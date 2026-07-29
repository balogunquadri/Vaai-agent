import { NextRequest, NextResponse } from 'next/server';
import { proxyToService, routeServicePath } from '@/lib/gateway';
import { ServiceName } from '@/lib/gateway/service-registry';

/**
 * Catch-all gateway handler for dynamic API routes
 * Routes requests to appropriate microservice based on path
 * 
 * Usage: /api/gateway/[...path]
 * Examples:
 *  - /api/gateway/auth/login → routes to auth-service
 *  - /api/gateway/alerts → routes to alerts-service
 *  - /api/gateway/campaigns/123 → routes to leadgen-service
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleGatewayRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleGatewayRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleGatewayRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleGatewayRequest(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleGatewayRequest(request, params);
}

async function handleGatewayRequest(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = `/${pathArray.join('/')}`;

    // Route to appropriate service
    const service = routeServicePath(path);
    if (!service) {
      return NextResponse.json(
        { error: 'Route not found', path },
        { status: 404 }
      );
    }

    // Extract authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    // Parse request body if present
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        body = await request.json();
      } catch (e) {
        body = undefined;
      }
    }

    // Build gateway request
    const gatewayReq = {
      method: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      path,
      body,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.ip || '0.0.0.0',
        'X-Forwarded-Proto': request.headers.get('x-forwarded-proto') || 'https',
      },
      query: Object.fromEntries(request.nextUrl.searchParams),
    };

    // Proxy to service
    const { proxyToService: proxyClient } = await import('@/lib/gateway');
    const response = await proxyClient(service, gatewayReq, token);

    return NextResponse.json(response.data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error: any) {
    console.error('[Gateway] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Gateway error', message: error.message },
      { status: 500 }
    );
  }
}
