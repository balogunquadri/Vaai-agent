import { NextResponse } from "next/server";
import { exchangeCodeForTokens as exchange, persistLarkTokensForUser } from "@/lib/larkClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || ""; // userId
  const pkce_cookie = req.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("lark_pkce="));
  const code_verifier = pkce_cookie ? decodeURIComponent(pkce_cookie.split("=")[1]) : undefined;
  const redirect = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/lark-callback` : (process.env.LARK_REDIRECT_URI || "");

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  try {
    const tokens = await exchange(code, redirect, code_verifier as any);
    await persistLarkTokensForUser(state, tokens as any);

    const html = `<!doctype html><html><body><script>window.localStorage.setItem('connected_lark','1');window.location.replace('/dashboard/integrations?connected=lark');</script></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("Lark callback failed", err);
    return NextResponse.redirect(`/dashboard/integrations?error=lark_oauth_failed`);
  }
}
