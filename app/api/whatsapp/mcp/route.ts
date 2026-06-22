import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, toolName, args } = body;

    if (!userId || !toolName) {
      return NextResponse.json({ error: "Missing userId or toolName" }, { status: 400 });
    }

    const result = await whatsappManager.executeMcp(userId, toolName, args || {});

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error executing WhatsApp MCP tool:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
