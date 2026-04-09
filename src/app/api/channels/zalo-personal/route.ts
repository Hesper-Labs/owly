import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sanitizeChannelCredentials } from "@/lib/security";
import {
  getZaloStatus,
  connectZalo,
  startZaloQRLogin,
  disconnectZalo,
} from "@/lib/channels/zalo-personal";

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
      // Strip credential fields from client input — these are server-managed (encrypted)
      const safeClientConfig = Object.fromEntries(
        Object.entries(config as Record<string, unknown>).filter(([k]) => !["imei", "cookie", "userAgent"].includes(k))
      );
      mergedConfig = { ...existingConfig, ...safeClientConfig };
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

    return NextResponse.json(sanitizeChannelCredentials(channel as Record<string, unknown>));
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
