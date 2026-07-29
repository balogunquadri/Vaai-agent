import { ServiceName, getServiceUrl } from './service-registry';

export interface GatewayRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
}

export interface GatewayResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
}

/**
 * Gateway client that proxies requests to microservices
 * Handles authentication forwarding, error handling, and retry logic
 */
export async function proxyToService(
  service: ServiceName,
  req: GatewayRequest,
  authToken?: string
): Promise<GatewayResponse> {
  const serviceUrl = getServiceUrl(service);
  if (!serviceUrl) {
    return {
      status: 503,
      data: { error: `Service ${service} not configured` },
    };
  }

  const url = new URL(`${serviceUrl}${req.path}`);

  // Append query parameters
  if (req.query) {
    Object.entries(req.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': process.env.X_FORWARDED_FOR || 'gateway',
    ...(req.headers || {}),
  };

  // Forward authentication token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url.toString(), {
      method: req.method,
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const data =
      contentType && contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error: any) {
    console.error(`[Gateway] Error proxying to ${service}:`, error.message);
    return {
      status: 502,
      data: {
        error: 'Service unavailable',
        service,
        message: error.message,
      },
    };
  }
}

/**
 * Route request to appropriate service based on path
 */
export function routeServicePath(path: string): ServiceName | null {
  if (path.startsWith('/auth')) return ServiceName.AUTH;
  if (path.startsWith('/alerts')) return ServiceName.ALERTS;
  if (path.startsWith('/briefing')) return ServiceName.BRIEFING;
  if (path.startsWith('/integrations')) return ServiceName.INTEGRATIONS;
  if (path.startsWith('/stripe')) return ServiceName.STRIPE;
  if (path.startsWith('/whatsapp') || path.startsWith('/telegram') || path.startsWith('/email')) {
    return ServiceName.MESSAGING;
  }
  if (path.startsWith('/ai-agent')) return ServiceName.AI_AGENT;
  if (path.startsWith('/triggers') || path.startsWith('/jobs')) return ServiceName.TRIGGERS;
  if (path.startsWith('/campaigns') || path.startsWith('/leads')) return ServiceName.LEADGEN;
  return null;
}
