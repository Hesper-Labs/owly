import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return "*".repeat(key.length - 8) + key.slice(-8);
}

function generateApiKey(): string {
  return "owly_" + crypto.randomBytes(32).toString("hex");
}

export async function GET() {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    const masked = keys.map((k) => ({
      ...k,
      key: maskKey(k.key),
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 }
      );
    }

    const fullKey = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: fullKey,
      },
    });

    // Return full key only on creation
    return NextResponse.json(
      {
        ...apiKey,
        key: fullKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
