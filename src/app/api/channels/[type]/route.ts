import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import { disconnectZalo } from "@/lib/channels/zalo-personal";

const CHANNEL_TYPES = ["whatsapp", "email", "phone", "sms", "telegram", "zalo-personal"];

// Strip sensitive session data from Zalo config before sending to client
function sanitizeConfig(type: string, channel: object) {
  if (type === "zalo-personal" && "config" in channel && typeof (channel as Record<string, unknown>).config === "object") {
    const cfg = (channel as Record<string, unknown>).config as Record<string, unknown>;
    const { imei, cookie, userAgent, ...safeConfig } = cfg;
    return { ...channel, config: safeConfig };
  }
  return channel;
}

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:read");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { type } = await context.params;

    if (!CHANNEL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { type },
    });

    if (!channel) {
      return NextResponse.json({
        id: null,
        type,
        isActive: false,
        config: {},
        status: "disconnected",
        createdAt: null,
        updatedAt: null,
      });
    }

    return NextResponse.json(sanitizeConfig(type, channel));
  } catch (error) {
    logger.error("Failed to fetch channel:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { type } = await context.params;

    if (!CHANNEL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive, config, status } = body;

    // Merge config with existing to preserve server-written fields (e.g., Zalo credentials)
    let mergedConfig = config;
    if (config) {
      const existing = await prisma.channel.findUnique({ where: { type }, select: { config: true } });
      const existingConfig = (typeof existing?.config === "object" && existing?.config !== null ? existing.config : {}) as Record<string, unknown>;
      mergedConfig = { ...existingConfig, ...config };
    }

    const channel = await prisma.channel.upsert({
      where: { type },
      update: {
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        config: mergedConfig ?? undefined,
        status: status ?? undefined,
      },
      create: {
        type,
        isActive: typeof isActive === "boolean" ? isActive : false,
        config: mergedConfig ?? {},
        status: status ?? "disconnected",
      },
    });

    return NextResponse.json(sanitizeConfig(type, channel));
  } catch (error) {
    logger.error("Failed to update channel:", error);
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { type } = await context.params;

    if (!CHANNEL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !["connect", "disconnect", "test"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: connect, disconnect, test" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({ where: { type } });

    if (action === "disconnect") {
      // Stop active listeners for channels with runtime state
      if (type === "zalo-personal") {
        await disconnectZalo();
      }

      const updated = await prisma.channel.upsert({
        where: { type },
        update: { status: "disconnected" },
        create: {
          type,
          isActive: false,
          config: {},
          status: "disconnected",
        },
      });
      return NextResponse.json(
        sanitizeConfig(type, {
          ...updated,
          message: `${type} channel disconnected`,
        })
      );
    }

    if (action === "connect") {
      if (!channel?.config || Object.keys(channel.config as object).length === 0) {
        return NextResponse.json(
          { error: "Channel must be configured before connecting" },
          { status: 400 }
        );
      }

      const updated = await prisma.channel.update({
        where: { type },
        data: { status: "connected", isActive: true },
      });

      return NextResponse.json(
        sanitizeConfig(type, {
          ...updated,
          message: `${type} channel connected`,
        })
      );
    }

    if (action === "test") {
      if (!channel?.config || Object.keys(channel.config as object).length === 0) {
        return NextResponse.json(
          { error: "Channel must be configured before testing" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        sanitizeConfig(type, {
          success: true,
          message: `${type} connection test initiated`,
          channel,
        })
      );
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.error("Failed to perform channel action:", error);
    return NextResponse.json(
      { error: "Failed to perform channel action" },
      { status: 500 }
    );
  }
}
