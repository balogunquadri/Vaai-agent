import { Campaign } from "../models/Campaign";
import { Lead } from "../models/Lead";
import { CampaignLaunch } from "../models/CampaignLaunch";
import { sendEmail } from "./emailSender";
import { emitCampaignLaunchUpdate, emitLeadUpdate } from "./realtime";
import { renderEmailBody } from "./emailPersonalization";
import { trigger } from "../trigger";

export async function launchCampaign(campaignId: string, userId: string) {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campaign not found or access denied");
  }

  const launch = await CampaignLaunch.create({
    campaignId,
    userId,
    launchedAt: new Date(),
    status: "queued",
    stepIndex: 0,
    sentCount: 0,
    triggeredBy: "manual",
  });

  emitCampaignLaunchUpdate(userId, launch);

  const leads = await Lead.find({ campaignId, status: { $in: ["pending", "sent"] } });
  if (leads.length === 0) {
    await CampaignLaunch.findByIdAndUpdate(launch.id, {
      status: "completed",
      sentCount: 0,
    });
    return launch;
  }

  for (let stepIndex = 0; stepIndex < campaign.sequenceSteps.length; stepIndex++) {
    const step = campaign.sequenceSteps[stepIndex];
    const scheduledAt = new Date(Date.now() + step.delayMinutes * 60_000);
    const triggerId = `campaign-${campaign.id}-launch-${launch.id}-step-${stepIndex}-${Date.now()}`;

    await trigger.schedule?.({
      id: triggerId,
      name: `send-${campaign.name}-step-${stepIndex}`,
      runAt: scheduledAt,
      payload: { campaignId, stepIndex, userId },
      task: async () => {
        await CampaignLaunch.findByIdAndUpdate(launch.id, {
          status: "running",
          stepIndex,
        });

        const updatedLaunch = await CampaignLaunch.findById(launch.id);
        if (updatedLaunch) {
          emitCampaignLaunchUpdate(userId, updatedLaunch);
        }

        let sentCount = 0;
        for (const lead of leads) {
          try {
            const html = renderEmailBody(step.bodyTemplate, lead.customVariables || {}, lead, step.personalizationEnabled);
            await sendEmail({
              to: lead.email,
              subject: step.subject,
              html,
              campaignId: campaign.id,
              leadId: lead.id,
            });

            lead.status = "sent";
            lead.lastSentAt = new Date();
            await lead.save();
            emitLeadUpdate(userId, lead);
            sentCount += 1;
          } catch (error: any) {
            lead.error = error?.message || "Email send failed";
            await lead.save();
            emitLeadUpdate(userId, lead);
          }
        }

        const finalStatus = stepIndex === campaign.sequenceSteps.length - 1 ? "completed" : "running";
        await CampaignLaunch.findByIdAndUpdate(launch.id, {
          status: finalStatus,
          sentCount: sentCount,
        });

        const completedLaunch = await CampaignLaunch.findById(launch.id);
        if (completedLaunch) {
          emitCampaignLaunchUpdate(userId, completedLaunch);
        }
      },
    });
  }

  return launch;
}
