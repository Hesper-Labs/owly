# Canned Responses

## Overview

Canned responses are pre-written reply templates that allow your support team to respond to common customer inquiries quickly and consistently. Instead of typing the same answers repeatedly, agents can insert a canned response with a keyboard shortcut or by selecting it from the library.

Each canned response has a title, content body, category for organization, an optional keyboard shortcut, usage tracking, and an active/inactive toggle.

![Canned Responses](../screenshots/06-canned-responses.png)
*The Canned Responses page showing response cards organized in a grid, with category badges, shortcut indicators, usage counts, and active/inactive toggles.*

---

## Creating a Canned Response

**Step 1:** Navigate to **Canned Responses** in the sidebar.

**Step 2:** Click the **Add Response** button in the top-right corner.

**Step 3:** Fill in the response details in the modal dialog:

| Field | Description | Required |
|-------|-------------|----------|
| **Title** | A short, descriptive name for the response (e.g., "Welcome Greeting") | Yes |
| **Content** | The full text of the response that will be inserted when used | Yes |
| **Category** | A category label for organizing responses (e.g., "General", "Billing", "Technical") | Yes (defaults to "General") |
| **Shortcut** | A keyboard shortcut trigger (e.g., `/greeting`, `/refund`, `/hours`) | No |

**Step 4:** Click **Create Response** to save.

The new response will appear as a card in the Canned Responses grid.

---

## Categories for Organization

Categories help you group related canned responses together, making it easier to find the right template when you need it.

### How Categories Work

- Each canned response belongs to exactly one category.
- The default category is "General."
- Categories are free-form text fields -- you can create any category name by typing it in the Category input field.
- The category filter dropdown on the Canned Responses page is dynamically populated from the categories of existing responses.

### Suggested Category Structure

| Category | Use For |
|----------|---------|
| **General** | Welcome messages, thank-you responses, general acknowledgments |
| **Billing** | Invoice questions, payment confirmations, refund processes |
| **Technical** | Troubleshooting steps, system requirements, error resolutions |
| **Sales** | Product information, pricing, feature comparisons |
| **Shipping** | Delivery status, tracking information, shipping policies |
| **Account** | Password resets, account settings, subscription management |
| **Escalation** | Transfer notices, escalation confirmations, wait-time messages |

### Filtering by Category

1. On the Canned Responses page, locate the category dropdown in the filter bar.
2. Select a specific category to show only responses in that group.
3. Select "All Categories" to show all responses.

The category filter works in combination with the search bar, allowing you to narrow results by both category and keyword simultaneously.

---

## Keyboard Shortcuts

Keyboard shortcuts provide the fastest way to insert a canned response during a conversation. Instead of navigating the response library, you can type a short trigger text that expands into the full response.

### How Shortcuts Work

