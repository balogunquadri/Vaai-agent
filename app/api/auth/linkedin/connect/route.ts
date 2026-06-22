import { NextResponse, NextRequest } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "";
  const urlObj = new URL(request.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (clientId) {
    const redirectUri = `${origin}/auth/linkedin-callback`;
    const scopes = ["r_liteprofile", "r_emailaddress", "w_member_social"].join(" ");
    const linkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}${userId ? `&state=${encodeURIComponent(userId)}` : ""}`;

    return NextResponse.redirect(linkedinUrl);
  }

  // Simulation fallback: mark connected in integrations
  try {
    const { data: existing } = await insforge.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "linkedin")
      .maybeSingle();

    if (existing) {
      await insforge.database
        .from("integrations")
        .update({ connected: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await insforge.database.from("integrations").insert([
        { user_id: userId, platform: "linkedin", connected: true }
      ]);
    }
  } catch (err) {
    console.error("LinkedIn connect simulation failed:", err);
  }

  return NextResponse.redirect(`${origin}/dashboard/integrations?connected=linkedin`);
}
