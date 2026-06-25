import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { SpyService } from "../../../../lib/services/spyService";
import { runIntelligenceEngine } from "../../../../lib/services/intelligenceEngine";

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId in process trigger." }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 1. Fetch current job state
    const { data: jobRow, error: fetchErr } = await admin.database
      .from("integrations")
      .select()
      .eq("id", jobId)
      .single();

    if (fetchErr || !jobRow) {
      console.error(`[Spy Process Worker] Job ${jobId} not found:`, fetchErr);
      return NextResponse.json({ success: false, error: "Job status row not found." }, { status: 404 });
    }

    const jobState = jobRow.state || {};
    
    // If the job is already processing or completed, skip duplicate executions
    if (jobState.status === "running" || jobState.status === "completed") {
      return NextResponse.json({ success: true, message: "Job is already running or completed." });
    }

    const { urlA, urlB, options, userId } = jobState;

    if (!urlA || !urlB || !options) {
      return NextResponse.json({ success: false, error: "Invalid job parameters." }, { status: 400 });
    }

    console.log(`[Spy Process Worker] Starting job ${jobId} for ${urlA} vs ${urlB}`);

    // 2. Mark job as running
    await admin.database
      .from("integrations")
      .update({
        state: { ...jobState, status: "running", startedAt: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    // 3. Double-check cache before starting expensive scraping
    const sortedTargets = [urlA.toLowerCase().trim(), urlB.toLowerCase().trim()].sort();
    const cacheKey = `${sortedTargets[0]}_vs_${sortedTargets[1]}`;

    const { data: cachedRows } = await admin.database
      .from("integrations")
      .select()
      .eq("platform", "spy_cache")
      .eq("connected", true);

    const activeCache = cachedRows?.find((row: any) => {
      const state = row.state || {};
      return state.key === cacheKey && new Date(state.expiresAt).getTime() > Date.now();
    });

    if (activeCache) {
      console.log(`[Spy Process Worker] Cache hit during process startup for ${cacheKey}`);
      const cachedPayload = activeCache.state.payload;

      // Update job to completed with cached payload
      await admin.database
        .from("integrations")
        .update({
          state: {
            ...jobState,
            status: "completed",
            completedAt: new Date().toISOString(),
            result: cachedPayload
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", jobId);

      return NextResponse.json({ success: true, fromCache: true });
    }

    // 4. Run scraping services in parallel
    const serviceA = new SpyService(urlA);
    const serviceB = new SpyService(urlB);

    const [companyA, companyB] = await Promise.all([
      serviceA.fetchIntelligence(options),
      serviceB.fetchIntelligence(options),
    ]);

    // 5. Generate AI Comparative SWOT report
    const aiReport = await runIntelligenceEngine(companyA, companyB, options);

    const resultPayload = {
      companyA,
      companyB,
      aiReport,
    };

    // 6. Save results to Cache
    const cacheExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Hours TTL
    const cacheState = {
      key: cacheKey,
      expiresAt: cacheExpiresAt,
      payload: resultPayload
    };

    await admin.database
      .from("integrations")
      .insert([
        {
          user_id: "system",
          platform: "spy_cache",
          connected: true,
          state: cacheState,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    // 7. Save results and complete Job status
    await admin.database
      .from("integrations")
      .update({
        state: {
          ...jobState,
          status: "completed",
          completedAt: new Date().toISOString(),
          result: resultPayload
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    console.log(`[Spy Process Worker] Successfully completed job ${jobId}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[Spy Process Worker] Critical execution failure:", err);
    
    // Attempt to mark the job as failed in db
    try {
      const { jobId } = await request.clone().json();
      if (jobId) {
        const admin = createAdminClient({
          baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
          apiKey: process.env.INSFORGE_API_KEY!,
        });
        
        const { data: jobRow } = await admin.database
          .from("integrations")
          .select()
          .eq("id", jobId)
          .single();

        if (jobRow) {
          await admin.database
            .from("integrations")
            .update({
              state: {
                ...(jobRow.state || {}),
                status: "failed",
                completedAt: new Date().toISOString(),
                error: err.message || String(err)
              },
              updated_at: new Date().toISOString()
            })
            .eq("id", jobId);
        }
      }
    } catch (saveErr) {
      console.error("[Spy Process Worker] Failed to update error state in database:", saveErr);
    }

    return NextResponse.json({ success: false, error: err.message || "Execution failed" }, { status: 500 });
  }
}
