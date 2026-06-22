"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ComingSoon() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-[#030014] text-white px-6">
      <div className="max-w-md text-center space-y-6 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Feature Coming Soon</h2>
        <p className="text-zinc-400 text-sm">
          This panel is currently under active development. In the meantime, feel free to configure your active app connections in the Integrations tab!
        </p>
        <button
          onClick={() => router.push("/dashboard/integrations")}
          className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none cursor-pointer w-full"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-400 rounded-xl" />
          <div className="w-full py-2.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-950/20 text-white font-medium text-sm transition-all duration-300 relative flex items-center justify-center">
            Go to Integrations
          </div>
        </button>
      </div>
    </div>
  );
}
