import { schedules, task } from "@trigger.dev/sdk/v3";
import { createAdminClient } from "@insforge/sdk";
import { GoogleGenAI } from "@google/genai";
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

// Standard OpenAPI 3.0 response schema for scheduled briefings
const scheduledBriefingSchema = {
  type: "OBJECT",
  properties: {
    importantCount: { type: "INTEGER", description: "Count of critical items" },
    priorityCount: { type: "INTEGER", description: "Count of priority items" },
    followUpsCount: { type: "INTEGER", description: "Count of follow-up tasks" },
    summaryText: { type: "STRING", description: "A comprehensive markdown daily briefing summarizing key messages and emails" },
    categories: {
      type: "OBJECT",
      properties: {
        email: {
          type: "OBJECT",
          properties: {
            count: { type: "INTEGER" },
            summary: { type: "STRING", description: "Brief 1-sentence summary of emails" }
          },
          required: ["count", "summary"]
        },
        messages: {
          type: "OBJECT",
          properties: {
            count: { type: "INTEGER" },
            summary: { type: "STRING", description: "Brief 1-sentence summary of messages" }
          },
          required: ["count", "summary"]
        },
        mentions: {
          type: "OBJECT",
          properties: {
            count: { type: "INTEGER" },
            summary: { type: "STRING", description: "Brief 1-sentence summary of mentions" }
          },
          required: ["count", "summary"]
        },
        tasks: {
          type: "OBJECT",
          properties: {
            count: { type: "INTEGER" },
            summary: { type: "STRING", description: "Brief 1-sentence summary of tasks" }
          },
          required: ["count", "summary"]
        },
        followUps: {
          type: "OBJECT",
          properties: {
            count: { type: "INTEGER" },
            summary: { type: "STRING", description: "Brief 1-sentence summary of follow-ups" }
          },
          required: ["count", "summary"]
        }
      },
      required: ["email", "messages", "mentions", "tasks", "followUps"]
    }
  },
  required: ["importantCount", "priorityCount", "followUpsCount", "summaryText", "categories"]
};

