# Architecture

This page provides a technical overview of Owly's architecture, covering the technology stack, directory layout, database design, authentication flow, and key design decisions.

---

## High-Level Architecture

```
                                +-------------------+
                                |   Web Browser     |
                                |   (Dashboard UI)  |
                                +--------+----------+
                                         |
                                    HTTPS/WSS
                                         |
+-------------+    +-----------+    +----+------------+    +-----------+
|  WhatsApp   +--->+           |    |                 |    |           |
+-------------+    |           |    |   Next.js App   |    | PostgreSQL|
+-------------+    |  Channel  +--->+   (App Router)  +<-->+ Database  |
|    Email    +--->+  Handlers |    |                 |    |           |
+-------------+    |           |    +---+----+--------+    +-----------+
+-------------+    |           |        |    |
|    Phone    +--->+-----------+        |    |
+-------------+                         |    |
                                        |    |
                               +--------+    +--------+
                               |                      |
                          +----+------+        +------+------+
                          |   OpenAI  |        |  ElevenLabs |
                          |   API     |        |  (Voice)    |
                          +-----------+        +-------------+
```

Customer messages arrive through WhatsApp, Email, or Phone channels. Each channel has a dedicated handler that normalizes the incoming message and routes it to the AI engine. The AI engine queries the knowledge base, calls the OpenAI API with tool definitions, executes any tool calls, and returns the response. The response is then sent back through the originating channel.

The admin dashboard is a React-based single-page application served by Next.js. It communicates with the backend through REST API routes.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript | Type-safe JavaScript for frontend and backend |
| **UI** | React 19 + Tailwind CSS 4 | Component-based UI with utility-first styling |
| **State Management** | Zustand | Lightweight client-side state management |
| **Database** | PostgreSQL | Relational database for all persistent data |
| **ORM** | Prisma 7 | Type-safe database access and schema management |
| **AI Engine** | OpenAI SDK | Chat completions with function calling |
| **Voice** | ElevenLabs SDK | Text-to-speech for phone channel |
| **Phone** | Twilio SDK | Inbound/outbound phone call handling |
| **Email** | Nodemailer + IMAP | SMTP sending and IMAP receiving |
| **WhatsApp** | whatsapp-web.js | WhatsApp Web protocol client |
| **Real-time** | Socket.IO | WebSocket communication for live updates |
| **Auth** | JWT + bcryptjs | Token-based authentication with password hashing |
| **UI Components** | Radix UI | Accessible, unstyled component primitives |
| **Icons** | Lucide React | Open-source icon library |

---

## Directory Structure

