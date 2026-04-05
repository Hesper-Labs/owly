# Automation Rules

Automation rules let you define automatic actions that trigger when specific conditions are met during a conversation. They help reduce manual work by routing conversations, applying tags, sending automatic replies, and alerting team members based on keywords or patterns.

![Automation](../screenshots/07-automation.png)
*The Automation page showing rules with their types, conditions, priority levels, and trigger counts.*

---

## Rule Types

Owly supports four types of automation rules. Each type performs a different action when its conditions are met.

### Auto Route

Automatically routes conversations to a specific department based on the content of the message.

**When to use:**
- When certain topics should always go to a specific department
- To ensure specialized issues reach the right team without manual intervention

**Example configurations:**

| Rule Name | Condition | Action |
|-----------|-----------|--------|
| Route billing questions | Message contains "invoice" OR "payment" OR "charge" | Route to Billing department |
| Route technical issues | Message contains "error" OR "bug" OR "not working" | Route to Technical Support |
| Route sales inquiries | Message contains "pricing" OR "demo" OR "trial" | Route to Sales department |

### Auto Tag

Automatically applies tags to conversations based on message content or other fields.

**When to use:**
- To categorize conversations automatically for reporting
- To flag conversations that match certain criteria
- To organize conversations by topic without manual tagging

**Example configurations:**

| Rule Name | Condition | Action |
|-----------|-----------|--------|
| Tag urgent issues | Message contains "urgent" OR "emergency" OR "asap" | Apply tag: `urgent` |
| Tag refund requests | Message contains "refund" OR "money back" OR "return" | Apply tag: `refund-request` |
| Tag feedback | Message contains "suggestion" OR "feedback" OR "improve" | Apply tag: `feedback` |

### Auto Reply

Sends an automatic response when specific conditions are met. This works alongside the AI -- the auto reply is sent before the AI processes the message.

**When to use:**
- To acknowledge receipt of messages immediately
- To provide instant answers for very common questions
- To send specific responses outside business hours

**Example configurations:**

| Rule Name | Condition | Action |
|-----------|-----------|--------|
| Acknowledge urgent | Priority is "urgent" | Reply: "We have received your urgent request. A team member will respond shortly." |
| Hours of operation | Message contains "hours" AND "open" | Reply: "Our business hours are Monday-Friday, 9 AM to 6 PM EST." |
| Holiday notice | Any message (during holiday period) | Reply: "Thank you for reaching out. Our office is closed for the holiday. We will respond on [date]." |

### Keyword Alert

Sends an email notification to specified team members when certain keywords appear in a conversation.

**When to use:**
- To alert managers about escalation keywords
- To notify specific people about topics they need to monitor
- To track mentions of competitors, products, or sensitive topics

**Example configurations:**

| Rule Name | Condition | Action |
|-----------|-----------|--------|
| Escalation alert | Message contains "speak to manager" OR "supervisor" OR "complaint" | Email alert to manager@company.com |
| Legal mention | Message contains "lawyer" OR "legal" OR "lawsuit" | Email alert to legal@company.com |
| Competitor mention | Message contains "CompetitorName" | Email alert to sales@company.com |

---

## Building Conditions

Each automation rule has one or more conditions that must be met for the rule to trigger. Conditions follow a field/operator/value structure.

### Condition Fields

| Field | What It Checks |
|-------|---------------|
| Message | The content of the customer's message |
| Channel | The channel the message came from (whatsapp, email, phone, api) |
| Customer Name | The name of the customer |
| Customer Contact | The customer's contact information |
| Status | The conversation's current status |

### Operators

| Operator | Meaning |
|----------|---------|
| contains | The field contains the specified text (case-insensitive) |
| equals | The field exactly matches the specified value |
| starts_with | The field starts with the specified text |
| ends_with | The field ends with the specified text |
| not_contains | The field does not contain the specified text |

### Combining Conditions

A rule can have multiple conditions. When a rule has multiple conditions, all conditions must be met for the rule to trigger (AND logic).

**Example:** A rule with these conditions:
- Message contains "refund"
- Channel equals "email"

This rule will only trigger when a customer sends an email that contains the word "refund".

---

## Setting Priority

Each automation rule has a priority number. Rules with higher priority numbers are evaluated first.

| Priority | Behavior |
|----------|----------|
| Higher number | Evaluated first |
| Lower number | Evaluated after higher-priority rules |
| Same priority | Evaluated in creation order |

### Why Priority Matters

If multiple rules could match the same message, priority determines which rule takes effect first. For example:

- Rule A (priority 10): Route "billing" messages to Billing department
- Rule B (priority 5): Route all messages to General Support

A message containing "billing" would match both rules, but Rule A (priority 10) is evaluated first and routes the message to Billing. Rule B would apply to messages that do not match Rule A.

---

## Real-World Examples

### Example 1: Urgent Issue Fast Track

**Type:** Auto Route + Keyword Alert (two rules working together)

**Rule 1 -- Auto Route:**
- Name: "Route urgent to senior support"
- Type: Auto Route
- Condition: Message contains "not working" AND Channel equals "phone"
- Action: Route to Technical Support
- Priority: 10

**Rule 2 -- Keyword Alert:**
- Name: "Alert on service outage"
- Type: Keyword Alert
- Condition: Message contains "outage" OR "down" OR "not working"
- Action: Email alert to oncall@company.com
- Priority: 10

### Example 2: Multi-Language Routing

**Rule 1:**
- Name: "Route Spanish speakers"
- Type: Auto Tag
- Condition: Message contains "hola" OR "necesito" OR "ayuda"
- Action: Apply tag: `spanish`
- Priority: 5

### Example 3: VIP Customer Handling

**Rule 1:**
- Name: "Flag VIP customers"
- Type: Keyword Alert
- Condition: Customer Contact equals "vip-customer@example.com"
- Action: Email alert to manager@company.com
- Priority: 15

---

## Next Steps

- [Business Hours and SLA](Business-Hours-and-SLA) -- Set up schedules that work with your automation rules
- [Team and Departments](Team-and-Departments) -- Configure departments for auto-routing targets
- [Canned Responses](Canned-Responses) -- Create templates for auto-reply actions
