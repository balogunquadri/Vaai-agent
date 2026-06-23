"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";

export default function Hero() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleUpgrade = async () => {
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
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to create checkout session.");
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout.");
    }
  };
  // Mock platforms for a moving marquee
  const platforms = [
    { name: "Gmail", iconColor: "from-red-500 to-rose-600", desc: "Mail" },
    { name: "WhatsApp", iconColor: "from-emerald-500 to-green-600", desc: "Chat" },
    { name: "Telegram", iconColor: "from-sky-400 to-blue-500", desc: "Chat" },
    { name: "Outlook", iconColor: "from-blue-600 to-indigo-700", desc: "Mail" },
    { name: "Slack", iconColor: "from-amber-400 via-rose-500 to-indigo-600", desc: "Collab" },
    { name: "Trello", iconColor: "from-blue-500 to-cyan-500", desc: "Task" },
    { name: "Jira", iconColor: "from-blue-600 to-blue-800", desc: "Dev" },
    { name: "Asana", iconColor: "from-rose-500 via-orange-500 to-amber-500", desc: "PM" },
    { name: "Google Meet", iconColor: "from-emerald-600 via-yellow-500 to-red-500", desc: "Video" },
    { name: "Zoom", iconColor: "from-blue-500 to-sky-400", desc: "Video" },
    { name: "Notion", iconColor: "from-zinc-700 to-zinc-950", desc: "Docs" },
    { name: "Canva", iconColor: "from-purple-500 to-indigo-600", desc: "Design" },
    { name: "Google Docs", iconColor: "from-blue-500 to-indigo-600", desc: "Word" },
    { name: "Google Sheets", iconColor: "from-green-500 to-emerald-600", desc: "Data" },
    { name: "Google Drive", iconColor: "from-yellow-500 via-green-500 to-blue-500", desc: "Cloud" },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden min-h-screen flex flex-col justify-center">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none animate-glow-pulse" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] max-w-[450px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none animate-glow-pulse [animation-delay:2s]" />

      {/* Grid Dots overlay */}
      <div className="absolute inset-0 grid-dots opacity-80 pointer-events-none -z-20" />

      {/* Slanted gradient divider */}
      <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#05021a] to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10 w-full text-center flex flex-col items-center">
        {/* Tag/Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/10 mb-6 animate-float">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">
            Introducing V-AI Agent v2.5
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-white max-w-4xl">
          Your AI Virtual & Spy Assistant That <br />
          <span className="text-gradient">Runs Your Workflow</span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          <strong className="text-zinc-200">Monitor </strong>Your Competitors While <strong className="text-zinc-200">you Connect Slack, Gmail, Notion</strong>, and 15+ other platforms. <br />Let your personal AI agent Monitor Your Competitors, automate summaries, extract action items, and trigger cross-app actions automatically.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              const el = document.getElementById("playground");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Connect Workspace</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>See How it Works</span>
          </button>

          <button
            onClick={handleUpgrade}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-black font-semibold hover:scale-[1.02] transition-all"
          >
            Upgrade — $20 / month
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-2xl">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-4">Supported Integrations</span>
          <div className="flex flex-wrap gap-x-6 gap-y-3 items-center justify-center opacity-65 hover:opacity-100 transition-opacity duration-300">
            <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Google Suite
            </span>
            <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> WhatsApp & Telegram
            </span>
            <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Slack & Teams
            </span>
            <span className="text-zinc-400 font-semibold text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Jira & Asana
            </span>
          </div>
        </div>
      </div>

      {/* Ticker of Apps scrolling horizontally for a premium vibe */}
      <div className="w-full mt-24 py-6 border-y border-white/5 bg-zinc-950/40 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-2 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Supported Platforms & Sync Nodes</p>
        </div>
        <div className="relative w-full flex">
          {/* Moving track */}
          <div className="flex gap-8 py-2 animate-[grid-move_30s_linear_infinite] whitespace-nowrap min-w-full justify-around">
            {[...platforms, ...platforms].map((platform, i) => (
              <div
                key={platform.name + i}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors duration-200"
              >
                <div className={`w-3.5 h-3.5 rounded-md bg-gradient-to-tr ${platform.iconColor} shadow-md`} />
                <span className="text-xs font-semibold text-zinc-300">{platform.name}</span>
                <span className="text-[9px] text-zinc-500 px-1 py-0.2 rounded bg-white/5">{platform.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
