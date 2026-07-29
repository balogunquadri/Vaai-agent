import type { Adapter } from "./adapter";
import { createAdminClient } from "@insforge/sdk";

async function getRecentItems(userId: string, limit = 5, userState: any = {}) {
  // Return simulated LinkedIn posts feed
  return [
    { id: "li_1", title: "AI in Workspaces", text: "Excited to share our latest research on Multi-agent orchestration protocols!", user: "LinkedIn", time: new Date().toISOString() },
    { id: "li_2", title: "Glassmorphism UI Trends", text: "Premium design languages enhance conversion rates by 40%.", user: "LinkedIn", time: new Date(Date.now() - 3600000).toISOString() }
  ].slice(0, limit);
}

async function executeTool(userId: string, toolName: string, args: any = {}, userState: any = {}) {
  if (toolName !== "linkedin_prepare_message_draft") {
    throw new Error(`LinkedIn adapter: tool ${toolName} not implemented`);
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
    .eq("platform", "linkedin")
    .maybeSingle();

  const newDraft = {
    id: "li_dr_" + Math.random().toString(36).substring(2, 11),
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
        platform: "linkedin",
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
      name: "linkedin_prepare_message_draft",
      description: "Prepare a message draft for a user on LinkedIn. It saves the draft and alerts the user to copy/send it manually.",
      parameters: {
        type: "OBJECT",
        properties: {
          recipientHandle: { type: "STRING", description: "LinkedIn handle, URL, or name of the recipient." },
          messageText: { type: "STRING", description: "Text content of the message." }
        },
        required: ["recipientHandle", "messageText"]
      }
    }
  ];
}

const linkedinAdapter: Adapter = {
  getRecentItems,
  executeTool,
  getToolSchemas
};

export default linkedinAdapter;
