import { NextResponse } from "next/server";
import { whatsappManager } from "@/lib/whatsapp";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const status = whatsappManager.getStatus(userId);
  return NextResponse.json({
    success: true,
    ...status,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const status = whatsappManager.getStatus(userId);
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
