"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceConfig = getServiceConfig;
exports.sleep = sleep;
exports.normalizeSnakeToCamel = normalizeSnakeToCamel;
exports.normalizeCamelToSnake = normalizeCamelToSnake;
function getServiceConfig() {
    return {
        port: Number(process.env.PORT) || 3001,
        env: (process.env.NODE_ENV || 'development'),
        insforgeUrl: process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL || '',
        insforgeApiKey: process.env.INSFORGE_API_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '',
        logLevel: (process.env.LOG_LEVEL || 'info'),
    };
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function normalizeSnakeToCamel(obj) {
    if (Array.isArray(obj)) {
        return obj.map(normalizeSnakeToCamel);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            acc[camelKey] = normalizeSnakeToCamel(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}
function normalizeCamelToSnake(obj) {
    if (Array.isArray(obj)) {
        return obj.map(normalizeCamelToSnake);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            acc[snakeKey] = normalizeCamelToSnake(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}
