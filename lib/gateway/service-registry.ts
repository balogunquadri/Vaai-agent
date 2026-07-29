/**
 * Service Registry: Maps service names to their URLs
 * Supports both local dev and production deployment patterns
 */

export enum ServiceName {
  AUTH = 'auth',
  ALERTS = 'alerts',
  BRIEFING = 'briefing',
  INTEGRATIONS = 'integrations',
  MESSAGING = 'messaging',
  AI_AGENT = 'ai-agent',
  TRIGGERS = 'triggers',
  STRIPE = 'stripe',
  LEADGEN = 'leadgen',
}

type ServiceRegistry = Record<ServiceName, string>;

function getServiceRegistry(): ServiceRegistry {
  const env = process.env.NODE_ENV || 'development';
  const apiGateway = process.env.API_GATEWAY_URL;

  // Production: Use explicit service URLs from environment or API gateway
  if (env === 'production') {
    return {
      [ServiceName.AUTH]: process.env.AUTH_SERVICE_URL || `${apiGateway}/auth`,
      [ServiceName.ALERTS]: process.env.ALERTS_SERVICE_URL || `${apiGateway}/alerts`,
      [ServiceName.BRIEFING]: process.env.BRIEFING_SERVICE_URL || `${apiGateway}/briefing`,
      [ServiceName.INTEGRATIONS]: process.env.INTEGRATIONS_SERVICE_URL || `${apiGateway}/integrations`,
      [ServiceName.MESSAGING]: process.env.MESSAGING_SERVICE_URL || `${apiGateway}/messaging`,
      [ServiceName.AI_AGENT]: process.env.AI_AGENT_SERVICE_URL || `${apiGateway}/ai-agent`,
      [ServiceName.TRIGGERS]: process.env.TRIGGERS_SERVICE_URL || `${apiGateway}/triggers`,
      [ServiceName.STRIPE]: process.env.STRIPE_SERVICE_URL || `${apiGateway}/stripe`,
      [ServiceName.LEADGEN]: process.env.LEADGEN_SERVICE_URL || `${apiGateway}/leadgen`,
    };
  }

  // Development: Default to localhost with standard ports
  return {
    [ServiceName.AUTH]: 'http://localhost:3001',
    [ServiceName.ALERTS]: 'http://localhost:3002',
    [ServiceName.BRIEFING]: 'http://localhost:3003',
    [ServiceName.INTEGRATIONS]: 'http://localhost:3004',
    [ServiceName.MESSAGING]: 'http://localhost:3005',
    [ServiceName.AI_AGENT]: 'http://localhost:3006',
    [ServiceName.TRIGGERS]: 'http://localhost:3007',
    [ServiceName.STRIPE]: 'http://localhost:3008',
    [ServiceName.LEADGEN]: process.env.NEXT_PUBLIC_LEADGEN_API_URL || 'http://localhost:4000',
  };
}

// Cache registry
let registry: ServiceRegistry | null = null;

export function getServiceUrl(service: ServiceName): string {
  if (!registry) {
    registry = getServiceRegistry();
  }
  return registry[service];
}

export function getAllServiceUrls(): ServiceRegistry {
  if (!registry) {
    registry = getServiceRegistry();
  }
  return registry;
}
