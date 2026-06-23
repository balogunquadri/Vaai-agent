import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe SDK v12 requires the API version/options as the second argument
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2022-11-15" });

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body: any = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        console.error("auto-subscribe-starter: invalid JSON body:", text);
        return NextResponse.json({ error: "invalid_json", raw: text }, { status: 400 });
      }
    }

    const email = body.email || "";
    const name = body.name || "";
    const userId = body.userId || "";

    // Create a Stripe customer and mark as starter in metadata
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId, plan: "starter" },
    });

    // We don't create a paid subscription for starter (free tier).
    return NextResponse.json({ ok: true, customerId: customer.id });
  } catch (err: any) {
    console.error("auto-subscribe-starter error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
