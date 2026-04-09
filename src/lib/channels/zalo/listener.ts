import { CloseReason, type API } from "zca-js";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  connectZalo,
  getReconnectAttempts,
  setReconnectAttempts,
  setApi,
  setConnectionStatus,
  setReconnectTimer,
} from "./connection";
import { handleIncomingMessage } from "./message-handler";

const MAX_RECONNECT = 3;

export function setupListener(api: API): void {
  api.listener.on("message", async (message) => {
    try {
      await handleIncomingMessage(api, message);
    } catch (error) {
      logger.error("[Zalo] Failed to process incoming message:", error);
    }
  });

  api.listener.on("connected", () => {
    logger.info("[Zalo] Listener connected");
    setConnectionStatus("connected");
  });

  api.listener.on("closed", async (event) => {
    const code = typeof event === "object" && event !== null ? (event as { code?: number }).code : event;
    logger.info("[Zalo] Listener closed", { code });

    if (code === CloseReason.DuplicateConnection) {
      logger.warn("[Zalo] Duplicate connection detected — NOT auto-reconnecting");
      setConnectionStatus("disconnected");
      setApi(null);
      await prisma.channel.upsert({
        where: { type: "zalo-personal" },
        update: { status: "disconnected" },
        create: { type: "zalo-personal", isActive: false, config: {}, status: "disconnected" },
      });
      return;
    }

    setConnectionStatus("disconnected");
    setApi(null);

    const attempts = getReconnectAttempts();
    if (attempts < MAX_RECONNECT) {
      setReconnectAttempts(attempts + 1);
      const delay = (attempts + 1) * 5000;
      logger.info(`[Zalo] Reconnecting in ${delay}ms (attempt ${attempts + 1}/${MAX_RECONNECT})`);
      const timer = setTimeout(() => {
        connectZalo().catch((err) => logger.error("[Zalo] Reconnect failed:", err));
      }, delay);
      setReconnectTimer(timer);
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
