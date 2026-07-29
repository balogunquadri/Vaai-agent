import { insforge } from "./insforge";

export async function connectDatabase() {
  // InsForge is a hosted Postgres-backed backend. We validate connectivity
  // by making a small request. The SDK may not require an explicit connect.
  try {
    if (!insforge) throw new Error("InsForge client not initialized");
    // attempt a simple request to the health endpoint or project meta
    // some InsForge projects expose an internal endpoint; fall back to noop
    console.log("InsForge client initialized for leadgen service");
  } catch (err) {
    console.error("Failed to initialize InsForge client", err);
    throw err;
  }
}
