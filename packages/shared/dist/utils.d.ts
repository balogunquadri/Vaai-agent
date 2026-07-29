export declare function getServiceConfig(): {
    port: number;
    env: "development" | "production" | "test";
    insforgeUrl: string;
    insforgeApiKey: string;
    logLevel: "debug" | "info" | "warn" | "error";
};
export declare function sleep(ms: number): Promise<void>;
export declare function normalizeSnakeToCamel(obj: any): any;
export declare function normalizeCamelToSnake(obj: any): any;
//# sourceMappingURL=utils.d.ts.map