import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import { Lead } from "../models/Lead";
import { emitLeadUpdate } from "../services/realtime";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const rows: Record<string, string>[] = [];
    const parser = parse(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      rows.push(record as Record<string, string>);
    }

    const leads = rows.map((row) => ({
      userId: req.body.userId,
      campaignId: req.body.campaignId,
      email: row.email,
      firstName: row.firstName || row.first_name || "",
      lastName: row.lastName || row.last_name || "",
      company: row.company || "",
      customVariables: row,
      status: "pending",
    }));

    const inserted = await Lead.insertMany(leads, { ordered: false });
    inserted.forEach((lead) => emitLeadUpdate(lead.userId, lead));

    return res.status(201).json({ insertedCount: inserted.length, leads: inserted });
  } catch (err: any) {
    console.error("Lead import error", err);
    return res.status(500).json({ error: err.message || "Import failed" });
  }
});

router.get("/campaign/:campaignId", async (req, res) => {
  try {
    const leads = await Lead.find({ campaignId: req.params.campaignId });
    // ensure descending createdAt ordering
    leads.sort((a: any, b: any) => (new Date(b.createdAt || b.createdAt).getTime() - new Date(a.createdAt || a.createdAt).getTime()));
    return res.json(leads);
  } catch (err) {
    console.error("Fetch leads error", err);
    return res.status(500).json({ error: "Unable to fetch leads" });
  }
});

export default router;
