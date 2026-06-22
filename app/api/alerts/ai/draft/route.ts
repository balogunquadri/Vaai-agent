import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { GoogleGenAI } from "@google/genai";

const composeResponseSchema = {
  type: "OBJECT",
  properties: {
    subject: { type: "STRING" },
    message: { type: "STRING" }
  },
  required: ["message"]
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, channel, recipientName, tone } = body || {};
    if (!alertId) return NextResponse.json({ error: "Missing alertId" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: alert, error: aErr } = await admin.database.from('alerts').select('*').eq('id', alertId).maybeSingle();
    if (aErr) {
      console.error('Failed to load alert', aErr);
      return NextResponse.json({ error: aErr.message || 'DB error' }, { status: 500 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const selectedTone = tone || 'professional';
    const replyChannel = channel || 'gmail';
    const recipient = recipientName || 'User';

    const context = `${alert?.title || ''}\n\n${alert?.description || ''}`;

    if (!apiKey) {
      // fallback draft
      return NextResponse.json({
        success: true,
        subject: replyChannel === 'gmail' ? `Re: ${alert?.title || 'Alert'}` : undefined,
        message: replyChannel === 'gmail'
          ? `Hi ${recipient},\n\nI noticed the following alert: "${alert?.title}". ${String(alert?.description || '').slice(0,200)}\n\nI'm investigating and will follow up shortly.\n\nThanks.`
          : `Hi ${recipient}, I saw the alert "${alert?.title}" — I'm investigating and will update you shortly.`
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert assistant that drafts short responses for users to send in reply to alerts.\nRecipient: ${recipient}\nChannel: ${replyChannel}\nTone: ${selectedTone}\nContext:\n${context}\n\nInstructions:\n- If channel is gmail produce a subject and a full email body.\n- If channel is a chat platform produce a short chat message only.\n- Keep it ${selectedTone}.\n\nRespond in JSON matching the schema: { \"subject\": string (optional), \"message\": string }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: composeResponseSchema as any
        }
      });

      const rawText = typeof (response as any).text === 'function' ? await (response as any).text() : response.text;
      const parsed = JSON.parse(String(rawText || '{}').trim());

      return NextResponse.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error('Gemini draft failed, using fallback draft:', err);
      return NextResponse.json({
        success: true,
        subject: replyChannel === 'gmail' ? `Re: ${alert?.title || 'Alert'}` : undefined,
        message: replyChannel === 'gmail'
          ? `Hi ${recipient},\n\nI noticed the alert "${alert?.title}" and I'm investigating now. I'll update once I have more details.\n\nBest regards.`
          : `Thanks — I'm looking into the alert "${alert?.title}" and will update shortly.`
      });
    }

  } catch (error: any) {
    console.error('AI draft endpoint error', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
