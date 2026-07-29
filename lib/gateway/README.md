/**
 * Configuration and documentation for the API Gateway
 * 
 * The gateway layer bridges the frontend with microservices.
 * 
 * Request Flow:
 *   Browser/Client → Next.js Frontend (/api/...) 
 *                 → API Gateway Router
 *                 → Route to Microservice
 *                 → Response back to Client
 * 
 * Environment Variables:
 * 
 * Development (localhost):
 *   - Auth: http://localhost:3001
 *   - Alerts: http://localhost:3002
 *   - Briefing: http://localhost:3003
 *   - Integrations: http://localhost:3004
 *   - Messaging: http://localhost:3005
 *   - AI Agent: http://localhost:3006
 *   - Triggers: http://localhost:3007
 *   - Stripe: http://localhost:3008
 *   - Leadgen: http://localhost:4000
 * 
 * Production:
 *   - AUTH_SERVICE_URL
 *   - ALERTS_SERVICE_URL
 *   - BRIEFING_SERVICE_URL
 *   - INTEGRATIONS_SERVICE_URL
 *   - MESSAGING_SERVICE_URL
 *   - AI_AGENT_SERVICE_URL
 *   - TRIGGERS_SERVICE_URL
 *   - STRIPE_SERVICE_URL
 *   - LEADGEN_SERVICE_URL
 *   OR
 *   - API_GATEWAY_URL (base URL, services append their domain)
 * 
 * API Routes:
 * 
 * Auth Service (port 3001):
 *   POST /auth/login
 *   POST /auth/register
 *   POST /auth/refresh
 *   POST /auth/logout
 *   GET  /auth/me
 * 
 * Alerts Service (port 3002):
 *   GET  /alerts
 *   POST /alerts
 *   PUT  /alerts/:id
 *   DELETE /alerts/:id
 *   POST /alerts/:id/actions
 *   GET  /alerts/summary
 * 
 * Briefing Service (port 3003):
 *   GET  /briefing
 *   POST /briefing
 *   PUT  /briefing/:id
 *   GET  /briefing/:id/compose
 *   POST /briefing/:id/send
 * 
 * Integrations Service (port 3004):
 *   POST /auth/[platform]/callback
 *   GET  /auth/[platform]/status
 *   GET  /integrations
 *   DELETE /integrations/:id
 * 
 * Messaging Service (port 3005):
 *   POST /whatsapp/connect
 *   POST /whatsapp/send
 *   POST /whatsapp/disconnect
 *   POST /whatsapp/status
 *   POST /whatsapp/mcp
 *   POST /telegram/connect
 *   POST /telegram/send
 *   POST /email/send
 * 
 * AI Agent Service (port 3006):
 *   POST /ai-agent/chat
 *   POST /ai-agent/upload
 * 
 * Triggers Service (port 3007):
 *   POST /triggers
 *   GET  /triggers
 *   POST /triggers/:id/evaluate
 *   POST /jobs/refresh-tokens
 *   POST /jobs/evaluate-triggers
 * 
 * Stripe Service (port 3008):
 *   POST /webhook/stripe
 *   POST /stripe/checkout
 *   GET  /stripe/billing
 *   POST /stripe/cancel
 * 
 * Lead Generation Service (port 4000):
 *   GET  /api/campaigns/user/:userId
 *   POST /api/campaigns
 *   GET  /api/campaigns/:id
 *   GET  /api/campaigns/:id/launches
 *   POST /api/campaigns/:id/launch
 *   POST /api/leads/import
 *   GET  /api/leads/campaign/:campaignId
 *   GET  /socket.io (WebSocket for real-time updates)
 * 
 * Usage in Frontend Components:
 * 
 *   import { useApi, apiCall } from '@/lib/api-client';
 * 
 *   // Hook-based
 *   const { request, loading, error } = useApi();
 *   const data = await request('/auth/login', {
 *     method: 'POST',
 *     body: { email, password },
 *     onSuccess: (data) => console.log('Logged in'),
 *   });
 * 
 *   // Callback-based
 *   const data = await apiCall('/alerts', {
 *     method: 'GET',
 *   });
 * 
 * The gateway automatically:
 *   - Routes requests to the correct microservice
 *   - Forwards authentication tokens
 *   - Handles errors and retries
 *   - Logs requests for debugging
 */

export const API_GATEWAY_CONFIG = {
  development: {
    services: {
      auth: 'http://localhost:3001',
      alerts: 'http://localhost:3002',
      briefing: 'http://localhost:3003',
      integrations: 'http://localhost:3004',
      messaging: 'http://localhost:3005',
      aiAgent: 'http://localhost:3006',
      triggers: 'http://localhost:3007',
      stripe: 'http://localhost:3008',
      leadgen: 'http://localhost:4000',
    },
  },
  production: {
    // Defined via environment variables
    baseUrl: process.env.API_GATEWAY_URL || process.env.VERCEL_URL,
  },
};
