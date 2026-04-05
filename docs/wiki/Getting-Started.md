# Getting Started

This guide walks you through installing Owly, running the setup wizard, and verifying that everything is working correctly.

---

## Prerequisites

Before installing Owly, make sure you have one of the following setups ready:

### Option A: Local Installation

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20 or higher | Runtime environment |
| PostgreSQL | 16 or higher | Database |
| npm | Bundled with Node.js | Package manager |

### Option B: Docker Installation

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker | 20.10 or higher | Container runtime |
| Docker Compose | v2 or higher | Multi-container orchestration |

> **Tip:** The Docker method is recommended for most users. It handles PostgreSQL automatically and requires no manual database setup.

---

## Installation

### Method 1: npm (Local Development)

**Step 1: Clone the repository**

```bash
git clone https://github.com/hsperus/owly.git
cd owly
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Configure environment variables**

```bash
cp .env.example .env
```

Open the `.env` file in your text editor and set the following values:

```bash
# Required: Your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/owly?schema=public"

# Required: A random secret for JWT authentication (change this!)
JWT_SECRET="your-random-secret-here"
NEXTAUTH_SECRET="your-random-secret-here"

# Required: OpenAI API key for AI responses
OPENAI_API_KEY="sk-your-openai-api-key"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Important:** You must change `JWT_SECRET` and `NEXTAUTH_SECRET` to random, unique values. Never use the default values in production.

**Step 4: Run database migrations**

```bash
npx prisma migrate dev
```

**Step 5 (Optional): Load sample data**

```bash
npm run db:seed
```

This creates a sample admin account and populates the database with example data so you can explore the interface immediately.

**Step 6: Start the development server**

```bash
npm run dev
```

Owly is now running at [http://localhost:3000](http://localhost:3000).

---

### Method 2: Docker (Recommended)

**Step 1: Clone the repository**

```bash
git clone https://github.com/hsperus/owly.git
cd owly
```

**Step 2: Configure environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file with your API keys. The `DATABASE_URL` will be overridden by Docker Compose, so you do not need to change it.

**Step 3: Start the application**

```bash
docker compose up -d
```

This command starts two containers:
- **db** -- PostgreSQL 16 database with persistent storage
- **app** -- The Owly application (runs migrations automatically on startup)

**Step 4: Verify the containers are running**

```bash
docker compose ps
```

You should see both `db` and `app` containers with a status of "Up".

Owly is now running at [http://localhost:3000](http://localhost:3000).

---

## First-Time Setup Wizard

When you open Owly for the first time, you will be redirected to the setup wizard. This is a 4-step process that configures the essential settings.

![Login Page](../screenshots/01-login.png)
*The Owly login page. On first launch, you will be redirected to the setup wizard instead.*

### Step 1: Create Admin Account

This step creates your primary administrator account.

| Field | Description |
|-------|-------------|
| Name | Your display name (shown in the dashboard) |
| Username | The username you will use to log in |
| Password | Must be at least 6 characters |
| Confirm Password | Re-enter your password to confirm |

> **Note:** This is the only admin account created during setup. You can add more admin users later from the Administration page.

### Step 2: Business Profile

Configure the basic identity of your business. This information is used by the AI when responding to customers.

| Field | Description |
|-------|-------------|
| Business Name | Your company or organization name |
| Business Description | A brief description of what your business does (helps the AI understand context) |
| Welcome Message | The greeting customers see when they first contact you. Default: "Hello! How can I help you today?" |
| Tone | The communication style the AI will use: Friendly, Professional, Casual, or Concise |

### Step 3: AI Configuration

Set up the AI provider that will power your customer support responses.

| Field | Description |
|-------|-------------|
| AI Provider | Choose from OpenAI, Claude (Anthropic), or Ollama (Local) |
| Model | Select the specific model to use (options change based on provider) |
| API Key | Your API key for the selected provider |

> **Tip:** If you are just getting started, OpenAI with the `gpt-4o-mini` model provides a good balance of quality and cost. You can change this later in Settings.

### Step 4: All Set

A confirmation screen summarizing your setup. Click the button to proceed to the dashboard and start using Owly.

---

## Default Credentials

If you loaded the sample data using `npm run db:seed`, you can log in with:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> **Warning:** Change these credentials immediately after logging in. Go to Administration to update your password.

---

## Verifying the Installation

After starting Owly, you can verify that everything is working by hitting the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

A successful response looks like this:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": "0h 2m 15s",
  "database": "connected"
}
```

| Field | Expected Value | Meaning |
|-------|---------------|---------|
| status | `ok` | Application is running normally |
| status | `degraded` | Application is running but database connection failed |
| database | `connected` | PostgreSQL is reachable |
| database | `error` | PostgreSQL connection failed |

---

## Troubleshooting Common Issues

### Database connection failed

**Symptom:** The health check returns `"database": "error"` or the application fails to start with a database error.

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready -U postgres`
2. Check that the `DATABASE_URL` in your `.env` file is correct
3. Ensure the `owly` database exists: `createdb owly`
4. For Docker: check that the `db` container is healthy: `docker compose ps`

### Port 3000 is already in use

**Symptom:** The application fails to start because port 3000 is occupied.

**Solutions:**
1. Stop any other application using port 3000
2. For Docker, change the port mapping in `docker-compose.yml`: `"3001:3000"`

### Prisma migration errors

**Symptom:** `npx prisma migrate dev` fails with schema errors.

**Solutions:**
1. Ensure PostgreSQL is running and accessible
2. Try resetting the database: `npx prisma migrate reset` (this deletes all data)
3. Check that your `DATABASE_URL` uses the `?schema=public` parameter

### Setup wizard does not appear

**Symptom:** You see the login page instead of the setup wizard.

**Solutions:**
1. This means an admin account already exists in the database
2. If you used `npm run db:seed`, log in with the default credentials above
3. To start fresh, reset the database and restart the application

### AI responses are not working

**Symptom:** The AI does not respond to messages or returns errors.

**Solutions:**
1. Verify your OpenAI API key is correct in Settings > AI Configuration
2. Check that your API key has sufficient credits
3. Ensure the selected model is available on your API plan
4. Check the browser console and server logs for specific error messages

---

## Next Steps

Once Owly is running, proceed to:

1. [Dashboard Overview](Dashboard-Overview) -- Learn your way around the interface
2. [Knowledge Base Guide](Knowledge-Base-Guide) -- Add knowledge so the AI can answer questions accurately
3. [Channel Setup](Channel-Setup) -- Connect WhatsApp, Email, or Phone
4. [AI Configuration](AI-Configuration) -- Fine-tune the AI behavior
