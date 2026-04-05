# SLA Rules

## Overview

SLA (Service Level Agreement) rules define response time targets for your support team. They establish measurable goals for how quickly your team should respond to and resolve customer conversations, broken down by communication channel and priority level.

SLA rules help ensure consistent service quality by setting clear expectations. When targets are defined, you can track performance against those benchmarks and identify areas where response times need improvement.

![SLA Rules](../screenshots/11-sla-rules.png)
*The SLA Rules page displaying rule cards with channel scope, priority level, first response time, resolution time, and active/inactive status.*

---

## What SLA Means

A Service Level Agreement, in the context of customer support, is a commitment to respond to and resolve customer inquiries within a defined timeframe. SLA rules in Owly translate these commitments into measurable, trackable targets.

Each SLA rule defines two key metrics:

| Metric | Definition |
|--------|-----------|
| **First Response Time** | The maximum acceptable time between when a customer sends a message and when your team (or the AI) sends the first response |
| **Resolution Time** | The maximum acceptable time between when a conversation is created and when it is marked as resolved or closed |

These metrics are expressed in minutes, allowing for precise configuration ranging from immediate response (a few minutes) to multi-day resolution windows (expressed in hundreds or thousands of minutes).

---

## First Response Time Targets

The first response time measures how quickly a customer receives an initial reply after reaching out. This is often the most critical SLA metric, as customers form their first impression of your support quality based on how long they wait for an initial acknowledgment.

### Setting First Response Targets

When creating an SLA rule, enter the target in minutes in the **First Response (minutes)** field. The minimum value is 1 minute.

### Common First Response Benchmarks

| Scenario | Target | Minutes |
|----------|--------|---------|
| Urgent phone calls | Immediate | 1-5 |
| High-priority WhatsApp | Within 15 minutes | 15 |
| Standard email inquiries | Within 1 hour | 60 |
| Low-priority email | Within 4 hours | 240 |
| Non-urgent general inquiries | Within 8 hours | 480 |

### Display Format

The UI displays time targets in a human-readable format:
- Under 60 minutes: shown as `Xm` (e.g., `30m`)
- 60 minutes or more: shown as `Xh` (e.g., `4h`) or `Xh Ym` (e.g., `1h 30m`)

---

## Resolution Time Targets

The resolution time measures how long it takes from conversation creation to full resolution. This metric captures the entire customer experience, including any back-and-forth exchanges, escalations, and investigation time.

### Setting Resolution Targets

Enter the target in minutes in the **Resolution (minutes)** field. Resolution time should always be greater than or equal to the first response time.

### Common Resolution Benchmarks

| Scenario | Target | Minutes |
|----------|--------|---------|
| Simple questions (FAQ-level) | Within 30 minutes | 30 |
| Standard support requests | Within 4 hours | 240 |
| Complex technical issues | Within 8 hours | 480 |
| Multi-step or escalated issues | Within 24 hours | 1440 |
| Long-running investigations | Within 48 hours | 2880 |

---

## Channel-Specific SLAs

SLA rules can be scoped to specific communication channels or applied across all channels.

### Available Channel Options

| Option | Scope |
|--------|-------|
| **All Channels** | The rule applies to conversations from WhatsApp, Email, and Phone |
| **WhatsApp** | The rule applies only to WhatsApp conversations |
| **Email** | The rule applies only to email conversations |
| **Phone** | The rule applies only to phone conversations |

### Why Channel-Specific SLAs Matter

Different channels carry different customer expectations:

- **Phone:** Customers calling expect the fastest response. They are actively waiting on the line and will not tolerate long delays. Phone SLAs should have the shortest first response targets.
- **WhatsApp:** Messaging is near-real-time. Customers expect relatively quick responses, though not as immediate as phone calls. WhatsApp SLAs typically target 5-30 minutes for first response.
- **Email:** Customers sending emails generally accept longer response times. Email SLAs might target 1-4 hours for first response, with resolution times extending to 24-48 hours for complex issues.

### Example Channel-Specific Configuration

| Rule Name | Channel | First Response | Resolution |
|-----------|---------|---------------|------------|
| Phone SLA | Phone | 2m | 30m |
| WhatsApp SLA | WhatsApp | 15m | 4h |
| Email SLA | Email | 1h | 24h |

---

## Priority-Specific SLAs

SLA rules can also be scoped by conversation priority level, allowing you to set stricter targets for high-priority issues.

### Available Priority Options

| Option | Scope |
|--------|-------|
| **All Priorities** | The rule applies regardless of conversation priority |
| **Low** | Applies only to low-priority conversations |
| **Medium** | Applies only to medium-priority conversations |
| **High** | Applies only to high-priority conversations |
| **Urgent** | Applies only to urgent-priority conversations |

