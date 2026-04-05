<p align="center">
  <img src="public/owly.png" alt="Owly" width="140" height="140" />
</p>

<h1 align="center">Owly</h1>

<p align="center">
  <strong>Open-source AI-powered customer support agent</strong>
</p>

<p align="center">
  Self-hosted, free, and easy to set up.<br/>
  Connect WhatsApp, Email, and Phone to provide 24/7 AI customer support.
</p>

<p align="center">
  <a href="#features">Features</a> &middot;
  <a href="#screenshots">Screenshots</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#api">API</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="docs/wiki/Home.md">Wiki</a> &middot;
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-green.svg" alt="Node" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/typescript-5.x-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/next.js-14-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+-336791.svg" alt="PostgreSQL" />
</p>

<p align="center">
  <img src="docs/demo.gif" alt="Owly Demo" width="700" />
  <br/>
  <em>Dashboard with onboarding checklist, real-time stats, and channel overview</em>
</p>

---

## What is Owly?

Owly is a **self-hosted AI customer support agent** that small businesses and individuals can run on their own machines -- completely free. Connect your WhatsApp, Email, and Phone channels, add your business knowledge, and let the AI handle customer inquiries 24/7.

<table>
  <tr>
    <td width="25%" align="center">
      <br/>
      <strong>Zero Cost</strong><br/>
      <sub>No monthly fees. You only pay<br/>for AI API usage.</sub>
      <br/><br/>
    </td>
    <td width="25%" align="center">
      <br/>
      <strong>Your Data, Your Server</strong><br/>
      <sub>Everything runs on your machine.<br/>Complete privacy.</sub>
      <br/><br/>
    </td>
    <td width="25%" align="center">
      <br/>
      <strong>Multi-Channel</strong><br/>
      <sub>WhatsApp, Email, and Phone<br/>from a single dashboard.</sub>
      <br/><br/>
    </td>
    <td width="25%" align="center">
      <br/>
      <strong>5-Minute Setup</strong><br/>
      <sub>Docker Compose or npm.<br/>Guided setup wizard.</sub>
      <br/><br/>
    </td>
  </tr>
</table>

---

## Features

### Multi-Channel Support

Connect all your customer communication channels in one place.

<table>
  <tr>
    <td width="33%">
      <h4 align="center">WhatsApp</h4>
      <p align="center">Connect via QR code scan or Business API. Handles text, images, voice messages, and documents.</p>
    </td>
    <td width="33%">
      <h4 align="center">Email</h4>
      <p align="center">IMAP/SMTP with any provider. Branded HTML templates with automatic thread tracking.</p>
    </td>
    <td width="33%">
      <h4 align="center">Phone</h4>
      <p align="center">Twilio Voice with OpenAI Whisper (STT) and ElevenLabs (TTS) for natural voice conversations.</p>
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/12-channels.png" alt="Channel Management" width="100%" />
  <br/>
  <em>Connect and manage all channels from one screen</em>
</p>

### AI-Powered Conversations

Owly uses OpenAI GPT (extensible to Claude, Ollama) with your knowledge base to provide accurate, on-brand responses. During conversations, the AI can autonomously:

- **Create tickets** when customers report problems
- **Route issues** to the right department based on expertise matching
- **Send internal emails** to notify team members about urgent issues
- **Look up customer history** for context-aware support
- **Trigger webhooks** to notify external systems
- **Schedule follow-ups** for proactive customer care

<p align="center">
  <img src="docs/screenshots/03-conversations.png" alt="Conversations" width="100%" />
  <br/>
  <em>Unified inbox with conversation thread and admin takeover</em>
</p>

### Customer CRM

Every customer gets a unified profile across all channels -- conversations, notes, tags, and contact history in one place.

<p align="center">
  <img src="docs/screenshots/04-customers.png" alt="Customer Management" width="100%" />
  <br/>
  <em>Customer profiles with notes, tags, and cross-channel history</em>
</p>

### Knowledge Base

Train your AI with your business information. Organize entries into categories, set priorities, and test responses before going live.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/05-knowledge-base.png" alt="Knowledge Base Categories" />
      <br/>
      <em>Categories with entry counts and color coding</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/20-knowledge-detail.png" alt="Knowledge Base Entries" />
      <br/>
      <em>Entries with priority levels and active toggles</em>
    </td>
  </tr>
</table>

### Automation Engine