```
owly/
+-- prisma/
|   +-- schema.prisma          # Database schema definition
|   +-- migrations/            # Database migration files
|   +-- seed.ts                # Database seed script
+-- public/                    # Static assets (logo, favicon)
+-- src/
|   +-- app/
|   |   +-- (auth)/            # Authentication pages (login, setup)
|   |   +-- (dashboard)/       # Dashboard pages (all admin UI)
|   |   |   +-- admin/         # User management and API keys
|   |   |   +-- analytics/     # Analytics and reporting
|   |   |   +-- automation/    # Automation rules
|   |   |   +-- business-hours/# Business hours configuration
|   |   |   +-- canned-responses/ # Pre-written response templates
|   |   |   +-- channels/      # Channel management (WhatsApp, Email, Phone)
|   |   |   +-- conversations/ # Conversation inbox
|   |   |   +-- customers/     # Customer CRM
|   |   |   +-- knowledge/     # Knowledge base management
|   |   |   +-- settings/      # System settings
|   |   |   +-- sla/           # SLA rule management
|   |   |   +-- team/          # Team and department management
|   |   |   +-- tickets/       # Ticket management
|   |   |   +-- webhooks/      # Webhook configuration
|   |   |   +-- activity/      # Activity log viewer
|   |   |   +-- api-docs/      # Interactive API documentation
|   |   +-- api/               # REST API route handlers
|   |   |   +-- admin/         # User and API key endpoints
|   |   |   +-- analytics/     # Analytics data endpoint
|   |   |   +-- auth/          # Login and session endpoints
|   |   |   +-- channels/      # Channel webhook receivers
|   |   |   +-- chat/          # AI chat endpoint
|   |   |   +-- conversations/ # Conversation CRUD
|   |   |   +-- export/        # Data export endpoint
|   |   |   +-- health/        # Health check endpoint
|   |   |   +-- knowledge/     # Knowledge base CRUD
|   |   |   +-- settings/      # Settings CRUD
|   |   |   +-- tickets/       # Ticket CRUD
|   |   |   +-- webhooks/      # Webhook CRUD and testing
|   |   +-- globals.css        # Global styles and Tailwind imports
|   |   +-- layout.tsx         # Root layout
|   +-- components/
|   |   +-- layout/            # Sidebar, header, shared layout components
|   |   +-- ui/                # Reusable UI components (cards, charts, dialogs)
|   +-- generated/
|   |   +-- prisma/            # Generated Prisma client
|   +-- lib/
|       +-- ai/
|       |   +-- engine.ts      # AI conversation engine (chat loop, prompt building)
|       |   +-- tools.ts       # Tool definitions and execution logic
|       |   +-- types.ts       # TypeScript interfaces for AI system
|       +-- prisma.ts          # Prisma client singleton
|       +-- utils.ts           # Shared utility functions
+-- docs/                      # Documentation and screenshots
+-- package.json
+-- tsconfig.json
```

---

## Database Schema Overview

The database contains 20 models organized into functional groups.

### Core Models

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **Settings** | Global configuration (singleton, id="default") | None |
| **Admin** | Dashboard user accounts | None |
| **ApiKey** | API authentication keys | None |

### Conversations and Messages

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **Conversation** | A customer interaction session | Has many Messages, Tickets, ConversationTags |
| **Message** | A single message in a conversation | Belongs to Conversation |
| **ConversationTag** | Join table for conversation tags | Belongs to Conversation and Tag |
| **Tag** | Labels for organizing conversations | Has many ConversationTags |

### Support

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **Ticket** | A support issue requiring resolution | Belongs to Conversation, Department, TeamMember |
| **Department** | Organizational unit for team routing | Has many TeamMembers, Tickets |
| **TeamMember** | A support agent | Belongs to Department, has many Tickets |
| **InternalNote** | Private notes on conversations | Linked by conversationId |

### Knowledge and Automation

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **Category** | Knowledge base category grouping | Has many KnowledgeEntries |
| **KnowledgeEntry** | A single knowledge base article | Belongs to Category |
| **CannedResponse** | Pre-written reply templates | None |
| **AutomationRule** | Conditional automation logic | None |

### Operations

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **Channel** | Communication channel state | None |
| **Webhook** | Outbound webhook configuration | None |
| **SLARule** | Service level agreement rules | None |
| **BusinessHours** | Operating schedule (singleton) | None |
| **Schedule** | Team member availability | Linked by teamMemberId |
| **ActivityLog** | Audit trail of system events | None |
| **Customer** | Customer profile | Has many CustomerNotes |
| **CustomerNote** | Notes on customer profiles | Belongs to Customer |
| **CallLog** | Phone call records | None |

---

## Authentication Flow

Owly uses JWT-based authentication with HTTP-only cookies.

### Login Process

1. User submits username and password to `POST /api/auth`.
2. The server verifies the password against the bcrypt hash stored in the `Admin` table.
3. On success, a JWT token is generated containing the user's ID, username, and role.
4. The token is set as an HTTP-only cookie named `owly-token`.
5. The client is redirected to the dashboard.

### Request Authentication