// 1. Briefing Compiler Task
export const generateScheduledBriefing = task({
  id: "generate-scheduled-briefing",
  run: async (payload: { scheduleId: string; userId: string; scheduleState: any }) => {
    const { scheduleId, userId, scheduleState } = payload;
    const { name, selectedApps = [], selectedCategories = [] } = scheduleState;

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    let gmailEmails: any[] = [];
    let whatsappChats: any[] = [];

    // Pull mock/cached email logs if Gmail is selected
    if (selectedApps.includes("gmail")) {
      let fetchedReal = false;
      const accessToken = await getValidGmailToken(userId);
      if (accessToken) {
        try {
          const listRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (listRes.status === 401) {
            await admin.database
              .from("integrations")
              .update({ connected: false, updated_at: new Date().toISOString() })
              .eq("user_id", userId)
              .eq("platform", "gmail");
            throw new Error("Gmail access token unauthorized or expired.");
          }
          if (listRes.ok) {
            const listData = await listRes.json();
            const messages = listData.messages || [];
            const detailsPromises = messages.map(async (msg: any) => {
              const detailRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );
              if (detailRes.status === 401) {
                await admin.database
                  .from("integrations")
                  .update({ connected: false, updated_at: new Date().toISOString() })
                  .eq("user_id", userId)
                  .eq("platform", "gmail");
                throw new Error("Gmail access token unauthorized or expired.");
              }
              if (!detailRes.ok) return null;
              const detailData = await detailRes.json();
              const headers = detailData.payload?.headers || [];
              const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
              const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
              const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
              const bodyText = extractEmailBody(detailData.payload) || extractHtmlFallback(detailData.payload) || detailData.snippet || "";

              return {
                id: msg.id,
                from: fromHeader,
                subject: subjectHeader,
                date: dateHeader,
                snippet: detailData.snippet || "",
                body: bodyText,
              };
            });
            const fetched = (await Promise.all(detailsPromises)).filter(Boolean);
            if (fetched.length > 0) {
              gmailEmails = fetched;
              fetchedReal = true;
            }
          }
        } catch (err) {
          console.error("Failed to fetch real Gmail logs in background task:", err);
        }
      }

      if (!fetchedReal) {
        gmailEmails = [
          { subject: "Urgent: Project Alpha Timeline Shift", from: "manager@company.com", snippet: "We need to expedite the delivery of login layout to Friday morning.", date: "Today, 10:00 AM" },
          { subject: "Feedback: Invoice Update Required", from: "billing@client.com", snippet: "The invoice #1043 has incorrect banking details. Please update.", date: "Today, 11:15 AM" }
        ];
      }
    }

    // Pull WhatsApp chat logs using active session or mock if WhatsApp is selected
    if (selectedApps.includes("whatsapp")) {
      // In background task, we use a mock helper or active logs
      whatsappChats = [
        { name: "Support Team JID", lastMessage: "Can you confirm the pairing code works?", timestamp: "Today, 11:30 AM" }
      ];
      
      try {
        // Query the server route for real-time WhatsApp logs if server is running
        const res = await fetch(`http://localhost:3000/api/whatsapp/mcp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            toolName: "whatsapp_get_recent_messages",
            args: { limit: 5 }
          })
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.result)) {
          whatsappChats = data.result;
        }
      } catch (e) {
        console.log("Next.js dev server WhatsApp JID fetch offline, using mock chats.");
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let briefData: any = null;

    if (!apiKey) {
      // Create mock result matching schema
      briefData = {
        importantCount: 2,
        priorityCount: 3,
        followUpsCount: 1,
        summaryText: `### 🗓️ Scheduled Brief: ${name}\n\nThis is an automated background briefing summarizing updates from your connected channels (${selectedApps.join(", ")}):\n\n*   **Critical Updates**: Project Alpha login page layout has a timeline shift. Expedite modifications before Friday morning.\n*   **Urgent Billing**: Correct banking details for Invoice #1043 requested.\n\n*Note: Add GEMINI_API_KEY in .env.local to enable real AI summarization.*`,
        categories: {
          email: { count: 2, summary: "Timeline adjustments and billing issues identified." },
          messages: { count: 1, summary: "Active chat confirmation update." },
          mentions: { count: 0, summary: "No mentions detected." },
          tasks: { count: 1, summary: "Expedite the delivery of Project Alpha layout." },
          followUps: { count: 1, summary: "Review invoice billing feedback." }
        }
      };
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const promptText = `
You are an advanced workspaces assistant. Draft a daily briefing summary named "${name}" based on:
Gmail:
${JSON.stringify(gmailEmails, null, 2)}
WhatsApp:
${JSON.stringify(whatsappChats, null, 2)}

Filter findings based on:
Categories: ${selectedCategories.join(", ")}

Produce a JSON output matching responseSchema configuration. Maintain concise, bullet-pointed updates in "summaryText". Calculate category tallies and short summaries for: email, messages, mentions, tasks, followUps.
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: scheduledBriefingSchema as any,
          }
        });

        const rawText = typeof response.text === 'function' ? (response as any).text() : response.text;
        briefData = JSON.parse(rawText.trim());
      } catch (err) {
        console.error("Gemini failed, using mock parser:", err);
        briefData = {
          importantCount: 1,
          priorityCount: 2,
          followUpsCount: 1,
          summaryText: `### 🗓️ Scheduled Brief: ${name}\n\nUnable to generate AI content. Summary: detected ${gmailEmails.length} emails and ${whatsappChats.length} active chats.`,
          categories: {
            email: { count: gmailEmails.length, summary: "Emails log summary." },
            messages: { count: whatsappChats.length, summary: "Messages log summary." },
            mentions: { count: 0, summary: "No mentions." },
            tasks: { count: 1, summary: "Check inbox tasks." },
            followUps: { count: 1, summary: "Perform action updates." }
          }
        };
      }
    }

    // Save briefing result in database
    const finalBrief = {
      scheduleName: name,
      id: `brief_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...briefData
    };

    await admin.database.from("integrations").insert([
      {
        user_id: userId,
        platform: "briefing_result",
        connected: true,
        state: finalBrief
      }
    ]);

    console.log(`Successfully generated briefing for schedule: ${name} (${scheduleId})`);
  }
});

// 2. 15-Minute Cron Checker Task
export const checkBriefingsSchedule = schedules.task({
  id: "check-briefings-schedule",
  cron: {
    pattern: "*/15 * * * *", // Runs every 15 minutes
  },
  run: async (payload) => {
    console.log("Running 15-minute briefings schedule checker...", payload.timestamp);

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // Fetch all schedule configs
    const { data: schedulesList, error } = await admin.database
      .from("integrations")
      .select()
      .eq("platform", "briefing_schedule")
      .eq("connected", true);

    if (error) {
      console.error("Failed to query briefing schedules:", error);
      return;
    }

    const now = new Date();
    
    // Check which schedules are due
    for (const schedule of schedulesList) {
      const state = parseState(schedule.state);
      const nextRunTime = state.nextRun ? new Date(state.nextRun) : null;

      if (nextRunTime && nextRunTime.getTime() <= now.getTime()) {
        console.log(`Schedule "${state.name}" is due. Triggering briefing generation...`);

        // 1. Trigger background compile task
        await generateScheduledBriefing.trigger({
          scheduleId: schedule.id,
          userId: schedule.user_id,
          scheduleState: state
        });

        // 2. Update next run offsets
        const scheduledTime = state.scheduledTime || "08:00";
        const frequency = state.frequency || "daily";
        
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const nextTarget = new Date();
        nextTarget.setHours(hours, minutes, 0, 0);

        if (frequency === "daily") {
          nextTarget.setDate(nextTarget.getDate() + 1);
        } else if (frequency === "weekly") {
          nextTarget.setDate(nextTarget.getDate() + 7);
        } else if (frequency === "monthly") {
          nextTarget.setMonth(nextTarget.getMonth() + 1);
        } else {
          nextTarget.setDate(nextTarget.getDate() + 1);
        }

        const updatedState = {
          ...state,
          lastRun: now.toISOString(),
          nextRun: nextTarget.toISOString()
        };

        await admin.database
          .from("integrations")
          .update({
            state: updatedState,
            updated_at: new Date().toISOString()
          })
          .eq("id", schedule.id);
      }
    }
  }
});
