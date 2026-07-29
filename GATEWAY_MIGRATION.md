# API Gateway & Microservices Migration Guide

## How the Gateway Works

The API Gateway acts as a reverse proxy that routes frontend requests to appropriate microservices:

```
Frontend Request
    ↓
Next.js `/api/...` route
    ↓
Gateway Router (`lib/gateway/`)
    ↓
Service Route Mapping (auth → port 3001, alerts → port 3002, etc.)
    ↓
Microservice Endpoint
    ↓
Response back to Frontend
```

## Architecture

### Frontend (`app/api/`)
- `app/api/gateway/[...path]/route.ts` - Main gateway handler
- `app/api/[...path]/route.ts` - Fallback catch-all router
- `lib/api-client.ts` - Frontend client hooks

### Service Registry (`lib/gateway/`)
- `service-registry.ts` - Maps service names to URLs
- `gateway-client.ts` - Proxies requests to services

## Migration Example: Auth Service

### Before (Monolith)

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // Hash password
  const user = await insforge.from('users').select('*')
    .eq('email', email).limit(1);
  
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Generate JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  return NextResponse.json({ token, user });
}
```

### After (With Gateway)

#### Step 1: Create Auth Service Endpoint

```typescript
// services/auth-service/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createInsforgeClient } from '@vaai/shared';

const router = Router();
const insforge = createInsforgeClient(
  process.env.INSFORGE_URL || '',
  process.env.INSFORGE_API_KEY || ''
);

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Query InsForge for user
    const { data: users, error } = await insforge
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (error || !users?.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.AUTH_JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

#### Step 2: Register Route in Auth Service App

```typescript
// services/auth-service/src/app.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import { requestLogger, errorHandler, corsMiddleware } from '@vaai/shared';

const app = express();

app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// Register routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use(errorHandler);

export default app;
```

#### Step 3: Start Auth Service

```bash
cd services/auth-service
npm install
npm run dev
# Listening on http://localhost:3001
```

#### Step 4: Remove Old Monolith Endpoint (Optional)

Delete `app/api/auth/login/route.ts` and any auth-related API routes from the main app.

#### Step 5: Frontend Still Uses Same URL

The gateway automatically routes requests:

```typescript
// Frontend component - no changes needed!
import { useApi } from '@/lib/api-client';

export function LoginForm() {
  const { request, loading } = useApi();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      
      localStorage.setItem('auth_token', response.token);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get('email') as string;
      const password = new FormData(e.currentTarget).get('password') as string;
      handleLogin(email, password);
    }}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button disabled={loading}>Login</button>
    </form>
  );
}
```

## Request Routing Map

| Frontend URL | Routed To | Service | Port |
|---|---|---|---|
| `/api/auth/*` | `auth-service` | `http://localhost:3001` | 3001 |
| `/api/alerts/*` | `alerts-service` | `http://localhost:3002` | 3002 |
| `/api/briefing/*` | `briefing-service` | `http://localhost:3003` | 3003 |
| `/api/integrations/*` | `integrations-service` | `http://localhost:3004` | 3004 |
| `/api/whatsapp/*` | `messaging-service` | `http://localhost:3005` | 3005 |
| `/api/telegram/*` | `messaging-service` | `http://localhost:3005` | 3005 |
| `/api/ai-agent/*` | `ai-agent-service` | `http://localhost:3006` | 3006 |
| `/api/triggers/*` | `triggers-service` | `http://localhost:3007` | 3007 |
| `/api/stripe/*` | `stripe-service` | `http://localhost:3008` | 3008 |
| `/api/campaigns/*` | `leadgen` | `http://localhost:4000` | 4000 |
| `/api/leads/*` | `leadgen` | `http://localhost:4000` | 4000 |

## Debugging the Gateway

### Check Service Connectivity

```bash
# Test auth service
curl http://localhost:3001/health

# Test via gateway
curl http://localhost:3000/api/gateway/auth/health
```

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Service Not Found?

1. Verify service is running: `curl http://localhost:PORT/health`
2. Check port mapping in `lib/gateway/service-registry.ts`
3. Verify environment variables are set correctly
4. Check CORS settings in service (`src/app.ts`)

## Production Deployment

### Option 1: Separate Domains

```
https://auth.yourdomain.com/auth/login
https://alerts.yourdomain.com/alerts
https://api.yourdomain.com/api/gateway/auth/login (gateway proxy)
```

Set in `.env`:
```
AUTH_SERVICE_URL=https://auth.yourdomain.com
ALERTS_SERVICE_URL=https://alerts.yourdomain.com
```

### Option 2: Single API Gateway Domain

```
https://api.yourdomain.com/auth/login (routed to auth service)
https://api.yourdomain.com/alerts (routed to alerts service)
```

Set in `.env`:
```
API_GATEWAY_URL=https://api.yourdomain.com
```

### Option 3: Kubernetes Service Discovery

Services communicate via service names (no manual URLs):
```
http://auth-service:3001/auth/login
http://alerts-service:3002/alerts
```

Requires DNS setup in Kubernetes.

## Migration Checklist

- [ ] Create microservice in `services/your-service/`
- [ ] Implement endpoints using Express + shared utilities
- [ ] Connect to InsForge backend
- [ ] Test service locally: `npm run dev`
- [ ] Verify gateway routing works
- [ ] Update frontend imports (if any direct API calls)
- [ ] Remove old monolith routes
- [ ] Deploy service independently
- [ ] Update environment variables
- [ ] Monitor for errors in production
