import { prisma } from "@/lib/prisma";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  value: string;
}

interface AutomationRule {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  conditions: Condition[];
  actions: Action[];
  priority: number;
}

interface Message {
  content: string;
  channel?: string;
  customerName?: string;
}

interface Conversation {
  id: string;
  channel?: string;
  customerName?: string;
}

interface MatchedAction {
  ruleId: string;
  ruleName: string;
  type: string;
  actions: Action[];
}

function getFieldValue(
  field: string,
  message: Message,
  conversation: Conversation
): string {
  switch (field) {
    case "message_content":
      return message.content || "";
    case "channel":
      return message.channel || conversation.channel || "";
    case "customer_name":
      return message.customerName || conversation.customerName || "";
    default:
      return "";
  }
}

function evaluateCondition(
  condition: Condition,
  message: Message,
  conversation: Conversation
): boolean {
  const fieldValue = getFieldValue(
    condition.field,
    message,
    conversation
  ).toLowerCase();
  const targetValue = condition.value.toLowerCase();

  switch (condition.operator) {
    case "contains":
      return fieldValue.includes(targetValue);
    case "equals":
      return fieldValue === targetValue;
    case "starts_with":
      return fieldValue.startsWith(targetValue);
    default:
      return false;
  }
}

function ruleMatchesMessage(
  rule: AutomationRule,
  message: Message,
  conversation: Conversation
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return false;

  return rule.conditions.every((condition) =>
    evaluateCondition(condition, message, conversation)
  );
}

/**
 * Evaluates all active automation rules against a message and conversation.
 * Returns an array of matched actions sorted by rule priority (highest first).
 *
 * Called from the AI engine when a new message comes in.
 */
export async function evaluateRules(
  message: Message,
  conversation: Conversation
): Promise<MatchedAction[]> {
  const rules = await prisma.automationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  });

  const matchedActions: MatchedAction[] = [];

  for (const rule of rules) {
    const conditions = rule.conditions as unknown as Condition[];
    const actions = rule.actions as unknown as Action[];

    const automationRule: AutomationRule = {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      isActive: rule.isActive,
      conditions,
      actions,
      priority: rule.priority,
    };

    if (ruleMatchesMessage(automationRule, message, conversation)) {
      matchedActions.push({
        ruleId: rule.id,
        ruleName: rule.name,
        type: rule.type,
        actions,
      });

      // Increment trigger count in background
      prisma.automationRule
        .update({
          where: { id: rule.id },
          data: { triggerCount: { increment: 1 } },
        })
        .catch((err) =>
          console.error(
            `Failed to increment trigger count for rule ${rule.id}:`,
            err
          )
        );
    }
  }

  return matchedActions;
}
