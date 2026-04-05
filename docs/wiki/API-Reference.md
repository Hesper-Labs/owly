# API Reference

Owly provides a REST API for programmatic access to all major features. This page documents every available endpoint, including request and response formats.

![API Documentation Page](../screenshots/17-api-docs.png)

---

## Authentication

All API requests (except `/api/health` and `/api/auth`) require authentication. There are two methods:

### Method 1: API Key (Recommended for Integrations)

Include an API key in the `X-API-Key` header:

```
X-API-Key: owly_your_api_key_here
```

Generate API keys from the Admin page. See [API Keys](API-Keys) for details.

### Method 2: Session Cookie (Dashboard)

The Owly dashboard uses JWT-based session cookies (`owly-token`). This method is used automatically by the browser when you are logged in. It is not recommended for external integrations.

---

## Base URL

All endpoints are relative to your Owly deployment URL:

```
https://your-owly-domain
```

For local development:

```
http://localhost:3000
```

---

## Endpoints

### Chat

#### POST /api/chat

Send a message to the AI and receive a response. This is the primary endpoint for building custom chat interfaces.

**Request Body:**

```json
{
  "message": "Hello, I need help with my order",
  "conversationId": "optional-existing-conversation-id",
  "channel": "api",
  "customerName": "Jane Doe",
  "customerContact": "jane@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The customer's message text. |
| `conversationId` | string | No | An existing conversation ID to continue. If omitted, a new conversation is created. |
| `channel` | string | No | The channel identifier. Defaults to `api`. |
| `customerName` | string | No | The customer's display name. Defaults to `API User`. |
| `customerContact` | string | No | The customer's contact info (email or phone). |

**Response (200):**

```json
{
  "conversationId": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
  "response": "Hello Jane! I'd be happy to help you with your order. Could you please provide your order number?"
}
```

---

### Conversations

#### GET /api/conversations

Retrieve a list of all conversations, ordered by most recently updated.

**Response (200):**

```json
[
  {
    "id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
    "channel": "whatsapp",
    "customerName": "Jane Doe",
    "customerContact": "+15551234567",
    "status": "active",
    "satisfaction": null,
    "summary": "",
    "metadata": {},
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T14:30:00.000Z",
    "messages": [...],
    "tags": [...]
  }
]
```

#### POST /api/conversations

Create a new conversation.

**Request Body:**

```json
{
  "channel": "web",
  "customerName": "John Smith",
  "customerContact": "john@example.com"
}
```

**Response (201):**

```json
{
  "id": "new-conversation-uuid",
  "channel": "web",
  "customerName": "John Smith",
  "customerContact": "john@example.com",
  "status": "active",
  "satisfaction": null,
  "summary": "",
  "metadata": {},
  "createdAt": "2026-04-05T14:30:00.000Z",
  "updatedAt": "2026-04-05T14:30:00.000Z"
}
```

#### GET /api/conversations/:id

Retrieve a single conversation by ID, including its messages and related tickets.

**Response (200):**

```json
{
  "id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
  "channel": "whatsapp",
  "customerName": "Jane Doe",
  "customerContact": "+15551234567",
  "status": "active",
  "messages": [
    {
      "id": "msg-uuid",
      "role": "customer",
      "content": "I need help with my order",
      "createdAt": "2026-04-05T10:00:00.000Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "I'd be happy to help! Could you provide your order number?",
      "createdAt": "2026-04-05T10:00:01.000Z"
    }
  ],
  "tickets": [...]
}
```

#### PUT /api/conversations/:id

Update a conversation's fields (status, customerName, summary, etc.).

**Request Body:**

```json
{
  "status": "resolved",
  "summary": "Customer had a billing question, resolved by providing invoice."
}
```

**Response (200):** Returns the updated conversation object.

#### DELETE /api/conversations/:id

Delete a conversation and all associated messages.

**Response (200):**

```json
{
  "success": true
}
```

#### POST /api/conversations/:id/messages

Add a message to an existing conversation without triggering the AI. Useful for logging agent messages or system notes.

**Request Body:**

```json
{
  "role": "assistant",
  "content": "I've escalated your issue to our billing team."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | The message sender role: `customer`, `assistant`, or `system`. |
| `content` | string | Yes | The message text. |

**Response (201):** Returns the created message object.

---

### Tickets

#### GET /api/tickets

Retrieve all tickets, ordered by most recently created.

**Response (200):**

```json
[
  {
    "id": "ticket-uuid",
    "title": "Cannot access account",
    "description": "Customer locked out after password reset",
    "status": "open",
    "priority": "high",
    "conversationId": "conv-uuid",
    "departmentId": "dept-uuid",
    "assignedToId": null,
    "resolution": "",
    "createdAt": "2026-04-05T14:30:00.000Z",
    "updatedAt": "2026-04-05T14:30:00.000Z"
  }
]
```

#### POST /api/tickets

Create a new ticket.

**Request Body:**

```json
{
  "title": "Refund request for order #1234",
  "description": "Customer wants a refund for a defective product",
  "priority": "medium",
  "conversationId": "optional-conv-uuid",
  "departmentId": "optional-dept-uuid"
}
```

**Response (201):** Returns the created ticket object.

#### GET /api/tickets/:id

Retrieve a single ticket by ID, including related conversation, department, and assigned team member.

**Response (200):** Returns the ticket object with populated relations.

#### PUT /api/tickets/:id

Update a ticket's fields.

**Request Body:**

```json
{
  "status": "resolved",
  "resolution": "Refund processed successfully",
  "assignedToId": "team-member-uuid"
}
```

**Response (200):** Returns the updated ticket object.

#### DELETE /api/tickets/:id

Delete a ticket.

**Response (200):**

```json
{
  "success": true
}
```

---

### Knowledge Base

#### GET /api/knowledge/categories

Retrieve all knowledge base categories.

**Response (200):**

```json
[
  {
    "id": "cat-uuid",
    "name": "General FAQ",
    "description": "Frequently asked questions",
    "icon": "folder",
    "color": "#4A7C9B",
    "sortOrder": 0,
    "entries": [...],
    "createdAt": "2026-04-05T10:00:00.000Z"
  }
]
```

#### POST /api/knowledge/categories

Create a new category.

**Request Body:**

```json
{
  "name": "Billing",
  "description": "Questions about invoices, payments, and refunds",
  "icon": "credit-card",
  "color": "#22C55E"
}
```

**Response (201):** Returns the created category object.

#### GET /api/knowledge/entries

Retrieve all knowledge base entries.

**Response (200):**

```json
[
  {
    "id": "entry-uuid",
    "categoryId": "cat-uuid",
    "title": "How to reset your password",
    "content": "To reset your password, go to the login page and click...",
    "priority": 1,
    "isActive": true,
    "version": 1,
    "category": {
      "id": "cat-uuid",
      "name": "General FAQ"
    }
  }
]
```

#### POST /api/knowledge/entries

Create a new knowledge base entry.

**Request Body:**

```json
{
  "categoryId": "cat-uuid",
  "title": "Refund Policy",
  "content": "We offer full refunds within 30 days of purchase...",
  "priority": 2,
  "isActive": true
}
```

**Response (201):** Returns the created entry object.

#### POST /api/knowledge/test

Test the AI's response against the knowledge base. Sends a question and returns the AI's answer based on current knowledge base entries.

**Request Body:**

```json
{
  "question": "What is your refund policy?"
}
```

**Response (200):**

```json
{
  "answer": "We offer full refunds within 30 days of purchase. After 30 days, we can offer store credit...",
  "sources": [
    {
      "title": "Refund Policy",
      "category": "Billing"
    }
  ]
}
```

---

### Settings

#### GET /api/settings

Retrieve the current settings. Sensitive fields (API keys, passwords, tokens) are masked in the response.

**Response (200):**

```json
{
  "id": "default",
  "businessName": "My Business",
  "businessDesc": "We sell quality products",
  "welcomeMessage": "Hello! How can I help you today?",
  "tone": "friendly",
  "language": "auto",
  "aiProvider": "openai",
  "aiModel": "gpt-4o-mini",
  "aiApiKey": "****...last4",
  "maxTokens": 2048,
  "temperature": 0.7
}
```

#### PUT /api/settings

Update settings. You can send a partial update containing only the fields you want to change.

**Request Body:**

```json
{
  "businessName": "Acme Corp",
  "tone": "formal",
  "maxTokens": 4096
}
```

**Response (200):** Returns the updated settings object (with sensitive fields masked).

---

### Analytics

#### GET /api/analytics?period=7d

Retrieve analytics data for the specified period.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | Time period: `7d`, `30d`, or `90d`. |

**Response (200):**

```json
{
  "totalConversations": 142,
  "avgResponseTime": 1.8,
  "resolutionRate": 87.5,
  "satisfactionAvg": 4.2,
  "conversationsPerDay": [
    { "date": "2026-03-29", "count": 18 },
    { "date": "2026-03-30", "count": 22 }
  ],
  "channelBreakdown": [
    { "channel": "whatsapp", "count": 65 },
    { "channel": "email", "count": 42 },
    { "channel": "web", "count": 35 }
  ],
  "ticketsByPriority": [
    { "priority": "low", "count": 12 },
    { "priority": "medium", "count": 28 },
    { "priority": "high", "count": 8 },
    { "priority": "urgent", "count": 3 }
  ],
  "ticketsByStatus": [
    { "status": "open", "count": 15 },
    { "status": "in_progress", "count": 10 },
    { "status": "resolved", "count": 20 },
    { "status": "closed", "count": 5 },
    { "status": "escalated", "count": 1 }
  ],
  "teamPerformance": [
    { "member": "Alice Johnson", "ticketsResolved": 12, "avgTime": 45 }
  ]
}
```

---

### Export

#### GET /api/export?type=conversations&format=csv

Export data in JSON or CSV format.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `conversations` | The data type to export: `conversations`. |
| `format` | string | `json` | The output format: `json` or `csv`. |

**Response (200 -- JSON):** Returns the data as a JSON array.

**Response (200 -- CSV):** Returns the data as a CSV file with `Content-Type: text/csv` and a `Content-Disposition` header for download.

---

### Health

#### GET /api/health

A public endpoint (no authentication required) to check if the Owly server is running.

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-04-05T14:30:00.000Z"
}
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Description of what went wrong"
}
```

### Common Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| **400 Bad Request** | The request body is missing required fields or contains invalid data. | Missing `message` field in `/api/chat`, invalid JSON body, missing required fields. |
| **401 Unauthorized** | Authentication failed or was not provided. | Missing or invalid `X-API-Key` header, expired session cookie, deactivated API key. |
| **404 Not Found** | The requested resource does not exist. | Invalid conversation ID, ticket ID, or other entity ID in the URL path. |
| **500 Internal Server Error** | An unexpected server error occurred. | Database connection issues, AI provider errors, misconfigured settings. |

### Example Error Response

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized"
}
```

---

## Rate Limiting

Owly does not currently enforce built-in rate limiting. If you are deploying Owly in a production environment with public-facing API access, it is strongly recommended to add rate limiting at the reverse proxy level (e.g., Nginx, Caddy, or Cloudflare).

### Recommended Limits

| Endpoint | Suggested Limit |
|----------|----------------|
| `POST /api/chat` | 10 requests per minute per API key |
| `GET /api/conversations` | 60 requests per minute per API key |
| `GET /api/analytics` | 10 requests per minute per API key |
| All other endpoints | 60 requests per minute per API key |

### Nginx Rate Limiting Example

```nginx
limit_req_zone $http_x_api_key zone=owly_api:10m rate=60r/m;

location /api/ {
    limit_req zone=owly_api burst=10 nodelay;
    proxy_pass http://localhost:3000;
}
```

The `POST /api/chat` endpoint is the most resource-intensive because it calls the AI provider for each request. Stricter limits on this endpoint help control costs and prevent abuse.
