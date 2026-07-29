/**
 * Frontend API client for calling microservices via gateway
 * Provides hooks and utilities for common API operations
 */

import { useState, useCallback } from 'react';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  headers?: Record<string, string>;
}

/**
 * Hook for making API calls to microservices
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const request = useCallback(
    async (
      endpoint: string,
      options: UseApiOptions & {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        body?: any;
        query?: Record<string, string>;
      } = {}
    ) => {
      const {
        method = 'GET',
        body,
        query,
        headers = {},
        onSuccess,
        onError,
      } = options;

      setLoading(true);
      setError(null);

      try {
        const url = new URL(
          endpoint.startsWith('http')
            ? endpoint
            : `${window.location.origin}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
        );

        if (query) {
          Object.entries(query).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
        }

        // Get auth token from localStorage (assuming JWT is stored there)
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('auth_token')
          : null;

        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          const apiError: ApiError = {
            message: data.error || 'API error',
            status: response.status,
            code: data.code,
          };
          setError(apiError);
          onError?.(apiError);
          throw apiError;
        }

        onSuccess?.(data);
        return data;
      } catch (err: any) {
        const apiError: ApiError =
          err instanceof Error
            ? { message: err.message }
            : {
                message: 'Unknown error',
              };
        setError(apiError);
        onError?.(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { request, loading, error };
}

/**
 * Simple fetch wrapper for non-hook usage
 */
export async function apiCall(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', body, query, headers = {} } = options;

  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${typeof window !== 'undefined' ? window.location.origin : ''}/api${
          endpoint.startsWith('/') ? endpoint : `/${endpoint}`
        }`
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API error');
  }
  return data;
}
