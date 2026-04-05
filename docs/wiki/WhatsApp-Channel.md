# WhatsApp Channel

## Overview

The WhatsApp channel allows Owly to receive and respond to customer messages through WhatsApp. When a customer sends a message via WhatsApp, Owly automatically creates or resumes a conversation, passes the message to the AI engine, and sends the AI-generated response back through WhatsApp in real time.

Owly supports two connection methods: WhatsApp Web (QR code scanning) and WhatsApp Business API (API key authentication). Both methods enable full bidirectional messaging with AI-powered responses.

![Channels](../screenshots/12-channels.png)
*The Channels page displaying WhatsApp, Email, and Phone channel cards with their connection status and configuration options.*

---

## How WhatsApp Integration Works

The WhatsApp integration follows this flow for every incoming message:

1. A customer sends a message to your WhatsApp number.
2. Owly receives the message through the connected WhatsApp client.
3. The system checks whether an active or escalated conversation already exists for that customer contact. If not, a new conversation is created.
4. The message content is forwarded to the AI engine via the `chat()` function.
5. The AI generates a contextual response based on the conversation history and the knowledge base.
6. Owly sends the response back to the customer as a WhatsApp reply.

Messages from the linked account itself (outgoing messages) are ignored to prevent feedback loops.

---

## Method 1: WhatsApp Web (QR Code)

This is the simplest connection method. It works with any personal or business WhatsApp account and does not require a Meta Business account or API setup.

### QR Code Scanning Process

**Step 1:** Navigate to **Channels** in the sidebar.

**Step 2:** Locate the WhatsApp card and click **Configure**.

**Step 3:** Select **Web (QR Code)** as the connection mode.

**Step 4:** A QR code will appear on screen. The system uses the `whatsapp-web.js` library with Puppeteer running in headless mode to generate this code.

**Step 5:** On your phone, open WhatsApp and navigate to:
- **Settings** (or the three-dot menu on Android)
- **Linked Devices**
- **Link a Device**
- Point your phone camera at the QR code displayed on screen.

**Step 6:** Wait for the connection to establish. The channel status will progress through these stages:
- `disconnected` -- Initial state
- `connecting` -- Client is initializing
- `qr_ready` -- QR code is displayed, waiting for scan
- `connecting` -- Authenticated, loading chats
- `connected` -- Ready to send and receive messages

Once connected, the channel record in the database is updated to active status.

### Session Persistence

WhatsApp Web authentication data is stored locally in the `.wwebjs_auth` directory using the `LocalAuth` strategy. This means:

- **Standard deployments:** The session persists across application restarts as long as the `.wwebjs_auth` directory is preserved.
- **Docker deployments:** Authentication is persisted in the `whatsapp_auth` volume. You do not need to re-scan the QR code after container restarts, provided the volume is properly mounted.
- **Session expiry:** If the phone goes offline, or if the WhatsApp session is manually logged out from the phone's Linked Devices menu, the connection will drop and you will need to scan the QR code again.

### Reconnection Behavior

When the client detects a disconnection, it updates the channel status to `disconnected` in the database and sets the client reference to `null`. The next time you initiate a connection from the Channels page, a fresh client is created and a new QR code is generated.

If authentication fails (for example, due to a corrupted session), the system emits an `auth_failure` event and sets the status to `error` with a descriptive message.

---

## Method 2: WhatsApp Business API

For organizations that need a more robust and scalable connection, Owly supports the WhatsApp Business API.

### Prerequisites

- A Meta Business account
- A WhatsApp Business API account (set up through the Meta for Developers portal)
- A registered business phone number

### API Key Setup

**Step 1:** Navigate to **Channels** in the sidebar.

**Step 2:** Locate the WhatsApp card and click **Configure**.

**Step 3:** Select **API** as the connection mode.

**Step 4:** Enter your WhatsApp Business API credentials:

| Field | Description |
|-------|-------------|
| **API Key** | Your WhatsApp Business API key obtained from the Meta for Developers portal |
| **Phone Number** | The business phone number registered with the WhatsApp Business API |

**Step 5:** Click **Save** to store the configuration.

### Differences from WhatsApp Web

| Feature | WhatsApp Web | Business API |
|---------|-------------|--------------|
| Setup complexity | Low (QR scan) | Moderate (Meta Business account required) |
| Requires phone online | Yes | No |
| Session stability | Depends on phone connection | Managed by Meta infrastructure |
| Message templates | Not required | Required for initiating conversations |
| Rate limits | Standard WhatsApp limits | Business-tier rate limits |
| Suitable for | Small teams, testing | Production, high-volume support |

---

## Media Handling

Owly processes several types of media attachments received through WhatsApp:

### Supported Media Types

When a message contains media, the system downloads the attachment and categorizes it by MIME type:

