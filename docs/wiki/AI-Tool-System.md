# AI Tool System

Owly's AI agent is more than a simple chatbot. It can take actions during conversations by calling tools -- structured functions that interact with the database, external services, and team members. This page explains how the tool system works and what each tool does.

---

## How It Works

When a customer sends a message, Owly's AI engine processes it through the following pipeline:

1. **Load context**: Retrieve the conversation history, business settings, and active knowledge base entries.
2. **Build system prompt**: Construct a detailed system prompt that includes the business identity, tone guidelines, language preference, knowledge base content, and customer history.
3. **Send to AI provider**: Send the full message history (system prompt + conversation) to the configured AI model (e.g., OpenAI's `gpt-4o-mini`) along with the available tool definitions.
4. **Check for tool calls**: If the AI determines that a tool should be used, it returns a `tool_calls` response instead of a regular message.
5. **Execute tools**: Owly executes each requested tool, collects the results, and sends them back to the AI.
6. **Generate response**: The AI uses the tool results to formulate its final response to the customer.
7. **Save and return**: Both the customer's message and the AI's response are saved to the database.

This loop can repeat up to 5 times in a single request if the AI needs to call multiple tools sequentially (e.g., create a ticket, then assign it to a team member).

---

## Available Tools

### create_ticket

Creates a support ticket for issues that require human attention.

**When it is used**: The AI calls this tool when a customer reports a problem that cannot be resolved through the knowledge base alone, such as a bug report, account issue, or complex complaint.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Brief title describing the issue. |
| `description` | string | Yes | Detailed description of the problem. |
| `priority` | string | Yes | Priority level: `low`, `medium`, `high`, or `urgent`. |
| `department` | string | No | Department name to route the ticket to. Matched by partial, case-insensitive search. |

**What it does**: Creates a new `Ticket` record in the database. If a department name is provided, it searches for a matching department and links the ticket. The ticket is automatically associated with the current conversation.

**Example scenario**: A customer says "My order #5678 arrived damaged and I need a replacement." The AI creates a ticket with title "Damaged order #5678 - replacement needed", priority "high", and routes it to the appropriate department.

---

### assign_to_person

Assigns a ticket to a team member based on their expertise.

**When it is used**: After creating a ticket, the AI may call this tool to find the best team member to handle the issue based on their listed expertise.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ID of the ticket to assign. |
| `expertise` | string | Yes | The expertise area needed. Matched against team members' expertise field. |

**What it does**: Searches for an available team member whose expertise field contains the specified text (case-insensitive). If found, updates the ticket's `assignedToId` and sets the status to `in_progress`. If no matching member is available, returns an error message.

**Example scenario**: A ticket about payment processing issues is created. The AI calls `assign_to_person` with expertise "billing" and Owly finds a team member with "billing, payments, invoicing" in their expertise field.

---

### send_internal_email

Sends an email notification to a team member about a customer issue.

**When it is used**: The AI calls this tool to alert team members about urgent issues, escalations, or situations that need immediate human attention.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Email address of the team member. |
| `subject` | string | Yes | Email subject line. |
| `body` | string | Yes | Email body content. |

**What it does**: Uses the SMTP settings configured in the Settings page to send an email. If SMTP is not configured, returns an error message.

**Prerequisite**: SMTP settings must be configured in Settings > Email for this tool to function.

---

### get_customer_history

Retrieves the customer's previous conversation history.

**When it is used**: The AI calls this tool to look up whether a customer has contacted support before, providing context for the current interaction.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerContact` | string | Yes | The customer's contact info (phone number or email address). |

**What it does**: Queries the database for conversations matching the customer's contact information. Returns up to 5 most recent conversations with their last 5 messages each. Message content is truncated to 200 characters.

**Example scenario**: A returning customer contacts support. The AI retrieves their history and responds with: "I can see you contacted us last week about a shipping delay. Is this about the same order, or a new issue?"

---

### schedule_followup

Schedules a follow-up message to be sent to the customer after a delay.

**When it is used**: The AI calls this tool when it promises to follow up with the customer later, such as after an issue is being investigated.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | string | Yes | The conversation ID to follow up on. |
| `message` | string | Yes | The follow-up message content. |
| `delayHours` | number | Yes | Hours to wait before sending the follow-up. |

**What it does**: Records the follow-up intent with a scheduled timestamp. In the current implementation, this is logged and would be processed by a background job system in a production deployment.

> **Note**: The follow-up execution requires a background job processor (such as Bull or Agenda). The current version records the intent but does not automatically send the follow-up message.

---

### trigger_webhook

Triggers a configured webhook to notify an external system.

**When it is used**: The AI calls this tool when it needs to notify an external service about an event that has occurred during the conversation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `webhookName` | string | Yes | Name of the webhook to trigger. Matched by partial, case-insensitive search. |
| `data` | object | No | Data payload to include in the webhook request body. |

**What it does**: Searches for an active webhook matching the provided name. If found, sends an HTTP request to the webhook's URL with the configured method, headers, and the provided data payload as JSON.

**Prerequisite**: The target webhook must be configured and active on the Webhooks page.

---

## Function Calling Mechanism

Owly uses OpenAI's function calling (tool use) API. The tool definitions are passed to the model alongside the conversation messages:

1. Each tool is defined with a `name`, `description`, and `parameters` schema using JSON Schema format.
2. The AI model evaluates the conversation and decides whether any tools should be called.
3. If the model returns `finish_reason: "tool_calls"`, Owly extracts the tool name and arguments.
4. Owly executes the tool and returns the result as a `tool` message.
5. The model receives the tool result and either calls another tool or generates a text response.

The maximum tool call depth is 5 iterations per request. If the AI exceeds this limit, Owly returns a fallback message suggesting the customer connect with a human team member.

---

## System Prompt Structure

The system prompt that guides the AI's behavior is constructed dynamically for each conversation. It includes the following sections:

### Identity

```
You are Owly, the AI customer support assistant for {businessName}.
About the business: {businessDesc}
```

### Communication Style

The tone setting from the General tab in Settings determines the AI's communication guidelines:

- **Friendly**: "Be warm, approachable, and conversational. Use a casual but professional tone."
- **Formal**: "Be professional, polished, and courteous. Use formal language and proper grammar."
- **Technical**: "Be precise and detailed. Use technical terminology when appropriate and provide thorough explanations."

### Language

If the language setting is `auto`, the AI is instructed: "Respond in the same language the customer uses." Otherwise, it is instructed to always respond in the configured language.

### Knowledge Base

All active knowledge base entries are injected into the system prompt, sorted by priority (highest first). Each entry includes its category name, title, and full content. The AI is instructed to use this information to answer questions accurately and to never fabricate information not present in the knowledge base.

### Guidelines

The system prompt includes explicit instructions for the AI:

- Always be helpful and try to resolve the customer's issue.
- If the knowledge base does not contain an answer, honestly say so and offer to connect the customer with a team member.
- Use `create_ticket` for problems requiring human intervention.
- Use `send_internal_email` for urgent issues requiring team notification.
- Use `get_customer_history` to check for returning customers.
- Never make up information.
- Keep responses concise but thorough.

### Context

The prompt includes the current channel (whatsapp, email, phone, web, api) and the customer's name if known, allowing the AI to tailor its responses appropriately (e.g., shorter messages for WhatsApp, more detailed for email).

---

## Configuration Effects

### Temperature

Lower temperature values (0.1--0.3) make the AI more deterministic and consistent. This is recommended for customer support where accurate, repeatable answers are important. Higher values (0.7--1.0) introduce more variation in responses, which may feel more natural but risks inconsistency.

### Max Tokens

Controls the maximum length of the AI's response. For customer support, 2048 tokens (the default) is usually sufficient. Increase this if your knowledge base entries require detailed explanations.

### Model Selection

The chosen model affects response quality, speed, and cost:

- **gpt-4o-mini**: Fast, affordable, suitable for most customer support scenarios.
- **gpt-4o**: More capable reasoning, better at complex multi-step issues, but slower and more expensive.
