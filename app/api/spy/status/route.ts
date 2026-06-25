import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId in query parameter." }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const { data: jobRow, error: fetchErr } = await admin.database
      .from("integrations")
      .select()
      .eq("id", jobId)
      .single();

    if (fetchErr || !jobRow) {
      return NextResponse.json({ success: false, error: "Job status not found." }, { status: 404 });
    }

    const jobState = jobRow.state || {};
    const { status, createdAt } = jobState;

    // Self-healing fallback: If job remains pending for more than 5 seconds, re-trigger background processing
    if (status === "pending" && createdAt) {
      const elapsedMs = Date.now() - new Date(createdAt).getTime();
      if (elapsedMs > 5000) {
        console.warn(`[Spy Status Endpoint] Job ${jobId} pending for ${elapsedMs}ms (>5s). Re-triggering process...`);
        
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        fetch(`${baseUrl}/api/spy/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        }).catch((err) => {
          console.error("[Spy Status Endpoint] Failed to re-trigger process background worker:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: status || "unknown",
      data: jobState.result || null,
      error: jobState.error || null,
    });

  } catch (error: any) {
    console.error("Critical error in /api/spy/status route handler:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during status lookup." },
      { status: 500 }
    );
  }
}
