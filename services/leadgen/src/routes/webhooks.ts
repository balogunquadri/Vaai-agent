import { Router } from "express";
import { Lead } from "../models/Lead";
import { emitLeadUpdate } from "../services/realtime";

const router = Router();

router.post("/email/inbound", async (req, res) => {
  try {
    const payload = req.body;
    const from =
      payload.from?.email || payload.from || payload.sender?.email || payload.sender;
    const subject = payload.subject || payload.message?.subject || "";
    const text = payload.text || payload.body || payload.message?.text || "";

    if (!from) {
      return res.status(400).json({ error: "Missing source email address" });
    }

    const lead = await Lead.findOne({
      email: { $regex: new RegExp(`^${String(from).replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$", "i") },
      status: { $in: ["sent", "opened"] },
    });

    if (!lead) {
      return res.status(200).json({ ok: true, message: "No matching lead" });
    }

    lead.status = "replied";
    lead.repliedAt = new Date();
    lead.metadata = {
      ...lead.metadata,
      inboundSubject: subject,
      inboundText: text,
      inboundPayload: payload,
    };

    await lead.save();
    emitLeadUpdate(lead.userId, lead);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Inbound webhook error", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
