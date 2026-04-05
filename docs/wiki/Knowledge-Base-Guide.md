# Knowledge Base Guide

The knowledge base is the foundation of your AI support agent. It contains the information that Owly uses to answer customer questions accurately. A well-organized knowledge base leads to better, more relevant AI responses.

![Knowledge Base](../screenshots/05-knowledge-base.png)
*The Knowledge Base page showing categories with entry counts, descriptions, and color-coded icons.*

---

## How the Knowledge Base Works

Owly uses a technique called RAG (Retrieval-Augmented Generation) to provide accurate answers. Here is what happens when a customer asks a question:

1. The customer sends a message through any channel (WhatsApp, Email, Phone, or API)
2. Owly retrieves all active knowledge base entries
3. The entries are sorted by priority (higher priority entries are given more weight)
4. The AI receives the knowledge base along with the customer's question
5. The AI generates a response based on your knowledge base content, not from general internet knowledge
6. If the AI cannot find a relevant answer, it honestly tells the customer and offers to connect them with a team member

This means the AI will only answer with information you have provided, making it safe to use with customers.

---

## Managing Categories

Categories help you organize your knowledge into logical groups. Common categories include FAQ, Products, Policies, Pricing, and Troubleshooting.

### Creating a Category

1. Navigate to **Knowledge Base** in the sidebar
2. Click **Add Category**
3. Fill in the category details:

| Field | Description | Example |
|-------|-------------|---------|
| Name | The category title | "Frequently Asked Questions" |
| Description | A brief explanation of what this category covers | "Common questions about our services and policies" |
| Color | A hex color code for the category badge | `#4A7C9B` |
| Icon | An icon name for visual identification | `folder`, `book`, `shield` |

4. Click **Save** to create the category

### Tips for Organizing Categories

- Keep the number of categories manageable (5-10 is ideal for most businesses)
- Use clear, descriptive names that make it obvious what each category contains
- Group related information together (all pricing info in one category, all product info in another)
- Use colors to visually distinguish categories at a glance

---

## Managing Knowledge Entries

Each category contains individual knowledge entries. An entry is a single piece of information that the AI can use to answer questions.

![Knowledge Base Detail](../screenshots/20-knowledge-detail.png)
*A category detail view showing individual knowledge entries with their titles, priority levels, and active status.*

### Adding a Knowledge Entry

1. Click on a category to open its detail view
2. Click **Add Entry**
3. Fill in the entry details:

| Field | Description | Example |
|-------|-------------|---------|
| Title | A descriptive title for this piece of knowledge | "Return Policy" |
| Content | The full text content the AI will use | "Customers can return items within 30 days of purchase with a valid receipt..." |
| Priority | A number from 0-10 (higher = more important to the AI) | `5` |
| Active | Toggle to enable or disable this entry | On |

4. Click **Save** to add the entry

### Priority Levels

Priority determines how much weight the AI gives to each entry when generating responses:

| Priority | Use Case |
|----------|----------|
| 0-2 (Low) | Background information, rarely asked questions |
| 3-5 (Medium) | Standard knowledge, common topics |
| 6-8 (High) | Important policies, frequently asked questions |
| 9-10 (Critical) | Must-know information, safety notices, legal requirements |

Higher-priority entries appear first in the AI's context, making them more likely to influence the response.

### Activating and Deactivating Entries

Each entry has an active toggle. When an entry is deactivated:
- It remains in the database but is excluded from AI responses
- This is useful for seasonal information (holiday hours, promotional offers)
- You can reactivate it at any time without recreating it

---

## Best Practices for Writing Effective Entries

### Be Specific and Clear

Write entries as if you are explaining something to a new employee. Avoid jargon unless your customers would use it.

**Good:** "Our standard shipping takes 3-5 business days within the continental US. Express shipping (1-2 business days) is available for an additional $15."

**Less effective:** "Shipping varies."

### Include Keywords Customers Would Use

Think about how customers phrase their questions and include those terms in your entry.

**Good:** A "Return Policy" entry that includes phrases like "refund", "exchange", "send back", "return window", and "money back".

### Keep Entries Focused

Each entry should cover one specific topic. If you find an entry growing very long, split it into multiple entries.

### Set Priorities Thoughtfully

- Set high priority for your most frequently asked questions
- Set high priority for information where accuracy is critical (pricing, legal terms)
- Set lower priority for supplementary or rarely-needed information

### Update Regularly

Review your knowledge base periodically. Remove outdated information and add new entries as your products, services, or policies change.

---

## Testing Your Knowledge Base

Owly includes a built-in testing tool that lets you see how the AI responds using your current knowledge base.

### Using the Test Page

1. Navigate to **Knowledge Base** in the sidebar
2. Look for the test or query feature (accessible via the `/knowledge/test` API endpoint)
3. Type a question that a customer might ask
4. Review the AI's response to see if it uses your knowledge base correctly

### What to Test

- Ask questions that your knowledge base should be able to answer
- Ask questions that are slightly different from your entry titles (to test the AI's understanding)
- Ask questions that your knowledge base does not cover (to verify the AI admits it does not know)
- Test in different languages if you serve multilingual customers

### Iterating on Your Knowledge Base

Based on your testing:
1. If the AI gives incorrect answers, check if the relevant entry is active and has sufficient priority
2. If the AI misses information, add a new entry or expand an existing one
3. If the AI provides too much detail, consider making the entry more concise
4. If the AI mixes up similar topics, make entry titles and content more distinct

---

## Next Steps

- [Conversations and Inbox](Conversations-and-Inbox) -- See how the AI uses your knowledge base in real conversations
- [AI Configuration](AI-Configuration) -- Tune the AI model, temperature, and tone settings
- [Canned Responses](Canned-Responses) -- Create pre-written templates for common replies
