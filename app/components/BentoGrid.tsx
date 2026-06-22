"use client";

import React, { useState } from "react";

export default function BentoGrid() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      title: "Receive Request",
      app: "Slack",
      desc: "Client messages: 'Need update on design review in Trello'",
      color: "border-pink-500/30 text-pink-400 bg-pink-500/10",
    },
    {
      title: "Analyze Docs",
      app: "Google Sheets",
      desc: "Extract project statuses and design link from Canva",
      color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Generate Summary",
      app: "AI Engine",
      desc: "Compile draft: 'Task is 80% complete, feedback is positive'",
      color: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    },
    {
      title: "Notify Stakeholders",
      app: "Telegram & Gmail",
      desc: "Send summary to team and email the client",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-[#05021a] overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-purple-950/20 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-cyan-400 mb-3">
            Bento Features Grid
          </h2>
          <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Supercharged AI Capabilities
          </p>
          <p className="mt-4 text-zinc-400 text-lg leading-relaxed">
            Consolidate notification streams, automate documentation, and orchestrate actions across all tools with built-in semantic understanding.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Multi-Channel Synthesis (col-span-8) */}
          <div className="md:col-span-8 rounded-3xl glass-panel border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="max-w-lg relative z-10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Universal Communication Synthesis</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Connect Outlook, Gmail, WhatsApp, and Slack. V-AI acts as a centralized brain, reading inbound traffic to extract key action items, tasks, and urgencies.
              </p>
            </div>

            {/* Visual Workspace Mockup */}
            <div className="w-full bg-zinc-950/60 rounded-xl border border-white/5 p-4 mt-2 font-mono text-xs">
              <div className="flex gap-2 mb-3 border-b border-white/5 pb-2 text-[10px] text-zinc-500">
                <span>INBOX MERGED FEED</span>
                <span className="text-violet-400 ml-auto">Updated Just Now</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-400 font-bold text-[10px] w-20">WhatsApp</span>
                  <span className="text-zinc-300 truncate">"Can we push the meeting to 4pm instead of 2?"</span>
                </div>
                <div className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-zinc-400 font-bold text-[10px] w-20">Gmail</span>
                  <span className="text-zinc-300 truncate">"Please review the attached contract before Asana setup."</span>
                </div>
                <div className="flex gap-2 items-center bg-violet-500/10 p-2 rounded-lg border border-violet-500/20">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-400 font-bold text-[10px] w-20">AI Summary</span>
                  <span className="text-violet-200 truncate font-semibold">"WhatsApp: Reschedule Meet. Gmail: Action needed on contract Doc."</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Autonomous Reminders (col-span-4) */}
          <div className="md:col-span-4 rounded-3xl glass-panel border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[40px] rounded-full pointer-events-none" />
            
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Reminders</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Never miss alignment calls. AI monitors Calendar, Zoom, and Google Meet to remind you 10 minutes prior with summarized pre-meeting notes.
              </p>
            </div>

            {/* Smart Calendar Preview */}
            <div className="bg-cyan-950/20 border border-cyan-500/10 rounded-2xl p-4 mt-2">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2">Next Scheduled Event</div>
              <div className="text-sm font-semibold text-white">Google Meet: Sync (Canva Assets)</div>
              <div className="text-xs text-zinc-400 mt-1">Starting in 9 mins</div>
              <div className="mt-3 text-[10px] bg-black/40 p-2 rounded text-zinc-400 border border-white/5 leading-normal">
                💡 <strong className="text-white">Prep:</strong> Read Notion doc #CanvaFeedback before joining.
              </div>
            </div>
          </div>

          {/* Card 3: Privacy & Locker (col-span-4) */}
          <div className="md:col-span-4 rounded-3xl glass-panel border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-[40px] rounded-full pointer-events-none" />
            
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6 text-pink-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Vault Privacy</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Your credentials and API tokens are encrypted client-side. We utilize SOC-2 compliant secure storage so your Slack & Gmail data remains 100% private.
              </p>
            </div>

            {/* Privacy Badges */}
            <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-zinc-400 font-bold">AES-256 Bit Encryption</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[9px]">
                SECURE
              </span>
            </div>
          </div>

          {/* Card 4: Cross-App Workflows (col-span-8) */}
          <div className="md:col-span-8 rounded-3xl glass-panel border border-white/10 p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="max-w-lg relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Automated Orchestration Trigger</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Orchestrate multi-step flows. Design rules where inputs in one app trigger automations in another. Click the steps below to see the chain of execution.
              </p>
            </div>

            {/* Interactive Workflow Node Visual */}
            <div className="mt-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {workflowSteps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveWorkflowStep(index)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      activeWorkflowStep === index
                        ? "bg-zinc-900 border-white/20 shadow-md shadow-white/5"
                        : "bg-black/30 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="text-[10px] text-zinc-500 font-bold mb-1">STEP 0{index + 1}</div>
                    <div className="text-xs font-bold text-white truncate">{step.title}</div>
                    <div className="text-[9px] text-zinc-400 mt-1 truncate">{step.app}</div>
                  </button>
                ))}
              </div>

              {/* Step Detail Card */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${workflowSteps[activeWorkflowStep].color}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {workflowSteps[activeWorkflowStep].app} Activity
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/20">Active Node</span>
                </div>
                <p className="text-xs text-white/90 mt-2 font-mono">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
