import { ThreadType, type API } from "zca-js";
import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";
import { logger } from "@/lib/logger";
import { resolveCustomer } from "@/lib/customer-resolver";
import { emitNewMessage } from "@/lib/realtime";
import { getApi, getConnectionStatus } from "./connection";
import { enrichCustomerFromZalo, resolveUserName, resolveGroupName } from "./profile-enrichment";
import { isAllowedByFilter, updateThreadMetadata } from "./filter";

// ---------------------------------------------------------------------------
// Incoming message handler
// ---------------------------------------------------------------------------

export async function handleIncomingMessage(
  api: API,
  message: { data: Record<string, unknown>; threadId: string; type: number; isSelf?: boolean },
): Promise<void> {
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

  const senderName = await resolveUserName(api, senderId);
  const groupName = isGroup ? await resolveGroupName(api, message.threadId) : null;

  const customerId = await resolveCustomer("zalo-personal", senderId, senderName);

  // Enrich customer record with full Zalo profile (non-blocking)
  enrichCustomerFromZalo(api, customerId, senderId).catch((err) =>
    logger.warn("[Zalo] Failed to enrich customer profile", { customerId, error: String(err) })
  );

  // Find or create conversation
  let conversation: Awaited<ReturnType<typeof prisma.conversation.findFirst>>;
  if (isGroup) {
    conversation = await prisma.conversation.findFirst({
      where: {
        channel: "zalo-personal",
        status: { in: ["active", "escalated"] },
        metadata: { path: ["zaloThreadId"], equals: message.threadId },
      },
    });
  } else {
    conversation = await prisma.conversation.findFirst({
      where: {
        channel: "zalo-personal",
        status: { in: ["active", "escalated"] },
        OR: [{ customerId }, { customerContact: senderId }],
      },
    });
  }

  const isNew = !conversation;
  if (!conversation) {
    const conversationContact = isGroup ? message.threadId : senderId;
    const conversationName = isGroup && groupName ? groupName : senderName;
    conversation = await createNewConversation("zalo-personal", conversationName, conversationContact, customerId);
  }

  if (isNew) {
    await updateThreadMetadata(conversation.id, threadLabel, message.threadId, groupName || senderName);
  }

  const aiResponse = await chat(conversation.id, content);

  await api.sendMessage({ msg: aiResponse }, message.threadId, message.type);
}

// ---------------------------------------------------------------------------
// Self-sent messages (operator replied from another device)
// ---------------------------------------------------------------------------

async function handleSelfMessage(threadId: string, content: string): Promise<void> {
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

  // Skip if this message was already saved recently (dedup against dashboard/AI replies)
  const cutoff = new Date(Date.now() - 10_000);
  const duplicate = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
      content,
      role: { in: ["operator", "assistant"] },
      createdAt: { gte: cutoff },
    },
  });
  if (duplicate) {
    logger.debug("[Zalo] Self-message is duplicate, skipping", { conversationId: conversation.id });
    return;
  }

  const saved = await prisma.message.create({
    data: { conversationId: conversation.id, role: "operator", content },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  emitNewMessage(conversation.id, { id: saved.id, role: "operator", content });
  logger.info("[Zalo] Saved self-message as operator", { conversationId: conversation.id });
}

// ---------------------------------------------------------------------------
// Send outbound message
// ---------------------------------------------------------------------------

export async function sendZaloMessage(
  threadId: string,
  text: string,
  threadType: number = ThreadType.User,
): Promise<boolean> {
  const api = getApi();
  if (!api || getConnectionStatus() !== "connected") {
    return false;
  }

  try {
    await api.sendMessage({ msg: text }, threadId, threadType);
    return true;
  } catch (error) {
    logger.error("[Zalo] Failed to send message:", error);
    return false;
  }
}
