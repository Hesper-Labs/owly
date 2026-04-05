# Ticket System

The Ticket System tracks customer issues that require attention beyond a single conversation. Tickets can be created manually by administrators or automatically by the AI when it detects a problem that needs human intervention.

![Tickets](../screenshots/10-tickets.png)
*The Tickets page showing a list of tickets with priority levels, status counters, department assignments, and team member assignments.*

---

## How Tickets Are Created

### Automatic Creation by AI

During a conversation, the AI can create a ticket when:
- The customer reports a problem that the AI cannot resolve from the knowledge base
- The issue requires a follow-up action by a team member
- The customer explicitly requests to escalate their issue

The AI uses the `create_ticket` tool to do this, and the ticket is automatically linked to the originating conversation.

### Manual Creation

Administrators can create tickets manually:

1. Navigate to **Tickets** in the sidebar
2. Click **Create Ticket**
3. Fill in the ticket details
4. Click **Save**

---

## Ticket Fields

Each ticket contains the following information:

| Field | Description | Values |
|-------|-------------|--------|
| Title | A brief summary of the issue | Free text |
| Description | Detailed explanation of the problem | Free text |
| Priority | Urgency level | `low`, `medium`, `high`, `urgent` |
| Status | Current lifecycle stage | `open`, `in_progress`, `resolved`, `closed` |
| Department | The department responsible | Any configured department |
| Assigned To | The team member handling the ticket | Any team member in the department |
| Conversation | The linked conversation (if any) | Auto-linked when created by AI |
| Resolution | Notes on how the issue was resolved | Free text (filled when resolving) |

### Priority Levels

| Priority | Use Case | Typical Response Time |
|----------|----------|----------------------|
| Low | Non-urgent requests, feature suggestions | Within a few days |
| Medium | Standard issues affecting the customer | Within 24 hours |
| High | Significant problems impacting service | Within a few hours |
| Urgent | Critical issues requiring immediate attention | As soon as possible |

---

## Ticket Lifecycle

Tickets follow a defined lifecycle from creation to closure:

```
open --> in_progress --> resolved --> closed
```

| Status | Description |
|--------|-------------|
| **Open** | The ticket has been created but no one has started working on it yet |
| **In Progress** | A team member has been assigned and is actively working on the issue |
| **Resolved** | The issue has been addressed. The resolution notes should explain what was done. |
| **Closed** | The ticket is finalized and no further action is needed |

### Status Transitions

- **Open to In Progress** -- Happens automatically when a ticket is assigned to a team member, or manually by an administrator
- **In Progress to Resolved** -- Set manually when the team member has addressed the issue
- **Resolved to Closed** -- Set manually after confirming the customer is satisfied with the resolution
- **Any status to Open** -- A ticket can be reopened if the issue resurfaces

---

## Filtering and Searching Tickets

The Tickets page provides several ways to find specific tickets:

### Status Counters

At the top of the page, you will see counters showing how many tickets are in each status. Click on a counter to filter the list by that status.

### Search

Use the search bar to find tickets by:
- Title
- Description
- Customer name

### Filter Options

You can filter tickets by:
- **Status** -- Open, In Progress, Resolved, Closed
- **Priority** -- Low, Medium, High, Urgent
- **Department** -- Any configured department
- **Assigned To** -- Any team member

---

## Assigning Tickets to Team Members

### Automatic Assignment

When the AI creates a ticket and uses the `assign_to_person` tool, the system automatically:
1. Searches for available team members with matching expertise
2. Assigns the ticket to the best match
3. Changes the ticket status to "In Progress"

### Manual Assignment

1. Open the ticket
2. Select a department from the dropdown
3. Select a team member from the available members in that department
4. Save the changes

> **Tip:** When assigning manually, consider the team member's current workload. You can see how many tickets each member is handling in the [Analytics](Analytics-and-Reports) page.

---

## Resolution Tracking

When resolving a ticket, it is good practice to document the resolution:

1. Open the ticket
2. Add resolution notes explaining what was done to address the issue
3. Change the status to **Resolved**
4. Save the changes

Resolution notes help with:
- Training new team members on common issues
- Identifying patterns in customer problems
- Improving the knowledge base (add the resolution as a new knowledge entry if it comes up frequently)
- Auditing and compliance

---

## Next Steps

- [Team and Departments](Team-and-Departments) -- Configure departments and team members for ticket assignment
- [Automation Rules](Automation-Rules) -- Set up rules to auto-route tickets
- [Business Hours and SLA](Business-Hours-and-SLA) -- Define response time targets for tickets
- [Analytics and Reports](Analytics-and-Reports) -- Monitor ticket metrics and team performance
