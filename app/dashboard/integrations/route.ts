import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const dest = `/dashboard?tab=integrations${query ? `&${query}` : ""}`;
  return NextResponse.redirect(new URL(dest, request.url));
}
