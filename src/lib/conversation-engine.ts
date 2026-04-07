import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Conversation Routing & Management Engine
 */

// Routing strategies
export type RoutingStrategy = "round_robin" | "least_busy" | "skill_based" | "priority";

interface RoutingResult {
  assignedToId: string;
  assignedToName: string;
  departmentId: string;
  departmentName: string;
  reason: string;
}

/**
 * Route a conversation to the best available agent.
 */
export async function routeConversation(
  conversationId: string,
  strategy: RoutingStrategy = "skill_based",
  requiredExpertise?: string,
  departmentId?: string
): Promise<RoutingResult | null> {
  const where: Record<string, unknown> = { isAvailable: true };
  if (departmentId) where.departmentId = departmentId;

  const members = await prisma.teamMember.findMany({
    where,
    include: {
      department: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (members.length === 0) return null;

  let selected;

  switch (strategy) {
    case "skill_based":
      if (requiredExpertise) {
        const expertiseLower = requiredExpertise.toLowerCase();
        selected = members.find((m) =>
          m.expertise.toLowerCase().includes(expertiseLower)
        );
      }
      if (!selected) selected = members[0];
      break;

    case "least_busy":
      selected = members.reduce((min, m) =>
        m._count.tickets < min._count.tickets ? m : min
      );
      break;

    case "round_robin":
      // Get the last assigned member and pick the next one
      const lastTicket = await prisma.ticket.findFirst({
        where: { assignedToId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { assignedToId: true },
      });
      if (lastTicket?.assignedToId) {
        const lastIndex = members.findIndex((m) => m.id === lastTicket.assignedToId);
        selected = members[(lastIndex + 1) % members.length];
      } else {
        selected = members[0];
      }
      break;

    case "priority":
    default:
      selected = members[0];
      break;
  }

  if (!selected) return null;

  return {
    assignedToId: selected.id,
    assignedToName: selected.name,
    departmentId: selected.departmentId,
    departmentName: selected.department.name,
    reason: `Routed via ${strategy} strategy`,
  };
}

/**
 * Transfer a conversation to another agent.
 */
export async function transferConversation(
  conversationId: string,
  toMemberId: string,
  fromMemberName: string,
  note?: string
): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: { id: toMemberId },
    select: { id: true, name: true },
  });

  if (!member) return false;

  // Update all open tickets for this conversation
  await prisma.ticket.updateMany({
    where: { conversationId, status: { in: ["open", "in_progress"] } },
    data: { assignedToId: toMemberId },
  });

  // Add internal note about transfer
  await prisma.internalNote.create({
    data: {
      conversationId,
      content: `Conversation transferred from ${fromMemberName} to ${member.name}${note ? `: ${note}` : ""}`,
      authorName: "System",
    },
  });

  logger.info("Conversation transferred", {
    conversationId,
    from: fromMemberName,
    to: member.name,
  });

  return true;
}

/**
 * Merge two conversations into one.
 */
export async function mergeConversations(
  primaryId: string,
  secondaryId: string
): Promise<boolean> {
  const [primary, secondary] = await Promise.all([
    prisma.conversation.findUnique({ where: { id: primaryId } }),
    prisma.conversation.findUnique({ where: { id: secondaryId } }),
  ]);

  if (!primary || !secondary) return false;

  // Move all messages from secondary to primary
  await prisma.message.updateMany({
    where: { conversationId: secondaryId },
    data: { conversationId: primaryId },
  });

  // Move tickets
  await prisma.ticket.updateMany({
    where: { conversationId: secondaryId },
    data: { conversationId: primaryId },
  });

  // Move internal notes
  await prisma.internalNote.updateMany({
    where: { conversationId: secondaryId },
    data: { conversationId: primaryId },
  });

  // Add merge note
  await prisma.internalNote.create({
    data: {
      conversationId: primaryId,
      content: `Merged with conversation ${secondaryId} (${secondary.customerName} via ${secondary.channel})`,
      authorName: "System",
    },
  });

  // Close secondary
  await prisma.conversation.update({
    where: { id: secondaryId },
    data: { status: "closed", summary: `Merged into ${primaryId}` },
  });

  return true;
}

/**
 * Snooze a conversation - mark it for follow-up at a later time.
 */
export async function snoozeConversation(
  conversationId: string,
  snoozeUntil: Date,
  reason: string,
  authorName: string
): Promise<boolean> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: "snoozed",
      metadata: {
        snoozeUntil: snoozeUntil.toISOString(),
        snoozeReason: reason,
      },
    },
  });

  await prisma.internalNote.create({
    data: {
      conversationId,
      content: `Snoozed until ${snoozeUntil.toLocaleDateString()}: ${reason}`,
      authorName,
    },
  });

  return true;
}

/**
 * Auto-escalate conversations that breach SLA.
 */
export async function checkSLABreaches(): Promise<number> {
  const slaRules = await prisma.sLARule.findMany({
    where: { isActive: true },
  });

  if (slaRules.length === 0) return 0;

  let escalated = 0;

  for (const rule of slaRules) {
    const cutoff = new Date(Date.now() - rule.firstResponseMins * 60 * 1000);

    const breached = await prisma.conversation.findMany({
      where: {
        status: "active",
        createdAt: { lte: cutoff },
        ...(rule.channel !== "all" ? { channel: rule.channel } : {}),
        messages: { none: { role: "assistant" } },
      },
      take: 50,
    });

    for (const conv of breached) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { status: "escalated" },
      });
      escalated++;
    }
  }

  if (escalated > 0) {
    logger.warn(`SLA breach: ${escalated} conversations auto-escalated`);
  }

  return escalated;
}

/**
 * Execute a macro (multiple actions at once).
 */
export async function executeMacro(
  conversationId: string,
  actions: { type: string; value: string }[],
  authorName: string
): Promise<{ executed: number; errors: string[] }> {
  let executed = 0;
  const errors: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "set_status":
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { status: action.value },
          });
          executed++;
          break;

        case "assign_department": {
          const dept = await prisma.department.findFirst({
            where: { name: { contains: action.value, mode: "insensitive" } },
          });
          if (dept) {
            await prisma.ticket.updateMany({
              where: { conversationId },
              data: { departmentId: dept.id },
            });
            executed++;
          }
          break;
        }

        case "add_tag": {
          let tag = await prisma.tag.findUnique({
            where: { name: action.value },
          });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: action.value } });
          }
          await prisma.conversationTag.create({
            data: { conversationId, tagId: tag.id },
          }).catch(() => { /* already tagged */ });
          executed++;
          break;
        }

        case "add_note":
          await prisma.internalNote.create({
            data: { conversationId, content: action.value, authorName },
          });
          executed++;
          break;

        case "send_message":
          await prisma.message.create({
            data: { conversationId, role: "assistant", content: action.value },
          });
          executed++;
          break;

        default:
          errors.push(`Unknown action type: ${action.type}`);
      }
    } catch (err) {
      errors.push(`${action.type}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return { executed, errors };
}
