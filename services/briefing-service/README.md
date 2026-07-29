# Service Template Structure

This is a template for microservices in the VAAI platform. Copy this folder and customize:

## Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `src/server.ts` - Entry point (HTTP server)
- `src/app.ts` - Express app setup
- `src/routes/` - API route handlers
- `src/models/` - Database models/adapters
- `src/services/` - Business logic

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Environment Variables

```bash
PORT=3001
NODE_ENV=development
INSFORGE_URL=https://your-insforge-host
INSFORGE_API_KEY=ik_your_key
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Deployment

Each service can be deployed independently:

- **Docker**: Build with `npm run build`, then containerize
- **Serverless**: Use Vercel, AWS Lambda, or similar
- **VM/VPS**: Use PM2 or systemd

See root `docker-compose.yml` for local orchestration.
