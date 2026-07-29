import { TriggerClient } from "@trigger.dev/sdk/v3";

export const trigger: any = new TriggerClient({
  apiKey: process.env.TRIGGER_API_KEY,
  project: process.env.TRIGGER_PROJECT,
});
