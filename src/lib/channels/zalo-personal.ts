import { Zalo, LoginQRCallbackEventType, ThreadType, CloseReason, type API } from "zca-js";
import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";
import { logger } from "@/lib/logger";
import { resolveCustomer, normalizePhone } from "@/lib/customer-resolver";
import { emitNewMessage } from "@/lib/realtime";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let zaloApi: API | null = null;
let qrImageBase64: string | null = null;
let connectionStatus: "disconnected" | "qr_pending" | "connected" = "disconnected";
let reconnectAttempts = 0;
let qrLoginInProgress = false;
const MAX_RECONNECT = 3;

// ---------------------------------------------------------------------------
// Public getters
// ---------------------------------------------------------------------------

export function getZaloStatus() {
  return {
    status: connectionStatus,
    qrImage: qrImageBase64,
  };
}

// ---------------------------------------------------------------------------
// Connect with saved credentials
// ---------------------------------------------------------------------------

export async function connectZalo(): Promise<{ success: boolean; error?: string }> {
  if (zaloApi && connectionStatus === "connected") {
    return { success: true };
  }

  const channel = await prisma.channel.findUnique({ where: { type: "zalo-personal" } });
  const config = (channel?.config as Record<string, unknown>) || {};

  if (!config.imei || !config.cookie || !config.userAgent) {
    return { success: false, error: "No saved credentials. Please scan QR code first." };
  }

  try {
    // Stop old listener if any before creating new connection
    if (zaloApi) {
      try { zaloApi.listener.stop(); } catch { /* ignore */ }
      zaloApi = null;
    }

    const zalo = new Zalo({ selfListen: true });
    const api = await zalo.login({
      imei: config.imei as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cookie: config.cookie as any,
      userAgent: config.userAgent as string,
    });

    zaloApi = api;
    connectionStatus = "connected";
    reconnectAttempts = 0;
    qrImageBase64 = null;

    await prisma.channel.upsert({
      where: { type: "zalo-personal" },
      update: { status: "connected", isActive: true },
      create: { type: "zalo-personal", isActive: true, config: channel?.config ?? {}, status: "connected" },
    });

    setupListener(api);
    logger.info("[Zalo] Connected with saved credentials");
    return { success: true };
  } catch (error) {
    logger.error("[Zalo] Failed to connect with credentials:", error);
    connectionStatus = "disconnected";
    return { success: false, error: "Failed to connect. Credentials may be expired — re-scan QR." };
  }
}

// ---------------------------------------------------------------------------
// QR Login flow
// ---------------------------------------------------------------------------

