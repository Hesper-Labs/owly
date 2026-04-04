<p align="center">
  <img src="public/owly.png" alt="Owly" width="120" height="120" />
</p>

<h1 align="center">Owly</h1>
<p align="center">Open-source AI-powered customer support agent</p>

<p align="center">
  Self-hosted, free, and easy to set up. Connect WhatsApp, Email, and Phone to provide 24/7 AI customer support.
</p>

---

## Features

**Multi-Channel Support**
- WhatsApp (via WhatsApp Web QR or Business API)
- Email (IMAP/SMTP with branded HTML templates)
- Phone (Twilio + OpenAI Whisper STT + ElevenLabs TTS)

**AI-Powered Conversations**
- OpenAI GPT integration with function calling
- Knowledge base-aware responses (RAG)
- Automatic ticket creation and team routing
- Customer history context
- Configurable tone and language

**Admin Dashboard**
- Real-time conversation management
- Unified inbox across all channels
- Customer CRM with profiles and notes
- Ticket system with priority and assignment
- Analytics with charts and metrics
- Team and department management

**Automation**
- Auto-routing rules (keyword-based department routing)
- Auto-tagging conversations
- SLA rules with response time targets
- Business hours with offline messages
- Canned responses for quick replies
- Customer satisfaction surveys

**Professional Features**
- Dark mode
- Activity audit log
- API key management
- Interactive API documentation
- Webhook integrations
- CSV/JSON data export
- Docker Compose deployment

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/owly.git
cd owly

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npx prisma migrate dev

# (Optional) Load sample data
npm run db:seed

# Start the development server
npm run dev
```

Open http://localhost:3000 and follow the setup wizard.

### Docker

```bash
# Start with Docker Compose
docker compose up -d

# The app will be available at http://localhost:3000
```

## Configuration

All configuration is done through the admin dashboard:

| Setting | Location |
|---------|----------|
| Business profile | Settings > General |
| AI provider & model | Settings > AI Configuration |
| Voice (ElevenLabs) | Settings > Voice |
| Phone (Twilio) | Settings > Phone |
| Email (SMTP/IMAP) | Settings > Email |
| WhatsApp | Channels > WhatsApp |
| Team & departments | Team |
| SLA rules | SLA Rules |
| Business hours | Business Hours |
| Automation rules | Automation |

## API

Owly provides a REST API for integration with external systems.

```bash
# Send a message
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "channel": "api"}'

# Health check
curl http://localhost:3000/api/health
```

Full API documentation is available at `/api-docs` in the dashboard.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **UI:** Tailwind CSS
- **AI:** OpenAI GPT (extensible to Claude, Ollama)
- **Voice:** ElevenLabs TTS + OpenAI Whisper STT
- **Phone:** Twilio Voice API
- **WhatsApp:** whatsapp-web.js

## License

MIT
