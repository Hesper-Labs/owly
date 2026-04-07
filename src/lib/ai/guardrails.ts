/**
 * AI Guardrails - Controls what the AI can and cannot do.
 */

export interface GuardrailConfig {
  blockedTopics: string[];
  maxResponseLength: number;
  requireHumanApproval: string[];
  confidenceThreshold: number;
}

const DEFAULT_GUARDRAILS: GuardrailConfig = {
  blockedTopics: [
    "legal advice",
    "medical advice",
    "investment advice",
    "price commitments",
    "competitor comparisons",
  ],
  maxResponseLength: 2000,
  requireHumanApproval: [
    "refund",
    "cancellation",
    "discount",
    "compensation",
    "legal",
  ],
  confidenceThreshold: 0.6,
};

/**
 * Check if a message contains blocked topics.
 */
export function checkBlockedTopics(
  message: string,
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): { blocked: boolean; topic?: string } {
  const lower = message.toLowerCase();
  for (const topic of config.blockedTopics) {
    if (lower.includes(topic.toLowerCase())) {
      return { blocked: true, topic };
    }
  }
  return { blocked: false };
}

/**
 * Check if a message requires human approval before AI responds.
 */
export function requiresHumanApproval(
  message: string,
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): { required: boolean; reason?: string } {
  const lower = message.toLowerCase();
  for (const keyword of config.requireHumanApproval) {
    if (lower.includes(keyword.toLowerCase())) {
      return { required: true, reason: keyword };
    }
  }
  return { required: false };
}

/**
 * Truncate AI response to maximum allowed length.
 */
export function enforceResponseLength(
  response: string,
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): string {
  if (response.length <= config.maxResponseLength) return response;
  return response.substring(0, config.maxResponseLength).trimEnd() + "...";
}

/**
 * Analyze sentiment of a message.
 * Returns: positive, negative, neutral, or frustrated
 */
export function analyzeSentiment(message: string): {
  sentiment: "positive" | "negative" | "neutral" | "frustrated";
  score: number;
} {
  const lower = message.toLowerCase();

  const negativePatterns = [
    "angry", "furious", "terrible", "worst", "hate", "awful",
    "disgusting", "unacceptable", "ridiculous", "horrible",
    "scam", "fraud", "sue", "lawyer", "complaint",
  ];
  const frustratedPatterns = [
    "again", "still", "waiting", "how long", "not working",
    "broken", "frustrated", "annoyed", "disappointed",
    "already told", "third time", "keep asking",
  ];
  const positivePatterns = [
    "thank", "great", "excellent", "awesome", "love",
    "perfect", "amazing", "wonderful", "fantastic", "helpful",
    "appreciate", "satisfied", "happy",
  ];

  let score = 0;
  for (const p of negativePatterns) {
    if (lower.includes(p)) score -= 2;
  }
  for (const p of frustratedPatterns) {
    if (lower.includes(p)) score -= 1;
  }
  for (const p of positivePatterns) {
    if (lower.includes(p)) score += 2;
  }

  if (score <= -3) return { sentiment: "negative", score: Math.max(-1, score / 10) };
  if (score <= -1) return { sentiment: "frustrated", score: score / 10 };
  if (score >= 2) return { sentiment: "positive", score: Math.min(1, score / 10) };
  return { sentiment: "neutral", score: 0 };
}

/**
 * Detect customer intent from message.
 */
export function detectIntent(message: string): {
  intent: string;
  confidence: number;
} {
  const lower = message.toLowerCase();

  const intents: { intent: string; keywords: string[]; weight: number }[] = [
    { intent: "support", keywords: ["help", "issue", "problem", "not working", "broken", "error", "bug", "fix"], weight: 1 },
    { intent: "billing", keywords: ["invoice", "bill", "charge", "payment", "refund", "price", "cost", "subscription", "plan"], weight: 1 },
    { intent: "sales", keywords: ["buy", "purchase", "pricing", "demo", "trial", "interested", "quote", "proposal"], weight: 1 },
    { intent: "complaint", keywords: ["complaint", "unhappy", "dissatisfied", "terrible", "worst", "unacceptable", "sue"], weight: 1.5 },
    { intent: "information", keywords: ["how", "what", "when", "where", "can i", "do you", "is it", "tell me"], weight: 0.5 },
    { intent: "cancellation", keywords: ["cancel", "unsubscribe", "stop", "close account", "terminate", "end service"], weight: 1.5 },
    { intent: "feedback", keywords: ["suggest", "feedback", "improve", "feature request", "would be nice", "wish"], weight: 1 },
    { intent: "greeting", keywords: ["hello", "hi", "hey", "good morning", "good afternoon"], weight: 0.3 },
  ];

  let bestMatch = { intent: "general", confidence: 0 };

  for (const { intent, keywords, weight } of intents) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) matchCount++;
    }
    const confidence = Math.min(1, (matchCount * weight) / 3);
    if (confidence > bestMatch.confidence) {
      bestMatch = { intent, confidence };
    }
  }

  return bestMatch;
}

/**
 * Generate a conversation summary from messages.
 */
export function generateSummaryPrompt(
  messages: { role: string; content: string }[]
): string {
  const transcript = messages
    .slice(-20)
    .map((m) => `${m.role}: ${m.content.substring(0, 300)}`)
    .join("\n");

  return `Summarize this customer support conversation in 2-3 sentences. Focus on: what the customer needed, what was done, and the outcome.

Conversation:
${transcript}

Summary:`;
}

/**
 * Calculate AI confidence score based on response characteristics.
 */
export function estimateConfidence(
  response: string,
  knowledgeBaseSize: number,
  hasToolCalls: boolean
): { score: number; shouldEscalate: boolean } {
  let score = 0.5;

  // Knowledge base coverage
  if (knowledgeBaseSize > 20) score += 0.1;
  if (knowledgeBaseSize > 50) score += 0.1;

  // Response quality indicators
  if (response.length > 50 && response.length < 1500) score += 0.1;
  if (hasToolCalls) score += 0.1;

  // Uncertainty indicators
  const uncertainPhrases = [
    "i'm not sure", "i don't know", "i cannot", "i apologize",
    "unfortunately", "i'm unable", "beyond my knowledge",
    "connect you with", "team member",
  ];
  const lower = response.toLowerCase();
  for (const phrase of uncertainPhrases) {
    if (lower.includes(phrase)) {
      score -= 0.15;
      break;
    }
  }

  score = Math.max(0, Math.min(1, score));

  return {
    score: Math.round(score * 100) / 100,
    shouldEscalate: score < DEFAULT_GUARDRAILS.confidenceThreshold,
  };
}

/**
 * Generate suggested replies for an agent based on conversation context.
 */
export function generateSuggestedRepliesPrompt(
  messages: { role: string; content: string }[],
  cannedResponses: { title: string; content: string }[]
): string {
  const lastMessages = messages.slice(-5);
  const transcript = lastMessages
    .map((m) => `${m.role}: ${m.content.substring(0, 200)}`)
    .join("\n");

  const canned = cannedResponses
    .slice(0, 5)
    .map((c) => `- ${c.title}: ${c.content.substring(0, 100)}`)
    .join("\n");

  return `Based on this conversation, suggest 3 short professional replies the support agent could send. Each reply should be 1-2 sentences.

Recent messages:
${transcript}

${canned ? `Available templates:\n${canned}\n` : ""}
Return exactly 3 suggestions as a JSON array of strings.`;
}
