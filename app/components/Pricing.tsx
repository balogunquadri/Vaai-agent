"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

export default function Pricing() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleUnlockPro = async () => {
    if (!profile?.email) {
      router.push("/sign-up");
      return;
    }

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, name: profile.name }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout.");
    }
  };

  const handleContactEnterprise = async () => {
    // show modal form
    setShowContact(true);
  };

  const [showContact, setShowContact] = useState(false);
  const [contactEmail, setContactEmail] = useState(profile?.email || "");
  const [contactMessage, setContactMessage] = useState("");

  const submitContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!contactEmail) {
      alert("Please enter your email.");
      return;
    }

    try {
      const res = await fetch("/api/stripe/custom-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contactEmail, name: profile?.name || "", message: contactMessage }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Request sent. Our sales team will contact you.");
        setShowContact(false);
        setContactMessage("");
      } else {
        alert(data.error || "Failed to request custom plan.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to request custom plan.");
    }
  };

  return (
    <section id="pricing" className="relative py-24 bg-[#030014] overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[55vw] rounded-full bg-violet-950/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-violet-400 mb-3">
            Pricing Plans
          </h2>
          <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Flexible Plans for Any Scale
          </p>
          <p className="mt-4 text-zinc-400 text-base md:text-lg">
            Choose a plan that fits your personal or organizational workflow. Get started for free.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Card 1: Free */}
          <div className="rounded-3xl glass-panel p-8 border border-white/5 bg-black/20 flex flex-col justify-between hover:border-white/10 transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-zinc-300">Starter Sandbox</h3>
              <p className="text-xs text-zinc-500 mt-1">Perfect for personal trial</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-zinc-500 text-xs font-semibold">/month</span>
              </div>

              <div className="h-[1px] bg-white/5 my-6" />

              <ul className="space-y-4 text-xs text-zinc-400 text-left">
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Connect up to 3 platform apps</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Standard summarization updates</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Email customer support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/sign-up")}
              className="mt-8 w-full py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Card 2: Professional (Most Popular with glow border) */}
          <div className="rounded-3xl glass-panel p-8 border border-violet-500/30 bg-zinc-950/60 flex flex-col justify-between relative shadow-2xl shadow-violet-600/5 hover:border-violet-500/50 transition-colors duration-300">
            {/* Pop Tag */}
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-[10px] font-bold text-white tracking-wider uppercase">
              Most Popular
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Pro Workspace</h3>
              <p className="text-xs text-violet-300 mt-1">For power users & professionals</p>
              
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">$20</span>
                    <span className="text-zinc-400 text-xs font-semibold">/month</span>
                  </div>

              <div className="h-[1px] bg-white/10 my-6" />

              <ul className="space-y-4 text-xs text-zinc-300 text-left">
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Connect up to 15 endpoints</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-time cross-app action flows</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Smart Zoom & Meet briefings</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority Slack Support channel</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleUnlockPro}
              id="unlock-pro-btn"
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-xs font-semibold text-white shadow-lg hover:shadow-violet-600/20 transition-all cursor-pointer hover:scale-[1.01]"
            >
              Unlock Pro Now
            </button>
          </div>

          {/* Card 3: Enterprise */}
          <div className="rounded-3xl glass-panel p-8 border border-white/5 bg-black/20 flex flex-col justify-between hover:border-white/10 transition-colors duration-300">
            <div>
              <h3 className="text-lg font-bold text-zinc-300">Custom Business</h3>
              <p className="text-xs text-zinc-500 mt-1">For organizational automation</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-zinc-500 text-xs font-semibold">/month</span>
              </div>

              <div className="h-[1px] bg-white/5 my-6" />

              <ul className="space-y-4 text-xs text-zinc-400 text-left">
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited platforms & connections</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom webhook trigger setup</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>HIPAA & GDPR private hosting</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated accounts engineer</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleContactEnterprise}
              className="mt-8 w-full py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
            >
              Contact Enterprise
            </button>
          </div>

        </div>
      </div>

      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={submitContact} className="w-full max-w-lg p-6 rounded-xl bg-zinc-900 border border-white/5">
            <h3 className="text-lg font-bold mb-2">Request a Custom Plan</h3>
            <p className="text-sm text-zinc-400 mb-4">We'll email your request to our sales team.</p>

            <label className="text-xs text-zinc-400">Your email</label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-3 rounded bg-black/20 border border-white/5 text-white mb-3" />

            <label className="text-xs text-zinc-400">Message</label>
            <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} className="w-full p-3 rounded bg-black/20 border border-white/5 text-white mb-4" />

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowContact(false)} className="px-4 py-2 rounded bg-white/5 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-violet-600 text-white text-sm">Send</button>
            </div>
          </form>
        </div>
      )}

    </section>
  );
}
