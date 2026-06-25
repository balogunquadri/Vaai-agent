import { NextResponse } from "next/server";
import { SpyService } from "../../../lib/services/spyService";
import { runIntelligenceEngine } from "../../../lib/services/intelligenceEngine";
import { SpyRequestPayload } from "../../../types/spy";

export async function POST(request: Request) {
  try {
    const payload: SpyRequestPayload = await request.json();
    const { urlA, urlB, options } = payload;

    // 1. Validation
    if (!urlA || !urlB) {
      return NextResponse.json(
        { success: false, error: "Both URL A and URL B are required inputs." },
        { status: 400 }
      );
    }

    if (!options || typeof options !== "object") {
      return NextResponse.json(
        { success: false, error: "Analysis options must be provided." },
        { status: 400 }
      );
    }

    console.log(`[API Spy] Triggered audit for ${urlA} vs ${urlB}`);

    // 2. Instantiate Spy Services
    const serviceA = new SpyService(urlA);
    const serviceB = new SpyService(urlB);

    // 3. Fetch data in parallel
    const [companyA, companyB] = await Promise.all([
      serviceA.fetchIntelligence(options),
      serviceB.fetchIntelligence(options),
    ]);

    // 4. Generate the comparative AI report using Gemini
    let aiReport = "";
    try {
      aiReport = await runIntelligenceEngine(companyA, companyB, options);
    } catch (engineErr: any) {
      console.error("Gemini analysis compilation failed:", engineErr);
      aiReport = `### ⚠️ AI Engine Error\nWe gathered the data successfully but Gemini was unable to generate the report: ${engineErr.message || engineErr}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        companyA,
        companyB,
        aiReport,
      },
    });
  } catch (error: any) {
    console.error("Critical error in /api/spy route handler:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during analysis." },
      { status: 500 }
    );
  }
}
