import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireAuth, isAuthenticated } from "@/lib/route-auth";
import { emitNewMessage } from "@/lib/realtime";
import { sendZaloMessage } from "@/lib/channels/zalo-personal";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "messages:read");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    logger.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "messages:create");
  if (!isAuthenticated(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { content, role } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const validRoles = ["customer", "assistant", "system", "operator"];
    const messageRole = validRoles.includes(role) ? role : "assistant";

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: messageRole,
        content: content.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    emitNewMessage(id, { id: message.id, role: messageRole, content: content.trim() });

    // Deliver message to the actual channel (outbound)
    if (messageRole === "operator" || messageRole === "assistant") {
      await deliverToChannel(conversation, content.trim());
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// Deliver outbound message to the conversation's channel
async function deliverToChannel(
  conversation: { channel: string; metadata: unknown },
  text: string
): Promise<void> {
  try {
    if (conversation.channel === "zalo-personal") {
      const meta = (typeof conversation.metadata === "object" && conversation.metadata !== null
        ? conversation.metadata : {}) as Record<string, unknown>;
      const threadId = meta.zaloThreadId as string | undefined;
      if (!threadId) {
        logger.warn("[Messages] Zalo conversation missing zaloThreadId in metadata");
        return;
      }
      const threadType = meta.zaloThreadType === "group" ? 1 : 0;
      const sent = await sendZaloMessage(threadId, text, threadType);
      if (!sent) {
        logger.warn("[Messages] Failed to deliver message to Zalo", { threadId });
      }
    }
    // Other channels (whatsapp, telegram, sms) can be added here
  } catch (error) {
    logger.error("[Messages] Channel delivery failed:", error);
  }
}
