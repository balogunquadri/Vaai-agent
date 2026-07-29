# Microservices Quick Start Guide

## ✅ What's Built

You now have a **complete microservices architecture**:

### 1. **Shared Packages** (`packages/`)
- `@vaai/types` - Shared TypeScript interfaces
- `@vaai/shared` - InsForge client, logger, middleware utilities

### 2. **API Gateway** (`lib/gateway/`)
- Service registry with automatic routing
- Gateway client for proxying requests
- Frontend-transparent routing

### 3. **Microservices** (`services/`)
- ✅ auth-service (3001) - Full JWT implementation
- ⏳ alerts-service (3002) - Skeleton ready
- ⏳ briefing-service (3003) - Skeleton ready
- ⏳ integrations-service (3004) - Skeleton ready
- ⏳ messaging-service (3005) - Skeleton ready
- ⏳ ai-agent-service (3006) - Skeleton ready
- ⏳ triggers-service (3007) - Skeleton ready
- ⏳ stripe-service (3008) - Skeleton ready
- ✅ leadgen (4000) - Already migrated to InsForge

### 4. **Deployment Ready**
- Dockerfiles for all services
- docker-compose.yml for local orchestration
- Frontend Dockerfile for Vercel/Docker

---

## 🚀 Quick Start (Local Development)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your InsForge credentials:
#   INSFORGE_URL=https://your-instance.insforge.app
#   INSFORGE_API_KEY=ik_your_key
#   GOOGLE_GENAI_API_KEY=your_gemini_key
#   STRIPE_SECRET_KEY=sk_your_key

# 3. Start all services
docker-compose up

# Services running at:
#   Frontend: http://localhost:3000
#   Auth: http://localhost:3001
#   Alerts: http://localhost:3002
#   ... (see ports in docker-compose.yml)
```

### Option 2: Manual Dev Mode (Windows PowerShell)

**Terminal 1: Frontend**
```powershell
npm run dev
# http://localhost:3000
```

**Terminal 2: Auth Service**
```powershell
npm run dev -w services/auth-service
# http://localhost:3001
```

**Terminal 3: Other Services**
```powershell
npm run dev -w services/alerts-service
npm run dev -w services/briefing-service
# etc.
```

---

## 📝 Using the Gateway

### From Frontend

**Option A: Using Hook**
```typescript
import { useApi } from '@/lib/api-client';

function LoginForm() {
  const { request, loading } = useApi();
  
  const handleLogin = async (email: string, password: string) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('auth_token', response.token);
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      handleLogin(data.get('email'), data.get('password'));
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={loading}>Login</button>
    </form>
  );
}
```

**Option B: Simple Fetch**
```typescript
import { apiCall } from '@/lib/api-client';

const data = await apiCall('/auth/login', {
  method: 'POST',
  body: { email, password },
});
localStorage.setItem('auth_token', data.token);
```

### Request Flow

```
Browser Request
    ↓
/api/auth/login (Next.js)
    ↓
lib/gateway/gateway-client.ts → routes to ServiceName.AUTH
    ↓
http://localhost:3001/auth/login (auth-service)
    ↓