Automate repetitive tasks with rule-based automation, business hours, SLA tracking, and canned responses.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/07-automation.png" alt="Automation Rules" />
      <br/>
      <em>Auto-route, auto-tag, auto-reply, keyword alerts</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/06-canned-responses.png" alt="Canned Responses" />
      <br/>
      <em>Quick reply templates with shortcuts</em>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/08-business-hours.png" alt="Business Hours" />
      <br/>
      <em>Weekly schedule with timezone and offline messages</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/11-sla-rules.png" alt="SLA Rules" />
      <br/>
      <em>Response time targets per channel and priority</em>
    </td>
  </tr>
</table>

### Team & Ticket Management

Organize your team into departments, track issues with a full ticket system, and monitor performance.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/09-team.png" alt="Team Management" />
      <br/>
      <em>Departments, members, expertise, and availability</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/10-tickets.png" alt="Ticket System" />
      <br/>
      <em>Priority levels, assignments, and status tracking</em>
    </td>
  </tr>
</table>

### Analytics & Insights

Monitor your support performance with charts, metrics, and team performance tracking.

<p align="center">
  <img src="docs/screenshots/14-analytics.png" alt="Analytics Dashboard" width="100%" />
  <br/>
  <em>Conversation trends, channel breakdown, ticket distribution, and satisfaction scores</em>
</p>

### Administration & API

Manage users, API keys, webhooks, and explore the full REST API with interactive documentation.

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/16-admin.png" alt="Administration" />
      <br/>
      <em>Multi-admin with roles and API key management</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/17-api-docs.png" alt="API Documentation" />
      <br/>
      <em>Interactive API docs with live request testing</em>
    </td>
  </tr>
</table>

### Dark Mode

Full dark theme with persistent preference, applied across all 19 pages.

<p align="center">
  <img src="docs/screenshots/19-dark-mode.png" alt="Dark Mode" width="100%" />
  <br/>
  <em>Dark mode dashboard with consistent styling across all components</em>
</p>

### More Features

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/18-settings.png" alt="Settings" />
      <br/>
      <em>6-tab settings: General, AI, Voice, Phone, Email, WhatsApp</em>
    </td>
    <td width="50%">
      <img src="docs/screenshots/13-webhooks.png" alt="Webhooks" />
      <br/>
      <em>Webhook management with payload preview and testing</em>
    </td>
  </tr>
</table>

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+

### Option 1: npm

```bash
# Clone the repository
git clone https://github.com/hsperus/owly.git
cd owly

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npx prisma migrate dev

# (Optional) Load sample data with a default admin account
npm run db:seed
# Default login: username=admin, password=admin123

# Start the development server
npm run dev
```

### Option 2: Docker Compose

```bash
git clone https://github.com/hsperus/owly.git
cd owly

cp .env.example .env
# Edit .env with your API keys

docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) -- the setup wizard will guide you through the initial configuration.

<p align="center">
  <img src="docs/screenshots/01-login.png" alt="Login Page" width="500" />
  <br/>
  <em>Clean login page with Owly branding</em>
</p>

---

## Configuration

All configuration is done through the admin dashboard -- no config files to edit after initial setup:

| Setting | Location | Description |
|---------|----------|-------------|
| Business profile | Settings > General | Name, description, welcome message, tone |
| AI provider | Settings > AI Configuration | OpenAI / Claude / Ollama, model, API key |
| Voice | Settings > Voice | ElevenLabs API key and voice selection |
| Phone | Settings > Phone | Twilio Account SID, auth token, phone number |
| Email | Settings > Email | SMTP and IMAP server configuration |
| WhatsApp | Channels > WhatsApp | QR code scan or Business API |
| Team | Team | Departments, members, expertise areas |
| SLA | SLA Rules | Response and resolution time targets |
| Schedule | Business Hours | Weekly availability and offline messages |
| Automation | Automation | Auto-route, auto-tag, auto-reply rules |
| Templates | Canned Responses | Pre-written reply templates |
| Integrations | Webhooks | External service connections |

---

## API

Owly provides a full REST API. Interactive documentation with live testing is available at `/api-docs` in the dashboard.

```bash
# Send a message and get AI response
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"message": "What are your business hours?", "channel": "api"}'

