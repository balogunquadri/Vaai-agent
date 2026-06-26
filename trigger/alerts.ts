import { schedules, task } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@insforge/sdk";
import { getValidGmailToken, extractEmailBody, extractHtmlFallback } from "../lib/gmail";

// Helper to parse state safely and auto-repair character-spread corruption
function parseState(state: any): any {
  if (!state) return {};
  let stateObj = state;
  if (typeof stateObj === "string") {
    try {
      stateObj = JSON.parse(stateObj);
    } catch (e) {
      console.error("Failed to parse state string:", e);
      return {};
    }
  }
  while (stateObj && typeof stateObj === "object" && "0" in stateObj) {
    const keys = Object.keys(stateObj).filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
    let str = "";
    for (const k of keys) {
      str += stateObj[k];
    }
    try {
      stateObj = JSON.parse(str);
    } catch (e) {
      console.error("Failed to parse reconstructed state:", e);
      break;
    }
  }
  return stateObj || {};
}

// Evaluation worker task for a single user's alert rule
export const evaluateAlertRule = task({
  id: "evaluate-alert-rule",
  run: async (payload: { userId: string; ruleId: string; state: any }) => {
    const { userId, ruleId, state: rawState } = payload;
    const state = parseState(rawState);
    console.log(`Evaluating alert rule "${state.name}" (${ruleId}) for user ${userId}`);

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const apps: string[] = state.selectedApps || [];
    const condition: string = state.condition || "";

    // Load existing triggered alerts to prevent duplicates
    const { data: oldTriggers } = await admin.database
      .from("integrations")
      .select("state")
      .eq("user_id", userId)
      .eq("platform", "triggered_alert");

    const existingSourceIds = new Set<string>();
    oldTriggers?.forEach((t: any) => {
      const stateObj = parseState(t.state);
      if (stateObj?.sourceId) {
        existingSourceIds.add(stateObj.sourceId);
      }
    });

    // 1. Gmail Monitor
    if (apps.includes("gmail")) {
      const accessToken = await getValidGmailToken(userId);
      if (accessToken) {
        try {
          const q = condition.startsWith("keyword:")
            ? condition.replace("keyword:", "").split(",").join(" OR ")
            : "";
          const listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5${q ? `&q=${encodeURIComponent(q)}` : ""}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          if (listRes.ok) {
            const listData = await listRes.json();
            const messages = listData.messages || [];

            for (const msg of messages) {
              if (existingSourceIds.has(msg.id)) continue;

              const detailRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );
              
              if (detailRes.ok) {
                const detail = await detailRes.json();
                const headers = detail.payload?.headers || [];
                const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
                const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
                const bodyText = extractEmailBody(detail.payload) || extractHtmlFallback(detail.payload) || detail.snippet || "";

                // Keyword match verification
                const keywords = condition.startsWith("keyword:")
                  ? condition.replace("keyword:", "").split(",")
                  : [];

                let isMatch = keywords.length === 0;
                for (const kw of keywords) {
                  const lowerKw = kw.toLowerCase().trim();
                  if (
                    subjectHeader.toLowerCase().includes(lowerKw) ||
                    fromHeader.toLowerCase().includes(lowerKw) ||
                    bodyText.toLowerCase().includes(lowerKw)
                  ) {
                    isMatch = true;
                    break;
                  }
                }

                if (isMatch) {
                  const newAlert = {
                    alertId: ruleId,
                    title: `Gmail Alert: ${subjectHeader}`,
                    description: `Received email from ${fromHeader} containing matching keywords.`,
                    sourceApp: "gmail",
                    priorityLevel: state.priorityLevel || "high",
                    status: "active",
                    time: new Date().toISOString(),
                    sourceId: msg.id,
                    payload: {
                      from: fromHeader,
                      subject: subjectHeader,
                      body: bodyText,
                    },
                  };

                  await admin.database.from("integrations").insert([
                    {
                      user_id: userId,
                      platform: "triggered_alert",
                      connected: true,
                      state: newAlert,
                    },
                  ]);
                  console.log(`Saved triggered Gmail alert: ${newAlert.title}`);
                  existingSourceIds.add(msg.id);
                }
              }
            }
          }
        } catch (err) {
          console.error("Background task Gmail check failed:", err);
        }
      }
    }

    // 2. WhatsApp Monitor
    if (apps.includes("whatsapp")) {
      try {
        // Attempt WhatsApp background check
        const { whatsappManager } = await import("../lib/whatsapp");
        const status = whatsappManager.getStatus(userId);
        if (status && status.state === "connected") {
          const messagesList = await whatsappManager.executeMcp(userId, "whatsapp_get_recent_messages", { limit: 5 });
          if (Array.isArray(messagesList)) {
            for (const msg of messagesList) {
              const msgId = msg.chatId + "_" + (msg.timestamp || Date.now());
              if (existingSourceIds.has(msgId)) continue;

              const text = msg.lastMessage || "";
              const keywords = condition.startsWith("keyword:")
                ? condition.replace("keyword:", "").split(",")
                : [];

              let isMatch = keywords.length === 0;
              for (const kw of keywords) {
                const lowerKw = kw.toLowerCase().trim();
                if (text.toLowerCase().includes(lowerKw) || msg.name.toLowerCase().includes(lowerKw)) {
                  isMatch = true;
                  break;
                }
              }

              if (isMatch) {
                const newAlert = {
                  alertId: ruleId,
                  title: `WhatsApp from ${msg.name}`,
                  description: `WhatsApp text contains alert keywords: '${text.substring(0, 60)}...'`,
                  sourceApp: "whatsapp",
                  priorityLevel: state.priorityLevel || "medium",
                  status: "active",
                  time: new Date().toISOString(),
                  sourceId: msgId,
                  payload: {
                    sender: `${msg.name} (${msg.chatId})`,
                    text,
                  },
                };

                await admin.database.from("integrations").insert([
                  {
                    user_id: userId,
                    platform: "triggered_alert",
                    connected: true,
                    state: newAlert,
                  },
                ]);
                console.log(`Saved triggered WhatsApp alert: ${newAlert.title}`);
                existingSourceIds.add(msgId);
              }
            }
          }
        }
      } catch (err) {
        console.error("Background task WhatsApp check failed:", err);
      }
    }
  }
});

// Periodic scheduler checking all user-configured alerts rules
export const checkAlertsSchedule = schedules.task({
  id: "check-alerts-schedule",
  cron: {
    pattern: "*/15 * * * *", // Runs every 15 minutes
  },
  run: async (payload) => {
    console.log("Running background alerts checker cron...", payload.timestamp);

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // Fetch all active alert rules
    const { data: alertRules, error } = await admin.database
      .from("integrations")
      .select()
      .eq("platform", "alert")
      .eq("connected", true);

    if (error) {
      console.error("Failed to query alert rules from integrations:", error);
      return;
    }

    console.log(`Found ${alertRules?.length || 0} active alert rules to evaluate.`);

    for (const ruleRow of (alertRules || [])) {
      await evaluateAlertRule.trigger({
        userId: ruleRow.user_id,
        ruleId: ruleRow.id,
        state: parseState(ruleRow.state),
      });
    }
  }
});