export async function startZaloQRLogin(): Promise<{ success: boolean; qrImage?: string; error?: string }> {
  if (connectionStatus === "connected") {
    return { success: false, error: "Already connected. Disconnect first." };
  }

  if (qrLoginInProgress) {
    return { success: false, error: "QR login already in progress." };
  }

  qrLoginInProgress = true;
  connectionStatus = "qr_pending";
  qrImageBase64 = null;

  return new Promise((resolve) => {
    const zalo = new Zalo({ selfListen: true });

    zalo.loginQR({}, (event) => {
      switch (event.type) {
        case LoginQRCallbackEventType.QRCodeGenerated: {
          const qrData = event.data as { image: string };
          const raw = qrData.image;
          qrImageBase64 = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
          logger.info("[Zalo] QR code generated");
          resolve({ success: true, qrImage: qrImageBase64 });
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
          // Save credentials to DB
          const creds = event.data as { cookie: unknown; imei: string; userAgent: string };
          saveCredentials(creds).catch((err) =>
            logger.error("[Zalo] Failed to save credentials:", err)
          );
          break;
        }
      }
    })
      .then((api) => {
        zaloApi = api;
        connectionStatus = "connected";
        qrImageBase64 = null;
        reconnectAttempts = 0;
        qrLoginInProgress = false;

        prisma.channel
          .upsert({
            where: { type: "zalo-personal" },
            update: { status: "connected", isActive: true },
            create: { type: "zalo-personal", isActive: true, config: {}, status: "connected" },
          })
          .catch((err) => logger.error("[Zalo] Failed to update channel status:", err));

        setupListener(api);
        logger.info("[Zalo] Login complete, listener started");
      })
      .catch((err) => {
        logger.error("[Zalo] QR login failed:", err);
        connectionStatus = "disconnected";
        qrImageBase64 = null;
        qrLoginInProgress = false;
      });
  });
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------

export async function disconnectZalo(): Promise<void> {
  if (zaloApi) {
    try {
      zaloApi.listener.stop();
    } catch {
      // ignore
    }
    zaloApi = null;
  }

  qrImageBase64 = null;
  connectionStatus = "disconnected";
  reconnectAttempts = 0;
  qrLoginInProgress = false;

  await prisma.channel.upsert({
    where: { type: "zalo-personal" },
    update: { status: "disconnected" },
    create: { type: "zalo-personal", isActive: false, config: {}, status: "disconnected" },
  });

  logger.info("[Zalo] Disconnected");
}

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

export async function sendZaloMessage(
  threadId: string,
  text: string,
  threadType: number = ThreadType.User
): Promise<boolean> {
  if (!zaloApi || connectionStatus !== "connected") {
    return false;
  }

  try {
    await zaloApi.sendMessage({ msg: text }, threadId, threadType);
    return true;
  } catch (error) {
    logger.error("[Zalo] Failed to send message:", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal: listener setup
// ---------------------------------------------------------------------------

function setupListener(api: API): void {
  api.listener.on("message", async (message) => {
    try {
      await handleIncomingMessage(api, message);
    } catch (error) {
      logger.error("[Zalo] Failed to process incoming message:", error);
    }
  });

  api.listener.on("connected", () => {
    logger.info("[Zalo] Listener connected");
    connectionStatus = "connected";
  });

  api.listener.on("closed", async (event) => {
    const code = typeof event === "object" && event !== null ? (event as { code?: number }).code : event;
    logger.info("[Zalo] Listener closed", { code });

    if (code === CloseReason.DuplicateConnection) {
      logger.warn("[Zalo] Duplicate connection detected — NOT auto-reconnecting");
      connectionStatus = "disconnected";
      zaloApi = null;
      await prisma.channel.upsert({
        where: { type: "zalo-personal" },
        update: { status: "disconnected" },
        create: { type: "zalo-personal", isActive: false, config: {}, status: "disconnected" },
      });
      return;
    }

    connectionStatus = "disconnected";
    zaloApi = null;

    // Attempt reconnect with backoff
    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      const delay = reconnectAttempts * 5000;
      logger.info(`[Zalo] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT})`);
      setTimeout(() => {
        connectZalo().catch((err) => logger.error("[Zalo] Reconnect failed:", err));
      }, delay);
    } else {
      logger.warn("[Zalo] Max reconnect attempts reached");
      await prisma.channel.upsert({
        where: { type: "zalo-personal" },
        update: { status: "disconnected" },
        create: { type: "zalo-personal", isActive: false, config: {}, status: "disconnected" },
      });
    }
  });

  api.listener.on("error", (error) => {
    logger.error("[Zalo] Listener error:", error);
  });

  api.listener.start();
}

// ---------------------------------------------------------------------------
// Internal: handle incoming message
// ---------------------------------------------------------------------------

async function handleIncomingMessage(api: API, message: { data: Record<string, unknown>; threadId: string; type: number; isSelf?: boolean }): Promise<void> {
  const content = message.data.content;
  if (typeof content !== "string") return; // MVP: text only

  // Self-messages: operator replied from another device — save without AI response
  if (message.isSelf) {
    await handleSelfMessage(message.threadId, content);
    return;
  }

  const senderId = String(message.data.uidFrom || "");
  if (!senderId) return;

  // Check allowlist/denylist filter before processing
  if (!await isAllowedByFilter(senderId, message.threadId)) return;

  const isGroup = message.type === ThreadType.Group;
  const threadLabel = isGroup ? "group" : "user";

  // Always resolve sender name (the person who sent the message)
  const senderName = await resolveUserName(api, senderId);
  // For groups, also resolve the group name for metadata
  const groupName = isGroup ? await resolveGroupName(api, message.threadId) : null;

  // Resolve customer using the sender's individual name
  const customerId = await resolveCustomer("zalo-personal", senderId, senderName);

  // Enrich customer record with full Zalo profile (non-blocking)
  enrichCustomerFromZalo(api, customerId, senderId).catch((err) =>
    logger.warn("[Zalo] Failed to enrich customer profile", { customerId, error: String(err) })
  );

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      channel: "zalo-personal",
      status: { in: ["active", "escalated"] },
      OR: [{ customerId }, { customerContact: senderId }],
    },
  });

  const isNew = !conversation;
  if (!conversation) {
    // For groups, use group name as conversation name; for DMs, use sender name
    const conversationName = isGroup && groupName ? groupName : senderName;
    conversation = await createNewConversation("zalo-personal", conversationName, senderId, customerId);
  }

  // Only store thread metadata and auto-tag on new conversations
  if (isNew) {
    await updateThreadMetadata(conversation.id, threadLabel, message.threadId, groupName || senderName);
  }

  // Get AI response
  const aiResponse = await chat(conversation.id, content);

  // Reply via Zalo
  await api.sendMessage({ msg: aiResponse }, message.threadId, message.type);
}

