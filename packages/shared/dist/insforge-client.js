"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInsforgeClient = createInsforgeClient;
const sdk_1 = require("@insforge/sdk");
function createInsforgeClient(url, apiKey) {
    if (!url || !apiKey) {
        throw new Error('InsForge URL and API key are required');
    }
    return (0, sdk_1.createClient)({
        baseUrl: url,
        anonKey: apiKey,
    });
}
