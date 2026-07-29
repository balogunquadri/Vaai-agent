"use client";

import React, { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="relative bg-[#030014] border-t border-white/5 pt-20 pb-12 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-violet-900/5 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Info (col-span-4) */}
          <div className="md:col-span-4 flex flex-col items-start text-left">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Va-Ai<span className="text-cyan-400 font-extrabold">.</span>
              </span>
            </a>
            
            <p className="mt-4 text-xs text-zinc-400 max-w-xs leading-relaxed">
              Orchestrate notifications, summaries, and actions across 15+ workspaces in real-time. Powering workspace intelligence for teams.
            </p>

            {/* Socials */}
            <div className="mt-6 flex gap-4">
              {["twitter", "github", "linkedin"].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">{social.slice(0, 2)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links columns (col-span-4 total: 2 cols of 2) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8 text-left">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">Features</a>
                </li>
                <li>
                  <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">FAQ Support</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Privacy & Legal</h4>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Security Vault</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">GDPR / SOC-2</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter (col-span-4) */}
          <div className="md:col-span-4 flex flex-col text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Stay Synchronized</h4>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Get product updates, automation templates, and monthly dev summaries.
            </p>

            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Thank you! You have been subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-600/10 cursor-pointer"
                >
                  Join
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 font-mono">
          <span>&copy; {new Date().getFullYear()} Va-Ai Inc. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Stateless Cloud Infrastructure Verified
          </span>
        </div>
      </div>
    </footer>
  );
}
