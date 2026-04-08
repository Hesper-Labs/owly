import { z } from "zod";

// Shared schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Auth
export const loginSchema = z.object({
  action: z.literal("login"),
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

export const setupSchema = z.object({
  action: z.literal("setup"),
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  name: z.string().max(200).optional(),
});

// Conversations
export const createConversationSchema = z.object({
  channel: z.enum(["whatsapp", "email", "phone", "sms", "telegram", "zalo-personal", "api", "widget"]),
  customerName: z.string().max(200).optional(),
  customerContact: z.string().max(500).optional(),
  status: z.enum(["active", "resolved", "closed", "escalated"]).optional(),
});

export const updateConversationSchema = z.object({
  status: z.enum(["active", "resolved", "closed", "escalated"]).optional(),
  satisfaction: z.number().int().min(1).max(5).nullable().optional(),
  summary: z.string().max(5000).nullable().optional(),
  customerName: z.string().max(200).optional(),
});

// Messages
export const createMessageSchema = z.object({
  role: z.enum(["customer", "assistant", "system"]).default("assistant"),
  content: z.string().min(1, "Message content is required").max(50000),
  mediaType: z.string().max(100).nullable().optional(),
  mediaUrl: z.string().url().max(2000).nullable().optional(),
});

// Tickets
export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  conversationId: z.string().max(100).optional(),
  departmentId: z.string().max(100).optional(),
  assignedToId: z.string().max(100).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  resolution: z.string().max(10000).nullable().optional(),
  departmentId: z.string().max(100).nullable().optional(),
  assignedToId: z.string().max(100).nullable().optional(),
});

// Knowledge
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createKnowledgeEntrySchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required").max(100000),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

// Team
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  email: z.string().email().max(300).optional(),
});

export const createTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(300),
  phone: z.string().max(50).optional(),
  role: z.string().max(100).optional(),
  expertise: z.string().max(500).optional(),
  departmentId: z.string().min(1, "Department is required"),
  isAvailable: z.boolean().default(true),
});

// Customers
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().max(300).optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  zalo: z.string().max(50).optional(),
  tags: z.string().max(500).optional(),
  isBlocked: z.boolean().default(false),
  notes: z.string().max(5000).nullable().optional(),
});

// Webhooks
export const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  url: z.string().url("Invalid URL").max(2000),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  headers: z.record(z.string(), z.string()).optional(),
  triggerOn: z.string().min(1).max(200),
  isActive: z.boolean().default(true),
});

// Automation
export const createAutomationRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["auto_route", "auto_tag", "auto_reply", "keyword_alert"]),
  isActive: z.boolean().default(true),
  conditions: z.array(
    z.object({
      field: z.enum(["message_content", "channel", "customer_name"]),
      operator: z.enum(["contains", "equals", "starts_with"]),
      value: z.string().min(1).max(500),
    })
  ).min(1, "At least one condition is required"),
  actions: z.array(
    z.object({
      type: z.string().min(1).max(100),
      value: z.string().max(1000),
    })
  ).min(1, "At least one action is required"),
  priority: z.number().int().min(0).max(1000).default(0),
});

// Settings
export const updateSettingsSchema = z.object({
  businessName: z.string().max(500).optional(),
  businessDesc: z.string().max(5000).optional(),
  welcomeMessage: z.string().max(2000).optional(),
  tone: z.enum(["friendly", "formal", "technical", "professional"]).optional(),
  language: z.string().max(20).optional(),
  aiProvider: z.string().max(50).optional(),
  aiModel: z.string().max(100).optional(),
  aiApiKey: z.string().max(500).optional(),
  maxTokens: z.number().int().min(100).max(128000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  smtpHost: z.string().max(500).optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().max(300).optional(),
  smtpPass: z.string().max(500).optional(),
  smtpFrom: z.string().max(300).optional(),
  imapHost: z.string().max(500).optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapUser: z.string().max(300).optional(),
  imapPass: z.string().max(500).optional(),
  twilioSid: z.string().max(200).optional(),
  twilioToken: z.string().max(200).optional(),
  twilioPhone: z.string().max(50).optional(),
  elevenLabsKey: z.string().max(200).optional(),
  elevenLabsVoice: z.string().max(200).optional(),
  whatsappMode: z.string().max(50).optional(),
  whatsappApiKey: z.string().max(500).optional(),
  whatsappPhone: z.string().max(50).optional(),
}).strict();

// Canned Responses
export const createCannedResponseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
  category: z.string().max(100).optional(),
  shortcut: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

// SLA
export const createSLARuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  channel: z.string().max(50).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  firstResponseMins: z.number().int().min(1).max(10080),
  resolutionMins: z.number().int().min(1).max(43200),
  isActive: z.boolean().default(true),
});

// Admin Users
export const createAdminSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(200),
  name: z.string().max(200).optional(),
  role: z.enum(["admin", "supervisor", "agent", "viewer"]).default("admin"),
});

// API Keys
export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

// Internal Notes
export const createNoteSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  authorName: z.string().max(200).optional(),
});

// Pagination helper
export { paginationSchema };

// Validation helper
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = result.error.issues || [];
  const errors = issues.map((e) => `${(e.path || []).join(".")}: ${e.message}`).join(", ");
  return { success: false, error: errors || result.error.message };
}
