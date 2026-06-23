import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2022-11-15" });

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let body: any = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        console.error("create-checkout-session: invalid JSON body:", text);
        return NextResponse.json({ error: "invalid_json", raw: text }, { status: 400 });
      }
    }

    const email = body.email || "";
    const name = body.name || "";

    const origin = new URL(req.url).origin;

    // create or reuse customer
    const customer = await stripe.customers.create({ email, name });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Pro Plan" },
            recurring: { interval: "month" },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/plans?checkout=success`,
      cancel_url: `${origin}/dashboard/plans?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
