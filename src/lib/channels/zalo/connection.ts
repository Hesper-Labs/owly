import { Zalo, LoginQRCallbackEventType, type API } from "zca-js";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptCredential } from "@/lib/security";
import { asRecord } from "./helpers";
import { setupListener } from "./listener";

// ---------------------------------------------------------------------------
// State
// WARNING: Module-level mutable state — assumes single Node.js process.
// In serverless/multi-instance deployments these will reset on cold start.
// ---------------------------------------------------------------------------

let zaloApi: API | null = null;
let qrImageBase64: string | null = null;
let connectionStatus: "disconnected" | "qr_pending" | "connected" = "disconnected";
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const QR_LOGIN_TIMEOUT_MS = 60_000;

// Promise-based mutex to prevent concurrent QR logins
let qrLoginPromise: Promise<{ success: boolean; qrImage?: string; error?: string }> | null = null;

// ---------------------------------------------------------------------------
// State accessors (used by other modules in this package)
// ---------------------------------------------------------------------------

export function getApi(): API | null { return zaloApi; }
export function setApi(api: API | null) { zaloApi = api; }
export function getConnectionStatus() { return connectionStatus; }
export function setConnectionStatus(s: typeof connectionStatus) { connectionStatus = s; }
export function getReconnectAttempts() { return reconnectAttempts; }
export function setReconnectAttempts(n: number) { reconnectAttempts = n; }
export function getReconnectTimer() { return reconnectTimer; }
export function setReconnectTimer(t: ReturnType<typeof setTimeout> | null) { reconnectTimer = t; }

// ---------------------------------------------------------------------------
// Public getters
// ---------------------------------------------------------------------------

export function getZaloStatus() {
  return { status: connectionStatus, qrImage: qrImageBase64 };
}

// ---------------------------------------------------------------------------
// Connect with saved credentials
// ---------------------------------------------------------------------------

export async function connectZalo(): Promise<{ success: boolean; error?: string }> {
  if (zaloApi && connectionStatus === "connected") {
    return { success: true };
  }

  const channel = await prisma.channel.findUnique({ where: { type: "zalo-personal" } });
  const config = asRecord(channel?.config);

  if (!config.imei || !config.cookie || !config.userAgent) {
    return { success: false, error: "No saved credentials. Please scan QR code first." };
  }

  try {
    // Stop old listener before creating new connection
    if (zaloApi) {
      try { zaloApi.listener.stop(); } catch { /* ignore */ }
      zaloApi = null;
    }

    const zalo = new Zalo({ selfListen: true });
    const api = await zalo.login({
      imei: decryptCredential(String(config.imei)),
      cookie: JSON.parse(decryptCredential(String(config.cookie))),
      userAgent: decryptCredential(String(config.userAgent)),
    });

    zaloApi = api;
    connectionStatus = "connected";
    reconnectAttempts = 0;
    qrImageBase64 = null;

    // Set up listener before persisting "connected" — Fix 9
    setupListener(api);

    await prisma.channel.upsert({
      where: { type: "zalo-personal" },
      update: { status: "connected", isActive: true },
      create: { type: "zalo-personal", isActive: true, config: channel?.config ?? {}, status: "connected" },
    });

    logger.info("[Zalo] Connected with saved credentials");
    return { success: true };
  } catch (error) {
    logger.error("[Zalo] Failed to connect with credentials:", error);
    connectionStatus = "disconnected";
    return { success: false, error: "Failed to connect. Credentials may be expired — re-scan QR." };
  }
}

// ---------------------------------------------------------------------------
// QR Login flow — Fix 4: Promise-based mutex replaces boolean flag
// ---------------------------------------------------------------------------

export function startZaloQRLogin(): Promise<{ success: boolean; qrImage?: string; error?: string }> {
  if (connectionStatus === "connected") {
    return Promise.resolve({ success: false, error: "Already connected. Disconnect first." });
  }

  // Return existing promise if QR login already in progress
  if (qrLoginPromise) {
    return qrLoginPromise;
  }

  qrLoginPromise = doQRLogin().finally(() => { qrLoginPromise = null; });
  return qrLoginPromise;
}

