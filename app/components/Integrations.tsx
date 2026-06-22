"use client";

import React, { useState } from "react";

interface AppNode {
  id: string;
  name: string;
  category: "chat" | "mail" | "doc" | "video" | "pm" | "design";
  color: string; // Tailwind glow classes
  iconColor: string; // Gradient color for icon
  connected: boolean;
}

export default function Integrations() {
  const [apps, setApps] = useState<AppNode[]>([
    { id: "gmail", name: "Gmail", category: "mail", color: "shadow-red-500/20 text-red-400", iconColor: "from-red-500 to-rose-600", connected: true },
    { id: "whatsapp", name: "WhatsApp", category: "chat", color: "shadow-emerald-500/20 text-emerald-400", iconColor: "from-emerald-500 to-green-600", connected: false },
    { id: "telegram", name: "Telegram", category: "chat", color: "shadow-sky-400/20 text-sky-400", iconColor: "from-sky-400 to-blue-500", connected: true },
    { id: "outlook", name: "Outlook", category: "mail", color: "shadow-blue-600/20 text-blue-400", iconColor: "from-blue-600 to-indigo-700", connected: false },
    { id: "slack", name: "Slack", category: "chat", color: "shadow-amber-500/20 text-amber-400", iconColor: "from-amber-400 via-rose-500 to-indigo-600", connected: true },
    { id: "trello", name: "Trello", category: "pm", color: "shadow-cyan-500/20 text-cyan-400", iconColor: "from-blue-500 to-cyan-500", connected: false },
    { id: "jira", name: "Jira", category: "pm", color: "shadow-blue-600/20 text-blue-500", iconColor: "from-blue-600 to-blue-800", connected: false },
    { id: "asana", name: "Asana", category: "pm", color: "shadow-rose-500/20 text-rose-400", iconColor: "from-rose-500 via-orange-500 to-amber-500", connected: false },
    { id: "gmeet", name: "Google Meet", category: "video", color: "shadow-emerald-600/20 text-emerald-400", iconColor: "from-emerald-600 via-yellow-500 to-red-500", connected: true },
    { id: "zoom", name: "Zoom", category: "video", color: "shadow-blue-500/20 text-blue-400", iconColor: "from-blue-500 to-sky-400", connected: false },
    { id: "notion", name: "Notion", category: "doc", color: "shadow-zinc-600/20 text-zinc-300", iconColor: "from-zinc-700 to-zinc-950", connected: true },
    { id: "canva", name: "Canva", category: "design", color: "shadow-purple-500/20 text-purple-400", iconColor: "from-purple-500 to-indigo-600", connected: false },
    { id: "gdocs", name: "Google Docs", category: "doc", color: "shadow-blue-500/20 text-blue-400", iconColor: "from-blue-500 to-indigo-600", connected: true },
    { id: "gsheets", name: "Google Sheets", category: "doc", color: "shadow-green-500/20 text-green-400", iconColor: "from-green-500 to-emerald-600", connected: true },
    { id: "gdrive", name: "Google Drive", category: "doc", color: "shadow-yellow-500/20 text-yellow-400", iconColor: "from-yellow-500 via-green-500 to-blue-500", connected: true },
  ]);

  const toggleConnection = (id: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === id ? { ...app, connected: !app.connected } : app
      )
    );
  };

  const connectedCount = apps.filter((app) => app.connected).length;

  return (
    <section id="integrations" className="relative py-24 bg-[#030014] overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-violet-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Title Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-6 text-left">
            <h2 className="text-xs uppercase tracking-widest font-extrabold text-violet-400 mb-3">
              App Connections
            </h2>
            <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              One-Click Secure <br />Integrations
            </p>
            <p className="mt-4 text-zinc-400 text-base md:text-lg leading-relaxed">
              Connect your communication chats, productivity workflows, and document files securely. Grant permission with standard OAuth protocols—no passwords shared.
            </p>
          </div>
          <div className="lg:col-span-6 flex justify-start lg:justify-end">
            <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row gap-6 items-center">
              <div className="text-center md:text-left">
                <div className="text-3xl font-extrabold text-white">{connectedCount} / {apps.length}</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Endpoints Connected</div>
              </div>
              <div className="h-[1px] w-full md:h-12 md:w-[1px] bg-white/10" />
              <div className="text-center md:text-left">
                <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 justify-center md:justify-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  256-bit AES Vault
                </div>
                <div className="text-xs text-zinc-400 mt-1">GDPR & SOC-2 compliance approved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive App Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`rounded-2xl glass-panel p-5 flex flex-col items-center justify-between text-center transition-all duration-300 relative group ${
                app.connected
                  ? "border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)] bg-zinc-950/40"
                  : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/40"
              }`}
            >
              {/* Central Connection Dot */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    app.connected ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
              </div>

              {/* Icon Container */}
              <div className="relative mt-2 mb-4 group-hover:scale-110 transition-transform duration-300">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${app.iconColor} p-[1px] shadow-lg`}
                >
                  <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center font-bold text-white text-base">
                    {app.name.charAt(0)}
                  </div>
                </div>
                {app.connected && (
                  <div className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-tr ${app.iconColor} opacity-25 blur-md -z-10`} />
                )}
              </div>

              {/* Details */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-white leading-none">{app.name}</h4>
                <span className="text-[10px] uppercase font-bold text-zinc-500 mt-1.5 block tracking-wider">
                  {app.category}
                </span>
              </div>

              {/* Connect Toggle Button */}
              <button
                onClick={() => toggleConnection(app.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  app.connected
                    ? "bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600 hover:text-white"
                    : "bg-white/5 text-zinc-300 border border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-xs flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            All keys are encrypted locally using the WebCrypto API. Under no circumstances do we read raw login passwords.
          </p>
        </div>

      </div>
    </section>
  );
}