### Priority Escalation Strategy

A common approach is to create multiple SLA rules with decreasing response times as priority increases:

| Rule Name | Priority | First Response | Resolution |
|-----------|----------|---------------|------------|
| Standard SLA | Low | 4h | 48h |
| Normal SLA | Medium | 1h | 24h |
| Priority SLA | High | 15m | 8h |
| Critical SLA | Urgent | 5m | 2h |

### Combining Channel and Priority

You can create highly specific SLA rules by combining both channel and priority filters. For example:

| Rule Name | Channel | Priority | First Response | Resolution |
|-----------|---------|----------|---------------|------------|
| Urgent WhatsApp | WhatsApp | Urgent | 5m | 1h |
| Standard Email | Email | Medium | 2h | 24h |
| VIP Phone | Phone | High | 1m | 30m |

---

## How to Create an SLA Rule

**Step 1:** Navigate to **SLA Rules** in the sidebar (under the Settings or Management section).

**Step 2:** Click the **Add Rule** button in the top-right corner.

**Step 3:** Fill in the rule details in the modal dialog:

| Field | Description | Required |
|-------|-------------|----------|
| **Name** | A descriptive name for the SLA rule | Yes |
| **Description** | Optional explanation of the rule's purpose | No |
| **Channel** | Select the channel scope (All Channels, WhatsApp, Email, or Phone) | Yes (defaults to All Channels) |
| **Priority** | Select the priority scope (All Priorities, Low, Medium, High, Urgent) | Yes (defaults to All Priorities) |
| **First Response (minutes)** | Target time for the first response in minutes | Yes (defaults to 30) |
| **Resolution (minutes)** | Target time for full resolution in minutes | Yes (defaults to 480) |

**Step 4:** Click **Create Rule** to save the SLA rule.

The new rule will appear as a card in the SLA Rules grid, showing the channel and priority badges, time targets, and an active/inactive toggle.

---

## Managing SLA Rules

### Viewing Rules

All SLA rules are displayed as cards in a responsive grid layout. Each card shows:

- Rule name and optional description
- Channel badge (e.g., "WhatsApp", "All Channels")
- Priority badge (e.g., "High", "All Priorities")
- First response time target
- Resolution time target
- Active/inactive status with toggle

### Editing Rules

Click the pencil icon on any rule card to open the editing modal. All fields can be modified, and changes take effect immediately after saving.

### Enabling and Disabling Rules

Each rule has a toggle switch to activate or deactivate it. Disabled rules are shown with reduced opacity and are not enforced. This allows you to temporarily suspend an SLA without deleting it -- useful during holidays, maintenance windows, or special events.

### Deleting Rules

Click the trash icon on a rule card, then confirm the deletion in the confirmation dialog. Deleted SLA rules cannot be recovered.

---

## Best Practices

### Start with Realistic Targets

Begin with targets that your team can consistently meet. It is better to set achievable targets and tighten them over time than to set aggressive targets that are frequently violated, which leads to alert fatigue and demoralized staff.

### Cover All Channels

Create at least one SLA rule for each active channel. Customers on different channels have different expectations, and your SLA targets should reflect those differences.

### Separate by Priority

High-priority and urgent conversations deserve faster response times. Create priority-specific rules so that critical issues are not lumped together with routine inquiries.

### Review and Adjust Regularly

Monitor your team's actual performance against SLA targets. If a rule is consistently met with a wide margin, consider tightening the target. If a rule is frequently breached, either adjust the target or investigate process improvements.

### Use Descriptive Names

Name your SLA rules clearly so that team members immediately understand their scope. Good examples: "Urgent Phone Response", "Standard Email Resolution", "WhatsApp First Reply". Poor examples: "SLA 1", "Rule A", "New Rule".

### Align with Business Hours

Consider how your SLA targets interact with your configured business hours. A 1-hour first response SLA is meaningful during business hours but may be unrealistic outside of them. Factor in your team's working schedule when setting targets.

### Document Your SLA Commitments

If your SLA targets are part of a formal agreement with customers or stakeholders, document the specific targets alongside the Owly rule configuration. This ensures alignment between the technical implementation and the business commitment.

---

## Related Pages

- [Business Hours](Business-Hours) -- Configure when your support team is available
- [Automation Rules](Automation-Rules) -- Automate responses to meet SLA targets
- [Conversations and Inbox](Conversations-and-Inbox) -- Monitor conversation status and response times
- [Dashboard Overview](Dashboard-Overview) -- View SLA compliance metrics at a glance