// ---------------------------------------------------------------------------
// Internal: handle self-sent messages (operator replied from another device)
// ---------------------------------------------------------------------------

async function handleSelfMessage(threadId: string, content: string): Promise<void> {
  // Find existing conversation by zaloThreadId using Prisma JSON path filter
  const conversation = await prisma.conversation.findFirst({
    where: {
      channel: "zalo-personal",
      status: { in: ["active", "escalated"] },
      metadata: { path: ["zaloThreadId"], equals: threadId },
    },
    select: { id: true },
  });

  if (!conversation) {
    logger.debug("[Zalo] Self-message for unknown thread, skipping", { threadId });
    return;
  }

  // Save as "operator" role — human reply, not AI
  const saved = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "operator",
      content,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  emitNewMessage(conversation.id, { id: saved.id, role: "operator", content });
  logger.info("[Zalo] Saved self-message as operator", { conversationId: conversation.id });
}

// ---------------------------------------------------------------------------
// Internal: enrich customer with full Zalo profile
// ---------------------------------------------------------------------------

const ENRICH_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function enrichCustomerFromZalo(api: API, customerId: string, zaloUserId: string): Promise<void> {
  const cacheKey = `enrich:${customerId}`;
  if (getCached(cacheKey)) return; // Already enriched recently

  const res = await api.getUserInfo(zaloUserId);
  const profiles = res?.changed_profiles ?? res;
  // zca-js transforms IDs to "id_0" format internally — try both forms
  const profile = profiles?.[zaloUserId] || profiles?.[`${zaloUserId}_0`];
  if (!profile) {
    logger.warn("[Zalo] No profile data returned from getUserInfo", { zaloUserId, responseKeys: Object.keys(profiles ?? {}) });
    return;
  }

  logger.debug("[Zalo] Raw profile from getUserInfo", { zaloUserId, profile });

  const displayName = profile.displayName || profile.zaloName || (profile as Record<string, unknown>).name;
  const avatar = profile.avatar || (profile as Record<string, unknown>).avatar;
  const rawPhone = profile.phoneNumber;
  const gender = profile.gender;
  const dob = profile.dob;
  const status = profile.status;
  const zaloName = profile.zaloName;

  // Validate phone: reject falsy, "0", and non-digit strings; normalize for consistent matching
  const phoneStr = rawPhone != null ? String(rawPhone) : "";
  const validPhone = phoneStr.replace(/\D/g, "").length >= 7 ? normalizePhone(phoneStr) : "";

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, phone: true, metadata: true },
  });
  if (!customer) return;

  const existingMeta = (typeof customer.metadata === "object" && customer.metadata !== null ? customer.metadata : {}) as Record<string, unknown>;

  const zaloProfile: Record<string, unknown> = {};
  if (displayName) zaloProfile.zaloDisplayName = String(displayName);
  if (zaloName) zaloProfile.zaloName = String(zaloName);
  if (avatar) zaloProfile.zaloAvatar = String(avatar);
  if (validPhone) zaloProfile.zaloPhone = validPhone;
  if (gender !== undefined && gender !== null) zaloProfile.zaloGender = Number(gender);
  if (dob !== undefined && dob !== null) zaloProfile.zaloDob = String(dob);
  if (status) zaloProfile.zaloStatus = String(status);

  const update: Record<string, unknown> = {
    metadata: { ...existingMeta, ...zaloProfile },
  };

  // Backfill phone if customer has none and Zalo profile has a valid one
  if (!customer.phone && validPhone) {
    update.phone = validPhone;
    logger.info("[Zalo] Backfilled customer phone from Zalo profile", { customerId, phone: validPhone });
  }

  // Update name if current is generic
  if (customer.name === "Unknown" && displayName) {
    update.name = String(displayName);
  }

  await prisma.customer.update({ where: { id: customerId }, data: update });

  // Only cache if we got meaningful profile data (so we retry on empty profiles)
  if (Object.keys(zaloProfile).length > 0) {
    setCache(cacheKey, "1", ENRICH_CACHE_TTL);
  }
  logger.debug("[Zalo] Enriched customer profile", { customerId, fields: Object.keys(zaloProfile), phoneSaved: !!(!customer.phone && validPhone) });
}

