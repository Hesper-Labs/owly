import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateConversationSummary } from "@/lib/ai/engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const summary = await generateConversationSummary(id);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