# Response:
# {"conversationId": "...", "response": "We are open Monday to Friday, 9 AM to 6 PM..."}
```

```bash
# Health check
curl http://localhost:3000/api/health
# {"status": "ok", "version": "0.1.0", "database": "connected"}
```

<details>
<summary><strong>View all endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message, get AI response |
| `GET` `POST` | `/api/conversations` | List or create conversations |
| `GET` `PUT` `DELETE` | `/api/conversations/:id` | Manage a conversation |
| `POST` | `/api/conversations/:id/messages` | Add message (admin takeover) |
| `POST` | `/api/conversations/:id/satisfaction` | Rate conversation (1-5) |
| `POST` | `/api/conversations/:id/notes` | Add internal note |
| `GET` `POST` | `/api/customers` | List or create customers |
| `GET` `PUT` `DELETE` | `/api/customers/:id` | Manage a customer |
| `GET` `POST` | `/api/tickets` | List or create tickets |
| `GET` `PUT` `DELETE` | `/api/tickets/:id` | Manage a ticket |
| `GET` `POST` | `/api/knowledge/categories` | Knowledge categories |
| `GET` `POST` | `/api/knowledge/entries` | Knowledge entries |
| `POST` | `/api/knowledge/test` | Test AI with a question |
| `GET` `PUT` | `/api/settings` | Application settings |
| `GET` | `/api/analytics?period=7d` | Analytics data |
| `GET` | `/api/export?type=conversations&format=csv` | Export (CSV/JSON) |
| `GET` `POST` | `/api/automation` | Automation rules |
| `GET` `PUT` | `/api/business-hours` | Business hours config |
| `GET` `POST` | `/api/sla` | SLA rules |
| `GET` `POST` | `/api/canned-responses` | Canned responses |
| `GET` `POST` | `/api/webhooks` | Webhook management |
| `POST` | `/api/webhooks/test` | Test a webhook |
| `GET` `POST` | `/api/admin/users` | Admin user management |
| `GET` `POST` | `/api/admin/api-keys` | API key management |
| `GET` | `/api/activity` | Activity audit log |
| `GET` | `/api/health` | Health check |

</details>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **UI** | Tailwind CSS |
| **AI** | OpenAI GPT (extensible to Claude, Ollama) |
| **Voice TTS** | ElevenLabs |
| **Voice STT** | OpenAI Whisper |
| **Phone** | Twilio Voice API |
| **WhatsApp** | whatsapp-web.js |
| **Auth** | JWT + bcrypt |
| **Charts** | Pure CSS/SVG (zero dependencies) |
| **Deployment** | Docker Compose |

---

## Project Structure

```
owly/
├── prisma/                  # Database schema, migrations, seed
├── public/                  # Static assets (logo)
├── docs/
│   ├── screenshots/         # UI screenshots (20 images)
│   └── wiki/                # Full documentation (25 pages)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, setup wizard
│   │   ├── (dashboard)/     # 19 dashboard pages
│   │   └── api/             # 55+ REST API endpoints
│   ├── components/
│   │   ├── layout/          # Sidebar, header
│   │   └── ui/              # 12 reusable components
│   └── lib/
│       ├── ai/              # AI engine, tools, types
│       ├── channels/        # WhatsApp, email, phone
│       └── hooks/           # Theme hook
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## Documentation

Full documentation is available in the [Wiki](docs/wiki/Home.md):

- [Installation Guide](docs/wiki/Installation-Guide.md)
- [Setup Wizard](docs/wiki/Setup-Wizard.md)
- [Quick Start Tutorial](docs/wiki/Quick-Start-Tutorial.md)
- [API Reference](docs/wiki/API-Reference.md)
- [AI Tool System](docs/wiki/AI-Tool-System.md)
- [Architecture](docs/wiki/Architecture.md)

---

## Roadmap

- [ ] Embeddable live chat widget for customer websites
- [ ] WebSocket real-time updates
- [ ] Vector embeddings for semantic knowledge search
- [ ] Visual AI tool builder
- [ ] Public knowledge base (self-service)
- [ ] Customer self-service portal
- [ ] Visual workflow builder
- [ ] Telegram, Instagram, SMS channels
- [ ] Shopify / WooCommerce integration
- [ ] Sentiment analysis
- [ ] Mobile admin (PWA)
- [ ] Multi-tenant / white-label

---

## Contributing

Contributions are welcome! See the [Contributing Guide](docs/wiki/Contributing.md) for details.

```bash
# Fork, clone, and create a branch
git checkout -b feature/your-feature

# Make changes and commit
git commit -m 'feat: add your feature'

# Push and open a PR
git push origin feature/your-feature
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <img src="public/owly.png" alt="Owly" width="48" height="48" /><br/>
  <strong>Owly</strong> -- AI Customer Support, Made Simple<br/>
  <sub>Built with Next.js, TypeScript, and PostgreSQL</sub>
</p>
