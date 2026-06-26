import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { deriveUserIdFromRequest } from "../../../lib/authHelpers";
import { SpyRequestPayload } from "../../../types/spy";

// Helper to parse state safely and auto-repair character-spread corruption
function parseState(state: any): any {
  if (!state) return {};
  let stateObj = state;
  if (typeof stateObj === "string") {
    try {
      stateObj = JSON.parse(stateObj);
    } catch (e) {
      console.error("Failed to parse state string:", e);
      return {};
    }
  }
  while (stateObj && typeof stateObj === "object" && "0" in stateObj) {
    const keys = Object.keys(stateObj).filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
    let str = "";
    for (const k of keys) {
      str += stateObj[k];
    }
    try {
      stateObj = JSON.parse(str);
    } catch (e) {
      console.error("Failed to parse reconstructed state:", e);
      break;
    }
  }
  return stateObj || {};
}

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

    console.log(`[API Spy] Triggered audit request for ${urlA} vs ${urlB}`);

    const userId = deriveUserIdFromRequest(request) || "anonymous";

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 2. Sort targets and generate cache key
    const sortedTargets = [urlA.toLowerCase().trim(), urlB.toLowerCase().trim()].sort();
    const cacheKey = `${sortedTargets[0]}_vs_${sortedTargets[1]}`;

    // 3. Query DB cache first
    const { data: cachedRows, error: cacheFetchErr } = await admin.database
      .from("integrations")
      .select()
      .eq("platform", "spy_cache")
      .eq("connected", true);

    if (!cacheFetchErr && cachedRows && cachedRows.length > 0) {
      // Look for a valid (non-expired) cache entry
      const activeCache = cachedRows.find((row: any) => {
        const state = parseState(row.state);
        return state.key === cacheKey && new Date(state.expiresAt).getTime() > Date.now();
      });

      if (activeCache) {
        console.log(`[API Spy] Cache hit for key: ${cacheKey}`);
        const parsedState = parseState(activeCache.state);
        return NextResponse.json({
          success: true,
          fromCache: true,
          data: parsedState.payload,
        });
      }
    }

    // 4. Cache missed: create an asynchronous background job
    const initialJobState = {
      status: "pending",
      urlA,
      urlB,
      options,
      userId,
      createdAt: new Date().toISOString()
    };

    const { data: jobRow, error: insertErr } = await admin.database
      .from("integrations")
      .insert([
        {
          user_id: userId,
          platform: "spy_job",
          connected: false,
          state: initialJobState,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertErr || !jobRow) {
      console.error("[API Spy] Failed to insert job status in db:", insertErr);
      return NextResponse.json(
        { success: false, error: "Failed to create processing job in database." },
        { status: 500 }
      );
    }

    const jobId = jobRow.id;

    // Save the jobId back inside the state object
    await admin.database
      .from("integrations")
      .update({
        state: { ...initialJobState, jobId },
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId);

    // 5. Fire background worker trigger asynchronously (fire-and-forget)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    fetch(`${baseUrl}/api/spy/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch((err) => {
      console.error("[API Spy] Failed to trigger process background worker:", err);
    });

    console.log(`[API Spy] Async job ${jobId} initiated successfully.`);

    return NextResponse.json(
      {
        success: true,
        fromCache: false,
        jobId,
      },
      { status: 202 } // 202 Accepted
    );

  } catch (error: any) {
    console.error("Critical error in /api/spy route handler:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during analysis." },
      { status: 500 }
    );
  }
}
