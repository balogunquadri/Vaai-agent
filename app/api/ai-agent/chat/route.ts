import { NextResponse } from "next/server";
import { sanitizeInput, redactPII, moderateOutput } from "../../../../lib/services/guardrails";
import { retrieveRagContext } from "../../../../lib/services/ragService";
import { logLlmTelemetry } from "../../../../lib/services/observabilityService";
import mcpRegistry from "../../../../lib/mcpRegistry";

const WRITE_TOOLS = new Set([
  "gmail_create_draft",
  "whatsapp_send_message",
  "slack_post_message",
  "outlook_send_message",
  "discord_post_message",
  "linkedin_post_update",
  "telegram_send_message"
]);

export async function POST(request: Request) {
  const startTime = Date.now();
  const toolCallsLog: any[] = [];
  
  try {
    const body = await request.json();
    const { userId, prompt, history = [], tone = "Warm & Engaging", attachments = [], confirmedToolCall } = body;

    if (!userId || !prompt) {
      return NextResponse.json({ error: "Missing required fields userId or prompt" }, { status: 400 });
    }

    // 1. Input Guardrail: Sanitization Check
    const validation = sanitizeInput(prompt);
    if (!validation.clean) {
      console.warn(`[API AI Chat] Input blocked: ${validation.reason}`);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              text: `⚠️ Input Blocked: ${validation.reason}`, 
              error: "Input Guardrails Violation" 
            })}\n\n`)
          );
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    // 2. Input Guardrail: PII Redaction
    const redactedPrompt = redactPII(prompt);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable not set." }, { status: 500 });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    // Format conversation history for Gemini
    const contents: any[] = [];
    history.forEach((msg: any) => {
      const role = msg.sender === "user" ? "user" : "model";
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    });

    // 3. Human-In-The-Loop Execution: Pre-inject confirmed tool responses
    if (confirmedToolCall && confirmedToolCall.name) {
      console.log(`[API AI Chat] Restoring confirmed tool execution:`, confirmedToolCall.name);
      
      const startToolTime = Date.now();
      let toolResult;
      let success = true;
      let errorStr = "";

      try {
        toolResult = await mcpRegistry.dispatchToolCall(userId, confirmedToolCall.name, confirmedToolCall.args);
      } catch (err: any) {
        success = false;
        errorStr = err.message || String(err);
        toolResult = { error: errorStr };
      }

      toolCallsLog.push({
        name: confirmedToolCall.name,
        args: confirmedToolCall.args,
        success,
        durationMs: Date.now() - startToolTime,
        error: errorStr || undefined
      });

      // Inject the tool interaction history so Gemini can synthesize the output
      contents.push({
        role: "model",
        parts: [{ functionCall: confirmedToolCall }]
      });
      contents.push({
        role: "tool",
        parts: [{
          functionResponse: {
            name: confirmedToolCall.name,
            response: { result: toolResult }
          }
        }]
      });
    } else {
      // Append current redacted prompt
      contents.push({
        role: "user",
        parts: [{ text: redactedPrompt }]
      });
    }

    // If attachments exist, inject manifest
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attText = attachments.map((a: any) => `- ${a.name} (${a.type || 'file'}, ${a.size || 'unknown'} bytes): ${a.url}`).join("\n");
      contents.push({ role: "user", parts: [{ text: `Attachments:\n${attText}` }] });
    }

    // 4. Retrieval Augmented Generation (RAG) Context injection
    const ragContext = await retrieveRagContext(userId, redactedPrompt);

    const systemInstruction = `
