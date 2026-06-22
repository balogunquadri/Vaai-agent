import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (clientId) {
    const redirectUri = `${origin}/auth/discord-callback`;
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
      "identify email guilds"
    )}${userId ? `&state=${encodeURIComponent(userId)}` : ""}`;

    return NextResponse.redirect(discordUrl);
  }

  // If no client configured, simulate a successful connect by recording the integration
  try {
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "discord")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await insforge.database.from("integrations").insert([
        { user_id: userId, platform: "discord", connected: true }
      ]);
    }
  } catch (err) {
    console.error("Discord connect simulation failed:", err);
  }

  return NextResponse.redirect(`${origin}/dashboard/integrations?connected=discord`);
}
