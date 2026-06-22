import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.JIRA_CLIENT_ID;
  if (clientId) {
    const redirectUri = `${origin}/auth/jira-callback`;
    const scopes = ["read:jira-work", "write:jira-work", "manage:jira-project"].join(" ");
    const state = encodeURIComponent(userId);
    const jiraAuthUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${encodeURIComponent(
      clientId
    )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&prompt=consent`;

    return NextResponse.redirect(jiraAuthUrl);
  }

  // Simulation fallback: mark connected in integrations
  try {
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "jira")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await insforge.database.from("integrations").insert([
        { user_id: userId, platform: "jira", connected: true }
      ]);
    }
  } catch (err) {
    console.error("Jira connect simulation failed:", err);
  }

  return NextResponse.redirect(`${origin}/dashboard/integrations?connected=jira`);
}
