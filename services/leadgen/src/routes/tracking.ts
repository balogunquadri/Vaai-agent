import { Router } from "express";
import { Lead } from "../models/Lead";

const router = Router();

const PIXEL_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA" +
    "AAC0lEQVR42mP8/x8AAwMBAJWDI00AAAAASUVORK5CYII=",
  "base64"
);

router.get("/opened/:leadId.png", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (lead && lead.status !== "opened" && lead.status !== "replied") {
      lead.status = "opened";
      lead.openedAt = new Date();
      await lead.save();
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(PIXEL_BUFFER);
  } catch (err) {
    console.error("Tracking pixel error", err);
    res.status(500).end();
  }
});

export default router;
