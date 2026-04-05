# Dashboard

The Dashboard is the first page you see after logging into Owly. It provides a real-time overview of your customer support activity, including conversation statistics, recent activity, channel status, and an onboarding checklist for new installations.

![Owly Dashboard](../screenshots/02-dashboard.png)

---

## Page Layout

The dashboard is divided into several sections:

1. **Header** -- Title ("Dashboard") and description ("Overview of your customer support activity").
2. **Onboarding Checklist** -- Appears at the top when setup is not yet complete. See [Onboarding Checklist](#onboarding-checklist) below.
3. **Stat Cards** -- Four key metrics in a responsive grid.
4. **Recent Conversations** -- A list of the 10 most recently updated conversations (left column, 2/3 width).
5. **Channel Overview** -- Connection status of each channel (right column, top).
6. **Quick Stats** -- Additional aggregate metrics (right column, bottom).

---

## Stat Cards

The stat cards row shows four key performance indicators at a glance. Each card displays a metric name, the current value, and a color-coded icon.

| Card | Description | Icon Color |
|------|-------------|------------|
| **Total Conversations** | The total number of conversations across all channels and all time. Includes active, resolved, and closed conversations. | Default (primary) |
| **Active Now** | The number of conversations currently in "active" status, meaning they have not been resolved or closed. This is your live workload indicator. | Green |
| **Open Tickets** | The number of tickets with "open" status. Tickets are created when issues need tracking beyond a single conversation. | Orange |
| **Resolution Rate** | The percentage of all conversations that have been marked as "resolved," calculated as `(resolved / total) * 100`. A higher number indicates more effective support. | Blue |

### Interpreting the Stat Cards

- **Total Conversations** grows over time and reflects overall volume. A sudden spike may indicate a product issue or marketing campaign driving support traffic.
- **Active Now** is your most actionable metric. If this number is high relative to your team size, consider adding automation rules or canned responses to handle common queries faster.
- **Open Tickets** shows unresolved issues that require human attention. Keep this number low by regularly reviewing and closing resolved tickets.
- **Resolution Rate** is a lagging indicator. It improves as your knowledge base becomes more comprehensive and the AI handles more queries without human intervention.

---

## Onboarding Checklist

The onboarding checklist appears at the top of the dashboard when your Owly instance is not fully configured. It tracks six setup milestones and provides direct links to the relevant pages.

### Checklist Items

| Step | Description | Link |
|------|-------------|------|
| **Admin account created** | Your admin account is set up and ready. Automatically completed after the setup wizard. | Admin page |
| **Business profile configured** | Set your business name and details. Completed if the business name has been changed from the default "My Business." | Settings page |
| **AI configured** | Connect your AI provider with an API key. Completed when a valid API key is saved. | Settings page |
| **Knowledge base entries added** | Add content for the AI to reference. Completed when at least one knowledge base entry exists. | Knowledge Base page |
| **At least one channel connected** | Connect WhatsApp, email, or phone. Completed when at least one channel is active. | Channels page |
| **Team members added** | Add your support team for escalations. Completed when at least one team member exists. | Team page |

### Progress Tracking

- A progress bar at the top of the checklist shows completion as a percentage (e.g., "4 / 6").
- Completed items display a green checkmark and appear with reduced opacity and strikethrough text.
- Incomplete items show an empty circle and a right-arrow chevron that links to the relevant configuration page.

### Dismissing the Checklist

- Click the **X** button in the top-right corner of the checklist, or click the "Hide checklist" link at the bottom.
- The dismissal is stored in `localStorage`, so it persists across page reloads but not across different browsers or cleared browser data.
- The checklist automatically hides itself once all six items are completed.

---

## Recent Conversations

The Recent Conversations panel takes up the left two-thirds of the main content area. It shows the 10 most recently updated conversations, ordered by the `updatedAt` timestamp (most recent first).

### Each Conversation Row Displays

| Element | Description |
|---------|-------------|
| **Channel icon** | A colored icon indicating the channel: green message bubble for WhatsApp, blue envelope for Email, purple phone for Phone. |
| **Customer name** | The name associated with the conversation (pulled from the customer record or phone number). |
| **Timestamp** | Relative time since the last update (e.g., "2 minutes ago", "3 hours ago"). |
| **Channel and message count** | The channel label (WhatsApp, Email, Phone) and total number of messages in the conversation. |
| **Last message preview** | A single-line truncated preview of the most recent message in the conversation. |
| **Status badge** | A color-coded pill showing the conversation status: "active", "resolved", or "closed." |

### Empty State

When no conversations exist yet (fresh installation), the panel shows a centered empty state with a message icon and the text: "No conversations yet. Conversations will appear here once customers start reaching out."

### Tips

- The conversation list updates when you reload the dashboard. For real-time updates, check the Conversations page.
- Click on a conversation row to navigate to the full conversation view (if linking is enabled on your version).
- Use this list for a quick check of recent activity, but rely on the Conversations page for filtering, searching, and managing conversations.

---

## Channel Overview

The Channel Overview widget appears in the right column and shows the connection status of each supported channel:

| Channel | Icon | Color |
|---------|------|-------|
| **WhatsApp** | Message circle | Green |
| **Email** | Envelope | Blue |
| **Phone** | Phone handset | Purple |

Each channel row displays:

- The channel name and icon on the left.
- A status badge on the right, showing either **Connected** (green) or **Disconnected** (red).

### Using the Channel Overview

- If all channels show "Disconnected," navigate to the [Channel Setup](Channel-Setup) page to configure at least one channel.
- Channel status reflects the current connection state. For WhatsApp, this means the QR code session is active. For Email, it means IMAP/SMTP credentials are valid. For Phone, it means Twilio credentials are configured.
- This widget provides a quick visual check. For detailed channel management, use the Channels page from the sidebar.

---

## Quick Stats

The Quick Stats widget appears below the Channel Overview in the right column. It shows three aggregate metrics:

| Metric | Description |
|--------|-------------|
| **Total Messages** | The total number of individual messages (both inbound and outbound) across all conversations. |
| **Total Tickets** | The total number of tickets created, regardless of status. |
| **Avg. Resolution Rate** | Same as the Resolution Rate stat card -- percentage of conversations marked as resolved. |

These metrics complement the stat cards by providing additional context. Total Messages gives a sense of conversation depth (are conversations typically short or long?), while Total Tickets shows how often conversations escalate to tracked issues.

---

## Tips for Using the Dashboard Effectively

1. **Check the dashboard at the start of each day.** The Active Now count and Recent Conversations list give you an immediate sense of your current workload.

2. **Use the onboarding checklist to completion.** Each completed step improves the effectiveness of your AI agent. The checklist links directly to the relevant pages, so use it as a guided setup flow.

3. **Monitor the Resolution Rate trend.** If it drops, investigate whether the knowledge base needs updates or if new types of questions are coming in that the AI cannot handle.

4. **Keep an eye on Open Tickets.** Tickets represent issues that need human attention. A growing ticket count without corresponding resolution suggests a bottleneck in your support process.

5. **Check Channel Overview regularly.** WhatsApp sessions can expire if the linked device is disconnected for too long. The Channel Overview widget gives you an instant visual indicator if a channel has gone offline.

6. **Dismiss the onboarding checklist only after all steps are complete.** While you can dismiss it early, keeping it visible serves as a reminder of remaining configuration tasks.

---

## Navigation

From the dashboard, you can access all other Owly features through the sidebar:

| Section | Pages |
|---------|-------|
| **Support** | Conversations, Customers, Knowledge Base, Canned Responses |
| **Automation** | Automation Rules, Business Hours, SLA Rules |
| **Operations** | Team, Tickets, Channels |
| **Insights** | Analytics, Activity Log |
| **Admin** | Admin Management, Webhooks, API Docs, Settings |

---

## Next Steps

- [Quick Start Tutorial](Quick-Start-Tutorial) -- If you just installed Owly and want to get your first AI conversation running
- [Knowledge Base Guide](Knowledge-Base-Guide) -- Add and organize content for your AI agent
- [Conversations and Inbox](Conversations-and-Inbox) -- Learn how to manage conversations once they start coming in
- [Automation Rules](Automation-Rules) -- Set up auto-routing, tagging, and replies to reduce manual work
