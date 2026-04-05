# Phone Channel

## Overview

The Phone channel enables Owly to handle incoming voice calls with AI-powered responses. The integration combines three services: Twilio for telephony infrastructure, OpenAI Whisper for speech-to-text transcription, and ElevenLabs for natural text-to-speech synthesis. Together, these create a seamless voice support experience where customers call your number, speak naturally, and receive spoken AI responses.

![Channels](../screenshots/12-channels.png)
*The Channels page showing WhatsApp, Email, and Phone channel cards with their connection status and configuration options.*

---

## Architecture: How Phone Calls Work

The phone call flow follows this pipeline:

```
Customer calls  -->  Twilio receives call  -->  Webhook to Owly
     |
     v
Owly greets caller (TwiML Say/Gather)
     |
     v
Customer speaks  -->  Twilio STT (or Whisper)  -->  Text transcription
     |
     v
AI engine processes text  -->  Generates response
     |
     v
Response delivered via TwiML Say  -->  Customer hears answer
     |
     v
Gather continues  -->  Loop for follow-up questions
```

### Detailed Step-by-Step

1. **Incoming call:** A customer dials your Twilio phone number.
2. **Webhook trigger:** Twilio sends a POST request to your configured webhook URL (`/api/channels/phone/incoming`) with the caller's phone number (`From`) and a unique call identifier (`CallSid`).
3. **Call log creation:** Owly creates a call log record in the database with the call SID, caller number, and in-progress status.
4. **Conversation lookup:** The system checks for an existing active or escalated conversation for the caller's phone number. If none exists, a new conversation is created with the name "Phone Caller."
5. **Welcome message:** Owly responds with TwiML that speaks a welcome message (configurable in Settings) and sets up a `<Gather>` element to capture the caller's speech.
6. **Speech capture:** Twilio listens for the caller's speech input with automatic speech timeout detection and multi-language support (`language="auto"`).
7. **Speech processing:** When the caller finishes speaking, Twilio sends the transcribed speech (`SpeechResult`) to the gather callback URL (`/api/channels/phone/gather`).
8. **AI response:** The transcribed text is passed to the AI engine via the `chat()` function, which generates a contextual response.
9. **Spoken reply:** The AI response is wrapped in TwiML `<Say>` and `<Gather>` elements, so the caller hears the answer and can ask a follow-up question.
10. **Loop or end:** If the caller continues speaking, the process repeats from step 6. If there is no speech input, the system says goodbye and ends the call.

---

## Twilio Setup

Twilio provides the telephony infrastructure for receiving and managing phone calls.

### Prerequisites

You need the following from your Twilio account:

| Credential | Where to Find It |
|------------|------------------|
| **Account SID** | Twilio Console dashboard, displayed prominently on the main page |
| **Auth Token** | Twilio Console dashboard, click the eye icon to reveal |
| **Phone Number** | A purchased Twilio phone number in +E.164 format (e.g., `+15551234567`) |

### Configuration Steps

**Step 1:** Navigate to **Settings** in the Owly sidebar.

**Step 2:** Click the **Phone** tab.

**Step 3:** Enter your Twilio credentials:

| Field | Description |
|-------|-------------|
| **Twilio Account SID** | The account identifier, starts with `AC` |
| **Twilio Auth Token** | The secret authentication token for API access |
| **Twilio Phone Number** | Your Twilio number in +E.164 format (e.g., `+15551234567`) |

**Step 4:** Click **Save**.

### Webhook URL Configuration

For incoming calls to reach Owly, you must configure your Twilio phone number to point to the correct webhook URL.

