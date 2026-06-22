import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const composeResponseSchema = {
  type: "OBJECT",
  properties: {
    subject: { 
      type: "STRING", 
      description: "Appropriate email subject line (required for email, leave empty for chat messages)" 
    },
    message: { 
      type: "STRING", 
      description: "The actual drafted message or email body" 
    }
  },
  required: ["message"]
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context, recipientName, replyChannel, tone } = body;

    if (!context) {
      return NextResponse.json({ error: "Missing log context" }, { status: 400 });
    }

    const channel = replyChannel || "gmail";
    const recipient = recipientName || "Client";
    const selectedTone = tone || "professional";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Return a clean fallback draft
      return NextResponse.json({
        success: true,
        subject: channel === "gmail" ? "Re: Discussion Follow-up" : undefined,
        message: channel === "gmail"
          ? `Dear ${recipient},\n\nThank you for reaching out. I have reviewed your feedback regarding "${context.slice(0, 100)}...". I am working on this action item and will send you an update shortly.\n\nBest regards,\nUser`
          : `Hi ${recipient}, thanks for your message. Regarding "${context.slice(0, 80)}...", I am checking on this now and will update you shortly.`
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `
You are an advanced communications AI helper. Draft a high-quality reply message based on the provided context:
Recipient Name: ${recipient}
Platform: ${channel}
Tone: ${selectedTone}
Discussion Context:
${context}

Instructions:
1. If the platform is gmail, generate both a relevant "subject" and the email "message" body.
2. If the platform is whatsapp, slack, or any chat application, generate only the "message" body (no email subject, salutations, or email signatures, keep it friendly and chat-appropriate).
3. Align the message style to be ${selectedTone} and directly helpful.

Produce your output strictly in JSON matching the requested schema.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: composeResponseSchema as any,
        }
      });

      const rawText = typeof response.text === 'function' ? (response as any).text() : response.text;
      const parsedResult = JSON.parse(rawText.trim());

      return NextResponse.json({
        success: true,
        ...parsedResult
      });

    } catch (apiError: any) {
      console.error("Gemini compose helper failed, using mock draft:", apiError);
      return NextResponse.json({
        success: true,
        subject: channel === "gmail" ? "Re: Discussion Follow-up" : undefined,
        message: channel === "gmail"
          ? `Dear ${recipient},\n\nThank you for reaching out. Regarding the item "${context.slice(0, 100)}...", I am working on the resolution and will keep you posted.\n\nBest regards,\nUser`
          : `Hi ${recipient}, checking on "${context.slice(0, 80)}..." now. I will update you as soon as possible.`
      });
    }

  } catch (error: any) {
    console.error("AI compose API failed:", error);
    return NextResponse.json(
      { error: "Internal server error during draft compilation", details: error.message },
      { status: 500 }
    );
  }
}
