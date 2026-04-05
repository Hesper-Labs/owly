<p align="center">
  <img src="../../public/owly.png" alt="Owly" width="120" height="120" />
</p>

<h1 align="center">Owly Documentation</h1>

<p align="center">
  Open-source, self-hosted AI customer support agent.<br/>
  Connect WhatsApp, Email, and Phone to deliver 24/7 automated support from your own infrastructure.
</p>

---

Owly is a free, self-hosted customer support platform powered by AI. It connects your WhatsApp, Email, and Phone channels to a single admin dashboard where conversations are handled automatically by an AI agent trained on your knowledge base. There are no monthly fees -- you only pay for the AI API usage from your chosen provider (OpenAI, Claude, or Ollama for fully local operation).

Owly gives small businesses and solo operators the same multi-channel AI support capabilities that enterprise platforms charge hundreds of dollars per month to provide. Deploy it with Docker Compose or npm, complete the setup wizard, add your knowledge base entries, and your AI agent is live.

---

## Table of Contents

### Getting Started

| Page | Description |
|------|-------------|
| [Installation Guide](Installation-Guide) | Prerequisites, step-by-step install, Docker Compose setup, and troubleshooting |
| [Setup Wizard](Setup-Wizard) | The 4-step first-run wizard for admin account, business profile, and AI configuration |
| [Quick Start Tutorial](Quick-Start-Tutorial) | 5-minute guide to your first AI-powered conversation |
| [Dashboard](Dashboard) | Understanding the main dashboard, stat cards, and onboarding checklist |

### Core Features

| Page | Description |
|------|-------------|
| [Conversations and Inbox](Conversations-and-Inbox) | Managing customer conversations across all channels in a unified inbox |
| [Customer Management](Customer-Management) | CRM features including profiles, tags, notes, and contact history |
| [Knowledge Base Guide](Knowledge-Base-Guide) | Building and organizing AI knowledge for accurate, on-brand responses |
| [Ticket System](Ticket-System) | Tracking and resolving customer issues with priorities and assignments |
| [Canned Responses](Canned-Responses) | Pre-written reply templates with keyboard shortcuts |

### Channels

| Page | Description |
|------|-------------|
| [Channel Setup](Channel-Setup) | Connecting WhatsApp (QR code or Business API), Email (IMAP/SMTP), and Phone (Twilio) |

### Automation

| Page | Description |
|------|-------------|
| [Automation Rules](Automation-Rules) | Auto-routing, auto-tagging, auto-replies, and keyword alerts |
| [Business Hours and SLA](Business-Hours-and-SLA) | Weekly schedules, timezone support, offline messages, and response time targets |

### Administration

| Page | Description |
|------|-------------|
| [Team and Departments](Team-and-Departments) | Organizing your support team with departments and expertise areas |
| [Dashboard Overview](Dashboard-Overview) | Detailed reference for dashboard widgets and metrics |
| Analytics and Reports | Performance metrics, charts, conversation trends, and data export |
| API Reference | REST API documentation with authentication, endpoints, and examples |

### Developer Guide

| Page | Description |
|------|-------------|
| Architecture Overview | Tech stack, project structure, and key design decisions |
| Contributing | How to contribute to Owly -- development setup, coding standards, and PR guidelines |
| Deployment | Production deployment with Docker, reverse proxy, SSL, and environment variables |

---

## Quick Links

| Resource | Link |
|----------|------|
| GitHub Repository | [github.com/hsperus/owly](https://github.com/hsperus/owly) |
| Report an Issue | [GitHub Issues](https://github.com/hsperus/owly/issues) |
| License | [MIT License](https://github.com/hsperus/owly/blob/main/LICENSE) |
| Health Check Endpoint | `GET /api/health` |

---

## Tech Stack

- **Framework:** Next.js with TypeScript
- **Database:** PostgreSQL 16+ with Prisma ORM
- **AI:** OpenAI GPT, Claude (Anthropic), Ollama (local models)
- **Voice:** Twilio Voice + OpenAI Whisper (STT) + ElevenLabs (TTS)
- **Messaging:** WhatsApp Web (whatsapp-web.js) + IMAP/SMTP for email
- **UI:** Radix UI, Tailwind CSS, Lucide icons

**Version:** 0.1.0 |
**License:** MIT |
**Minimum Requirements:** Node.js 20+, PostgreSQL 16+