**Step 1:** Log in to the [Twilio Console](https://console.twilio.com).

**Step 2:** Navigate to **Phone Numbers** > **Manage** > **Active Numbers**.

**Step 3:** Click on the phone number you want to use with Owly.

**Step 4:** Under the **Voice & Fax** section, configure:

| Setting | Value |
|---------|-------|
| **A CALL COMES IN** | Webhook |
| **URL** | `https://your-owly-domain.com/api/channels/phone/incoming` |
| **HTTP Method** | `POST` |

**Step 5:** Optionally, configure the **Call Status Changes** webhook to: `https://your-owly-domain.com/api/channels/phone/status`

**Step 6:** Save the configuration.

> **Important:** The webhook URL must be publicly accessible from the internet. If you are running Owly locally for development, use a tunneling service such as ngrok to expose your local server. Example: `ngrok http 3000` will give you a public URL like `https://abc123.ngrok.io` that you can use as the webhook base URL.

---

## ElevenLabs Setup

ElevenLabs provides high-quality text-to-speech synthesis, giving Owly a natural-sounding voice for phone interactions.

### Prerequisites

| Credential | Where to Find It |
|------------|------------------|
| **API Key** | ElevenLabs dashboard, under your profile settings |
| **Voice ID** | ElevenLabs Voice Library, select a voice and copy its ID |

### Configuration Steps

**Step 1:** Navigate to **Settings** in the Owly sidebar.

**Step 2:** Click the **Voice** tab.

**Step 3:** Enter your ElevenLabs configuration:

| Field | Description |
|-------|-------------|
| **ElevenLabs API Key** | Your API key from the ElevenLabs dashboard |
| **Voice ID** | The ID of the voice you want Owly to use for spoken responses |

**Step 4:** Click **Save**.

### Voice Settings

Owly uses the following voice synthesis parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Model** | `eleven_multilingual_v2` | Supports multiple languages with high quality output |
| **Stability** | `0.5` | Balanced between consistent and expressive speech |
| **Similarity Boost** | `0.75` | How closely the output matches the original voice |
| **Style** | `0.0` | Neutral style for professional support interactions |
| **Speaker Boost** | `true` | Enhances clarity, especially for phone audio quality |

> **Tip:** ElevenLabs offers a library of pre-made voices with different characteristics. Choose a voice that aligns with your brand personality. You can also create a custom cloned voice through the ElevenLabs platform.

---

## Speech-to-Text (Whisper)

Owly includes a speech-to-text capability using the OpenAI Whisper model. The `transcribeAudio()` function accepts a raw audio buffer and returns the transcribed text.

### How STT Works

1. The audio buffer is wrapped as a WAV file.
2. The file is submitted to the OpenAI `audio.transcriptions.create` endpoint using the `whisper-1` model.
3. The transcribed text is returned for processing by the AI engine.

> **Note:** The primary call flow uses Twilio's built-in speech recognition via the `<Gather input="speech">` TwiML element. The Whisper-based transcription is available as an alternative for scenarios requiring higher accuracy or custom audio processing.

---

## Parallel Call Handling

Owly can handle multiple simultaneous phone calls because each call operates independently:

- Each incoming call receives its own unique `CallSid` from Twilio.
- Each call creates or resumes a separate conversation in the database.
- The AI engine processes each conversation independently based on its own conversation ID and history.
- TwiML responses are generated per-call and returned to Twilio for the specific call session.

There is no shared state between concurrent calls, so the system scales naturally with the number of incoming calls. The practical limit depends on your server resources and API rate limits for OpenAI and ElevenLabs.

---

## Call Logs and Summaries

Owly maintains a detailed log for every phone call.

### Call Log Fields

| Field | Description |
|-------|-------------|
| **Call SID** | Twilio's unique identifier for the call |
| **From** | The caller's phone number |
| **To** | Your Twilio phone number |
| **Status** | Current call status (`in-progress`, `completed`) |
| **Duration** | Total call duration in seconds (populated when the call ends) |

### Call Lifecycle

1. **Call starts:** A call log record is created with status `in-progress` when the incoming call webhook fires.
2. **During call:** The status remains `in-progress` as the caller interacts with the AI.
3. **Call ends:** When Twilio reports the call has ended (via the status callback), the log is updated with status `completed` and the call duration.

All speech exchanges during the call are also stored as messages within the associated conversation, providing a full text transcript alongside the call metadata.

---

## TwiML Response Structure

Owly generates TwiML (Twilio Markup Language) XML responses to control call behavior.

### Welcome/Gather Response

When a call first comes in, the system generates a TwiML response that:

1. Speaks the configurable welcome message using the `alice` voice.
2. Opens a `<Gather>` element that listens for speech input.
3. Includes a fallback message if no speech is detected.

### Ongoing Conversation Response

After the AI generates a response to the caller's speech, the TwiML:

1. Speaks the AI-generated response.
2. Opens a new `<Gather>` element asking if there is anything else.
3. If no further speech is detected, thanks the caller and ends the call.

The callback URL for each `<Gather>` includes the conversation ID and call SID as query parameters, ensuring continuity across multiple exchanges within the same call.

---

## Limitations and Considerations

### Public URL Requirement

Twilio must be able to reach your Owly instance via a public HTTPS URL. Local development setups require a tunneling service (such as ngrok or Cloudflare Tunnel).

### Latency

The phone call pipeline involves multiple API calls (speech recognition, AI processing, optional TTS), which introduces some latency between the caller finishing their sentence and hearing the response. The typical round-trip time depends on network conditions and API response times.

### Voice Quality

The current TwiML implementation uses Twilio's built-in `alice` voice for speaking responses. ElevenLabs TTS is available as an integration point for higher-quality voice synthesis, though the default flow uses TwiML `<Say>` for simplicity and lower latency.

### Language Support

The `<Gather>` element is configured with `language="auto"`, which allows Twilio to detect the caller's language automatically. The AI engine's response language will depend on its configuration and the knowledge base content.

### Cost Considerations

Phone support incurs costs from multiple services:

| Service | Cost Factor |
|---------|-------------|
| **Twilio** | Per-minute charges for incoming and outgoing calls, plus phone number rental |
| **OpenAI** | API usage for Whisper transcription (if used) and AI response generation |
| **ElevenLabs** | Character-based pricing for text-to-speech synthesis (if used) |

Review each provider's pricing page and monitor your usage to avoid unexpected charges.

---

## Troubleshooting

### Calls Not Connecting

- Verify that the Twilio Account SID and Auth Token are correct.
- Confirm the Twilio phone number is active and properly formatted in +E.164 format.
- Ensure the webhook URL is publicly accessible and points to `/api/channels/phone/incoming`.
- Check Twilio's call logs in the console for specific error codes.

### No Response After Speaking

- Check that the gather callback URL is correctly constructed and accessible.
- Verify the AI engine is operational and the API key is configured.
- Review application logs for errors in the `/api/channels/phone/gather` endpoint.

### Poor Audio Quality

- Ensure a stable internet connection between your server and Twilio.
- If using ElevenLabs TTS, verify the API key is valid and the voice ID exists.
- Consider adjusting ElevenLabs voice settings (stability and similarity boost) for clarity.

### Webhook Errors in Twilio Console

- Confirm the Owly application is running and the webhook endpoints return valid TwiML.
- Check that the response Content-Type is `text/xml`.
- Review server logs for unhandled exceptions in the incoming call or gather handlers.

---

## Related Pages

- [Channel Setup](Channel-Setup) -- General channel configuration overview
- [Conversations and Inbox](Conversations-and-Inbox) -- View call transcripts and conversation history
- [Business Hours](Business-Hours) -- Configure availability for phone support
- [SLA Rules](SLA-Rules) -- Set response time targets for phone interactions
