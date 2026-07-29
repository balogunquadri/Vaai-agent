import { Router } from "express";
import { Campaign } from "../models/Campaign";
import { launchCampaign } from "../services/campaignLauncher";
import { CampaignLaunch } from "../models/CampaignLaunch";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { userId, name, active, sequenceSteps } = req.body;
    if (!userId || !name || !Array.isArray(sequenceSteps)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const campaign = await Campaign.create({ userId, name, active: !!active, sequenceSteps });
    return res.status(201).json(campaign);
  } catch (err) {
    console.error("Create campaign error", err);
    return res.status(500).json({ error: "Unable to create campaign" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.params.userId });
    campaigns.sort((a: any, b: any) => (new Date(b.updatedAt || b.updated_at || b.createdAt).getTime() - new Date(a.updatedAt || a.updated_at || a.createdAt).getTime()));
    return res.json(campaigns);
  } catch (err) {
    console.error("Fetch user campaigns error", err);
    return res.status(500).json({ error: "Unable to fetch campaigns" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    return res.json(campaign);
  } catch (err) {
    console.error("Fetch campaign error", err);
    return res.status(500).json({ error: "Unable to fetch campaign" });
  }
});

router.get("/:id/launches", async (req, res) => {
  try {
    const launches = await CampaignLaunch.find({ campaignId: req.params.id });
    launches.sort((a: any, b: any) => (new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()));
    return res.json(launches);
  } catch (err) {
    console.error("Fetch campaign launches error", err);
    return res.status(500).json({ error: "Unable to fetch launches" });
  }
});

router.post("/:id/launch", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const launch = await launchCampaign(req.params.id, userId);
    return res.status(200).json(launch);
  } catch (err: any) {
    console.error("Launch campaign error", err);
    return res.status(500).json({ error: err.message || "Unable to launch campaign" });
  }
});

export default router;
