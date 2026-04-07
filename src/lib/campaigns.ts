import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Campaign Manager
 * Proactive messaging, broadcast, and customer segmentation.
 */

export type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "paused";
export type CampaignChannel = "email" | "whatsapp" | "sms" | "widget";

export interface CampaignSegment {
  field: string;     // customer field: tags, channel, lastContact, etc.
  operator: string;  // equals, contains, before, after, gt, lt
  value: string;
}

export interface CampaignConfig {
  name: string;
  channel: CampaignChannel;
  message: string;
  subject?: string;           // For email
  segments: CampaignSegment[];
  scheduledAt?: Date;
}

/**
 * Evaluate a customer against campaign segments.
 */
export function matchesSegment(
  customer: Record<string, unknown>,
  segment: CampaignSegment
): boolean {
  const value = String(customer[segment.field] || "").toLowerCase();
  const target = segment.value.toLowerCase();

  switch (segment.operator) {
    case "equals":
      return value === target;
    case "contains":
      return value.includes(target);
    case "not_contains":
      return !value.includes(target);
    case "starts_with":
      return value.startsWith(target);
    case "before":
      return new Date(value) < new Date(target);
    case "after":
      return new Date(value) > new Date(target);
    case "is_empty":
      return value === "";
    case "is_not_empty":
      return value !== "";
    default:
      return false;
  }
}

/**
 * Find customers matching all campaign segments.
 */
export async function findTargetCustomers(
  segments: CampaignSegment[],
  limit = 1000
): Promise<Array<{ id: string; name: string; email: string; phone: string; whatsapp: string }>> {
  // Fetch all customers and filter in-memory for complex segment logic
  const customers = await prisma.customer.findMany({
    where: { isBlocked: false },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true,
      tags: true,
      firstContact: true,
      lastContact: true,
    },
    take: limit,
  });

  return customers.filter((customer) => {
    const record = customer as unknown as Record<string, unknown>;
    return segments.every((seg) => matchesSegment(record, seg));
  });
}

/**
 * Proactive message - send a message to a specific customer.
 */
export async function sendProactiveMessage(
  customerId: string,
  channel: string,
  message: string
): Promise<{ conversationId: string } | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) return null;

  const conversation = await prisma.conversation.create({
    data: {
      channel,
      customerName: customer.name,
      customerContact:
        channel === "email" ? customer.email :
        channel === "whatsapp" ? customer.whatsapp :
        customer.phone,
      customerId,
      status: "active",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: message,
    },
  });

  logger.info("Proactive message sent", {
    customerId,
    channel,
    conversationId: conversation.id,
  });

  return { conversationId: conversation.id };
}
