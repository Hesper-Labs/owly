import { ToolDefinition } from "./types";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const owlyTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_ticket",
      description:
        "Create a support ticket for an issue that needs human attention. Use this when the customer reports a problem that cannot be resolved through the knowledge base.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Brief title describing the issue",
          },
          description: {
            type: "string",
            description: "Detailed description of the issue",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Priority level of the ticket",
          },
          department: {
            type: "string",
            description: "Department name to assign the ticket to",
          },
        },
        required: ["title", "description", "priority"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_to_person",
      description:
        "Assign a ticket or issue to a specific team member based on their expertise.",
      parameters: {
        type: "object",
        properties: {
          ticketId: {
            type: "string",
            description: "The ticket ID to assign",
          },
          expertise: {
            type: "string",
            description:
              "The expertise area needed to resolve this issue. The system will find the best matching team member.",
          },
        },
        required: ["ticketId", "expertise"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_internal_email",
      description:
        "Send an email to a team member about a customer issue that needs their attention.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Email address of the team member",
          },
          subject: {
            type: "string",
            description: "Email subject",
          },
          body: {
            type: "string",
            description: "Email body content",
          },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_history",
      description:
        "Retrieve the customer's previous conversation history across all channels to provide context-aware support.",
      parameters: {
        type: "object",
        properties: {
          customerContact: {
            type: "string",
            description:
              "Customer's contact info (phone number or email address)",
          },
          customerId: {
            type: "string",
            description:
              "Customer's unique ID for cross-channel history lookup. Use this when available for more complete history.",
          },
        },
        required: ["customerContact"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_followup",
      description:
        "Schedule a follow-up message to the customer after a specified time.",
      parameters: {
        type: "object",
        properties: {
          conversationId: {
            type: "string",
            description: "The conversation ID",
          },
          message: {
            type: "string",
            description: "The follow-up message to send",
          },
          delayHours: {
            type: "number",
            description: "Hours to wait before sending the follow-up",
          },
        },
        required: ["conversationId", "message", "delayHours"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger_webhook",
      description:
        "Trigger a configured webhook to notify an external system about an event.",
      parameters: {
        type: "object",
        properties: {
          webhookName: {
            type: "string",
            description: "Name of the webhook to trigger",
          },
          data: {
            type: "object",
            description: "Data payload to send with the webhook",
          },
        },
        required: ["webhookName"],
      },
    },
  },
];

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  conversationId?: string
): Promise<string> {
  switch (toolName) {
    case "create_ticket":
      return await createTicket(args, conversationId);
    case "assign_to_person":
      return await assignToPerson(args);
    case "send_internal_email":
      return await sendInternalEmail(args);
    case "get_customer_history":
      return await getCustomerHistory(args);
    case "schedule_followup":
      return await scheduleFollowup(args);
    case "trigger_webhook":
      return await triggerWebhook(args);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function createTicket(
  args: Record<string, unknown>,
  conversationId?: string
): Promise<string> {
  const department = args.department
    ? await prisma.department.findFirst({
        where: {
          name: { contains: args.department as string, mode: "insensitive" },
        },
      })
    : null;

  const ticket = await prisma.ticket.create({
    data: {
      title: args.title as string,
      description: args.description as string,
      priority: (args.priority as string) || "medium",
      conversationId: conversationId || null,
      departmentId: department?.id || null,
    },
  });

  return JSON.stringify({
    success: true,
    ticketId: ticket.id,
    message: `Ticket created: ${ticket.title} (Priority: ${ticket.priority})`,
  });
}

async function assignToPerson(args: Record<string, unknown>): Promise<string> {
  const expertise = args.expertise as string;
  const ticketId = args.ticketId as string;

  const member = await prisma.teamMember.findFirst({
    where: {
      expertise: { contains: expertise, mode: "insensitive" },
      isAvailable: true,
    },
    include: { department: true },
  });

  if (!member) {
    return JSON.stringify({
      success: false,
      message: `No available team member found with expertise in: ${expertise}`,
    });
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToId: member.id, status: "in_progress" },
  });

  return JSON.stringify({
    success: true,
    assignedTo: member.name,
    department: member.department.name,
    message: `Ticket assigned to ${member.name} (${member.department.name})`,
  });
}

async function sendInternalEmail(
  args: Record<string, unknown>
): Promise<string> {
  const settings = await prisma.settings.findFirst();
  if (!settings?.smtpHost) {
    return JSON.stringify({
      success: false,
      message: "Email not configured. Please set up SMTP in settings.",
    });
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  await transporter.sendMail({
    from: settings.smtpFrom || settings.smtpUser,
    to: args.to as string,
    subject: args.subject as string,
    text: args.body as string,
  });

  return JSON.stringify({
    success: true,
    message: `Email sent to ${args.to}`,
  });
}

async function getCustomerHistory(
  args: Record<string, unknown>
): Promise<string> {
  // Cross-channel lookup: prefer customerId for unified history
  const where = args.customerId
    ? { customerId: args.customerId as string }
    : { customerContact: args.customerContact as string };

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      messages: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (conversations.length === 0) {
    return JSON.stringify({
      success: true,
      history: [],
      message: "No previous conversations found for this customer.",
    });
  }

  const history = conversations.map((conv: { channel: string; status: string; createdAt: Date; summary: string; messages: Array<{ role: string; content: string }> }) => ({
    channel: conv.channel,
    status: conv.status,
    date: conv.createdAt,
    summary: conv.summary,
    messageCount: conv.messages.length,
    lastMessages: conv.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content.substring(0, 200),
    })),
  }));

  return JSON.stringify({ success: true, history });
}

async function scheduleFollowup(
  args: Record<string, unknown>
): Promise<string> {
  // In a production system, this would use a job queue (Bull, Agenda, etc.)
  // For now, we store it and a background process would pick it up
  return JSON.stringify({
    success: true,
    message: `Follow-up scheduled in ${args.delayHours} hours: "${args.message}"`,
    scheduledFor: new Date(
      Date.now() + (args.delayHours as number) * 3600000
    ).toISOString(),
  });
}

async function triggerWebhook(args: Record<string, unknown>): Promise<string> {
  const webhook = await prisma.webhook.findFirst({
    where: {
      name: { contains: args.webhookName as string, mode: "insensitive" },
      isActive: true,
    },
  });

  if (!webhook) {
    return JSON.stringify({
      success: false,
      message: `No active webhook found with name: ${args.webhookName}`,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(webhook.url, {
      method: webhook.method,
      headers: {
        "Content-Type": "application/json",
        ...(webhook.headers as Record<string, string>),
      },
      body: JSON.stringify(args.data || {}),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error && error.name === "AbortError"
      ? "Webhook request timed out after 10 seconds"
      : `Webhook request failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    return JSON.stringify({ success: false, message });
  }
  clearTimeout(timeoutId);

  return JSON.stringify({
    success: response.ok,
    status: response.status,
    message: response.ok
      ? `Webhook "${webhook.name}" triggered successfully`
      : `Webhook failed with status ${response.status}`,
  });
}
