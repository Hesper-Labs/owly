# Installation Guide

This guide covers everything you need to install and run Owly on your machine, whether you prefer Docker Compose (recommended for production) or a manual npm-based setup for development.

---

## Prerequisites

Before installing Owly, make sure you have the following:

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| **Node.js** | 20.0+ | Required for npm-based setup. Check with `node -v` |
| **PostgreSQL** | 16.0+ | Can be installed locally or via Docker |
| **npm** | 10.0+ | Comes with Node.js. Check with `npm -v` |
| **Git** | 2.0+ | For cloning the repository |
| **Docker** (optional) | 24.0+ | Required only for Docker Compose setup |
| **Docker Compose** (optional) | 2.20+ | Required only for Docker Compose setup |

### Optional Dependencies

- **Puppeteer/Chromium dependencies** -- Required only if you plan to use the WhatsApp Web channel (QR code scan method). See the [Troubleshooting](#troubleshooting) section for OS-specific packages.

---

## Option 1: Docker Compose (Recommended)

Docker Compose is the simplest way to run Owly. It handles PostgreSQL, the application, and persistent storage automatically.

### Step 1: Clone the Repository

```bash
git clone https://github.com/hsperus/owly.git
cd owly
```

### Step 2: Configure Environment Variables

Copy the example environment file and edit it with your values:

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the required variables. See the [Environment Variables](#environment-variables) section below for a complete reference.

At minimum, you need to set:

```bash
JWT_SECRET="a-random-secret-string-at-least-32-chars"
NEXTAUTH_SECRET="another-random-secret-string"
```

The `DATABASE_URL` is already configured for Docker Compose in `docker-compose.yml` and does not need to be changed.

### Step 3: Start the Services

```bash
docker compose up -d
```

This starts two services:

- **db** -- PostgreSQL 16 (Alpine) on port 5432
- **app** -- Owly application on port 3000

### Step 4: Open the Application

Navigate to `http://localhost:3000` in your browser. You will be redirected to the [Setup Wizard](Setup-Wizard) on first launch.

### Stopping and Restarting

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Restart
docker compose up -d

# View logs
docker compose logs -f app
```

---

## Option 2: Manual Setup (npm)

Use this method for development or if you prefer to manage PostgreSQL separately.

### Step 1: Clone the Repository

```bash
git clone https://github.com/hsperus/owly.git
cd owly
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set the `DATABASE_URL` to point to your PostgreSQL instance:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/owly?schema=public"
```

Also set your secret keys:

```bash
JWT_SECRET="a-random-secret-string-at-least-32-chars"
NEXTAUTH_SECRET="another-random-secret-string"
```

### Step 4: Create the Database

Make sure PostgreSQL is running, then create the database:

```bash
createdb owly
```

Or connect to PostgreSQL and create it manually:

```sql
CREATE DATABASE owly;
```

### Step 5: Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all required tables in your database.

### Step 6: (Optional) Seed Demo Data

If you want to populate the database with sample data for testing:

```bash
npm run db:seed
```

### Step 7: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## Environment Variables

The following table describes all environment variables in `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` |
| `JWT_SECRET` | Yes | Secret key for signing JWT authentication tokens. Use a random string of at least 32 characters. |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth session encryption. Use a different random string from `JWT_SECRET`. |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of your Owly instance. Defaults to `http://localhost:3000`. Set this to your domain in production. |
| `OPENAI_API_KEY` | No | OpenAI API key. Can also be configured later through the Setup Wizard or Settings page. |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for phone channel voice synthesis (text-to-speech). |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID for the phone channel. |
| `TWILIO_AUTH_TOKEN` | No | Twilio Auth Token for the phone channel. |
| `TWILIO_PHONE_NUMBER` | No | Your Twilio phone number in E.164 format (e.g., `+1234567890`). |

**Notes:**

- The AI API key (`OPENAI_API_KEY`) can be set here or through the web UI at Settings. The web UI setting takes precedence.
- Twilio and ElevenLabs keys are only required if you plan to use the Phone channel.
- For production, always use strong, unique values for `JWT_SECRET` and `NEXTAUTH_SECRET`.

---

## Verifying the Installation

After starting Owly, verify that everything is working:

1. **Health check endpoint:** Open `http://localhost:3000/api/health` in your browser or run:

   ```bash
   curl http://localhost:3000/api/health
   ```

   A successful response returns `{ "status": "ok" }`.

2. **Setup wizard:** Navigate to `http://localhost:3000`. On first launch you will be redirected to the setup wizard at `/setup`.

3. **Database connection:** If you see a database connection error, check that PostgreSQL is running and `DATABASE_URL` is correct.

---

## Troubleshooting

### Port 3000 Already in Use

If another application is using port 3000:

```bash
# Find what is using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

For Docker Compose, you can change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Access Owly at localhost:8080
```

### Port 5432 Already in Use (PostgreSQL)

If you have a local PostgreSQL instance conflicting with the Docker container:

```bash
# Option 1: Stop local PostgreSQL
brew services stop postgresql  # macOS
sudo systemctl stop postgresql  # Linux

# Option 2: Change Docker port mapping in docker-compose.yml
ports:
  - "5433:5432"
```

If you change the PostgreSQL port, update `DATABASE_URL` accordingly.

### Database Connection Refused

Common causes and solutions:

1. **PostgreSQL is not running:**
   ```bash
   # Check status
   docker compose ps          # Docker
   pg_isready                 # Local install
   ```

2. **Wrong credentials:** Verify that the username, password, host, and port in `DATABASE_URL` match your PostgreSQL configuration.

3. **Database does not exist:** Create it manually:
   ```bash
   createdb owly
   ```

4. **Docker networking issue:** If running the app outside Docker but the database inside Docker, use `localhost` (not `db`) as the host:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/owly?schema=public"
   ```

### Prisma Migration Errors

If migrations fail:

```bash
# Reset the database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migrations (development only)
npm run db:push
```

### WhatsApp Channel: Missing Puppeteer Dependencies

The WhatsApp Web integration uses Puppeteer, which requires a Chromium browser. On headless servers (Linux), you may need to install system-level dependencies.

**Debian/Ubuntu:**

```bash
sudo apt-get update
sudo apt-get install -y \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  fonts-liberation \
  libappindicator3-1
```

**Alpine (Docker):**

```bash
apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont
```

**macOS:** No additional dependencies are needed. Puppeteer downloads its own Chromium binary.

### Application Crashes on Startup

1. Check the logs:
   ```bash
   # Docker
   docker compose logs app

   # npm
   # Check terminal output for error messages
   ```

2. Ensure Node.js version is 20+:
   ```bash
   node -v
   ```

3. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

---

## Successful Installation

Once everything is running, you should see the Owly dashboard after completing the setup wizard:

![Owly Dashboard](../screenshots/02-dashboard.png)

From here, proceed to the [Setup Wizard](Setup-Wizard) guide to configure your admin account, business profile, and AI provider.

---

## Next Steps

- [Setup Wizard](Setup-Wizard) -- Complete first-run configuration
- [Quick Start Tutorial](Quick-Start-Tutorial) -- Get your first AI conversation in 5 minutes
- [Channel Setup](Channel-Setup) -- Connect WhatsApp, Email, or Phone
