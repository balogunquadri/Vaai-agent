<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Development Rules

## Main Rule
* Work with minimal changes. Do not rewrite unrelated code. Do not scan the full project unless required.

## Token Saving Rules
* Inspect sets files needed for the current task.
* Do not read the whole codebase unless asked.
* Do not output FULL files unless requested.
* Use targeted edits instead of rewriting large files.
* Keep final response short.
* Mention only changed files and what changed.
* Do not explain obvious code.
* Do not repeat the user request.
* Do not create unnecessary abstractions.
* Do not install new packages unless absolutely needed.

## Code Style
* Write clean, simple, production-ready code.
* Use TypeScript properly.
* Avoid `any` unless there is no better option.
* Follow existing folder structure.
* Follow existing naming conventions.
* Reuse existing utilities, hooks, components, and styles.
* Do not refactor working code unless requested.
* Avoid duplicate code.

## Component Rules
* Create small, reusable components.
* Keep page files mostly for Layout and data flow.
* Keep related UI bits components.
* Keep business logic into hooks, server actions, or utilities.
* Avoid very large JSX blocks.
* Keep components focused on one responsibility.
* Keep `"use client"` as few as possible.

## Logic Rules
* Use Server Components by default.
* Use Client Components only for state, effects, browser APIs, or user interactions.
* Use Server actions or API routes for backend logic.
* Validate input before database operations.
* Add loading, error, and empty states where needed.
* Never expose secrets to the client.

## UI Rules
* Use existing design system components first.
* Keep UI minimal, clean, responsive, and consistent.
* Avoid one-off styling.
* Use consistent spacing, typography, and colors.
* Do not recreate existing screens.

## Database/Auth Rules
* Do not change schema unless asked.
* Reuse existing database client.
* Always verify authenticated user before saving private data.
* Always associate user-owned data with userId.
* Do not duplicate user records.
* Store only necessary user information.

## Workflow
### Before coding:
* Identify the smallest set of files needed.
* Check existing components/utilities first.
* Make the smallest safe change.

### After coding:
* Run type check or relevant test if available.
* Summarize changed files only.
* Keep response concise.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **My First Project** (API base `https://5838ur4e.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
