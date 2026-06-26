import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@insforge/sdk";

// Standard OpenAPI 3.0-compliant response schema for Gemini Structured Output
const dashboardBriefSchema = {
  type: "OBJECT",
  properties: {
    importantCount: { 
      type: "INTEGER", 
      description: "Count of critical updates, issues, or messages requiring immediate client action" 
    },
    priorityCount: { 
      type: "INTEGER", 
      description: "Count of items categorized as standard priority tasks" 
    },
    followUpsCount: { 
      type: "INTEGER", 
      description: "Count of tasks requiring customer follow-up actions" 
    },
    todayBrief: { 
      type: "STRING", 
      description: "A short, concise markdown brief (maximum 3-4 bullet points) summarizing key updates from all active applications" 
    },
    priorityItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          app: { 
            type: "STRING", 
            description: "The source application platform of the item (e.g. gmail, whatsapp, slack, github, etc.)" 
          },
          title: { 
            type: "STRING", 
            description: "The title, subject line, contact name, or key identifier" 
          },
          time: { 
            type: "STRING", 
            description: "The time or date when received (e.g. 10:15 AM)" 
          },
          description: { 
            type: "STRING", 
            description: "A single concise sentence summarizing the priority context" 
          },
          priority: { 
            type: "STRING", 
            enum: ["high", "medium", "low"], 
            description: "The urgency priority level" 
          }
        },
        required: ["app", "title", "time", "description", "priority"]
      },
      description: "List of top 3-4 priority action items"
    }
  },
  required: ["importantCount", "priorityCount", "followUpsCount", "todayBrief", "priorityItems"]
};

// Generates dynamic mock fallback if API key is absent or generation fails
function generateMockFromRealData(allLogs: Record<string, any[]>) {
  let importantCount = 0;
  let priorityCount = 0;
  let followUpsCount = 0;
  const priorityItems: any[] = [];
  
  let brief = `### 🗓️ Workspace Daily Overview\n\n`;
  const apps = Object.keys(allLogs);
  
  if (apps.length === 0) {
    brief += `*   **Clear Workspace**: No connected application channels detected. Go to integrations to get started.\n`;
  } else {
    apps.forEach((app) => {
      const logs = allLogs[app] || [];
      if (logs.length > 0) {
        importantCount += Math.ceil(logs.length * 0.3);
        priorityCount += Math.ceil(logs.length * 0.5);
        followUpsCount += Math.ceil(logs.length * 0.2);
        
        brief += `*   **${app.charAt(0).toUpperCase() + app.slice(1)}**: Detected ${logs.length} active updates. Latest: *${logs[0].title || logs[0].subject || "New update"}*.\n`;
        
        // Add to priority items
        priorityItems.push({
          app,
          title: logs[0].title || logs[0].subject || `${app.toUpperCase()} Update`,
          time: "Today",
          description: (logs[0].text || logs[0].snippet || logs[0].description || "Update requires review.").slice(0, 60) + "...",
          priority: logs.length > 2 ? "high" : "medium"
        });
      }
    });
    
    brief += `\n*Note: Set GEMINI_API_KEY in your .env file for complete AI briefings.*`;
  }

  return {
    importantCount,
    priorityCount,
    followUpsCount,
    todayBrief: brief,
    priorityItems: priorityItems.slice(0, 4)
  };
}

