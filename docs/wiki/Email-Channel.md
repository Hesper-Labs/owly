# Email Channel

## Overview

The Email channel enables Owly to receive incoming customer emails via IMAP and send AI-generated responses via SMTP. When a customer sends an email to your support address, Owly automatically processes the message, generates an AI response, and replies with a branded HTML email -- all without manual intervention.

The email integration uses industry-standard protocols (IMAP for receiving, SMTP for sending) and is compatible with virtually any email provider, including Gmail, Outlook, Yahoo, and custom mail servers.

![Channels](../screenshots/12-channels.png)
*The Channels page showing WhatsApp, Email, and Phone channel cards with connection status indicators.*

---

## SMTP Configuration (Outgoing Email)

SMTP (Simple Mail Transfer Protocol) is used to send reply emails to customers. Configure these settings in the application's Settings page under the Email tab.

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **SMTP Host** | The hostname of your outgoing mail server | `smtp.gmail.com` |
| **SMTP Port** | The server port number. Use 587 for STARTTLS or 465 for SSL | `587` |
| **SMTP User** | Your email account username (typically the full email address) | `support@yourcompany.com` |
| **SMTP Password** | Your email password or app-specific password | *(your password)* |
| **From Address** | The sender address displayed to recipients. Defaults to the SMTP user if not specified | `support@yourcompany.com` |

### Security Modes

The system automatically selects the appropriate security mode based on the port number:

| Port | Security | Description |
|------|----------|-------------|
| **465** | SSL/TLS | The connection is encrypted from the start. The `secure` flag is set to `true`. |
| **587** | STARTTLS | The connection starts unencrypted and upgrades to TLS. The `secure` flag is set to `false`, and the transport negotiates TLS automatically. |

The SMTP transport is created using `nodemailer`, which handles TLS negotiation transparently.

---

## IMAP Configuration (Incoming Email)

IMAP (Internet Message Access Protocol) is used to receive and process incoming customer emails in real time. Configure these settings alongside your SMTP configuration.

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **IMAP Host** | The hostname of your incoming mail server | `imap.gmail.com` |
| **IMAP Port** | The server port number (993 for SSL is standard) | `993` |
| **IMAP User** | Your email account username | `support@yourcompany.com` |
| **IMAP Password** | Your email password or app-specific password | *(your password)* |

### How IMAP Listening Works

Once configured, the email listener operates as follows:

1. The system establishes an IMAP connection with TLS enabled (`tls: true`).
2. The INBOX folder is opened in read/write mode.
3. The listener subscribes to the `mail` event, which fires whenever new messages arrive.
4. When new mail is detected, the system searches for all `UNSEEN` (unread) messages.
5. Each unread message is fetched and parsed using the `mailparser` library.
6. The parsed email (sender, subject, body) is passed to the processing pipeline.

The IMAP connection remains open and listens continuously for new messages. If the connection drops (due to a network issue or server timeout), the `end` event is fired and the listener status is updated accordingly.

---

## How Email Threading Works

Owly maintains proper email threading using standard email headers, so customers see a clean conversation thread in their email client.

### In-Reply-To and References Headers

When Owly sends a reply to a customer email, the following headers are set:

| Header | Value | Purpose |
|--------|-------|---------|
| `In-Reply-To` | The `Message-ID` of the customer's original email | Links the reply directly to the incoming message |
| `References` | The `Message-ID` of the customer's original email | Helps email clients group messages into threads |
| `Subject` | Prefixed with `Re: ` followed by the original subject | Standard reply subject format |

This means that when a customer receives the AI-generated reply, it appears as part of the same email thread in Gmail, Outlook, Apple Mail, and other standards-compliant email clients.

### Conversation Continuity

The system also maintains conversation continuity at the application level:

1. When an email arrives, the system checks for an existing conversation with status `active` or `escalated` for the sender's email address on the email channel.
2. If a matching conversation exists, the new message is added to that conversation and the AI has access to the full conversation history.
3. If no matching conversation exists, a new conversation is created with the sender's name and email address.

---

## HTML Email Templates

All outgoing emails from Owly are sent in both plain text and HTML formats. The HTML template provides a clean, branded appearance.

### Template Structure

The HTML email template includes:

- **Content area:** Each line of the AI response is wrapped in a `<p>` tag with consistent styling (Arial font family, dark text color `#1E293B`, 10px bottom margin).
- **Footer:** A subtle footer separated by a border line (`#E2E8F0`), displaying "Powered by Owly Support" in a smaller, lighter font (`#64748B`, 12px).
- **Container:** The entire email is wrapped in a centered container with a maximum width of 600px and 20px padding for readability across devices.

The plain text version of the response is always included as a fallback for email clients that do not render HTML.

---

## Testing the Connection

After configuring both SMTP and IMAP settings:

1. Navigate to the **Channels** page in the sidebar.
2. Locate the Email card.
3. The status indicator will show the current connection state:
   - **Connected** -- The IMAP listener is active and monitoring for incoming emails.
   - **Disconnected** -- The listener is not running, or the configuration is missing.
4. Use the test function on the Email card to verify both sending and receiving capabilities.

You can also verify the connection by sending a test email to the configured address and checking that it appears as a new conversation in the Conversations inbox.

