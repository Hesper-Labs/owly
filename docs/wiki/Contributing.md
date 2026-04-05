# Contributing

Thank you for your interest in contributing to Owly. This guide covers everything you need to get started: setting up the development environment, understanding the code conventions, and submitting your changes.

---

## How to Contribute

There are several ways to contribute to Owly:

- **Report bugs**: Open an issue describing the problem, steps to reproduce, and expected vs. actual behavior.
- **Suggest features**: Open an issue with a detailed description of the feature, its use case, and how it fits into the existing system.
- **Submit code**: Fork the repository, create a branch, make your changes, and open a pull request.
- **Improve documentation**: Fix typos, clarify explanations, or add missing documentation in the `docs/wiki/` directory.
- **Write tests**: Help improve test coverage for existing features.

---

## Development Setup

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 20 or higher | Runtime environment |
| PostgreSQL | 16 or higher | Database |
| npm | Bundled with Node.js | Package manager |

### Step-by-Step Setup

**1. Fork and clone the repository:**

```bash
git clone https://github.com/your-username/owly.git
cd owly
```

**2. Install dependencies:**

```bash
npm install
```

**3. Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/owly"
```

**4. Set up the database:**

```bash
npm run db:push
npm run db:seed
```

`db:push` applies the Prisma schema to your database. `db:seed` populates it with sample data for development.

**5. Start the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

**6. Log in:**

Use the default credentials created by the seed script, or run through the setup wizard at `/setup` on a fresh database.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start the Next.js development server with hot reload. |
| `build` | `npm run build` | Create a production build. |
| `start` | `npm run start` | Start the production server. |
| `lint` | `npm run lint` | Run ESLint to check for code quality issues. |
| `db:seed` | `npm run db:seed` | Seed the database with sample data. |
| `db:migrate` | `npm run db:migrate` | Run Prisma migrations in development mode. |
| `db:push` | `npm run db:push` | Push the Prisma schema to the database without migrations. |
| `db:studio` | `npm run db:studio` | Open Prisma Studio to browse and edit database records. |

---

## Code Style and Conventions

### TypeScript

- All code is written in TypeScript. Avoid using `any` types unless absolutely necessary.
- Use explicit type annotations for function parameters and return types.
- Prefer interfaces over type aliases for object shapes.
- Use `const` by default; use `let` only when reassignment is needed.

### React Components

- Use functional components with hooks.
- Place component files in the appropriate directory under `src/app/` (pages) or `src/components/` (reusable components).
- Co-locate component-specific types and helpers at the top of the component file.
- Use the `"use client"` directive only when the component requires client-side interactivity.

### Tailwind CSS

- Use Tailwind utility classes for all styling. Avoid writing custom CSS unless absolutely necessary.
- Follow the existing color system using `owly-*` custom colors defined in the theme.
- Use the `cn()` utility from `src/lib/utils.ts` for conditional class names.

### API Routes

- Place API route handlers in `src/app/api/` following the Next.js App Router convention.
- Each route file exports named functions for the HTTP methods it supports (`GET`, `POST`, `PUT`, `DELETE`).
- Return `NextResponse.json()` for all responses.
- Include appropriate HTTP status codes (200 for success, 201 for creation, 400 for bad request, 404 for not found, 500 for server errors).
- Wrap database operations in try/catch blocks and return meaningful error messages.

### Commit Messages

Owly follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Every commit message must follow this format:

```
type: description
```

**Types:**

| Type | Purpose |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting, no logic change |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or modifying tests |
| `chore` | Maintenance tasks (dependency updates, build config) |

**Examples:**

```
feat: add WhatsApp Business API integration
fix: resolve duplicate key warning in analytics charts
docs: add webhook configuration guide to wiki
refactor: extract common form validation into shared utility
```

- Use imperative mood in the description ("add" not "added", "fix" not "fixed").
- Keep the subject line under 72 characters.
- Write commit messages in English.

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch**: Branch from `main` with a descriptive name.

   ```bash
   git checkout -b feat/whatsapp-business-api
   ```

2. **Make your changes**: Follow the code style conventions described above.

3. **Test your changes**: Verify that the application works correctly with your changes. Run the linter:

   ```bash
   npm run lint
   ```

4. **Build check**: Ensure the production build succeeds:

   ```bash
   npm run build
   ```

### Submitting

1. Push your branch to your fork.
2. Open a pull request against the `main` branch of the upstream repository.
3. Fill in the PR template with:
   - A clear description of what the PR does.
   - The motivation behind the change.
   - Steps to test the change.
   - Screenshots if the change affects the UI.

### Review Process

- A maintainer will review your PR and may request changes.
- Address review comments by pushing additional commits to your branch.
- Once approved, a maintainer will merge the PR.

---

## Issue Reporting

When reporting a bug, include:

1. **Environment**: Owly version, Node.js version, PostgreSQL version, operating system.
2. **Steps to reproduce**: A numbered list of steps that reliably trigger the issue.
3. **Expected behavior**: What you expected to happen.
4. **Actual behavior**: What actually happened, including any error messages.
5. **Screenshots**: If the issue is visual, include screenshots.
6. **Logs**: If relevant, include server console output or browser console errors.

Use the "Bug Report" issue template if one is available.

---

## Feature Requests

When requesting a feature, include:

1. **Problem statement**: What problem does this feature solve?
2. **Proposed solution**: How would this feature work from the user's perspective?
3. **Alternatives considered**: Have you considered other approaches?
4. **Additional context**: Mockups, examples from other tools, or related issues.

Use the "Feature Request" issue template if one is available.

---

## Project Structure for New Contributors

If you are new to the codebase, here is a recommended path for understanding the project:

1. **Start with the schema**: Read `prisma/schema.prisma` to understand the data model. This file defines every entity in the system and their relationships.

2. **Explore a simple API route**: Look at `src/app/api/health/route.ts` as the simplest example, then move to `src/app/api/settings/route.ts` for a basic CRUD example.

3. **Understand the AI engine**: Read `src/lib/ai/engine.ts` and `src/lib/ai/tools.ts` to understand how conversations are processed and how the AI uses tools.

4. **Look at a dashboard page**: Open any page under `src/app/(dashboard)/` (e.g., `settings/page.tsx`) to see how the frontend is structured. Each page is a self-contained client component that fetches data from the API.

5. **Check the middleware**: Read `src/middleware.ts` to understand how authentication is enforced across routes.

6. **Review the components**: Browse `src/components/` for reusable UI components like the sidebar, header, stat cards, and charts.

### Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Complete database schema |
| `src/middleware.ts` | Authentication and route protection |
| `src/lib/ai/engine.ts` | AI conversation loop and prompt building |
| `src/lib/ai/tools.ts` | Tool definitions and execution handlers |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/app/layout.tsx` | Root layout with global providers |
| `src/app/(dashboard)/page.tsx` | Main dashboard page |
| `src/app/api/chat/route.ts` | Primary AI chat endpoint |
