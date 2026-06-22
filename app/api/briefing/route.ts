import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";
import { getValidGmailToken, extractEmailBody, extractHtmlFallback } from "@/lib/gmail";

// Helper to parse "HH:MM" time and compute the next ISO date string run time
function computeNextRunTime(scheduledTime: string, frequency: string): string {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const now = new Date();
  
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  
  // If target time has already passed today, shift forward based on frequency
  if (target.getTime() <= now.getTime()) {
    if (frequency === "daily") {
      target.setDate(target.getDate() + 1);
    } else if (frequency === "weekly") {
      target.setDate(target.getDate() + 7);
    } else if (frequency === "monthly") {
      target.setMonth(target.getMonth() + 1);
    } else {
      target.setDate(target.getDate() + 1);
    }
  }
  
  return target.toISOString();
}

// GET: Retrieve user's schedules and briefing results
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const { data: rows, error } = await admin.database
      .from("integrations")
      .select()
      .eq("user_id", userId);

    if (error) throw error;

    const schedules: any[] = [];
    const briefs: any[] = [];

    rows?.forEach((row: any) => {
      if (row.platform === "briefing_schedule") {
        schedules.push({
          id: row.id,
          ...row.state,
          updated_at: row.updated_at,
        });
      } else if (row.platform === "briefing_result") {
        briefs.push({
          id: row.id,
          ...row.state,
          updated_at: row.updated_at,
        });
      }
    });

    // Sort briefings by creation date descending
    briefs.sort((a, b) => new Date(b.createdAt || b.updated_at || 0).getTime() - new Date(a.createdAt || a.updated_at || 0).getTime());

    return NextResponse.json({
      success: true,
      schedules,
      briefs,
    });
  } catch (error: any) {
    console.error("GET briefings details failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Register a new custom briefing schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      selectedApps,
      selectedCategories,
      scheduledTime,
      frequency,
      priorityLevel,
    } = body;

    if (!userId || !name || !scheduledTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const nextRun = computeNextRunTime(scheduledTime, frequency || "daily");

    const scheduleConfig = {
      name,
      description: description || "",
      selectedApps: selectedApps || [],
      selectedCategories: selectedCategories || [],
      scheduledTime,
      frequency: frequency || "daily",
      priorityLevel: priorityLevel || "medium",
      lastRun: null,
      nextRun,
    };

    const { data: existing } = await admin.database
      .from("integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "briefing_schedule")
      .maybeSingle();

    let inserted;
    let dbError;

    if (existing) {
      const { data: updated, error: updateError } = await admin.database
        .from("integrations")
        .update({
          connected: true,
          state: scheduleConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      inserted = updated;
      dbError = updateError;
    } else {
      const { data: newRow, error: insertError } = await admin.database
        .from("integrations")
        .insert([
          {
            user_id: userId,
            platform: "briefing_schedule",
            connected: true,
            state: scheduleConfig,
          },
        ])
        .select()
        .single();
      inserted = newRow;
      dbError = insertError;
    }

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      schedule: {
        id: inserted.id,
        ...inserted.state,
      },
    });
  } catch (error: any) {
    console.error("POST custom briefings schedule failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Run/compile a briefing schedule immediately
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, scheduleId } = body;

    if (!userId || !scheduleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 1. Fetch schedule config
    const { data: scheduleRow, error: schedError } = await admin.database
      .from("integrations")
      .select()
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .eq("platform", "briefing_schedule")
      .maybeSingle();

    if (schedError || !scheduleRow) {
      return NextResponse.json({ error: "Briefing schedule not found" }, { status: 404 });
    }

    const state = scheduleRow.state || {};
    const { name, selectedApps = [], selectedCategories = [] } = state;

    const allLogs: Record<string, any[]> = {};
    const { getAppRecentItems } = await import("@/lib/mcpApps");

    // Fetch data for all selected apps
    for (const app of selectedApps) {
      if (app === "gmail") {
        let gmailEmails: any[] = [];
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
            } else if (listRes.ok) {
              const listData = await listRes.json();
              const messages = listData.messages || [];
              const detailsPromises = messages.map(async (msg: any) => {
                const detailRes = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                  {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  }
                );
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
              gmailEmails = (await Promise.all(detailsPromises)).filter(Boolean);
              if (gmailEmails.length > 0) fetchedReal = true;
            }
          } catch (err) {
            console.error("Failed to fetch real Gmail logs:", err);
          }
        }
        allLogs.gmail = fetchedReal ? gmailEmails : await getAppRecentItems(userId, "gmail", 5);
      } else if (app === "whatsapp") {
        let whatsappChats: any[] = [];
        let fetchedReal = false;
        try {
          const { whatsappManager } = await import("@/lib/whatsapp");
          const status = whatsappManager.getStatus(userId);
          if (status && status.state === "connected") {
            const res = await whatsappManager.executeMcp(userId, "whatsapp_get_recent_messages", { limit: 5 });
            if (Array.isArray(res)) {
              whatsappChats = res;
              fetchedReal = true;
            }
          }
        } catch (err) {
          console.error("Failed to fetch WhatsApp logs directly on server:", err);
        }
        allLogs.whatsapp = fetchedReal ? whatsappChats : await getAppRecentItems(userId, "whatsapp", 5);
      } else {
        allLogs[app] = await getAppRecentItems(userId, app, 5);
      }
    }

    // 4. Summarize using Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    let briefData: any = null;

    const scheduledBriefingSchema = {
      type: "OBJECT",
      properties: {
        importantCount: { type: "INTEGER" },
        priorityCount: { type: "INTEGER" },
        followUpsCount: { type: "INTEGER" },
        summaryText: { type: "STRING" },
        categories: {
          type: "OBJECT",
          properties: {
            email: {
              type: "OBJECT",
              properties: {
                count: { type: "INTEGER" },
                summary: { type: "STRING" }
              },
              required: ["count", "summary"]
            },
            messages: {
              type: "OBJECT",
              properties: {
                count: { type: "INTEGER" },
                summary: { type: "STRING" }
              },
              required: ["count", "summary"]
            },
            mentions: {
              type: "OBJECT",
              properties: {
                count: { type: "INTEGER" },
                summary: { type: "STRING" }
              },
              required: ["count", "summary"]
            },
            tasks: {
              type: "OBJECT",
              properties: {
                count: { type: "INTEGER" },
                summary: { type: "STRING" }
              },
              required: ["count", "summary"]
            },
            followUps: {
              type: "OBJECT",
              properties: {
                count: { type: "INTEGER" },
                summary: { type: "STRING" }
              },
              required: ["count", "summary"]
            }
          },
          required: ["email", "messages", "mentions", "tasks", "followUps"]
        }
      },
      required: ["importantCount", "priorityCount", "followUpsCount", "summaryText", "categories"]
    };

    if (!apiKey) {
      let importantCount = 0;
      let priorityCount = 0;
      let followUpsCount = 0;
      let summaryParts: string[] = [];

      const counts = {
        email: 0,
        messages: 0,
        mentions: 0,
        tasks: 0,
        followUps: 0
      };

      const summaries = {
        email: "No new emails.",
        messages: "No new chat updates.",
        mentions: "No new mentions.",
        tasks: "No new tasks.",
        followUps: "No pending follow-ups."
      };

      Object.keys(allLogs).forEach((app) => {
        const logs = allLogs[app] || [];
        if (logs.length > 0) {
          importantCount += Math.ceil(logs.length * 0.3);
          priorityCount += Math.ceil(logs.length * 0.5);
          followUpsCount += Math.ceil(logs.length * 0.2);

          const itemTitle = logs[0].title || logs[0].subject || "update";
          summaryParts.push(`*   **${app.toUpperCase()}**: ${logs.length} updates found. Latest: ${itemTitle}`);

          // Aggregate into category metrics
          if (app === "gmail" || app === "outlook") {
            counts.email += logs.length;
            summaries.email = `Received updates including: '${itemTitle}'`;
          } else if (app === "whatsapp" || app === "telegram" || app === "lark") {
            counts.messages += logs.length;
            summaries.messages = `Chat updates from JID thread: '${itemTitle}'`;
          } else if (app === "slack" || app === "discord" || app === "teams") {
            counts.mentions += logs.length;
            summaries.mentions = `Channel mentions: '${itemTitle}'`;
          } else if (app === "jira" || app === "trello" || app === "asana" || app === "notion") {
            counts.tasks += logs.length;
            summaries.tasks = `Project management task updates: '${itemTitle}'`;
          } else {
            counts.followUps += logs.length;
            summaries.followUps = `Follow up needed on channel ${app}: '${itemTitle}'`;
          }
        }
      });

      if (summaryParts.length === 0) {
        summaryParts.push("*   No updates were compiled from selected applications. Check app connection status.");
      }

      briefData = {
        importantCount,
        priorityCount,
        followUpsCount,
        summaryText: `Today's briefing summaries for schedule "${name}":\n\n${summaryParts.join("\n")}\n\n*Note: Set GEMINI_API_KEY in your .env for full AI summaries.*`,
        categories: {
          email: { count: counts.email, summary: summaries.email },
          messages: { count: counts.messages, summary: summaries.messages },
          mentions: { count: counts.mentions, summary: summaries.mentions },
          tasks: { count: counts.tasks, summary: summaries.tasks },
          followUps: { count: counts.followUps, summary: summaries.followUps }
        }
      };
    } else {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `
You are an advanced workspaces assistant. Draft a daily briefing summary named "${name}" based on these selected apps logs:
${JSON.stringify(allLogs, null, 2)}

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
    }

    // 5. Save briefing result
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

    // 6. Recalculate schedule's lastRun / nextRun
    const frequency = state.frequency || "daily";
    const scheduledTime = state.scheduledTime || "08:00";
    
    // We compute using the current route local function
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= Date.now()) {
      if (frequency === "daily") {
        target.setDate(target.getDate() + 1);
      } else if (frequency === "weekly") {
        target.setDate(target.getDate() + 7);
      } else if (frequency === "monthly") {
        target.setMonth(target.getMonth() + 1);
      } else {
        target.setDate(target.getDate() + 1);
      }
    }
    const nextRun = target.toISOString();

    const updatedState = {
      ...state,
      lastRun: new Date().toISOString(),
      nextRun
    };

    await admin.database
      .from("integrations")
      .update({
        state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq("id", scheduleId);

    return NextResponse.json({
      success: true,
      brief: finalBrief
    });

  } catch (error: any) {
    console.error("PUT run briefing schedule failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// force turbopack cache invalidate