async function doQRLogin(): Promise<{ success: boolean; qrImage?: string; error?: string }> {
  connectionStatus = "qr_pending";
  qrImageBase64 = null;

  return new Promise((resolve) => {
    const zalo = new Zalo({ selfListen: true });
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        connectionStatus = "disconnected";
        qrImageBase64 = null;
        logger.warn("[Zalo] QR login timed out");
        resolve({ success: false, error: "QR login timed out. Please try again." });
      }
    }, QR_LOGIN_TIMEOUT_MS);

    zalo.loginQR({}, (event) => {
      switch (event.type) {
        case LoginQRCallbackEventType.QRCodeGenerated: {
          const qrData = typeof event.data === "object" && event.data !== null
            ? (event.data as { image?: string })
            : { image: undefined };
          const raw = qrData.image ?? "";
          qrImageBase64 = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
          logger.info("[Zalo] QR code generated");
          if (!resolved) {
            resolved = true;
            resolve({ success: true, qrImage: qrImageBase64 });
          }
          break;
        }

        case LoginQRCallbackEventType.QRCodeExpired: {
          logger.info("[Zalo] QR code expired");
          qrImageBase64 = null;
          connectionStatus = "disconnected";
          break;
        }

        case LoginQRCallbackEventType.QRCodeScanned: {
          logger.info("[Zalo] QR code scanned, waiting for confirmation");
          break;
        }

        case LoginQRCallbackEventType.QRCodeDeclined: {
          logger.info("[Zalo] QR code declined");
          qrImageBase64 = null;
          connectionStatus = "disconnected";
          break;
        }

        case LoginQRCallbackEventType.GotLoginInfo: {
          const creds = typeof event.data === "object" && event.data !== null
            ? (event.data as { cookie: unknown; imei: string; userAgent: string })
            : null;
          if (creds) {
            saveCredentials(creds).catch((err) =>
              logger.error("[Zalo] Failed to save credentials:", err)
            );
          }
          break;
        }
      }
    })
      .then((api) => {
        clearTimeout(timeout);
        zaloApi = api;
        connectionStatus = "connected";
        qrImageBase64 = null;
        reconnectAttempts = 0;

        // Set up listener before persisting "connected" — Fix 9
        setupListener(api);

        prisma.channel
          .upsert({
            where: { type: "zalo-personal" },
            update: { status: "connected", isActive: true },
            create: { type: "zalo-personal", isActive: true, config: {}, status: "connected" },
          })
          .catch((err) => logger.error("[Zalo] Failed to update channel status:", err));

        logger.info("[Zalo] Login complete, listener started");
      })
      .catch((err) => {
        clearTimeout(timeout);
        logger.error("[Zalo] QR login failed:", err);
        connectionStatus = "disconnected";
        qrImageBase64 = null;
      });
  });
}

// ---------------------------------------------------------------------------
// Disconnect — Fix 6: clears reconnect timer
// ---------------------------------------------------------------------------

export async function disconnectZalo(): Promise<void> {
  // Cancel any pending reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (zaloApi) {
    try { zaloApi.listener.stop(); } catch { /* ignore */ }
    zaloApi = null;
  }

  qrImageBase64 = null;
  connectionStatus = "disconnected";
  reconnectAttempts = 0;
  qrLoginPromise = null;

  await prisma.channel.upsert({
    where: { type: "zalo-personal" },
    update: { status: "disconnected" },
    create: { type: "zalo-personal", isActive: false, config: {}, status: "disconnected" },
  });

  logger.info("[Zalo] Disconnected");
}

// ---------------------------------------------------------------------------
// Internal: save credentials
// ---------------------------------------------------------------------------

async function saveCredentials(creds: { cookie: unknown; imei: string; userAgent: string }): Promise<void> {
  const { encryptCredential } = await import("@/lib/security");
  const existing = await prisma.channel.findUnique({ where: { type: "zalo-personal" }, select: { config: true } });
  const existingConfig = asRecord(existing?.config);
  const mergedConfig = {
    ...existingConfig,
    imei: encryptCredential(creds.imei),
    cookie: encryptCredential(JSON.stringify(creds.cookie)),
    userAgent: encryptCredential(creds.userAgent),
  };

  await prisma.channel.upsert({
    where: { type: "zalo-personal" },
    update: { config: mergedConfig },
    create: { type: "zalo-personal", isActive: false, config: mergedConfig, status: "disconnected" },
  });

  logger.info("[Zalo] Credentials saved to database");
}
