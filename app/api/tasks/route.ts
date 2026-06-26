import { NextResponse } from "next/server";
import { createAdminClient } from "@insforge/sdk";

// POST: Create a new task inside integrations table under platform "task"
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, description, priority = "medium" } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields: userId, title" }, { status: 400 });
    }

    const admin = createAdminClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      apiKey: process.env.INSFORGE_API_KEY!,
    });

    const taskConfig = {
      title,
      description: description || "",
      status: "pending",
      priorityLevel: priority,
      createdAt: new Date().toISOString(),
    };

    const { data: newRow, error } = await admin.database
      .from("integrations")
      .insert([
        {
          user_id: userId,
          platform: "task",
          connected: true,
          state: taskConfig,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task: {
        id: newRow.id,
        ...taskConfig,
      },
    });
  } catch (error: any) {
    console.error("POST task failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
