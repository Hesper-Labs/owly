# Customer Management

The Customers page is Owly's built-in CRM (Customer Relationship Management) system. It provides a centralized view of every customer who has contacted your business, with their contact details, conversation history, tags, and internal notes.

![Customers](../screenshots/04-customers.png)
*The Customer Management page showing customer profiles with contact information, tags, and action buttons.*

---

## Customer Profiles

Each customer profile contains the following information:

| Field | Description |
|-------|-------------|
| Name | The customer's name |
| Email | Email address (if known) |
| Phone | Phone number (if known) |
| WhatsApp | WhatsApp number (if known) |
| Tags | Comma-separated labels for categorization |
| Blocked | Whether the customer is blocked from contacting support |
| First Contact | Date of the customer's first interaction |
| Last Contact | Date of the customer's most recent interaction |

A single customer may have contact information across multiple channels. Owly consolidates all of their interactions into one profile.

---

## Adding and Editing Customers

### Adding a New Customer

1. Navigate to **Customers** in the sidebar
2. Click **Add Customer**
3. Fill in the customer's information (at minimum, a name is required)
4. Click **Save**

### Editing an Existing Customer

1. Find the customer in the list
2. Click on their profile or the edit button
3. Update any fields as needed
4. Click **Save**

> **Note:** Customers are also created automatically when they contact your business through any channel. The system uses their contact information (phone number, email, or WhatsApp number) to match incoming messages with existing profiles.

---

## Customer Tags

Tags are labels that help you categorize and organize customers. They are stored as comma-separated values on each customer profile.

### Common Tag Examples

| Tag | Use Case |
|-----|----------|
| `vip` | High-value or priority customers |
| `enterprise` | Business/corporate customers |
| `new` | Recently acquired customers |
| `returning` | Repeat customers |
| `issue-open` | Customers with unresolved issues |
| `spanish` | Language preference |

### Adding Tags

1. Open the customer's profile for editing
2. Enter tags in the tags field, separated by commas
3. Save the profile

Tags can be used to quickly identify customer segments and are visible in the customer list view.

---

## Internal Notes

Customer notes are private annotations attached to a customer profile. Unlike conversation-level internal notes, these notes persist across all conversations and provide a long-term record of important customer information.

### Adding a Note

1. Open the customer's profile
2. Navigate to the notes section
3. Type your note content
4. Click **Add Note**

Each note records the author name and timestamp automatically.

### Use Cases for Customer Notes

- Record customer preferences ("Prefers email communication, does not want phone calls")
- Document account history ("Upgraded to premium plan on March 15")
- Flag special handling requirements ("Requires manager approval for refunds over $100")
- Track follow-up actions ("Promised callback within 48 hours")

---

## Cross-Channel Conversation History

One of the key advantages of Owly's customer management is the ability to see a customer's complete conversation history across all channels.

When you open a customer profile, you can view:
- All conversations the customer has had, regardless of channel
- The channel used for each conversation (WhatsApp, Email, Phone, or API)
- The status and outcome of each conversation
- Linked tickets and their resolution status

This cross-channel view ensures that when a customer who previously contacted you by email now sends a WhatsApp message, you (and the AI) have the full context of their history.

> **Tip:** The AI can use the `get_customer_history` tool during conversations to automatically look up a customer's previous interactions and provide context-aware support.

---

## Blocking and Unblocking Customers

If a customer is abusive, sends spam, or needs to be restricted for any reason, you can block them.

### Blocking a Customer

1. Open the customer's profile
2. Click the **Block** button
3. Confirm the action

### Unblocking a Customer

1. Open the blocked customer's profile
2. Click the **Unblock** button
3. Confirm the action

Blocked customers are visually marked in the customer list so they are easy to identify.

---

## Searching and Filtering

The customer list supports search to help you find specific customers quickly.

### Search

Use the search bar at the top of the Customers page to search by:
- Customer name
- Email address
- Phone number
- WhatsApp number

The search results update as you type, making it easy to find any customer in your database.

---

## Next Steps

- [Conversations and Inbox](Conversations-and-Inbox) -- View and manage conversations linked to customers
- [Ticket System](Ticket-System) -- Track customer issues as tickets
- [Team and Departments](Team-and-Departments) -- Set up team members who handle customer interactions
