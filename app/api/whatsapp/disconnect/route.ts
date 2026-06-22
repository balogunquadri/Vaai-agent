import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await whatsappManager.disconnect(userId);

    return NextResponse.json({
      success: true,
      message: "WhatsApp disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error disconnecting WhatsApp:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