You are V-AI, a premium workspace AI Virtual Assistant.
You must respond with the following tone: ${tone}.
You help the user manage notifications, check emails, read chat history, post updates, and communicate across Gmail, WhatsApp, Slack, Outlook, Discord, LinkedIn, and Telegram.
You have access to 15 different tools to fetch or submit real and interactive simulation data across these channels.
When requested, call the appropriate tool. Always explain what you did and present the output in a clean, professional layout.
Format tables, bullet lists, bold text, links, and code blocks using standard Markdown.
Always maintain a helpful, premium tone. Suggest 2 or 3 brief quick reply recommendations that the client could say in follow-up. Place them at the end of your response, wrapped inside a custom tags blocks format like this:
[QUICK_REPLIES]
- Suggestion 1
- Suggestion 2
[/QUICK_REPLIES]
${ragContext ? `\nUse the following relevant context retrieved from the user's workspace history to formulate your answer:\n${ragContext}` : ""}
`;

    // Fetch tool definitions dynamically from local registry and remote servers
    const userTools = await mcpRegistry.listUserTools(userId);
    const tools = userTools && userTools.length > 0 ? [{ functionDeclarations: userTools }] : undefined;

    let hasFunctionCalls = true;
    let maxIterations = 5;
    let iteration = 0;
    let requiresConfirmation = false;
    let pendingToolCall: any = null;

    // Execution loop for Tool Calls
    while (hasFunctionCalls && iteration < maxIterations && !requiresConfirmation) {
      iteration++;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          ...(tools ? { tools: tools as any } : {}),
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        // Check if any function call is a destructive Write action requiring confirmation
        for (const call of functionCalls) {
          const isWrite = WRITE_TOOLS.has(call.name!);
          // Bypassed if this specific tool call was already confirmed and pre-injected in this run
          const isAlreadyConfirmed = confirmedToolCall && confirmedToolCall.name === call.name && JSON.stringify(confirmedToolCall.args) === JSON.stringify(call.args);

          if (isWrite && !isAlreadyConfirmed) {
            requiresConfirmation = true;
            pendingToolCall = { name: call.name!, args: call.args };
            break;
          }
        }

        if (requiresConfirmation) {
          break; // Exit loop, tool will not be executed
        }

        // Append the model's message (which contains functionCalls) to contents
        const modelContent = response.candidates?.[0]?.content || {
          role: "model",
          parts: functionCalls.map(call => ({ functionCall: call }))
        };
        contents.push(modelContent);

        // Execute safe function calls
        const toolParts = [];
        for (const call of functionCalls) {
          const startToolTime = Date.now();
          let toolResult;
          let success = true;
          let errorStr = "";

          try {
            toolResult = await mcpRegistry.dispatchToolCall(userId, call.name!, call.args);
          } catch (err: any) {
            success = false;
            errorStr = err.message || String(err);
            toolResult = { error: errorStr };
          }

          toolCallsLog.push({
            name: call.name!,
            args: call.args,
            success,
            durationMs: Date.now() - startToolTime,
            error: errorStr || undefined
          });

          toolParts.push({
            functionResponse: {
              name: call.name!,
              response: { result: toolResult }
            }
          });
        }

        // Append the tool's functionResponse to contents
        contents.push({
          role: "tool",
          parts: toolParts
        });
      } else {
        hasFunctionCalls = false;
      }
    }

    // 5. If human confirmation is required for a write tool, exit early with confirmation payload
    if (requiresConfirmation && pendingToolCall) {
      console.log(`[API AI Chat] HITL Gate triggered: requires confirmation for tool ${pendingToolCall.name}`);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              confirmationRequired: true, 
              toolCall: pendingToolCall 
            })}\n\n`)
          );
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    // 6. Otherwise, stream the final response text back to client
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction,
      }
    });

    // Stream SSE back to client and capture telemetry metrics
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        let promptTokens = 0;
        let candidatesTokens = 0;
        let totalTokens = 0;

        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            if (chunk.usageMetadata) {
              promptTokens = chunk.usageMetadata.promptTokenCount || 0;
              candidatesTokens = chunk.usageMetadata.candidatesTokenCount || 0;
              totalTokens = chunk.usageMetadata.totalTokenCount || 0;
            }
          }

          // 7. Output Moderation Guardrail check
          const moderation = moderateOutput(fullText);
          if (!moderation.safe) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                text: `\n\n${moderation.text}`, 
                error: "Output Moderation Violation" 
              })}\n\n`)
            );
          }

          // 8. Log Telemetry stats (Observability)
          const latencyMs = Date.now() - startTime;
          await logLlmTelemetry({
            userId,
            model: "gemini-3.1-flash-lite",
            prompt: redactedPrompt,
            response: moderation.safe ? fullText : moderation.text,
            latencyMs,
            tokensUsed: {
              promptTokens,
              candidatesTokens,
              totalTokens
            },
            toolCalls: toolCallsLog
          });

        } catch (err: any) {
          console.error("Streaming error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || "Streaming failed." })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    });

  } catch (error: any) {
    console.error("AI Agent chat API failed:", error);
    
    // Log failure telemetry if possible
    try {
      const latencyMs = Date.now() - startTime;
      const body = await request.clone().json();
      if (body && body.userId) {
        await logLlmTelemetry({
          userId: body.userId,
          model: "gemini-3.1-flash-lite",
          prompt: redactPII(body.prompt || ""),
          response: `Error: ${error.message || String(error)}`,
          latencyMs,
          toolCalls: toolCallsLog
        });
      }
    } catch (telemetryErr) {
      console.error("Observability failure during exception log:", telemetryErr);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