// ---------------------------------------------------------------------------
// Internal: name resolution with TTL cache
// ---------------------------------------------------------------------------

const nameCache = new Map<string, { value: string; expires: number }>();
const NAME_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 500;

function getCached(key: string): string | null {
  const entry = nameCache.get(key);
  if (entry && Date.now() < entry.expires) return entry.value;
  if (entry) nameCache.delete(key);
  return null;
}

function setCache(key: string, value: string, ttl: number = NAME_CACHE_TTL): void {
  // Evict expired entries when cache grows too large
  if (nameCache.size >= CACHE_MAX_SIZE) {
    const now = Date.now();
    for (const [k, v] of nameCache) {
      if (now >= v.expires) nameCache.delete(k);
    }
    // If still too large after eviction, clear oldest half
    if (nameCache.size >= CACHE_MAX_SIZE) {
      const entries = [...nameCache.entries()].sort((a, b) => a[1].expires - b[1].expires);
      for (let i = 0; i < entries.length / 2; i++) nameCache.delete(entries[i][0]);
    }
  }
  nameCache.set(key, { value, expires: Date.now() + ttl });
}

async function resolveUserName(api: API, userId: string): Promise<string> {
  const cached = getCached(`user:${userId}`);
  if (cached) return cached;

  try {
    const res = await api.getUserInfo(userId);
    // Response may be { changed_profiles: { [id]: profile } } or directly { [id]: profile }
    const profiles = res?.changed_profiles ?? res;
    // User ID might be in format "userId_0" in the response
    const profile = profiles?.[userId] || profiles?.[`${userId}_0`];
    const raw = profile?.displayName || profile?.zaloName || (profile as Record<string, unknown>)?.name;
    const name = typeof raw === "string" && raw ? raw : userId;
    setCache(`user:${userId}`, name);
    return name;
  } catch (err) {
    logger.warn("[Zalo] Failed to resolve user name", { userId, error: String(err) });
    return userId;
  }
}

