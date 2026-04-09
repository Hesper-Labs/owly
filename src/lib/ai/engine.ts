import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { owlyTools, executeToolCall } from "./tools";
import { emitNewMessage, publish } from "@/lib/realtime";
import { analyzeSentiment, detectIntent, estimateConfidence, requiresHumanApproval } from "./guardrails";
import type {
  AIMessage,
  AIConfig,
  ConversationContext,
  KnowledgeItem,
} from "./types";

function buildSystemPrompt(context: ConversationContext): string {
  const toneGuide: Record<string, string> = {
    friendly:
      "Be warm, approachable, and conversational. Use a casual but professional tone.",
    formal:
      "Be professional, polished, and courteous. Use formal language and proper grammar.",
    technical:
      "Be precise and detailed. Use technical terminology when appropriate and provide thorough explanations.",
  };

  const knowledgeSection =
    context.knowledgeBase.length > 0
      ? context.knowledgeBase
          .sort((a, b) => b.priority - a.priority)
          .map(
            (k) =>
              `[${k.category}] ${k.title}:\n${k.content}`
          )
          .join("\n\n---\n\n")
      : "No specific knowledge base entries available. Answer based on general knowledge about the business.";

  return `You are Owly, the AI customer support assistant for ${context.businessName}.

${context.businessDesc ? `About the business: ${context.businessDesc}` : ""}

## Communication Style
${toneGuide[context.tone] || toneGuide.friendly}
${context.language !== "auto" ? `Always respond in: ${context.language}` : "Respond in the same language the customer uses."}

## Your Knowledge Base
Use the following information to answer customer questions accurately:

${knowledgeSection}

## Important Guidelines
- Always be helpful and try to resolve the customer's issue
- If you cannot answer a question from the knowledge base, honestly say so and offer to connect them with a team member
- Use the create_ticket tool when a customer reports a problem that needs human intervention
- Use send_internal_email to notify relevant team members about urgent issues
- Use get_customer_history to check if the customer has contacted before
- Never make up information that isn't in your knowledge base
- Keep responses concise but thorough
- The customer is contacting via: ${context.channel}
${context.customerName !== "Unknown" ? `- Customer name: ${context.customerName}` : ""}

## Customer History
${context.customerHistory.length > 0 ? context.customerHistory.join("\n") : "This is the customer's first interaction."}`;
}

async function getKnowledgeBase(): Promise<KnowledgeItem[]> {
  const entries = await prisma.knowledgeEntry.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { priority: "desc" },
  });

  return entries.map((e: { category: { name: string }; title: string; content: string; priority: number }) => ({
    category: e.category.name,
    title: e.title,
    content: e.content,
    priority: e.priority,
  }));
}

async function getAIConfig(): Promise<AIConfig & ConversationContext> {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "default" } });
  }

  return {
    provider: settings.aiProvider,
    model: settings.aiModel,
    apiKey: settings.aiApiKey,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    businessName: settings.businessName,
    businessDesc: settings.businessDesc,
    welcomeMessage: settings.welcomeMessage,
    tone: settings.tone,
    language: settings.language,
    knowledgeBase: [],
    customerName: "",
    customerHistory: [],
    channel: "",
  };
}

export async function chat(
  conversationId: string,
  userMessage: string
): Promise<string> {
  const config = await getAIConfig();

  // Always save the incoming customer message first
  const savedCustomerMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "customer",
      content: userMessage,
    },
  });

  emitNewMessage(conversationId, { id: savedCustomerMessage.id, role: "customer", content: userMessage });

  if (!config.apiKey) {
    const fallback = "AI is not configured. Please add your API key in Settings > AI Configuration.";
    const savedFallback = await prisma.message.create({
      data: { conversationId, role: "assistant", content: fallback },
    });
    emitNewMessage(conversationId, { id: savedFallback.id, role: "assistant", content: fallback });
    return fallback;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!conversation) {
    return "Conversation not found.";
  }

  const knowledgeBase = await getKnowledgeBase();

  const context: ConversationContext = {
    ...config,
    knowledgeBase,
    customerName: conversation.customerName,
    channel: conversation.channel,
    customerHistory: [],
  };

  // Build message history
  const messages: AIMessage[] = [
    { role: "system", content: buildSystemPrompt(context) },
  ];

  for (const msg of conversation.messages) {
    if (msg.role === "customer") {
      messages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      messages.push({ role: "assistant", content: msg.content });
    }
  }

  // Guardrails: check if human approval needed
  const approval = requiresHumanApproval(userMessage);
  if (approval.required) {
    const sentiment = analyzeSentiment(userMessage);
    const intent = detectIntent(userMessage);

    // Store metadata for dashboard visibility (merge to preserve channel-specific data)
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { metadata: true } });
    const existingMeta = (typeof conv?.metadata === "object" && conv?.metadata !== null ? conv.metadata : {}) as Record<string, unknown>;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: {
          ...existingMeta,
          escalationReason: approval.reason,
          sentiment: sentiment.sentiment,
          intent: intent.intent,
        },
      },
    });
  }

  // Call AI
  const response = await callAI(config, messages, conversationId);

  // Save assistant message
  const savedMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: response,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Confidence scoring
  const confidence = estimateConfidence(response, knowledgeBase.length, false);
  if (confidence.shouldEscalate) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "escalated" },
    });
  }

  emitNewMessage(conversationId, { id: savedMessage.id, role: "assistant", content: response });

  return response;
}

async function callAI(
  config: AIConfig,
  messages: AIMessage[],
  conversationId: string,
  depth = 0
): Promise<string> {
  if (depth > 5) {
    return "I apologize, but I'm having trouble processing your request. Let me connect you with a team member.";
  }

  const openai = new OpenAI({ apiKey: config.apiKey });

  let response;
  try {
    response = await openai.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      tools: owlyTools as OpenAI.ChatCompletionTool[],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });
  } catch {
    return "I'm temporarily unable to process your request. Please try again in a moment, or I can connect you with a team member.";
  }

  const choice = response.choices[0];

  if (
    choice.finish_reason === "tool_calls" &&
    choice.message.tool_calls?.length
  ) {
    // Process tool calls
    const toolCalls = choice.message.tool_calls as Array<{
      id: string;
      type: string;
      function: { name: string; arguments: string };
    }>;

    messages.push({
      role: "assistant",
      content: choice.message.content || "",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    });

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeToolCall(
        toolCall.function.name,
        args,
        conversationId
      );

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
      });
    }

    // Continue the conversation with tool results
    return callAI(config, messages, conversationId, depth + 1);
  }

  return choice.message.content || "I apologize, I could not generate a response.";
}

export async function createNewConversation(
  channel: string,
  customerName: string,
  customerContact: string,
  customerId?: string
) {
  const conversation = await prisma.conversation.create({
    data: {
      channel,
      customerName,
      customerContact,
      ...(customerId && { customerId }),
    },
  });

  publish("global", {
    type: "conversation:new",
    conversationId: conversation.id,
    data: { id: conversation.id, channel, customerName, customerContact },
  });

  return conversation;
}