// GET method: Retrieve cached brief instantly from database
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

    const { data: cached, error } = await admin.database
      .from("integrations")
      .select("state, updated_at")
      .eq("user_id", userId)
      .eq("platform", "dashboard_brief")
      .maybeSingle();

    if (error) throw error;

    if (cached && cached.state) {
      let parsedCache = cached.state;
      if (typeof parsedCache === "string") {
        try {
          parsedCache = JSON.parse(parsedCache);
        } catch (e) {
          console.error("Failed to parse cached brief in GET:", e);
        }
      }
      return NextResponse.json({
        success: true,
        cached: parsedCache,
        updated_at: cached.updated_at,
      });
    }

    return NextResponse.json({ success: false });
  } catch (error: any) {
    console.error("GET dashboard brief cache error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST method: Process and cache dashboard brief (2-hour cache check)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, gmailEmails, whatsappChats, forceRefresh } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 1. Unless forceRefresh is true, check database cache (2-hour TTL)
    if (!forceRefresh) {
      const { data: cached, error: cacheError } = await admin.database
        .from("integrations")
        .select()
        .eq("user_id", userId)
        .eq("platform", "dashboard_brief")
        .maybeSingle();

      if (!cacheError && cached && cached.state) {
        const cacheAge = new Date().getTime() - new Date(cached.updated_at).getTime();
        // 2 hours in milliseconds = 7200000
        if (cacheAge < 7200000) {
          let parsedState = cached.state;
          if (typeof parsedState === "string") {
            try {
              parsedState = JSON.parse(parsedState);
            } catch (e) {
              console.error("Failed to parse cached brief state in POST:", e);
            }
          }
          return NextResponse.json(parsedState);
        }
      }
    }

    // 2. Fetch all active integrations for this user
    const { data: activeConns } = await admin.database
      .from("integrations")
      .select("platform")
      .eq("user_id", userId)
      .eq("connected", true);

    const activePlatforms = (activeConns || [])
      .map((c: any) => c.platform)
      .filter((p: string) => p !== "settings" && p !== "dashboard_brief" && p !== "briefing_schedule" && p !== "alert" && p !== "triggered_alert" && p !== "briefing_result");

    const allLogs: Record<string, any[]> = {};
    const { getAppRecentItems } = await import("@/lib/mcpApps");

    // Fetch logs from all active channels
    for (const platform of activePlatforms) {
      if (platform === "gmail") {
        allLogs[platform] = gmailEmails && gmailEmails.length > 0 ? gmailEmails : await getAppRecentItems(userId, "gmail", 5);
      } else if (platform === "whatsapp") {
        allLogs[platform] = whatsappChats && whatsappChats.length > 0 ? whatsappChats : await getAppRecentItems(userId, "whatsapp", 5);
      } else {
        // Fetch from custom helper
        allLogs[platform] = await getAppRecentItems(userId, platform, 5);
      }
    }

    const hasAnyLogs = Object.values(allLogs).some(logs => logs.length > 0);
    if (!hasAnyLogs) {
      const emptyState = {
        importantCount: 0,
        priorityCount: 0,
        followUpsCount: 0,
        todayBrief: "### Welcome to your Workspace Dashboard!\n\nNo active communications data detected. Connect your accounts under the Connected Apps card to generate your personalized workspace briefing.",
        priorityItems: []
      };

      await saveCacheToDb(admin, userId, emptyState);
      return NextResponse.json(emptyState);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let briefResult: any = null;

    if (!apiKey) {
      briefResult = generateMockFromRealData(allLogs);
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const promptText = `
You are an advanced workspace assistant. Synthesize a quick, high-value dashboard summary of the user's communications across all connected channels:
${JSON.stringify(allLogs, null, 2)}

Provide output strictly in JSON matching the response schema. Keep the "todayBrief" summary short: exactly 3-4 concise bullet points outlining the core updates. Ensure "priorityItems" contains at most 3-4 items with a single-sentence description. Speed and conciseness are highly critical.
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: dashboardBriefSchema as any,
          }
        });

        const rawText = typeof response.text === 'function' ? (response as any).text() : response.text;
        briefResult = JSON.parse(rawText.trim());
      } catch (err) {
        console.error("Gemini API call failed, using mock parser:", err);
        briefResult = generateMockFromRealData(allLogs);
      }
    }

    // 3. Save/Update cache in database
    await saveCacheToDb(admin, userId, briefResult);

    return NextResponse.json(briefResult);

  } catch (error: any) {
    console.error("Dashboard briefing endpoint failed:", error);
    return NextResponse.json(
      { error: "Internal server error during dashboard brief compilation", details: error.message },
      { status: 500 }
    );
  }
}

// Helpers to persist brief cache in the database
async function saveCacheToDb(admin: any, userId: string, briefData: any) {
  try {
    const { data: existing } = await admin.database
      .from("integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "dashboard_brief")
      .maybeSingle();

    if (existing) {
      await admin.database
        .from("integrations")
        .update({
          state: briefData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.database.from("integrations").insert([
        {
          user_id: userId,
          platform: "dashboard_brief",
          connected: true,
          state: briefData,
        },
      ]);
    }
  } catch (e) {
    console.error("Failed to save brief cache to database:", e);
  }
}
