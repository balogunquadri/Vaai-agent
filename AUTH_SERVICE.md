# Auth Service Implementation Complete

## ✅ What's Been Delivered

### 1. **Full Auth Service** (`services/auth-service/`)

#### Endpoints Implemented

- **POST `/auth/register`** - Create new user account
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
  Returns: `{ token, refreshToken, user }`

- **POST `/auth/login`** - Authenticate with email/password
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Returns: `{ token, refreshToken, expiresIn, user }`

- **POST `/auth/refresh`** - Get new access token
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```
  Returns: `{ token, refreshToken, expiresIn }`

- **POST `/auth/logout`** - Logout user
  Returns: `{ success: true }`

- **GET `/auth/me`** (Protected) - Get current user profile
  Returns: `{ id, email, firstName, lastName, role, createdAt }`

- **PUT `/auth/profile`** (Protected) - Update user profile
  Returns: `{ id, email, firstName, lastName }`

- **POST `/auth/change-password`** (Protected) - Change password
  Returns: `{ success: true, message }`

#### Features

✅ JWT-based authentication (7-day access token, 30-day refresh token)  
✅ Password hashing with bcryptjs (10 salt rounds)  
✅ InsForge database integration  
✅ User role support (default: "user")  
✅ Last login tracking  
✅ Email uniqueness validation  
✅ Protected routes middleware  
✅ Comprehensive error handling  
✅ CORS enabled  

#### Database Schema

The auth service expects a `users` table in InsForge:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 2. **API Gateway Updates**

The gateway automatically routes all `/auth/*` requests to the auth service:

```typescript
// From frontend
await apiCall('/auth/login', { method: 'POST', body: {...} });
// Routes to http://localhost:3001/auth/login
```

### 3. **Dockerfiles for All Services**

Created production-ready Dockerfiles with multi-stage builds:
- ✅ auth-service/Dockerfile
- ✅ alerts-service/Dockerfile
- ✅ briefing-service/Dockerfile
- ✅ integrations-service/Dockerfile
- ✅ messaging-service/Dockerfile
- ✅ ai-agent-service/Dockerfile
- ✅ triggers-service/Dockerfile
- ✅ stripe-service/Dockerfile
- ✅ leadgen/Dockerfile
- ✅ root Dockerfile (frontend)

### 4. **Docker Compose Configuration**

Updated `docker-compose.yml` with all services configured:
- All 9 services + frontend defined
- Service ports mapped (3001-3008, 4000)
- Environment variables passed through
- Service dependencies declared

### 5. **NPM Scripts Updated**

```bash
npm run services:build   # Build all packages + services
npm run services:dev     # Run all 9 services in dev mode
```

---

## 🚀 Quick Start: Using Auth Service

### Step 1: Ensure InsForge Table Exists

Create the `users` table in your InsForge instance:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Configure Environment

```bash
# .env.local
INSFORGE_URL=https://your-instance.insforge.app
INSFORGE_API_KEY=ik_your_api_key
AUTH_JWT_SECRET=your-secret-key-change-this
```

### Step 3: Start Auth Service

**Option A: Docker**
```bash
docker-compose up auth
```

**Option B: Dev Mode**
```bash
npm run dev -w services/auth-service
```

### Step 4: Test Endpoints

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get Profile (replace TOKEN)
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔌 Integrating Auth with Frontend

### Option 1: Using Auth Service Directly

```typescript
import { apiCall } from '@/lib/api-client';

export async function login(email: string, password: string) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('refresh_token', response.refreshToken);
  
  return response.user;
}

export async function register(email: string, password: string, firstName: string) {
  const response = await apiCall('/auth/register', {
    method: 'POST',
    body: { email, password, firstName },
  });
  
  localStorage.setItem('auth_token', response.token);
  return response.user;
}

export async function getCurrentUser() {
  return await apiCall('/auth/me', {
    method: 'GET',
  });
}
```

### Option 2: Creating React Hooks

```typescript
// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { apiCall } from '@/lib/api-client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token, refreshToken, user } = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, firstName: string) => {
      setLoading(true);
      setError(null);
      try {
        const { token, refreshToken, user } = await apiCall('/auth/register', {
          method: 'POST',
          body: { email, password, firstName },
        });
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        setUser(user);
        return user;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout };
}
```

### Option 3: Using Protected Routes

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/settings', '/profile'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Redirect to login if accessing protected route without token
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 🛡️ Security Considerations

### Current Implementation

✅ Passwords hashed with bcryptjs (10 rounds)  
✅ JWT tokens with 7-day expiry  
✅ Refresh tokens with 30-day expiry  
✅ CORS configured for cross-origin requests  
✅ Input validation on endpoints  

### Recommended Additions

⏳ Rate limiting on login/register endpoints  
⏳ Email verification before account activation  
⏳ Two-factor authentication (2FA)  
⏳ Token blacklist/revocation on logout  
⏳ HTTPS-only cookies  
⏳ CSRF protection  

### Protecting Endpoints (Example)

```typescript
// services/alerts-service/src/app.ts
import { verifyAuth } from '@vaai/shared';

// Protect specific routes
app.get('/alerts', verifyAuth, (req, res) => {
  res.json({ userId: req.userId, data: [] });
});
```

---

## 📊 Service Interaction Diagram

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
    POST /api/auth/login
         │
    ┌────▼────────────────┐
    │  API Gateway        │
    │  /api/[...path]     │
    └────┬────────────────┘
         │
    Route to /auth/*
         │
    ┌────▼────────────────┐
    │  Auth Service       │
    │  :3001              │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │  InsForge Backend   │
    │  (users table)      │
    └─────────────────────┘

Response: { token, refreshToken, user }
         │
    ┌────▼──────────────┐
    │  Stored in:       │
    │  localStorage     │
    │  or cookies       │
    └───────────────────┘
```

---

## 🔍 Debugging Auth Issues

### Issue: Invalid email or password

**Check 1:** User exists in InsForge `users` table
```bash
# In InsForge console
SELECT * FROM users WHERE email = 'test@example.com';
```

**Check 2:** Password hash is stored correctly
```bash
# Should be bcrypt hash starting with $2a$, $2b$, or $2y$
```

### Issue: JWT token not working

**Check 1:** Token not expired
```typescript
import jwt from 'jsonwebtoken';
const decoded = jwt.decode(token);
console.log(decoded.exp * 1000 > Date.now()); // true if valid
```

**Check 2:** Secret matches
```bash
# Ensure AUTH_JWT_SECRET is same on all services
```

### Issue: CORS error

**Check 1:** Frontend URL in `.env`
```bash
FRONTEND_URL=http://localhost:3000  # or your frontend URL
```

**Check 2:** Gateway CORS configuration
```typescript
// lib/gateway/gateway-client.ts already has CORS headers
```

---

## 📚 Files Created/Modified

### New Files
- `services/auth-service/src/routes/auth.ts` (300+ lines, full auth logic)
- `services/auth-service/Dockerfile`
- `services/alerts-service/Dockerfile`
- `services/briefing-service/Dockerfile`
- `services/integrations-service/Dockerfile`
- `services/messaging-service/Dockerfile`
- `services/ai-agent-service/Dockerfile`
- `services/triggers-service/Dockerfile`
- `services/stripe-service/Dockerfile`
- `services/leadgen/Dockerfile`
- `Dockerfile` (frontend)
- `QUICKSTART.md`
- `AUTH_SERVICE.md` (this file)

### Modified Files
- `services/auth-service/src/app.ts` (added auth routes)
- `docker-compose.yml` (updated all services)
- `package.json` (updated scripts)

---

## ✨ Next Steps

1. **Create InsForge Schema**
   - Create `users` table using SQL provided above
   - Run migrations if using migration system

2. **Test Auth Service**
   ```bash
   npm run dev -w services/auth-service
   curl http://localhost:3001/health
   ```

3. **Integrate with Frontend**
   - Update login/register pages to use `/auth/login`, `/auth/register`
   - Add protected routes middleware

4. **Migrate Other Endpoints**
   - Extract routes from monolith into services
   - Use auth service as template
   - Update gateway routing

5. **Deploy Services**
   - Build Docker images
   - Push to registry (DockerHub, ECR, etc.)
   - Deploy to Vercel/VM/K8s

---

## 📖 Related Documentation

- [GATEWAY_MIGRATION.md](GATEWAY_MIGRATION.md) - How to migrate endpoints
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [MICROSERVICES.md](MICROSERVICES.md) - Architecture overview
- [lib/gateway/README.md](lib/gateway/README.md) - Gateway configuration

---

**Status**: ✅ Ready for testing and integration!
