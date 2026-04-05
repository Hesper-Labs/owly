# Automation Rules

## Overview

Automation rules allow you to define conditions and actions that are executed automatically when incoming messages match specific criteria. Instead of manually routing conversations, tagging messages, or sending standard replies, you can configure rules that handle these tasks instantly and consistently.

Rules are evaluated against every incoming message. When a message matches a rule's conditions, the associated action is triggered. Each rule tracks how many times it has been triggered, giving you visibility into how frequently each automation fires.

![Automation](../screenshots/07-automation.png)
*The Automation page showing rule cards with type indicators, trigger counts, priority levels, and active/inactive toggles.*

---

## Rule Types

Owly provides four types of automation rules, each designed for a specific workflow pattern.

### Auto Route

**Purpose:** Automatically route conversations to the correct department based on message content or metadata.

**How it works:** When an incoming message matches the defined conditions, the conversation is assigned to the specified department. This eliminates manual triage and ensures that billing questions go to the Billing team, technical issues go to Support, and sales inquiries go to Sales, without any human intervention.

**Action input:** The name of the target department (e.g., `Sales`, `Support`, `Billing`, `Engineering`).

**Example use case:** A customer sends a message containing the word "invoice." The Auto Route rule detects this keyword and routes the conversation to the Billing department, where the appropriate team member can handle it.

---

### Auto Tag

**Purpose:** Automatically apply tags to conversations based on keywords or patterns in the message content.

**How it works:** When a message matches the conditions, one or more tags are applied to the conversation. Tags help you categorize and filter conversations for reporting, prioritization, and quick identification.

**Action input:** The tag name to apply (e.g., `urgent`, `vip`, `refund`, `bug-report`, `feature-request`).

**Example use case:** A customer mentions "refund" or "money back" in their message. The Auto Tag rule applies the `refund` tag to the conversation, making it easy to filter and prioritize all refund-related conversations in the inbox.

---

### Auto Reply

**Purpose:** Send an automatic response to the customer when specific conditions are met, without waiting for the AI engine to generate a response.

**How it works:** When a message matches the conditions, the system immediately sends the pre-configured reply message to the customer. This is useful for instant acknowledgments, common questions with fixed answers, or out-of-scope topics that should receive a standard response.

**Action input:** The full text of the reply message to send.

**Example use case:** A customer sends a message outside of business hours. An Auto Reply rule detects the timing condition and immediately responds with: "Thank you for reaching out. Our team is currently offline and will respond during business hours (Mon-Fri, 9 AM - 6 PM). For urgent matters, please call our emergency line."

---

### Keyword Alert

**Purpose:** Send email notifications to specified recipients when important keywords appear in incoming messages.

**How it works:** When a message matches the conditions, an email notification is sent to the configured email address. This allows managers, team leads, or specialized staff to be alerted immediately when high-priority or sensitive topics come up.

**Action input:** The email address to receive the notification (e.g., `manager@yourcompany.com`).

**Example use case:** A customer mentions "cancel subscription" or "legal action." The Keyword Alert rule sends an email notification to the customer success manager so they can intervene personally and attempt to retain the customer.

---

## Conditions

Conditions define when a rule should fire. Each rule must have at least one condition, and you can add multiple conditions for more precise matching.

### Condition Fields

| Field | Description | Use Case |
|-------|-------------|----------|
| **Message Content** | Matches against the text body of the incoming message | Keyword detection, topic identification |
| **Channel** | Matches against the communication channel (whatsapp, email, phone) | Channel-specific routing or tagging |
| **Customer Name** | Matches against the customer's name | VIP customer handling, personalized responses |

### Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| **Contains** | The field value includes the specified text (case-sensitive) | Message Content *contains* "refund" |
| **Equals** | The field value exactly matches the specified text | Channel *equals* "whatsapp" |
| **Starts With** | The field value begins with the specified text | Customer Name *starts with* "VIP" |

### Multiple Conditions

When a rule has multiple conditions, all conditions must be satisfied for the rule to trigger (AND logic). This allows you to create highly specific rules. For example:

- Condition 1: Message Content *contains* "billing"
- Condition 2: Channel *equals* "email"

This rule would only fire for email messages that mention billing, and would not fire for WhatsApp messages with the same content.

---

## Actions

Each rule type has a specific action format:

| Rule Type | Action Label | Input Format | Example |
|-----------|-------------|--------------|---------|
| **Auto Route** | Route to Department | Department name (text) | `Billing` |
| **Auto Tag** | Apply Tag | Tag name (text) | `urgent` |
| **Auto Reply** | Reply Message | Full message text (multiline) | `Thank you for contacting us...` |
| **Keyword Alert** | Notify Email | Email address | `alerts@yourcompany.com` |

### Multiple Actions

You can configure multiple actions for a single rule. For example, an Auto Tag rule can apply multiple tags simultaneously, or a Keyword Alert rule can notify multiple email addresses.

To add additional actions, click the **+ Add Action** link in the rule creation or editing modal.

---

## Priority Ordering

Rules are evaluated in order of priority, from highest to lowest. The priority field is a numeric value where higher numbers indicate higher priority.

| Priority | Behavior |
|----------|----------|
| Higher value (e.g., 10) | Evaluated first |
| Lower value (e.g., 0) | Evaluated later |
| Same priority | Evaluated by creation date (newest first) |

