/**
 * Fallback catch-all for `/api/*` routes that don't match more specific patterns
 * Attempts to route to appropriate microservice via gateway
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyToService, routeServicePath } from '@/lib/gateway';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'PATCH');
}

async function handleProxyRequest(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
) {
  try {
    const { path: pathArray } = await params;
    const path = `/${pathArray.join('/')}`;

    // Try to route to service
    const service = routeServicePath(path);
    if (!service) {
      return NextResponse.json(
        { error: 'Endpoint not found', path },
        { status: 404 }
      );
    }

    // Get auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    // Parse body
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.json();
      } catch (e) {
        body = undefined;
      }
    }

    // Call gateway
    const response = await proxyToService(
      service,
      {
        method,
        path,
        body,
        query: Object.fromEntries(request.nextUrl.searchParams),
        headers: {
          'X-Forwarded-For': request.ip || '',
          'X-Forwarded-Proto': 'https',
          'User-Agent': request.headers.get('user-agent') || '',
        },
      },
      token
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('[API Catch-All] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