async function resolveGroupName(api: API, groupId: string): Promise<string> {
  const cached = getCached(`group:${groupId}`);
  if (cached) return cached;

  try {
    const res = await api.getGroupInfo(groupId);
    const info = res?.gridInfoMap?.[groupId];
    const name = info?.name || "Unknown Group";
    setCache(`group:${groupId}`, name);
    return name;
  } catch (err) {
    logger.warn("[Zalo] Failed to resolve group name", { groupId, error: String(err) });
    return "Unknown Group";
  }
}

// ---------------------------------------------------------------------------
// Internal: store thread type in metadata and auto-assign tag
// ---------------------------------------------------------------------------

async function updateThreadMetadata(conversationId: string, threadLabel: "group" | "user", threadId: string, threadName: string): Promise<void> {
  try {
    // Merge into existing metadata (preserves other fields like escalation data)
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { metadata: true } });
    const meta = (typeof existing?.metadata === "object" && existing?.metadata !== null ? existing.metadata : {}) as Record<string, unknown>;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: { ...meta, zaloThreadType: threadLabel, zaloThreadId: threadId, zaloThreadName: threadName },
      },
    });

    // Find or create the tag, then link to conversation
    const tagName = threadLabel === "group" ? "Zalo Group" : "Zalo User";
    const tagColor = threadLabel === "group" ? "#6366F1" : "#0068FF";
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName, color: tagColor },
    });

    await prisma.conversationTag.upsert({
      where: { conversationId_tagId: { conversationId, tagId: tag.id } },
      update: {},
      create: { conversationId, tagId: tag.id },
    });
  } catch (err) {
    logger.warn("[Zalo] Failed to update thread metadata/tag", { conversationId, error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Internal: allowlist/denylist filter
// ---------------------------------------------------------------------------

async function isAllowedByFilter(senderId: string, threadId: string): Promise<boolean> {
  try {
    // Use cached filter config (30s TTL) to avoid DB read per message
    const cached = getCached("filter:config");
    let filterMode: string;
    let filterList: string[];

    if (cached) {
      const parsed = JSON.parse(cached);
      filterMode = parsed.filterMode;
      filterList = parsed.filterList;
    } else {
      const channel = await prisma.channel.findUnique({ where: { type: "zalo-personal" }, select: { config: true } });
      const cfg = (typeof channel?.config === "object" && channel?.config !== null ? channel.config : {}) as Record<string, unknown>;
      filterMode = (cfg.filterMode as string) || "disabled";
      filterList = Array.isArray(cfg.filterList) ? (cfg.filterList as string[]) : [];
      setCache("filter:config", JSON.stringify({ filterMode, filterList }), 30_000);
    }

    if (filterMode === "disabled") return true;
    if (filterList.length === 0) return filterMode === "denylist"; // empty denylist = allow all, empty allowlist = deny all

    const match = filterList.some((id) => id === senderId || id === threadId);
    return filterMode === "allowlist" ? match : !match;
  } catch (err) {
    logger.warn("[Zalo] Filter check failed, allowing message", { error: String(err) });
    return true; // fail-open to avoid silently dropping messages
  }
}

// ---------------------------------------------------------------------------
// Internal: save credentials
// ---------------------------------------------------------------------------

async function saveCredentials(creds: { cookie: unknown; imei: string; userAgent: string }): Promise<void> {
  // Merge credentials with existing config to preserve filter settings
  const existing = await prisma.channel.findUnique({ where: { type: "zalo-personal" }, select: { config: true } });
  const existingConfig = (typeof existing?.config === "object" && existing?.config !== null ? existing.config : {}) as Record<string, unknown>;
  const mergedConfig = {
    ...existingConfig,
    imei: creds.imei,
    cookie: JSON.parse(JSON.stringify(creds.cookie)),
    userAgent: creds.userAgent,
  };

  await prisma.channel.upsert({
    where: { type: "zalo-personal" },
    update: {
      config: mergedConfig,
    },
    create: {
      type: "zalo-personal",
      isActive: false,
      config: mergedConfig,
      status: "disconnected",
    },
  });

  logger.info("[Zalo] Credentials saved to database");
}
