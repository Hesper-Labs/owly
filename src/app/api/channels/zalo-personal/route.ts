import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  getZaloStatus,
  connectZalo,
  startZaloQRLogin,
  disconnectZalo,
} from "@/lib/channels/zalo-personal";

/** Strip credentials from config before sending to client */
function sanitize(channel: object) {
  if ("config" in channel && typeof (channel as Record<string, unknown>).config === "object") {
    const cfg = (channel as Record<string, unknown>).config as Record<string, unknown>;
    const { imei, cookie, userAgent, ...safeConfig } = cfg;
    return { ...channel, config: safeConfig };
  }
  return channel;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "channels:read");
  if (!isAuthenticated(auth)) return auth;

  const status = getZaloStatus();
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const body = await request.json();
    const { isActive, config } = body;

    // Merge config with existing to preserve server-written credentials
    let mergedConfig = config;
    if (config) {
      const existing = await prisma.channel.findUnique({ where: { type: "zalo-personal" }, select: { config: true } });
      const existingConfig = (typeof existing?.config === "object" && existing?.config !== null ? existing.config : {}) as Record<string, unknown>;
      mergedConfig = { ...existingConfig, ...config };
    }

    const channel = await prisma.channel.upsert({
      where: { type: "zalo-personal" },
      update: {
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        config: mergedConfig ?? undefined,
      },
      create: {
        type: "zalo-personal",
        isActive: typeof isActive === "boolean" ? isActive : false,
        config: mergedConfig ?? {},
        status: "disconnected",
      },
    });

    return NextResponse.json(sanitize(channel));
  } catch (error) {
    logger.error("[Zalo] Failed to update channel:", error);
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "qr-login") {
      const result = await startZaloQRLogin();
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === "connect") {
      const result = await connectZalo();
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (action === "disconnect") {
      await disconnectZalo();
      return NextResponse.json({ status: "disconnected", message: "Zalo disconnected" });
    }

    return NextResponse.json({ error: "Invalid action. Use: qr-login, connect, disconnect" }, { status: 400 });
  } catch (error) {
    logger.error("[Zalo] API action failed:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