- Shortcuts are defined per response (e.g., `/greeting`, `/refund`, `/reset-password`).
- The shortcut is displayed on the response card with a hash (#) prefix for visibility.
- Shortcuts are optional -- a canned response can exist without a shortcut.
- Shortcuts should be short, memorable, and descriptive.

### Shortcut Naming Conventions

| Convention | Example | Description |
|------------|---------|-------------|
| Slash prefix | `/greeting` | Mimics command-style input |
| Descriptive | `/refund-process` | Clearly indicates the response topic |
| Abbreviated | `/ty` | Short for "thank you" -- use sparingly |
| Category-prefixed | `/billing-late` | Includes the category for disambiguation |

### Recommended Shortcuts

| Shortcut | Response Type |
|----------|--------------|
| `/greeting` | Welcome or opening message |
| `/thanks` | Thank-you and closing message |
| `/refund` | Refund process explanation |
| `/hours` | Business hours information |
| `/reset` | Password reset instructions |
| `/shipping` | Shipping status and timeline |
| `/escalate` | Escalation notice to customer |
| `/hold` | Please-hold / processing message |
| `/followup` | Follow-up after resolution |

---

## Usage Tracking

Every canned response tracks how many times it has been used. The usage count is displayed on each response card alongside a bar chart icon.

### What Usage Tracking Tells You

| Metric | Insight |
|--------|---------|
| **High usage count** | This response addresses a common customer need. Consider improving or expanding it. |
| **Zero usage count** | This response may be redundant, poorly named, or address a rare scenario. Consider whether it is still needed. |
| **Declining usage** | Customer needs may have shifted, or the underlying issue may have been resolved. |
| **Consistently high usage across a category** | This category represents a major portion of customer inquiries. Consider investing in self-service resources for these topics. |

Usage counts accumulate over time and are not reset. They provide a long-term view of which responses are most valuable to your team.

---

## Active/Inactive Toggle

Each canned response has an active/inactive toggle that controls whether it is available for use.

### Active Responses

- Displayed at full opacity in the grid.
- Available for selection and shortcut insertion.
- The status label shows "Active" in green.

### Inactive Responses

- Displayed with reduced opacity (60%).
- Not available for shortcut insertion.
- The status label shows "Inactive" in muted text.
- Useful for seasonally relevant responses (e.g., holiday messages) or deprecated templates that you want to keep for reference.

### How to Toggle

Click the toggle switch on the bottom-right of any response card. The change is saved immediately via the API -- no additional save button is needed.

---

## Searching Canned Responses

The search bar at the top of the Canned Responses page allows you to filter responses by keyword. The search checks against:

- **Title** -- The response name
- **Content** -- The full text body
- **Shortcut** -- The keyboard trigger

The search is case-insensitive and updates the displayed results in real time as you type.

---

## Editing Canned Responses

**Step 1:** Find the response you want to edit in the grid.

**Step 2:** Click the pencil icon in the top-right corner of the response card.

**Step 3:** The editing modal opens with all fields pre-populated:
- Title
- Content
- Category
- Shortcut

**Step 4:** Make your changes and click **Update Response**.

All changes take effect immediately after saving.

---

## Deleting Canned Responses

**Step 1:** Find the response you want to delete in the grid.

**Step 2:** Click the trash icon in the top-right corner of the response card.

**Step 3:** A confirmation dialog will appear asking you to confirm the deletion.

**Step 4:** Click **Delete** to permanently remove the response, or **Cancel** to keep it.

Deleted canned responses cannot be recovered. If you want to temporarily remove a response from active use without deleting it, use the active/inactive toggle instead.

---

## Best Practices for Effective Templates

### 1. Write for Clarity, Not Length

Keep responses concise and focused. Customers appreciate direct answers. Avoid excessive pleasantries or filler text that increases reading time without adding value.

**Good:**
> Your refund has been processed and will appear in your account within 3-5 business days. If you do not see it after 5 days, please reply to this message and we will investigate.

**Avoid:**
> Thank you so much for reaching out to us! We really appreciate your patience while we looked into this. We are happy to let you know that we have gone ahead and processed your refund. The refund should appear in your account within 3-5 business days, although the exact timing depends on your financial institution. We sincerely hope this resolves your concern, and if you have any other questions at all, please do not hesitate to reach out to us again!

### 2. Use Placeholders for Personalization

Include obvious placeholder text where agents should insert customer-specific details:

> Hi [CUSTOMER NAME], your order #[ORDER NUMBER] has shipped and is expected to arrive by [DELIVERY DATE].

### 3. Keep Tone Consistent

All canned responses should follow the same professional tone. If your brand voice is formal, all templates should be formal. If conversational, maintain that across all responses. Inconsistent tone creates a disjointed customer experience.

### 4. Review and Update Regularly

Set a schedule (monthly or quarterly) to review all canned responses:
- Remove responses that address resolved issues.
- Update responses that reference outdated policies, pricing, or processes.
- Add new responses for recurring questions that have emerged.

### 5. Organize by Customer Journey

Structure your categories around the customer journey: onboarding, usage, billing, troubleshooting, and offboarding. This makes it intuitive for agents to find the right response at each stage.

### 6. Test Before Deploying

After creating a new canned response, read it from the customer's perspective. Check for:
- Grammar and spelling errors
- Broken links or outdated URLs
- Placeholder text that should have been removed
- Tone that does not match your brand voice

---

## Example Responses for Common Scenarios

### Welcome Greeting

| Field | Value |
|-------|-------|
| Title | Welcome Greeting |
| Shortcut | `/greeting` |
| Category | General |
| Content | Hello! Thank you for contacting our support team. How can I help you today? |

### Refund Confirmation

| Field | Value |
|-------|-------|
| Title | Refund Processed |
| Shortcut | `/refund` |
| Category | Billing |
| Content | Your refund has been processed successfully. The amount will be credited to your original payment method within 3-5 business days. If you do not see the refund after 5 business days, please let us know and we will follow up with our payment team. |

### Password Reset Instructions

| Field | Value |
|-------|-------|
| Title | Password Reset |
| Shortcut | `/reset` |
| Category | Account |
| Content | To reset your password, please follow these steps: 1) Go to the login page. 2) Click "Forgot Password." 3) Enter your registered email address. 4) Check your email for the reset link (also check your spam folder). 5) Click the link and set a new password. The reset link expires after 24 hours. |

### Business Hours Info

| Field | Value |
|-------|-------|
| Title | Business Hours |
| Shortcut | `/hours` |
| Category | General |
| Content | Our support team is available Monday through Friday, 9:00 AM to 6:00 PM (EST). We are closed on weekends and major holidays. During off-hours, you can still leave a message and we will respond as soon as we are back online. |

### Escalation Notice

| Field | Value |
|-------|-------|
| Title | Escalation to Specialist |
| Shortcut | `/escalate` |
| Category | Escalation |
| Content | I am going to connect you with a specialist who can better assist with your request. They will review the details of our conversation and follow up with you shortly. Thank you for your patience. |

### Shipping Status

| Field | Value |
|-------|-------|
| Title | Shipping Status |
| Shortcut | `/shipping` |
| Category | Shipping |
| Content | Your order has been shipped. You can track your delivery using the tracking number provided in your shipping confirmation email. Delivery typically takes 3-7 business days depending on your location. If you have not received your tracking information, please provide your order number and we will look it up for you. |

### Closing / Thank You

| Field | Value |
|-------|-------|
| Title | Closing Message |
| Shortcut | `/thanks` |
| Category | General |
| Content | Thank you for contacting us. If you have any other questions in the future, do not hesitate to reach out. Have a great day! |

---

## Related Pages

- [Conversations and Inbox](Conversations-and-Inbox) -- Use canned responses while handling conversations
- [Automation Rules](Automation-Rules) -- Auto Reply rules as a complement to canned responses
- [Knowledge Base Guide](Knowledge-Base-Guide) -- Build the knowledge that powers AI responses
- [Team and Departments](Team-and-Departments) -- Organize team access to response templates
