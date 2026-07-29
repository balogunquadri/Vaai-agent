import http from "http";
import app, { createApp } from "./app";
import { attachRealtime } from "./services/realtime";

async function start() {
  const expressApp = await createApp();
  const server = http.createServer(expressApp);

  attachRealtime(server);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  server.listen(port, () => {
    console.log(`Leadgen service listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error("Leadgen service failed to start", err);
  process.exit(1);
});
