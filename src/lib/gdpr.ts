import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GDPR Compliance Module
 * Handles data subject requests: export, deletion, anonymization
 */

// PII patterns for detection and redaction
const PII_PATTERNS = [
  { name: "credit_card", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD REDACTED]" },
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN REDACTED]" },
  { name: "email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL REDACTED]" },
  { name: "phone", pattern: /\b\+?\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}\b/g, replacement: "[PHONE REDACTED]" },
  { name: "ip_address", pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "[IP REDACTED]" },
];

/**
 * Redact PII from a text string.
 */
export function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

/**
 * Detect PII in a text string.
 */
export function detectPII(text: string): { found: boolean; types: string[] } {
  const types: string[] = [];
  for (const { name, pattern } of PII_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      types.push(name);
    }
  }
  return { found: types.length > 0, types };
}

/**
 * Export all data for a customer (GDPR data portability).
 */
export async function exportCustomerData(customerId: string): Promise<Record<string, unknown> | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      notes: true,
      conversations: {
        include: {
          messages: true,
          tickets: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  return {
    exportDate: new Date().toISOString(),
    format: "GDPR Data Export",
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      tags: customer.tags,
      firstContact: customer.firstContact,
      lastContact: customer.lastContact,
      createdAt: customer.createdAt,
    },
    notes: customer.notes.map((n) => ({
      content: n.content,
      author: n.authorName,
      date: n.createdAt,
    })),
    conversations: customer.conversations.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      createdAt: c.createdAt,
      messages: c.messages.map((m) => ({
        role: m.role,
        content: m.content,
        date: m.createdAt,
      })),
      tickets: c.tickets,
    })),
  };
}

/**
 * Delete all data for a customer (GDPR right to be forgotten).
 * Anonymizes conversation data instead of hard deleting to preserve analytics.
 */
export async function deleteCustomerData(
  customerId: string,
  hardDelete = false
): Promise<{ success: boolean; deletedRecords: number }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { conversations: { select: { id: true } } },
  });

  if (!customer) return { success: false, deletedRecords: 0 };

  let deletedRecords = 0;

  if (hardDelete) {
    // Full deletion - cascading
    for (const conv of customer.conversations) {
      await prisma.message.deleteMany({ where: { conversationId: conv.id } });
      await prisma.internalNote.deleteMany({ where: { conversationId: conv.id } });
      await prisma.conversationTag.deleteMany({ where: { conversationId: conv.id } });
      await prisma.ticket.deleteMany({ where: { conversationId: conv.id } });
      deletedRecords += 5;
    }
    await prisma.conversation.deleteMany({ where: { customerId } });
    await prisma.customerNote.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
    deletedRecords += customer.conversations.length + 2;
  } else {
    // Anonymization - preserve structure but remove PII
    for (const conv of customer.conversations) {
      await prisma.message.updateMany({
        where: { conversationId: conv.id },
        data: { content: "[REDACTED - GDPR]" },
      });
      deletedRecords++;
    }

    await prisma.conversation.updateMany({
      where: { customerId },
      data: {
        customerName: "Deleted User",
        customerContact: "",
        customerId: null,
      },
    });

    await prisma.customerNote.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });
    deletedRecords += 2;
  }

  logger.info("GDPR data deletion completed", {
    customerId,
    hardDelete,
    deletedRecords,
  });

  return { success: true, deletedRecords };
}

/**
 * Apply data retention policy - delete data older than specified days.
 */
export async function applyRetentionPolicy(
  retentionDays: number
): Promise<{ conversationsDeleted: number; messagesDeleted: number }> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const oldConversations = await prisma.conversation.findMany({
    where: {
      status: { in: ["resolved", "closed"] },
      updatedAt: { lte: cutoff },
    },
    select: { id: true },
  });

  let messagesDeleted = 0;
  for (const conv of oldConversations) {
    const result = await prisma.message.deleteMany({
      where: { conversationId: conv.id },
    });
    messagesDeleted += result.count;
  }

  const conversationsDeleted = oldConversations.length;
  if (conversationsDeleted > 0) {
    await prisma.conversation.deleteMany({
      where: { id: { in: oldConversations.map((c) => c.id) } },
    });
  }

  logger.info("Retention policy applied", {
    retentionDays,
    conversationsDeleted,
    messagesDeleted,
  });

  return { conversationsDeleted, messagesDeleted };
}
