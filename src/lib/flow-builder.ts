/**
 * Chatbot Flow Builder
 * Define conversation flows as a decision tree.
 * Visual builder on the frontend, this is the runtime engine.
 */

export type NodeType = "message" | "question" | "condition" | "action" | "ai_response" | "transfer" | "end";

export interface FlowNode {
  id: string;
  type: NodeType;
  content: string;
  options?: FlowOption[];      // For question nodes
  condition?: FlowCondition;   // For condition nodes
  action?: FlowAction;         // For action nodes
  nextNodeId?: string;         // Default next node
}

export interface FlowOption {
  label: string;
  nextNodeId: string;
}

export interface FlowCondition {
  field: string;     // message_content, channel, customer_tag, etc.
  operator: string;  // contains, equals, starts_with
  value: string;
  trueNodeId: string;
  falseNodeId: string;
}

export interface FlowAction {
  type: string;  // create_ticket, assign, tag, send_email, webhook
  params: Record<string, string>;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  startNodeId: string;
  nodes: FlowNode[];
  isActive: boolean;
}

interface FlowContext {
  conversationId: string;
  customerMessage: string;
  channel: string;
  customerName: string;
  variables: Record<string, string>;
}

/**
 * Execute a flow from a given node.
 * Returns the responses to send and the next state.
 */
export function executeFlowNode(
  flow: Flow,
  nodeId: string,
  context: FlowContext
): { responses: string[]; nextNodeId: string | null; actions: FlowAction[] } {
  const node = flow.nodes.find((n) => n.id === nodeId);
  if (!node) return { responses: [], nextNodeId: null, actions: [] };

  const responses: string[] = [];
  const actions: FlowAction[] = [];
  let nextNodeId: string | null = null;

  switch (node.type) {
    case "message":
      responses.push(interpolate(node.content, context.variables));
      nextNodeId = node.nextNodeId || null;
      break;

    case "question":
      responses.push(interpolate(node.content, context.variables));
      // Wait for user response - next node determined by option selection
      if (node.options) {
        const userMsg = context.customerMessage.toLowerCase();
        const matched = node.options.find((opt) =>
          userMsg.includes(opt.label.toLowerCase())
        );
        nextNodeId = matched?.nextNodeId || node.nextNodeId || null;
      }
      break;

    case "condition":
      if (node.condition) {
        const matches = evaluateCondition(node.condition, context);
        nextNodeId = matches ? node.condition.trueNodeId : node.condition.falseNodeId;
      }
      break;

    case "action":
      if (node.action) {
        actions.push(node.action);
      }
      nextNodeId = node.nextNodeId || null;
      break;

    case "ai_response":
      // Signal that AI should generate a response
      responses.push("__AI_RESPONSE__");
      nextNodeId = node.nextNodeId || null;
      break;

    case "transfer":
      responses.push(node.content || "Let me connect you with a team member.");
      actions.push({ type: "transfer", params: { department: node.content } });
      nextNodeId = null;
      break;

    case "end":
      if (node.content) responses.push(node.content);
      nextNodeId = null;
      break;
  }

  return { responses, nextNodeId, actions };
}

function evaluateCondition(condition: FlowCondition, context: FlowContext): boolean {
  let fieldValue = "";

  switch (condition.field) {
    case "message_content":
      fieldValue = context.customerMessage;
      break;
    case "channel":
      fieldValue = context.channel;
      break;
    case "customer_name":
      fieldValue = context.customerName;
      break;
    default:
      fieldValue = context.variables[condition.field] || "";
  }

  const lower = fieldValue.toLowerCase();
  const target = condition.value.toLowerCase();

  switch (condition.operator) {
    case "contains": return lower.includes(target);
    case "equals": return lower === target;
    case "starts_with": return lower.startsWith(target);
    case "not_contains": return !lower.includes(target);
    default: return false;
  }
}

function interpolate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

/**
 * Validate a flow definition.
 */
export function validateFlow(flow: Flow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(flow.nodes.map((n) => n.id));

  if (!flow.startNodeId) {
    errors.push("Flow must have a start node");
  } else if (!nodeIds.has(flow.startNodeId)) {
    errors.push("Start node ID does not exist");
  }

  for (const node of flow.nodes) {
    if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) {
      errors.push(`Node ${node.id}: nextNodeId "${node.nextNodeId}" does not exist`);
    }
    if (node.options) {
      for (const opt of node.options) {
        if (!nodeIds.has(opt.nextNodeId)) {
          errors.push(`Node ${node.id}: option "${opt.label}" points to non-existent node`);
        }
      }
    }
    if (node.condition) {
      if (!nodeIds.has(node.condition.trueNodeId)) {
        errors.push(`Node ${node.id}: condition trueNodeId does not exist`);
      }
      if (!nodeIds.has(node.condition.falseNodeId)) {
        errors.push(`Node ${node.id}: condition falseNodeId does not exist`);
      }
    }
  }

  // Check for unreachable nodes
  const reachable = new Set<string>();
  const queue = [flow.startNodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const node = flow.nodes.find((n) => n.id === id);
    if (!node) continue;
    if (node.nextNodeId) queue.push(node.nextNodeId);
    if (node.options) node.options.forEach((o) => queue.push(o.nextNodeId));
    if (node.condition) {
      queue.push(node.condition.trueNodeId);
      queue.push(node.condition.falseNodeId);
    }
  }

  const unreachable = flow.nodes.filter((n) => !reachable.has(n.id));
  if (unreachable.length > 0) {
    errors.push(`Unreachable nodes: ${unreachable.map((n) => n.id).join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}
