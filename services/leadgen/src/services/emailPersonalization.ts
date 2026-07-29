import { LeadDocument } from "../models/Lead";
import { CampaignStep } from "../models/Campaign";

export function renderEmailBody(
  template: string,
  customVars: Record<string, string>,
  lead: LeadDocument,
  personalizationEnabled: boolean
) {
  const baseBody = template
    .replace(/\{\{firstName\}\}/g, lead.firstName || "")
    .replace(/\{\{lastName\}\}/g, lead.lastName || "")
    .replace(/\{\{company\}\}/g, lead.company || "")
    .replace(/\{\{email\}\}/g, lead.email || "")
    .replace(/\{\{signature\}\}/g, "Best regards,\nYour team");

  const withCustom = Object.entries(customVars).reduce((body, [key, value]) => {
    return body.replace(new RegExp(`\{\{${key}\}\}`, "g"), value || "");
  }, baseBody);

  const trackingPixel = `<img src="${process.env.LEADGEN_HOST || "http://localhost:4000"}/api/email/opened/${lead.id}.png" width="1" height="1" style="display:none" alt=""/>`;

  const filled = withCustom.replace(/\{\{trackingPixel\}\}/g, trackingPixel);

  if (!personalizationEnabled) {
    return filled;
  }

  if (lead.firstName) {
    return filled.replace(/\{\{personalizedGreeting\}\}/g, `Hi ${lead.firstName},`);
  }

  return filled.replace(/\{\{personalizedGreeting\}\}/g, "Hello,");
}
