import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Owly API",
    description: "AI-powered customer support agent API. Multi-channel support for WhatsApp, Email, and Phone with autonomous AI actions.",
    version: "2026-04-07",
    contact: {
      name: "Hesper Labs",
      url: "https://github.com/Hesper-Labs/owly",
    },
    license: {
      name: "MIT",
      url: "https://github.com/Hesper-Labs/owly/blob/main/LICENSE",
    },
  },
  servers: [
    { url: "/api", description: "Current server" },
  ],
  tags: [
    { name: "Auth", description: "Authentication and setup" },
    { name: "Conversations", description: "Customer conversation management" },
    { name: "Messages", description: "Conversation messages" },
    { name: "Tickets", description: "Support ticket management" },
    { name: "Customers", description: "Customer CRM" },
    { name: "Knowledge", description: "Knowledge base management" },
    { name: "Team", description: "Team members and departments" },
    { name: "Automation", description: "Automation rules engine" },
    { name: "Webhooks", description: "Webhook management and delivery" },
    { name: "Chat", description: "AI chat inference" },
    { name: "Settings", description: "System configuration" },
    { name: "Admin", description: "User and API key management" },
    { name: "Analytics", description: "Statistics and analytics" },
    { name: "System", description: "Health check and system info" },
  ],
  paths: {
    "/auth": {
      get: {
        tags: ["Auth"],
        summary: "Check auth status",
        responses: { "200": { description: "Auth status with user info or setup requirement" } },
      },
      post: {
        tags: ["Auth"],
        summary: "Login, setup, or logout",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { action: { type: "string", enum: ["login", "setup", "logout"] }, username: { type: "string" }, password: { type: "string" } } } } },
        },
        responses: { "200": { description: "Success with auth token cookie" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/conversations": {
      get: {
        tags: ["Conversations"],
        summary: "List conversations (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "channel", in: "query", schema: { type: "string", enum: ["whatsapp", "email", "phone", "api"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "resolved", "closed", "escalated"] } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Paginated conversation list" } },
      },
      post: {
        tags: ["Conversations"],
        summary: "Create a conversation",
        requestBody: {
          content: { "application/json": { schema: { type: "object", required: ["channel"], properties: { channel: { type: "string" }, customerName: { type: "string" }, customerContact: { type: "string" } } } } },
        },
        responses: { "201": { description: "Created conversation" } },
      },
    },
    "/conversations/{id}": {
      get: { tags: ["Conversations"], summary: "Get conversation detail with messages, customer, tickets, and tags", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Conversation detail" }, "404": { description: "Not found" } } },
      put: { tags: ["Conversations"], summary: "Update conversation", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated conversation" } } },
      delete: { tags: ["Conversations"], summary: "Delete conversation", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/conversations/{id}/messages": {
      get: { tags: ["Messages"], summary: "List messages in conversation", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Message list" } } },
      post: { tags: ["Messages"], summary: "Add message to conversation", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Created message" } } },
    },
    "/tickets": {
      get: { tags: ["Tickets"], summary: "List tickets (paginated)", parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "priority", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Paginated ticket list" } } },
      post: { tags: ["Tickets"], summary: "Create a ticket", responses: { "201": { description: "Created ticket" } } },
    },
    "/customers": {
      get: { tags: ["Customers"], summary: "List customers (paginated)", responses: { "200": { description: "Paginated customer list" } } },
      post: { tags: ["Customers"], summary: "Create a customer", responses: { "201": { description: "Created customer" } } },
    },
    "/customers/{id}": {
      get: { tags: ["Customers"], summary: "Get customer detail with cross-channel conversations", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Customer with conversations" } } },
      put: { tags: ["Customers"], summary: "Update customer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Customers"], summary: "Delete customer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/customers/{id}/conversations": {
      get: { tags: ["Customers"], summary: "Unified cross-channel conversation timeline for a customer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "channel", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Paginated conversation list across all channels" } } },
    },
    "/chat": {
      post: { tags: ["Chat"], summary: "Send a message and get AI response", requestBody: { content: { "application/json": { schema: { type: "object", required: ["message"], properties: { message: { type: "string", maxLength: 10000 }, conversationId: { type: "string" }, channel: { type: "string" }, customerName: { type: "string" } } } } } }, responses: { "200": { description: "AI response with conversation ID" } } },
    },
    "/knowledge/entries": {
      get: { tags: ["Knowledge"], summary: "List knowledge entries (paginated)", responses: { "200": { description: "Paginated entries" } } },
      post: { tags: ["Knowledge"], summary: "Create knowledge entry", responses: { "201": { description: "Created entry" } } },
    },
    "/knowledge/categories": {
      get: { tags: ["Knowledge"], summary: "List categories (paginated)", responses: { "200": { description: "Paginated categories" } } },
      post: { tags: ["Knowledge"], summary: "Create category", responses: { "201": { description: "Created" } } },
    },
    "/automation": {
      get: { tags: ["Automation"], summary: "List automation rules (paginated)", responses: { "200": { description: "Paginated rules" } } },
      post: { tags: ["Automation"], summary: "Create automation rule", responses: { "201": { description: "Created rule" } } },
    },
    "/webhooks": {
      get: { tags: ["Webhooks"], summary: "List webhooks (paginated)", responses: { "200": { description: "Paginated webhooks" } } },
      post: { tags: ["Webhooks"], summary: "Create webhook", responses: { "201": { description: "Created webhook" } } },
    },
    "/webhooks/{id}/deliveries": {
      get: { tags: ["Webhooks"], summary: "List webhook deliveries with retry status", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["pending", "delivered", "failed"] } }], responses: { "200": { description: "Paginated delivery list" } } },
      post: { tags: ["Webhooks"], summary: "Retry a failed delivery", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Retry result" } } },
    },
    "/settings": {
      get: { tags: ["Settings"], summary: "Get settings (secrets masked)", responses: { "200": { description: "Settings with masked sensitive fields" } } },
      put: { tags: ["Settings"], summary: "Update settings", responses: { "200": { description: "Updated settings" } } },
    },
    "/stats": { get: { tags: ["Analytics"], summary: "Get summary statistics", responses: { "200": { description: "Stats overview" } } } },
    "/analytics": { get: { tags: ["Analytics"], summary: "Get detailed analytics", parameters: [{ name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } }], responses: { "200": { description: "Analytics data" } } } },
    "/export": { get: { tags: ["Analytics"], summary: "Export data (CSV/JSON)", parameters: [{ name: "type", in: "query", schema: { type: "string", enum: ["conversations", "tickets", "customers", "knowledge"] } }, { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"] } }, { name: "limit", in: "query", schema: { type: "integer", maximum: 50000 } }], responses: { "200": { description: "Exported data" } } } },
    "/health": { get: { tags: ["System"], summary: "Health check with service status", security: [], responses: { "200": { description: "Service health including database, OpenAI, memory, uptime" } } } },
    "/openapi.json": { get: { tags: ["System"], summary: "OpenAPI specification", security: [], responses: { "200": { description: "This document" } } } },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "owly-token" },
    },
    schemas: {
      PaginatedResponse: {
        type: "object",
        properties: {
          data: { type: "array", items: {} },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              requestId: { type: "string" },
              details: {},
            },
          },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
