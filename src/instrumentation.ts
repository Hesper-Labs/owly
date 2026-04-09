export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerShutdownHandlers } = await import("@/lib/shutdown");
    registerShutdownHandlers();

    // Auto-reconnect stateful channels that were connected before restart
    reconnectChannels();
  }
}

async function reconnectChannels() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const channels = await prisma.channel.findMany({
      where: { status: "connected", isActive: true },
      select: { type: true },
    });

    for (const ch of channels) {
      if (ch.type === "zalo-personal") {
        const { connectZalo } = await import("@/lib/channels/zalo");
        const result = await connectZalo();
        const { logger } = await import("@/lib/logger");
        if (result.success) {
          logger.info("[Startup] Zalo auto-reconnected");
        } else {
          logger.warn("[Startup] Zalo auto-reconnect failed", { error: result.error });
        }
      }
    }
  } catch (error) {
    // Dynamic import to avoid circular deps at module registration time
    try {
      const { logger } = await import("@/lib/logger");
      logger.error("[Startup] Channel auto-reconnect failed", { error });
    } catch {
      console.error("[Startup] Channel auto-reconnect failed", error);
    }
  }
}
