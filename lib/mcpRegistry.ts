import type { Adapter } from "./adapters/adapter";

const adapters: Record<string, Adapter> = {};

export function registerAdapter(platformId: string, adapter: Adapter) {
  adapters[platformId] = adapter;
}

export function getAdapter(platformId: string): Adapter | undefined {
  return adapters[platformId];
}

export function listAdapters(): string[] {
  return Object.keys(adapters);
}

export default { registerAdapter, getAdapter, listAdapters };
