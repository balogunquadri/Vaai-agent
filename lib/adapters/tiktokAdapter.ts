import type { Adapter } from "./adapter";
import { createAdminClient } from "@insforge/sdk";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  // Return simulated TikTok interactions feed
  return [
    { id: "tt_1", title: "New Trend Alert", text: "Multi-agent platforms video has gained 12k views in 3 hours!", user: "TikTok", time: new Date().toISOString() },
    { id: "tt_2", title: "Workspace Productivity", text: "Checking out VAAI workspace automation dashboard clip.", user: "TikTok", time: new Date(Date.now() - 7200000).toISOString() }
  ].slice(0, limit);
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  if (toolName !== "tiktok_prepare_message_draft") {
    throw new Error(`TikTok adapter: tool ${toolName} not implemented`);
  }

  const recipient = args.recipientHandle || args.recipient || "unknown";
  const text = args.messageText || args.text;
  if (!text) throw new Error("Missing parameter: messageText");

  const admin = createAdminClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    apiKey: process.env.INSFORGE_API_KEY!,
  });

  const { data: existing } = await admin.database
    .from("integrations")
    .select("id, state")
    .eq("user_id", userId)
    .eq("platform", "tiktok")
    .maybeSingle();

  const newDraft = {
    id: "tt_dr_" + Math.random().toString(36).substring(2, 11),
    recipient,
    text,
    created_at: new Date().toISOString(),
    status: "pending"
  };

  const currentDrafts = existing?.state?.pendingDrafts || [];
  const newState = {
    ...(existing?.state || {}),
    pendingDrafts: [...currentDrafts, newDraft]
  };

  if (existing) {
    await admin.database
      .from("integrations")
      .update({
        state: newState,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);
  } else {
    await admin.database.from("integrations").insert([
      {
        user_id: userId,
        platform: "tiktok",
        connected: true,
        state: newState
      }
    ]);
  }

  return {
    success: true,
    draftId: newDraft.id,
    recipient,
    message: text,
    note: "Draft created successfully. Go to Dashboard overview to verify and send."
  };
}

async function getToolSchemas(userId: string) {
  return [
    {
      name: "tiktok_prepare_message_draft",
      description: "Prepare a direct message draft for a user on TikTok. It saves the draft and alerts the user to copy/send it manually.",
      parameters: {
        type: "OBJECT",
        properties: {
          recipientHandle: { type: "STRING", description: "TikTok username handle or profile URL of the recipient." },
          messageText: { type: "STRING", description: "Text content of the message." }
        },
        required: ["recipientHandle", "messageText"]
      }
    }
  ];
}

const tiktokAdapter: Adapter = {
  getRecentItems,
  executeTool,
  getToolSchemas
};

export default tiktokAdapter;
