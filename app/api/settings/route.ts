import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

// GET: Retrieve user's settings profile
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

    // 1. Fetch user profile from users table
    const { data: userData, error: userError } = await admin.database
      .from("users")
      .select()
      .eq("id", userId)
      .maybeSingle();

    if (userError) throw userError;

    // 2. Fetch custom settings row from integrations table
    const { data: settingsRow, error: settingsError } = await admin.database
      .from("integrations")
      .select()
      .eq("user_id", userId)
      .eq("platform", "settings")
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Defaults
    const defaultSettings = {
      profile: {
        name: userData?.name || "Test User",
        email: userData?.email || "",
        phone: "+1234567890",
        avatar_url: userData?.avatar_url || "",
        timezone: "America/New_York",
        assistant_context: "I am a growth marketer focused on B2B SaaS startup campaigns, tracking pipeline updates and security vulnerabilities.",
      },
      appearance: {
        theme: "dark",
        primary_color: "violet",
      },
      ai_agent: {
        tone: "Warm & Engaging",
      },
      briefing: {
        default_categories: ["email", "messages", "tasks", "followUps"],
        frequency: "daily",
        scheduled_time: "08:00",
      },
      alerts: {
        default_notification_method: "in-app",
        keyword_filter: "failed,error,revoked,unauthorized",
        default_priority: "high",
        enable_whatsapp_copy: false,
      },
      billing: {
        plan: "Pro",
        status: "Active",
        renewal_date: "2026-07-18T12:00:00Z",
        auto_renew: true,
      },
    };

    const savedState = settingsRow?.state || {};

    // Merge saved state with defaults
    const mergedSettings = {
      profile: { ...defaultSettings.profile, ...savedState.profile, name: userData?.name || defaultSettings.profile.name, avatar_url: userData?.avatar_url || defaultSettings.profile.avatar_url },
      appearance: { ...defaultSettings.appearance, ...savedState.appearance },
      ai_agent: { ...defaultSettings.ai_agent, ...savedState.ai_agent },
      briefing: { ...defaultSettings.briefing, ...savedState.briefing },
      alerts: { ...defaultSettings.alerts, ...savedState.alerts },
      billing: { ...defaultSettings.billing, ...savedState.billing },
    };

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
    });
  } catch (error: any) {
    console.error("GET settings failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save user settings config
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json({ error: "Missing userId or settings payload" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    // 1. Update public.users table (name & avatar)
    const profile = settings.profile || {};
    const { error: userUpdateError } = await admin.database
      .from("users")
      .update({
        name: profile.name,
        avatar_url: profile.avatar_url,
      })
      .eq("id", userId);

    if (userUpdateError) throw userUpdateError;

    // 2. Fetch or Upsert integrations row for platform = settings
    const { data: existing } = await admin.database
      .from("integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "settings")
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await admin.database
        .from("integrations")
        .update({
          state: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await admin.database
        .from("integrations")
        .insert([
          {
            user_id: userId,
            platform: "settings",
            connected: true,
            state: settings,
          },
        ]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("POST settings failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
