import { task } from "@trigger.dev/sdk/v3";

export const compileSpyReport = task({
  id: "compile-spy-report",
  run: async (payload: { jobId: string }) => {
    const { jobId } = payload;
    console.log(`[Trigger.dev Worker] Triggered background spy job ${jobId}`);

    // Delegate execution to the optimized Next.js process route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/spy/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    if (!res.ok) {
      throw new Error(`Trigger.dev Spy Worker failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  }
});
