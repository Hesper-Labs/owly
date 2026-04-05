# Contributing to Owly

Thanks for your interest in contributing to Owly! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/Hesper-Labs/owly.git
cd owly

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Code Style

- **TypeScript** for all code
- **Tailwind CSS** for styling with the Owly custom color system (`owly-primary`, `owly-surface`, etc.)
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- No emojis in code, commits, or UI text
- All UI text in English

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:seed      # Seed sample data
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
  app/
    (auth)/          # Login, setup wizard
    (dashboard)/     # Dashboard pages
    api/             # REST API routes
  components/
    layout/          # Sidebar, header
    ui/              # Reusable components
  lib/
    ai/              # AI engine, tools
    channels/        # WhatsApp, email, phone
    hooks/           # React hooks
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes following the code style above
3. Test that `npm run build` passes with no errors
4. Write a clear PR description explaining what and why
5. Submit the PR

## Reporting Issues

Use [GitHub Issues](https://github.com/Hesper-Labs/owly/issues) with the appropriate template:
- **Bug Report** for something that's broken
- **Feature Request** for new ideas

## Need Help?

Open a [discussion](https://github.com/Hesper-Labs/owly/discussions) or check the [Wiki](https://github.com/Hesper-Labs/owly/wiki) for documentation.
