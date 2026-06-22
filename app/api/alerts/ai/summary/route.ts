import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId } = body || {};
    if (!alertId) return NextResponse.json({ error: "Missing alertId" }, { status: 400 });

    const admin = createAdminClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, apiKey: process.env.INSFORGE_API_KEY! });
    const { data: alert, error: aErr } = await admin.database.from('alerts').select('*').eq('id', alertId).maybeSingle();
    if (aErr) {
      console.error('Failed to load alert', aErr);
      return NextResponse.json({ error: aErr.message || 'DB error' }, { status: 500 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const contextText = `${alert?.title || ''}\n\n${alert?.description || ''}`;

    if (!apiKey) {
      // simple fallback summary
      const fallback = `Summary: ${alert?.title || 'Alert'} — ${String(alert?.description || '').slice(0, 240)}${(alert?.description||'').length>240? '...':''}`;
      return NextResponse.json({ success: true, summary: fallback });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a concise incident summarizer. Produce a short 2-3 sentence summary of the alert and then a one-line recommended action.\n\nAlert data:\nTitle: ${alert?.title}\nPlatform: ${alert?.platform}\nPriority: ${alert?.priority}\nDescription:\n${alert?.description}\n\nOutput format:\nSummary:\nRecommendedAction:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: { responseMimeType: "text/plain" }
      });

      const rawText = typeof (response as any).text === 'function' ? await (response as any).text() : response.text;
      const cleaned = String(rawText || '').trim();

      return NextResponse.json({ success: true, summary: cleaned });
    } catch (err: any) {
      console.error('Gemini summary failed, falling back:', err);
      const fallback = `Summary: ${alert?.title || 'Alert'} — ${String(alert?.description || '').slice(0, 240)}${(alert?.description||'').length>240? '...':''}`;
      return NextResponse.json({ success: true, summary: fallback });
    }

  } catch (error: any) {
    console.error('AI summary endpoint error', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
