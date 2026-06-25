import { GoogleGenAI } from "@google/genai";
import { CompetitorData, SpyOptions } from "../../types/spy";

/**
 * Sends comparative metadata and telemetry to Gemini to compile a competitive report.
 */
export async function runIntelligenceEngine(
  companyA: CompetitorData,
  companyB: CompetitorData,
  options: SpyOptions
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "### ⚠️ Configuration Error\nGEMINI_API_KEY environment variable is not configured. Please add it to your `.env.local` to enable AI competitive analysis reports.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert competitive intelligence analyst and growth marketing strategist.
You are performing a deep-dive competitive analysis between two domains:
- Company A: ${companyA.url} (${companyA.metadata.title || "Primary Domain"})
- Company B: ${companyB.url} (${companyB.metadata.title || "Target Competitor"})

Here is the raw telemetry data compiled for both companies:

[COMPANY A DATA]
${JSON.stringify(companyA, null, 2)}

[COMPANY B DATA]
${JSON.stringify(companyB, null, 2)}

Active Analyses Selected:
- SEO Audit: ${options.seoAudit ? "ENABLED" : "DISABLED"}
- Social Presence: ${options.socialPresence ? "ENABLED" : "DISABLED"}
- AI Footprint / Web Traffic: ${options.aiFootprint ? "ENABLED" : "DISABLED"}

Please generate a highly professional, strategic SWOT Analysis and Comparative Report. Follow this exact Markdown structure:

### 📊 Executive Summary
A high-level summary of the digital competitive landscape. Who has the stronger digital footprint, what are their main differentiators, and what is the key takeaway?

### ⚔️ SWOT Analysis
Provide a structured comparative SWOT analysis for both domains. Highlight:
- **Strengths**: Growth engines, high ranks, dominant social presence.
- **Weaknesses**: Gaps, lower metrics, missing handles, poor bounce rates.
- **Opportunities**: Unclaimed niches, AI traffic listings, competitor neglect.
- **Threats**: Rapid backlink acquisition, brand capture, SEO domain loss.

### 📈 Core Comparison Insights
*Only include details for the enabled analyses listed below:*
${
  options.seoAudit
    ? `*   **SEO Audit Insights**: Compare Visibility Scores, Organic Keywords, and Backlinks. Who commands organic search? Detail specific actions (like keyword gap analysis or link insertion) to take.`
    : ""
}
${
  options.socialPresence
    ? `*   **Social Presence Insights**: Analyze handles, social share metrics, and verified link availability. If socialTelemetry details are present, perform a deep-dive analysis on the competitor's social media account covering:
        - Type of content (e.g., Reels, carousels, threads).
        - Virality scores and what factors drive their reach.
        - Uniqueness: what makes their page and content stand out.
        - Areas of improvement: how to create 10x better content to beat them.`
    : ""
}
${
  options.aiFootprint
    ? `*   **AI Footprint & Traffic Referral**: Review traffic patterns, directory placements, bounce rates, and AI search referral volumes. Highlight opportunities to get listed on AI tool directories.`
    : ""
}

### 🚀 30-Day Growth & Replication Plan
Provide a concrete, step-by-step actionable plan (Days 1-10, 11-20, 21-30) explaining how Company A can close the gap, replicate Company B's success channels, and acquire organic market share. Keep it practical and hyper-focused.
`;

    const models = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let lastError = null;
    for (const modelName of models) {
      try {
        console.log(`[IntelligenceEngine] Attempting SWOT generation using model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        if (response.text) {
          console.log(`[IntelligenceEngine] Successfully generated report using model: ${modelName}`);
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[IntelligenceEngine] Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    throw new Error(lastError?.message || JSON.stringify(lastError));
  } catch (error: any) {
    console.error("Gemini Intelligence Engine generation failed across all fallback models:", error);
    return `### ❌ AI Generation Error\nFailed to compile competitive report via Gemini API: ${error.message || error}`;
  }
}
