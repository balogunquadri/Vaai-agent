import { GoogleGenAI } from "@google/genai";
import { CompetitorData, SpyOptions } from "../../types/spy";

// Schema definition for Structured competitive insights report
const SpyReportSchema = {
  type: "OBJECT",
  properties: {
    executiveSummary: { 
      type: "STRING", 
      description: "A high-level summary of the digital competitive landscape, main differentiators, and key takeaways."
    },
    strengths: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "List of competitor strengths (3-5 points)"
    },
    weaknesses: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "List of competitor weaknesses/gaps (3-5 points)"
    },
    opportunities: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "List of growth opportunities and replication paths (3-5 points)"
    },
    threats: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "List of competitor threats to monitor (3-5 points)"
    },
    seoInsights: { 
      type: "STRING", 
      description: "Brief analysis comparing SEO scores and keywords. Only fill if SEO option is enabled."
    },
    socialInsights: { 
      type: "STRING", 
      description: "Brief analysis comparing social channels and virality. Only fill if social presence option is enabled."
    },
    aiFootprintInsights: { 
      type: "STRING", 
      description: "Brief analysis comparing web traffic and AI Engine mentions. Only fill if AI footprint option is enabled."
    },
    planDays1to10: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "Action items for days 1 to 10 of the replication plan (3-4 concise points)"
    },
    planDays11to20: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "Action items for days 11 to 20 of the replication plan (3-4 concise points)"
    },
    planDays21to30: { 
      type: "ARRAY", 
      items: { type: "STRING" },
      description: "Action items for days 21 to 30 of the replication plan (3-4 concise points)"
    }
  },
  required: [
    "executiveSummary",
    "strengths",
    "weaknesses",
    "opportunities",
    "threats",
    "planDays1to10",
    "planDays11to20",
    "planDays21to30"
  ]
};

// Generates dynamic structured mock fallback if API key is absent or generation fails
function generateMockReport(companyA: CompetitorData, companyB: CompetitorData, options: SpyOptions) {
  return JSON.stringify({
    executiveSummary: `This is a simulated competitor SWOT analysis comparing ${companyA.url} and ${companyB.url}. Based on metadata benchmarks, ${companyA.url} has a strong baseline visibility but remains behind ${companyB.url} in search-engine discovery and multi-channel content engagement.`,
    strengths: [
      "Well-defined core brand value and tagline clarity.",
      "Optimized load times and page metadata structures.",
      "Clear positioning of core features above-the-fold."
    ],
    weaknesses: [
      "Lower backlinks authority compared to target domain.",
      "Absent or inactive social platform profiles on TikTok/LinkedIn.",
      "Higher bounce rate on auxiliary resource pages."
    ],
    opportunities: [
      "Capture keyword search volume via target comparison landings.",
      "Deploy vertical video formats to drive TikTok/Reels virality.",
      "Submit site map profiles to top 15 AI directory indexing endpoints."
    ],
    threats: [
      "Rapid organic backlink acquisition pace by target competitor.",
      "Aggressive SEO capturing on high-value organic search terms.",
      "Audience capture via active competitor community building."
    ],
    seoInsights: options.seoAudit ? "SEO visibility benchmarks show Company B maintains a solid keyword lead. Focus on metadata adjustments and target landing pages." : "",
    socialInsights: options.socialPresence ? "Social presence telemetry indicates active short-form videos lead competitor engagement. Replicating their content formatting is highly recommended." : "",
    aiFootprintInsights: options.aiFootprint ? "AI footprint references suggest a gap in directory inclusion. Recommend submitting site links to active search indexes." : "",
    planDays1to10: [
      "Perform metadata audits on all current product landings.",
      "Establish monitoring keywords targeting competitor organic terms.",
      "Submit main index links to active search indexing registries."
    ],
    planDays11to20: [
      "Develop and release 3 landing pages focusing on high-conversion terms.",
      "Create placeholder short-form profile handles across missing social platforms.",
      "Initiate backlinks request outreach to top directory hubs."
    ],
    planDays21to30: [
      "Analyze first weekly traffic referral telemetry for conversion spikes.",
      "Refine vertical content drafts based on user engagement metrics.",
      "Configure weekly competitor tracking schedules on the Briefing Hub."
    ]
  });
}

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
    return generateMockReport(companyA, companyB, options);
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

Please generate a highly professional, strategic SWOT Analysis and Comparative Report.
Structure your findings according to responseSchema schema. Keep insights concise, focused, and immediately actionable.
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
          config: {
            responseMimeType: "application/json",
            responseSchema: SpyReportSchema as any,
          }
        });

        const rawText = typeof response.text === 'function' ? (response as any).text() : response.text;
        if (rawText) {
          console.log(`[IntelligenceEngine] Successfully generated report using model: ${modelName}`);
          return rawText.trim();
        }
      } catch (err: any) {
        console.warn(`[IntelligenceEngine] Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    // If API calls fail, fallback gracefully to mock structured output instead of crashing
    console.error("Gemini failed across all models, using mock report.");
    return generateMockReport(companyA, companyB, options);
  } catch (error: any) {
    console.error("Gemini Intelligence Engine generation failed, fallback to mock report:", error);
    return generateMockReport(companyA, companyB, options);
  }
}