1. The Next.js middleware (`src/middleware.ts`) intercepts every request.
2. Public paths (`/login`, `/setup`, `/api/auth`, `/api/health`) are allowed without authentication.
3. Twilio webhook paths (`/api/channels/phone/*`) are allowed without cookie auth (Twilio uses its own signature verification).
4. For all other paths, the middleware checks for the `owly-token` cookie.
5. If missing: API routes return `401 Unauthorized`, page routes redirect to `/login`.

### API Key Authentication

For external API consumers, authentication is performed via the `X-API-Key` header. The key is validated against the `ApiKey` table with an `isActive` check.

---

## AI Conversation Flow

```
Customer Message
      |
      v
+-----+------+
| Save to DB  |  (Message record with role="customer")
+-----+------+
      |
      v
+-----+------+
| Load Context|  Settings, Knowledge Base, Conversation History
+-----+------+
      |
      v
+-----+------+
| Build Prompt|  System prompt with business info, tone, KB entries
+-----+------+
      |
      v
+-----+------+
| Call OpenAI |  Messages + Tool definitions
+-----+------+
      |
      +-------> Tool Call?
      |            |
      |     Yes    v
      |    +-------+--------+
      |    | Execute Tool   |  (create_ticket, assign_to_person, etc.)
      |    +-------+--------+
      |            |
      |            v
      |    +-------+--------+
      |    | Return Result  |  Tool result as "tool" message
      |    +-------+--------+
      |            |
      |            +-------> (loop back to Call OpenAI, max 5 times)
      |
      No
      |
      v
+-----+------+
| Save to DB  |  (Message record with role="assistant")
+-----+------+
      |
      v
+-----+------+
| Return to   |  JSON response to the calling channel or API
| Channel     |
+-------------+
```

---

## Channel Processing Flow

Each communication channel has a dedicated handler that normalizes incoming messages into a common format before passing them to the AI engine.

### WhatsApp (whatsapp-web.js)

- Connects via WhatsApp Web protocol using QR code authentication.
- Receives messages through a WebSocket connection.
- Supports text messages and media attachments.

### Email (IMAP + Nodemailer)

- Polls the configured IMAP server for new emails.
- Parses email content using `mailparser`.
- Sends responses via SMTP using `nodemailer`.

### Phone (Twilio)

- Receives inbound calls via Twilio webhook at `/api/channels/phone/incoming`.
- Uses Twilio's TwiML for call flow control.
- Speech-to-text and text-to-speech for voice interactions.
- Call status updates via `/api/channels/phone/status`.

### Web Chat / API

- Direct HTTP requests to `POST /api/chat`.
- No channel-specific preprocessing.
- Used by the built-in chat widget and external integrations.

---

## Key Design Decisions

### Single-Process Architecture

Owly runs as a single Next.js process that handles both the frontend and backend. This simplifies deployment but means that long-running AI requests share resources with the dashboard. For high-traffic deployments, consider running multiple instances behind a load balancer.

### Knowledge Base as Context Injection

Rather than using vector embeddings or a dedicated RAG pipeline, Owly injects the entire active knowledge base into the AI's system prompt. This approach is simpler to implement and works well for knowledge bases with up to a few hundred entries. For larger knowledge bases, a vector search system would be more appropriate.

### Tool Depth Limit

The AI can call tools up to 5 times per request. This prevents infinite loops while allowing multi-step actions (e.g., create ticket, assign to member, send email notification). If the limit is reached, a fallback message is returned.

### Singleton Settings

The `Settings` and `BusinessHours` models use a fixed ID (`"default"`) to enforce a singleton pattern. There is only one configuration per Owly instance.

### Prisma ORM

Prisma was chosen for type-safe database access and automatic migration management. The generated client at `src/generated/prisma/` provides full TypeScript types for all models.

### No Separate Worker Process

Background tasks (webhook delivery, follow-up scheduling) currently run synchronously within the request cycle. A production deployment handling high volumes should consider adding a job queue (Bull, BullMQ, or similar) for asynchronous processing.
