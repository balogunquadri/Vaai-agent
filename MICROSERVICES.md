# Monorepo & Microservices Architecture

## Overview

This project uses a monorepo structure with:
- **Frontend**: Next.js app (Vercel-deployable)
- **Shared Packages**: Types and utilities (`packages/`)
- **Microservices**: Domain-driven services (`services/`)

## Workspace Structure

```
vaai/
├── app/                          # Next.js frontend
├── packages/
│   ├── types/                    # Shared TypeScript types
│   └── shared/                   # Shared utilities (InsForge client, middleware, logger)
├── services/
│   ├── auth-service/             # Authentication & JWT
│   ├── alerts-service/           # Alert management
│   ├── briefing-service/         # Email briefings
│   ├── integrations-service/     # OAuth & provider integrations
│   ├── messaging-service/        # WhatsApp, Telegram, Email
│   ├── ai-agent-service/         # AI chat & uploads
│   ├── triggers-service/         # Trigger evaluation & scheduling
│   ├── stripe-service/           # Payment processing
│   └── leadgen/                  # Lead generation & email campaigns
├── lib/                          # Standalone utility modules (gradual migration)
├── docker-compose.yml            # Local orchestration
└── .env.example                  # Environment template
```

## Development Setup

### 1. Install Dependencies

```bash
npm install
# or: npm run workspace:install
```

This installs all workspace packages and services.

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_INSFORGE_URL` - Your InsForge backend URL
- `NEXT_PUBLIC_INSFORGE_ANON_KEY` - InsForge anon key
- `INSFORGE_API_KEY` - InsForge admin key (for services)
- `GOOGLE_GENAI_API_KEY` - Gemini API key (AI agent service)
- `STRIPE_SECRET_KEY` - Stripe secret key

### 3. Run Services Locally

**Option A: Run all services with Docker Compose**

```bash
docker-compose up
```

**Option B: Run individual services in dev mode**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Services (if npm >=7)
npm run services:dev

# Or run individually:
npm run dev -w services/auth-service
npm run dev -w services/alerts-service
npm run dev -w services/leadgen
```

### 4. Shared Types & Utilities

Reference shared packages in services:

```typescript
import { User, Alert, Lead } from '@vaai/types';
import { logger, getServiceConfig, createInsforgeClient } from '@vaai/shared';
```

## Creating a New Service

1. Copy an existing service folder (e.g., `services/alerts-service/`)
2. Update `package.json`:
   - Change `"name"` to your service name
   - Update scripts
3. Create routes in `src/routes/`
4. Add models/adapters in `src/models/`
5. Export from `src/app.ts`

**Example service tree:**

```
services/my-service/
├── src/
│   ├── app.ts                    # Express setup
│   ├── server.ts                 # Entry point
│   ├── routes/
│   │   └── my-routes.ts
│   ├── models/
│   │   └── my-model-adapter.ts   # InsForge queries
│   └── services/
│       └── my-business-logic.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Deployment

### Frontend (Vercel)

```bash
vercel deploy
```

Points to: environment vars for InsForge + API gateway URL

### Services

Each service can be deployed independently:

- **Docker**: Build image, push to registry, deploy to VM/Kubernetes
- **Serverless**: AWS Lambda, Azure Functions, Vercel Functions
- **Traditional**: PM2, systemd, or auto-scaling groups

Example Dockerfile for a service:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

## API Gateway

The frontend can route to services via:

1. **Relative proxy** (dev): `/api/auth/*` → `http://auth:3001/*`
2. **Absolute URLs** (prod): `https://auth.yourdomain.com/`
3. **Service mesh** (Kubernetes): Automatic routing via Istio/Linkerd

## Database (InsForge)

All services share the same InsForge backend. Define tables for:
- `users` - Authentication
- `leads` - Lead generation
- `campaigns` - Email campaigns
- `alerts` - Alert configurations
- `briefings` - Email briefings
- `integrations` - OAuth tokens
- `campaign_launches` - Campaign execution

Policies can enforce user-level isolation via `RLS`.

## Monitoring & Logging

Services use `pino` logger. Log level via `LOG_LEVEL` env var.

```bash
LOG_LEVEL=debug npm run dev -w services/auth-service
```

## Next Steps

1. ✅ Monorepo structure created
2. ⏳ Create API Gateway router (routes frontend requests to services)
3. ⏳ Extract and implement Auth Service
4. ⏳ Migrate remaining endpoints to services
5. ⏳ Set up Docker & Kubernetes configs
6. ⏳ CI/CD pipeline (GitHub Actions, etc.)

See `docker-compose.yml` for local orchestration example.
