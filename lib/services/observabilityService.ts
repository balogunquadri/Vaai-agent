import { createAdminClient } from "@insforge/sdk";

export interface TelemetryLog {
  userId: string;
  model: string;
  prompt: string;
  response: string;
  latencyMs: number;
  tokensUsed?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  toolCalls?: Array<{
    name: string;
    args: any;
    success: boolean;
    durationMs: number;
    error?: string;
  }>;
}

/**
 * Saves LLM execution metrics, parameters, and tool telemetry logs to the InsForge database.
 */
export async function logLlmTelemetry(log: TelemetryLog): Promise<void> {
  try {
    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const telemetryState = {
      model: log.model,
      prompt: log.prompt,
      response: log.response,
      latencyMs: log.latencyMs,
      tokensUsed: log.tokensUsed || { totalTokens: 0 },
      toolCallsCount: log.toolCalls?.length || 0,
      toolCalls: log.toolCalls || [],
      timestamp: new Date().toISOString(),
    };

    console.log(`[Observability] Logging query stats for user ${log.userId}. Latency: ${log.latencyMs}ms. Tokens: ${telemetryState.tokensUsed.totalTokens}`);

    await admin.database.from("integrations").insert([
      {
        user_id: log.userId,
        platform: "llm_observability",
        connected: true,
        state: telemetryState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]);

  } catch (err) {
    console.error("[Observability] Failed to save telemetry log:", err);
  }
}
