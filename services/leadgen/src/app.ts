import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connectDatabase } from "./db";
import campaignsRouter from "./routes/campaigns";
import leadsRouter from "./routes/leads";
import trackingRouter from "./routes/tracking";
import webhooksRouter from "./routes/webhooks";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/campaigns", campaignsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/email", trackingRouter);
app.use("/api/webhooks", webhooksRouter);

app.get("/healthz", (_, res) => res.status(200).json({ ok: true }));

export async function createApp() {
  await connectDatabase();
  return app;
}

export default app;
