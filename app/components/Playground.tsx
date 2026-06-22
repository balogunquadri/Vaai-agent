"use client";

import React, { useState, useEffect } from "react";

interface PromptScenario {
  id: string;
  title: string;
  prompt: string;
  response: React.ReactNode;
}

export default function Playground() {
  const [activeScenarioId, setActiveScenarioId] = useState("gmail");
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(true);

  const scenarios: PromptScenario[] = [
    {
      id: "gmail",
      title: "Summarize Inbound Emails",
      prompt: "Extract key points from my last 5 Gmail emails from clients",
      response: (
        <div className="space-y-4 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold text-[10px] border border-red-500/10">GMAIL</span>
            <span className="text-zinc-500 text-[10px]">Analyzed 5 messages</span>
          </div>
          <p className="text-sm text-zinc-300 font-medium">Here is your high-priority client summary:</p>
          <ul className="space-y-2.5 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <div>
                <strong className="text-zinc-200">Acme Corp (John):</strong> Requested contract revision by Friday. Wants to add SLA terms.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <div>
                <strong className="text-zinc-200">Venture Cap (Sarah):</strong> Confirmed pitch slot is moved to Monday at 10 AM.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <div>
                <strong className="text-zinc-200">Design Lead (Marco):</strong> Sent updated Canva links. Needs approvals.
              </div>
            </li>
          </ul>
          <div className="mt-4 p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-[11px] text-violet-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span>Drafted replies for Acme Corp & Sarah. Click to review in drafts folder.</span>
          </div>
        </div>
      ),
    },
    {
      id: "slack",
      title: "Slack to Jira Flow",
      prompt: "Find urgent bugs in #ops and create Jira tasks",
      response: (
        <div className="space-y-4 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold text-[10px] border border-amber-500/10">SLACK</span>
            <span className="text-zinc-500 text-[10px]">Scanned #ops channel</span>
          </div>
          <p className="text-sm text-zinc-300 font-medium">I found 1 urgent incident and created a tracking ticket:</p>
          <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-red-400 uppercase">JIRA BUG CREATED</span>
              <span className="text-[10px] text-zinc-500 font-mono">PROJ-882</span>
            </div>
            <h4 className="text-xs font-bold text-white">Payment gateway timeout during checkout flow</h4>
            <p className="text-[11px] text-zinc-400">
              Reported by Dave: "Seeing multiple gateway 504 errors on Stripe checkout endpoints."
            </p>
            <div className="flex gap-2 items-center pt-1">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold">P1 - CRITICAL</span>
              <span className="text-[9px] text-zinc-500">Assignee: Unassigned</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            ✅ Slack notification sent to <strong className="text-zinc-200">@dave</strong> confirming Ticket PROJ-882 was logged.
          </div>
        </div>
      ),
    },
    {
      id: "asana",
      title: "Asana & Calendar Sync",
      prompt: "Generate my morning standup notes from Asana & Zoom agenda",
      response: (
        <div className="space-y-4 font-sans">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold text-[10px] border border-rose-500/10">ASANA</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold text-[10px] border border-blue-500/10">ZOOM</span>
            <span className="text-zinc-500 text-[10px]">Standup Prep</span>
          </div>
          <p className="text-sm text-zinc-300 font-medium">Here are your standup speaking notes for today:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <input type="checkbox" checked readOnly className="mt-1 accent-violet-500 rounded border-white/10 bg-zinc-950" />
              <span className="text-xs text-zinc-400">
                <strong className="text-zinc-200">Finished yesterday:</strong> Completed the Canva landing assets export and notified client.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <input type="checkbox" readOnly className="mt-1 accent-violet-500 rounded border-white/10 bg-zinc-950" />
              <span className="text-xs text-zinc-300">
                <strong className="text-zinc-200">Focusing on today:</strong> Review Slack feedback thread from marketing team and update Asana ticket.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <input type="checkbox" readOnly className="mt-1 accent-violet-500 rounded border-white/10 bg-zinc-950" />
              <span className="text-xs text-zinc-300">
                <strong className="text-zinc-200">Blockers:</strong> Waiting for Google Doc pricing updates from John (due in Google Drive).
              </span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 border-t border-white/5 pt-2">
            📅 Next meeting: Zoom Product Sync in 1h 45m.
          </div>
        </div>
      ),
    },
  ];

  const handleScenarioChange = (id: string) => {
    setShowResponse(false);
    setIsTyping(true);
    setActiveScenarioId(id);
  };

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        setShowResponse(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <section id="playground" className="relative py-24 bg-[#05021a] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-cyan-400 mb-3">
            Interactive playground
          </h2>
          <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            See the AI Agent in Action
          </p>
          <p className="mt-4 text-zinc-400 text-base md:text-lg">
            Select an automation scenario below to test-drive how the virtual assistant parses raw communication data and generates workflows.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Panel: Prompt Selector */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <span className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider mb-2 block">
              Choose a scenario to run
            </span>
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => handleScenarioChange(s.id)}
                className={`p-5 rounded-2xl text-left border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                  activeScenarioId === s.id
                    ? "bg-zinc-900/90 border-violet-500/40 shadow-lg shadow-violet-500/5"
                    : "bg-black/30 border-white/5 hover:border-white/10 hover:bg-black/40"
                }`}
              >
                {activeScenarioId === s.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-violet-500 to-cyan-400" />
                )}
                <h4 className="text-sm font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
                  {s.title}
                </h4>
                <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                  "{s.prompt}"
                </p>
              </button>
            ))}
          </div>

          {/* Right Panel: Simulated Chat Interface */}
          <div className="lg:col-span-8 flex flex-col rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden min-h-[380px]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-zinc-950/40">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">V-AI Sandbox Assistant</h4>
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wide">AI Sandbox Instance</span>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 space-y-6 flex flex-col justify-between">
              
              {/* User Prompt */}
              <div className="flex gap-3 items-start self-end max-w-[85%]">
                <div className="p-4 rounded-2xl rounded-tr-none bg-violet-600 text-white text-xs font-medium shadow-md shadow-violet-600/10">
                  {activeScenario.prompt}
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 border border-white/5">
                  YOU
                </div>
              </div>

              {/* AI Response Output */}
              <div className="flex gap-3 items-start self-start max-w-[85%] w-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  AI
                </div>
                
                <div className="flex-1 p-5 rounded-2xl rounded-tl-none bg-black/40 border border-white/5 shadow-inner min-h-[160px] flex items-center justify-start">
                  
                  {isTyping && (
                    <div className="flex gap-1 items-center py-2 px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}

                  {!isTyping && showResponse && (
                    <div className="w-full text-left animate-[grid-move_0.3s_ease-out_forwards]">
                      {activeScenario.response}
                    </div>
                  )}
                  
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