---

## Common Email Provider Setup

### Gmail

Gmail requires an app-specific password for third-party access.

**Step 1:** Enable 2-Factor Authentication on your Google account (required for app passwords).

**Step 2:** Generate an App Password:
- Go to your Google Account settings
- Navigate to **Security** > **2-Step Verification** > **App Passwords**
- Select "Mail" as the app and your device type
- Copy the generated 16-character password

**Step 3:** Configure the following settings:

| Setting | Value |
|---------|-------|
| SMTP Host | `smtp.gmail.com` |
| SMTP Port | `587` |
| IMAP Host | `imap.gmail.com` |
| IMAP Port | `993` |
| Username | Your full Gmail address (e.g., `support@gmail.com`) |
| Password | The 16-character app password (not your regular Gmail password) |

**Step 4:** Ensure IMAP is enabled in Gmail:
- Open Gmail in a browser
- Go to **Settings** (gear icon) > **See all settings**
- Click the **Forwarding and POP/IMAP** tab
- Under IMAP Access, select **Enable IMAP**
- Click **Save Changes**

> **Warning:** Never use your primary Gmail password. Always use an app-specific password for security.

### Microsoft Outlook / Office 365

| Setting | Value |
|---------|-------|
| SMTP Host | `smtp.office365.com` |
| SMTP Port | `587` |
| IMAP Host | `outlook.office365.com` |
| IMAP Port | `993` |
| Username | Your full Outlook email address |
| Password | Your account password or app password |

> **Note:** If your organization uses Microsoft 365 with modern authentication (OAuth), you may need to generate an app password or configure OAuth separately. Contact your IT administrator if basic authentication is disabled.

### Custom Mail Server

For self-hosted or custom mail servers, obtain the following from your email administrator:

| Setting | What to Ask For |
|---------|-----------------|
| SMTP Host | The FQDN of your outgoing mail server |
| SMTP Port | Typically 587 (STARTTLS) or 465 (SSL) |
| IMAP Host | The FQDN of your incoming mail server |
| IMAP Port | Typically 993 (SSL) |
| Credentials | A dedicated support mailbox username and password |

Ensure that the mail server supports TLS connections, as the IMAP client is configured with `tls: true`.

---

## How the Email Processing Pipeline Works

The full lifecycle of an incoming email is as follows:

1. **Receipt:** The IMAP listener detects a new unread message in the INBOX.
2. **Parsing:** The raw email is parsed using `mailparser`, extracting the sender address, sender name, subject line, and plain text body.
3. **Validation:** If no sender address can be extracted, the email is skipped.
4. **Conversation lookup:** The system searches for an active or escalated conversation matching the sender's email address.
5. **Conversation creation:** If none exists, a new conversation is created.
6. **AI processing:** The message content is formatted as `Subject: [subject]\n\n[body]` and passed to the `chat()` function with the conversation ID.
7. **Reply generation:** The AI produces a contextual response.
8. **Email dispatch:** The response is sent via SMTP with proper threading headers, in both plain text and HTML formats.

---

## Limitations and Considerations

### Email Polling Behavior

The IMAP listener uses the server's push notification mechanism (IMAP IDLE equivalent via the `mail` event). However, some email servers may not support real-time push notifications reliably. In such cases, there may be a slight delay between email arrival and processing.

### Attachment Handling

The current implementation processes the plain text body of emails. File attachments in incoming emails are not downloaded or analyzed. The AI responds based solely on the text content.

### HTML Parsing

Incoming emails may contain complex HTML formatting. The system uses the `text` property from `mailparser`, which extracts the plain text representation. Rich formatting, inline images, and embedded content in incoming emails are stripped down to plain text before processing.

### TLS Certificate Validation

The IMAP connection is configured with `tlsOptions: { rejectUnauthorized: false }` to accommodate mail servers with self-signed certificates. In production environments with properly signed certificates, this setting provides broader compatibility at the cost of strict certificate validation.

---

## Troubleshooting

### Cannot Send Emails

- Verify that SMTP host, port, username, and password are correct.
- Confirm the port matches your security mode (587 for STARTTLS, 465 for SSL).
- For Gmail, ensure you are using an app password, not your regular password.
- Check if your email provider blocks third-party SMTP access by default.

### Not Receiving Emails

- Verify that IMAP host, port, username, and password are correct.
- Ensure IMAP is enabled in your email provider's settings.
- Confirm the IMAP port is 993 (SSL).
- For Gmail, verify that IMAP access is enabled under Settings > Forwarding and POP/IMAP.
- Check the application logs for `[Email]` prefixed messages indicating connection errors.

### Email Replies Not Threading

- Ensure the `Message-ID` header is present on incoming emails. Some automated systems or forms may not include this header.
- Verify that your email client supports standard threading via `In-Reply-To` and `References` headers.

---

## Related Pages

- [Channel Setup](Channel-Setup) -- General channel configuration overview
- [Conversations and Inbox](Conversations-and-Inbox) -- View and manage email conversations
- [Business Hours](Business-Hours) -- Configure availability and offline messages for email
- [Automation Rules](Automation-Rules) -- Set up rules for email-specific automation
