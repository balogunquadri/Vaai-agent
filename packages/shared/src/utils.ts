export function getServiceConfig() {
  return {
    port: Number(process.env.PORT) || 3001,
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    insforgeUrl: process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL || '',
    insforgeApiKey: process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '',
    logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeSnakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeSnakeToCamel);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      acc[camelKey] = normalizeSnakeToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

export function normalizeCamelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeCamelToSnake);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      acc[snakeKey] = normalizeCamelToSnake(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}