Response
```

---

## 🔧 Implementing a New Service

### Step 1: Copy Template

```bash
cp -r services/alerts-service services/my-new-service
```

### Step 2: Update package.json

```json
{
  "name": "my-new-service",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

### Step 3: Create Routes

```typescript
// services/my-new-service/src/routes/my-routes.ts
import { Router, Request, Response } from 'express';
import { createInsforgeClient } from '@vaai/shared';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const insforge = createInsforgeClient(
    process.env.INSFORGE_URL || '',
    process.env.INSFORGE_API_KEY || ''
  );
  
  const { data, error } = await insforge.from('my_table').select('*');
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
```

### Step 4: Register in App

```typescript
// services/my-new-service/src/app.ts
import myRoutes from './routes/my-routes';

app.use('/my-endpoint', myRoutes);
```

### Step 5: Update Gateway

Add to `lib/gateway/gateway-client.ts`:
```typescript
if (path.startsWith('/my-endpoint')) return ServiceName.MY_SERVICE;
```

---

## 📊 Service Communication Pattern

### Within Services

```typescript
// Call another service from within a service
const response = await fetch('http://auth-service:3001/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

### From Frontend to Multiple Services

The gateway handles routing automatically:

```typescript
// Same code, different endpoints
await apiCall('/auth/login', { /* ... */ });      // → auth-service
await apiCall('/alerts', { method: 'GET' });      // → alerts-service
await apiCall('/campaigns', { method: 'GET' });   // → leadgen
```

---

## 🔐 Authentication in Services

### Protecting Routes

```typescript
import { authMiddleware } from '@vaai/shared';

app.use('/protected', authMiddleware);

router.get('/protected', (req, res) => {
  res.json({ userId: req.userId });
});
```

### Custom Middleware in Auth Service

```typescript
import { verifyAuth } from './routes/auth';

app.get('/me', verifyAuth, (req, res) => {
  // req.userId is set by middleware
  res.json({ userId: req.userId });
});
```

---

## 📦 Deployment

### Development → Production

1. **Build Packages**
   ```bash
   npm run services:build
   ```

2. **Build & Push Docker Images**
   ```bash
   docker build -f services/auth-service/Dockerfile -t my-registry/auth-service:latest .
   docker push my-registry/auth-service:latest
   ```

3. **Deploy to Kubernetes/VM**
   ```bash
   # Update docker-compose.yml with production image URLs
   # or use Kubernetes manifests
   ```

### Environment Variables (Production)

Set these in your deployment platform:
```
INSFORGE_URL=https://prod-instance.insforge.app
INSFORGE_API_KEY=ik_prod_key
AUTH_JWT_SECRET=your-secret-key
GOOGLE_GENAI_API_KEY=...
STRIPE_SECRET_KEY=...
API_GATEWAY_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

---

## 🛠️ Debugging

### Check if Service is Running

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
# etc.
```

### View Gateway Routing

Add logs to `lib/gateway/gateway-client.ts`:
```typescript
console.log(`[Gateway] Routing ${path} to ${service}`);
```

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev -w services/auth-service
```

### Check Network in Docker

```bash
docker-compose exec auth-service curl http://alerts-service:3002/health
```

---

## 📚 Documentation

- [MICROSERVICES.md](MICROSERVICES.md) - Architecture overview
- [GATEWAY_MIGRATION.md](GATEWAY_MIGRATION.md) - Detailed migration guide
- [lib/gateway/README.md](lib/gateway/README.md) - Gateway config & routes

---

## ✨ Next Steps

1. **Start services**: `docker-compose up` or `npm run services:dev`
2. **Test auth**: `POST http://localhost:3000/api/auth/register`
3. **Implement other services**: Use auth-service as template
4. **Migrate endpoints**: Move routes from monolith to services
5. **Deploy**: Build Docker images and deploy to your infrastructure

---

## 📝 Common Commands

```bash
# Install all workspace dependencies
npm install

# Build all packages and services
npm run services:build

# Run frontend only
npm run dev

# Run all services in dev mode
npm run services:dev

# Start specific service
npm run dev -w services/auth-service

# Build Docker images
docker-compose build

# Start with Docker Compose
docker-compose up

# View logs
docker-compose logs -f auth-service

# Stop all
docker-compose down
```

---

## 🎯 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│                 (Vercel or Docker on port 3000)              │
└────────────┬────────────────────────────────────────────────┘
             │
     ┌───────▼────────┐
     │  API Gateway   │
     │  /api/[...path]│
     └───────┬────────┘
             │
    ┌────────┴──────────────────────────┬──────────┬──────────┐
    │                                   │          │          │
┌───▼────┐  ┌──────────┐  ┌──────────┐│       ...│          │
│ Auth   │  │ Alerts   │  │ Briefing ││       ...│          │
│3001    │  │3002      │  │3003      ││       ...│          │
└────────┘  └──────────┘  └──────────┘└──────────┴──────────┘
    │          │          │        ┌─────────────────┐
    └──────────┴──────────┴────────│ InsForge Backend│
                                   │ (Shared DB)     │
                                   └─────────────────┘
```

You're ready to scale! 🚀