Priority ordering is important when multiple rules could match the same message. For example, if you have a general "Route to Support" rule (priority 0) and a specific "Route to VIP Support" rule (priority 10), the VIP rule will be evaluated first. If it matches, the VIP routing takes precedence.

---

## Trigger Count Tracking

Every automation rule tracks how many times it has been triggered. This counter is displayed on the rule card and increments each time the rule's conditions are met and its action is executed.

The trigger count provides valuable insight into:

- **Rule effectiveness:** Rules with zero triggers may have conditions that are too restrictive.
- **Message patterns:** High trigger counts indicate common customer topics or frequent scenarios.
- **Workload distribution:** Compare trigger counts across Auto Route rules to understand how work is distributed among departments.

The trigger count is visible on each rule card alongside the priority level.

---

## Creating a Rule

**Step 1:** Navigate to **Automation** in the sidebar.

**Step 2:** Click the **Add Rule** button in the top-right corner.

**Step 3:** Fill in the rule details:

| Field | Description |
|-------|-------------|
| **Rule Name** | A descriptive name for the rule (e.g., "Route billing questions to Finance") |
| **Priority** | Numeric priority value (default: 0, higher = evaluated first) |
| **Description** | Optional description of what the rule does |
| **Rule Type** | Select one of: Auto Route, Auto Tag, Auto Reply, Keyword Alert |

**Step 4:** Define at least one condition:
- Select the **Field** (Message Content, Channel, or Customer Name)
- Select the **Operator** (Contains, Equals, or Starts With)
- Enter the **Value** to match against

**Step 5:** Configure the action(s) based on the selected rule type.

**Step 6:** Click **Create Rule** to save.

---

## Managing Rules

### Filtering by Type

The Automation page includes a filter bar with tabs for each rule type:

| Tab | Shows |
|-----|-------|
| **All** | All automation rules regardless of type |
| **Auto Route** | Only routing rules |
| **Auto Tag** | Only tagging rules |
| **Auto Reply** | Only auto-reply rules |
| **Keyword Alert** | Only keyword alert rules |

### Enabling and Disabling Rules

Each rule card has a toggle switch to enable or disable the rule. Disabled rules are shown with reduced opacity and do not evaluate incoming messages. This allows you to temporarily deactivate a rule without deleting it.

### Editing Rules

Click the **Edit** button on any rule card to open the editing modal. All fields (name, description, type, conditions, actions, priority) can be modified. Changes take effect immediately after saving.

### Deleting Rules

Click the **Delete** button on a rule card. A confirmation prompt will appear to prevent accidental deletion. Deleted rules cannot be recovered.

---

## Example Rules for Common Scenarios

### Route Billing Questions to Finance

| Setting | Value |
|---------|-------|
| Name | Route billing questions |
| Type | Auto Route |
| Condition | Message Content *contains* `invoice` |
| Condition | Message Content *contains* `billing` |
| Action | Route to Department: `Finance` |
| Priority | 5 |

### Tag Urgent Messages

| Setting | Value |
|---------|-------|
| Name | Flag urgent messages |
| Type | Auto Tag |
| Condition | Message Content *contains* `urgent` |
| Action | Apply Tag: `urgent` |
| Priority | 10 |

### Auto-Reply to Pricing Questions

| Setting | Value |
|---------|-------|
| Name | Pricing auto-reply |
| Type | Auto Reply |
| Condition | Message Content *contains* `pricing` |
| Action | Reply: `Thank you for your interest in our pricing. You can find our current plans at https://yourcompany.com/pricing. A team member will follow up shortly with personalized recommendations.` |
| Priority | 3 |

### Alert Manager on Cancellation Requests

| Setting | Value |
|---------|-------|
| Name | Cancellation alert |
| Type | Keyword Alert |
| Condition | Message Content *contains* `cancel` |
| Action | Notify Email: `success-team@yourcompany.com` |
| Priority | 8 |

### Tag VIP Customers on WhatsApp

| Setting | Value |
|---------|-------|
| Name | VIP WhatsApp tag |
| Type | Auto Tag |
| Condition | Channel *equals* `whatsapp` |
| Condition | Customer Name *starts with* `VIP` |
| Action | Apply Tag: `vip` |
| Priority | 7 |

---

## Best Practices

1. **Start broad, then refine.** Begin with simple rules using a single condition and add complexity as you understand your message patterns.
2. **Use priority to manage overlaps.** When multiple rules could match the same message, assign higher priority to more specific rules.
3. **Review trigger counts regularly.** Rules with zero triggers may need broader conditions. Rules with very high counts might benefit from being split into more specific sub-rules.
4. **Combine rule types for comprehensive automation.** For example, use Auto Route to assign the department and Auto Tag to label the conversation simultaneously.
5. **Test rules with known messages.** After creating a rule, send a test message that should match the conditions and verify the action is executed correctly.
6. **Keep descriptions clear.** Write descriptions that explain the business purpose of each rule, making it easier for team members to understand the automation logic.

---

## Related Pages

- [Conversations and Inbox](Conversations-and-Inbox) -- See automation results in your inbox
- [Team and Departments](Team-and-Departments) -- Set up departments for Auto Route rules
- [Canned Responses](Canned-Responses) -- Pre-written replies that complement Auto Reply rules
- [Business Hours](Business-Hours) -- Configure when automation rules should apply
