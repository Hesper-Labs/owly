import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import { sanitizeChannelCredentials, ZALO_SAFE_CONFIG_FIELDS } from "@/lib/security";

const CHANNEL_TYPES = ["whatsapp", "email", "phone", "sms", "telegram", "zalo-personal"];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "channels:read");
  if (!isAuthenticated(auth)) return auth;

  try {
    const channels = await prisma.channel.findMany({
      orderBy: { type: "asc" },
    });

    const channelMap = new Map(channels.map((ch) => [ch.type, ch]));
    const result = CHANNEL_TYPES.map((type) => {
      const existing = channelMap.get(type);
      if (existing) return sanitizeChannelCredentials(existing as Record<string, unknown>);
      return {
        id: null,
        type,
        isActive: false,
        config: {},
        status: "disconnected",
        createdAt: null,
        updatedAt: null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to fetch channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "channels:update");
  if (!isAuthenticated(auth)) return auth;

  try {
    const body = await request.json();
    const { type, isActive, config } = body;

    if (!type || !CHANNEL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type. Must be one of: " + CHANNEL_TYPES.join(", ") },
        { status: 400 }
      );
    }

    // Merge config safely: preserve server-managed credentials for zalo-personal
    let mergedConfig = config;
    if (config && type === "zalo-personal") {
      const existing = await prisma.channel.findUnique({ where: { type }, select: { config: true } });
      const existingConfig = (typeof existing?.config === "object" && existing?.config !== null ? existing.config : {}) as Record<string, unknown>;
      // Only accept safe config keys from client; preserve everything else from server
      const safeClientConfig = Object.fromEntries(
        Object.entries(config as Record<string, unknown>).filter(([k]) => ZALO_SAFE_CONFIG_FIELDS.includes(k))
      );
      mergedConfig = { ...existingConfig, ...safeClientConfig };
    }

    const channel = await prisma.channel.upsert({
      where: { type },
      update: {
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        config: mergedConfig ?? undefined,
      },
      create: {
        type,
        isActive: typeof isActive === "boolean" ? isActive : false,
        config: mergedConfig ?? {},
        status: "disconnected",
      },
    });

    return NextResponse.json(sanitizeChannelCredentials(channel as Record<string, unknown>), { status: 200 });
  } catch (error) {
    logger.error("Failed to save channel:", error);
    return NextResponse.json(
      { error: "Failed to save channel" },
      { status: 500 }
    );
  }
}
