import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, phoneNumber } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const pairingCode = await whatsappManager.connect(userId, phoneNumber);
    const status = whatsappManager.getStatus(userId);

    return NextResponse.json({
      success: true,
      pairingCode,
      status: status.state,
    });
  } catch (error: any) {
    console.error("Error connecting WhatsApp:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