| Media Type | Handling |
|-----------|----------|
| **Images** | Logged as `[image attachment: filename]` along with any caption text |
| **Videos** | Logged as `[video attachment: filename]` along with any caption text |
| **Documents** | Logged as `[application attachment: filename]` along with any caption text |
| **Voice Messages** | Logged as `[Voice message received]` along with any caption text |
| **Audio Files** | Logged as `[audio attachment: filename]` along with any caption text |

### How Media is Processed

1. The `message.hasMedia` flag is checked for every incoming message.
2. If media is present, the system calls `message.downloadMedia()` to retrieve the attachment.
3. The media MIME type is parsed to determine the category (image, video, audio, application).
4. A descriptive text representation is constructed (e.g., `[image attachment: photo.jpg] Check this out`).
5. This text representation, along with any caption, is passed to the AI engine as the message content.
6. The AI responds based on the textual description of the media.

> **Note:** The current implementation processes media as text descriptions rather than performing visual or audio analysis on the attachments. Voice messages are identified but not transcribed within the WhatsApp channel handler.

---

## How AI Responds to WhatsApp Messages

When a WhatsApp message arrives, the AI response pipeline works as follows:

1. **Contact identification:** The sender's contact information is retrieved, including their push name or contact name. If neither is available, the sender is labeled "Unknown."
2. **Conversation lookup:** The system searches for an existing conversation with status `active` or `escalated` for the same customer contact on the WhatsApp channel.
3. **Conversation creation:** If no matching conversation exists, a new one is created via `createNewConversation("whatsapp", customerName, customerContact)`.
4. **AI processing:** The message content is passed to the `chat()` function, which uses the conversation ID to maintain context across the full conversation history.
5. **Response delivery:** The AI-generated response is sent back to the customer using the `message.reply()` method, which creates a threaded reply in the WhatsApp chat.

The AI engine has access to the knowledge base, conversation history, and any configured system prompts, ensuring responses are contextually relevant and aligned with your support guidelines.

---

## Sending Outbound Messages

Owly can also send proactive messages to WhatsApp contacts. The `sendWhatsAppMessage(to, message)` function handles outbound messaging:

- The `to` parameter accepts either a raw phone number or a WhatsApp chat ID (with `@c.us` suffix).
- If a raw phone number is provided, the system automatically appends `@c.us` to form the correct chat ID.
- The function returns `true` on success and `false` if the client is not connected.

---

## Limitations and Considerations

### WhatsApp Web Requires Chromium

The WhatsApp Web connection method uses Puppeteer (a headless Chromium browser) internally. This has several implications:

- **Server requirements:** The server must have Chromium or Chrome installed, or the Puppeteer-bundled Chromium must be available.
- **Memory usage:** Running a headless browser consumes significant memory (typically 200-500 MB). Plan your server resources accordingly.
- **Puppeteer flags:** The client is configured with `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, and `--disable-gpu` flags for compatibility in containerized environments.

### Phone Must Stay Online (WhatsApp Web)

When using the QR code method, the phone linked to WhatsApp must maintain an active internet connection. If the phone loses connectivity or the WhatsApp app is closed for an extended period, the session may be terminated by WhatsApp servers.

### Single Session Limitation

Only one WhatsApp client instance can be active at a time. Calling `initWhatsApp()` when a client already exists will return without creating a duplicate.

### Rate Limits

WhatsApp enforces rate limits on message sending. Excessive automated messaging may result in the account being temporarily or permanently banned. Use the Business API for high-volume messaging scenarios.

### No Native Media Analysis

The current implementation does not perform OCR on images, transcribe audio, or analyze video content. Media attachments are described textually and the AI responds based on that description.

---

## Troubleshooting

### QR Code Not Appearing

- Verify the application is running and the Channels page is accessible.
- Check server logs for WhatsApp-related error messages (prefixed with `[WhatsApp]`).
- Ensure Chromium dependencies are installed on the server.
- Refresh the page and attempt the connection again.

### Connection Drops Frequently

- Confirm the phone linked to WhatsApp has a stable internet connection.
- Check that the WhatsApp session has not been logged out from the phone's Linked Devices settings.
- For Docker deployments, verify the `whatsapp_auth` volume is properly mounted and persisted.

### Authentication Failure

- Delete the `.wwebjs_auth` directory and scan the QR code again.
- Ensure no other WhatsApp Web session is active for the same account (WhatsApp limits the number of linked devices).

---

## Related Pages

- [Channel Setup](Channel-Setup) -- General channel configuration overview
- [Conversations and Inbox](Conversations-and-Inbox) -- View and manage incoming WhatsApp conversations
- [Automation Rules](Automation-Rules) -- Create rules that trigger based on WhatsApp messages
- [Business Hours](Business-Hours) -- Configure availability schedules
