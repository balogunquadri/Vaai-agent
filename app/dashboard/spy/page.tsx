"use client";

import React, { useState, useRef, useEffect } from "react";
import CompareForm from "../../components/spy/CompareForm";
import { SpyResultResponse } from "../../../types/spy";
import { useAuth } from "../../components/AuthProvider";
import { insforge } from "@/lib/insforge";

function parseState(state: any): any {
  if (!state) return {};
  let stateObj = state;
  if (typeof stateObj === "string") {
    try {
      stateObj = JSON.parse(stateObj);
    } catch (e) {
      console.error("Failed to parse state string:", e);
      return {};
    }
  }
  while (stateObj && typeof stateObj === "object" && "0" in stateObj) {
    const keys = Object.keys(stateObj).filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);
    let str = "";
    for (const k of keys) {
      str += stateObj[k];
    }
    try {
      stateObj = JSON.parse(str);
    } catch (e) {
      console.error("Failed to parse reconstructed state:", e);
      break;
    }
  }
  return stateObj || {};
}

export default function SpyDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpyResultResponse | null>(null);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [activePlatformTab, setActivePlatformTab] = useState("instagram");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tasks integrations
  const [addingTaskMap, setAddingTaskMap] = useState<Record<string, boolean>>({});
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // History list state
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await insforge.database
        .from("integrations")
        .select()
        .eq("platform", "spy_cache");
      
      if (!error && data) {
        const list = data.map((row: any) => {
          const stateObj = parseState(row.state);
          return {
            id: row.id,
            key: stateObj.key,
            targets: stateObj.key ? stateObj.key.split("_vs_") : [],
            expiresAt: stateObj.expiresAt,
            payload: stateObj.payload,
            updatedAt: row.updated_at
          };
        });
        setHistoryList(list);
      }
    } catch (e) {
      console.error("Failed to load audit history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handleSelectHistoryItem = (item: any) => {
    setResult({
      success: true,
      data: item.payload
    });
  };

  const handleAddTask = async (title: string, description: string) => {
    if (!user) {
      alert("Error: Active user session not found. Please log in.");
      return;
    }
    const taskKey = `${title}_${description}`;
    setAddingTaskMap(prev => ({ ...prev, [taskKey]: true }));
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title,
          description,
          priority: "medium"
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully added to your dashboard tasks: "${title}"!`);
      } else {
        alert(data.error || "Failed to add task.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to connect to tasks API.");
    } finally {
      setAddingTaskMap(prev => ({ ...prev, [taskKey]: false }));
    }
  };

  const toggleItemCompleted = (itemKey: string) => {
    setCompletedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const renderStructuredReport = (report: any) => {
    return (
      <div className="space-y-8 animate-fade-in text-xs">
        
        {/* Executive Summary */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 bg-gradient-to-r from-violet-900/10 to-cyan-900/10 border border-violet-500/20">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Executive Summary
          </h3>
          <p className="text-zinc-300 text-xs leading-relaxed">{report.executiveSummary}</p>
        </div>

        {/* SWOT Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">
            ⚔️ SWOT Analysis Matrix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/[0.01] hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3 mb-4">
                <span className="text-lg">💪</span>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Strengths</h4>
              </div>
              <ul className="space-y-3">
                {report.strengths?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>{item}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="glass-panel rounded-3xl p-6 border border-rose-500/20 bg-rose-500/[0.01] hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-2 border-b border-rose-500/10 pb-3 mb-4">
                <span className="text-lg">⚠️</span>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Weaknesses</h4>
              </div>
              <ul className="space-y-3">
                {report.weaknesses?.map((item: string, idx: number) => {
                  const taskKey = `weakness_${idx}`;
                  return (
                    <li key={idx} className="flex items-start justify-between gap-3 text-zinc-300 leading-relaxed text-[11px]">
                      <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <div>{item}</div>
                      </div>
                      {user && (
                        <button
                          type="button"
                          onClick={() => handleAddTask(`Fix Weakness: ${item.slice(0, 50)}...`, `From SWOT Weaknesses: ${item}`)}
                          disabled={addingTaskMap[taskKey]}
                          className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[9px] font-bold shrink-0 transition-all cursor-pointer select-none"
                        >
                          {addingTaskMap[taskKey] ? "..." : "+ Task"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="glass-panel rounded-3xl p-6 border border-violet-500/20 bg-violet-500/[0.01] hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-2 border-b border-violet-500/10 pb-3 mb-4">
                <span className="text-lg">💡</span>
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Opportunities</h4>
              </div>
              <ul className="space-y-3">
                {report.opportunities?.map((item: string, idx: number) => {
                  const taskKey = `opp_${idx}`;
                  return (
                    <li key={idx} className="flex items-start justify-between gap-3 text-zinc-300 leading-relaxed text-[11px]">
                      <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <div>{item}</div>
                      </div>
                      {user && (
                        <button
                          type="button"
                          onClick={() => handleAddTask(`Replicate Opp: ${item.slice(0, 50)}...`, `From SWOT Opportunities: ${item}`)}
                          disabled={addingTaskMap[taskKey]}
                          className="px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-[9px] font-bold shrink-0 transition-all cursor-pointer select-none"
                        >
                          {addingTaskMap[taskKey] ? "..." : "+ Task"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Threats */}
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 bg-amber-500/[0.01] hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-2 border-b border-amber-500/10 pb-3 mb-4">
                <span className="text-lg">🛡️</span>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Threats</h4>
              </div>
              <ul className="space-y-3">
                {report.threats?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <div>{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Enabled Insights */}
        {(report.seoInsights || report.socialInsights || report.aiFootprintInsights) && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">
              📈 Audit Domain Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {report.seoInsights && (
                <div className="glass-panel rounded-2xl p-5 border border-cyan-500/10 bg-cyan-500/[0.005]">
                  <h5 className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider mb-2">SEO Insights</h5>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{report.seoInsights}</p>
                </div>
              )}
              {report.socialInsights && (
                <div className="glass-panel rounded-2xl p-5 border border-violet-500/10 bg-violet-500/[0.005]">
                  <h5 className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider mb-2">Social Insights</h5>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{report.socialInsights}</p>
                </div>
              )}
              {report.aiFootprintInsights && (
                <div className="glass-panel rounded-2xl p-5 border border-rose-500/10 bg-rose-500/[0.005]">
                  <h5 className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider mb-2">AI Footprint Insights</h5>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{report.aiFootprintInsights}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 30-Day Stepper Timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-wider">
            🚀 30-Day Growth & Replication Timeline
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Days 1-10 */}
            <div className="glass-panel rounded-3xl p-6 border border-card-border/60 bg-foreground/[0.005] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border-color/30 pb-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] font-extrabold text-cyan-400 shrink-0">1</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Days 1 - 10: Setup & Audit</h4>
                </div>
                <div className="space-y-4">
                  {report.planDays1to10?.map((item: string, idx: number) => {
                    const itemKey = `plan1_${idx}`;
                    const isCompleted = !!completedItems[itemKey];
                    return (
                      <div key={idx} className="flex items-start justify-between gap-3 text-zinc-300 text-[11px] leading-relaxed border-b border-border-color/10 pb-2 last:border-b-0">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={() => toggleItemCompleted(itemKey)}
                            className="mt-1 w-3.5 h-3.5 rounded border border-card-border bg-card-bg accent-violet-600 cursor-pointer shrink-0" 
                          />
                          <span className={isCompleted ? "line-through text-zinc-500" : ""}>{item}</span>
                        </label>
                        {user && (
                          <button
                            type="button"
                            onClick={() => handleAddTask(`Plan D1-10: ${item.slice(0, 50)}...`, `Action Plan Phase 1: ${item}`)}
                            disabled={addingTaskMap[itemKey]}
                            className="px-1.5 py-0.5 rounded bg-foreground/[0.04] hover:bg-foreground/[0.08] text-zinc-400 hover:text-white text-[9px] shrink-0 cursor-pointer"
                          >
                            {addingTaskMap[itemKey] ? "..." : "+ Task"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Days 11-20 */}
            <div className="glass-panel rounded-3xl p-6 border border-card-border/60 bg-foreground/[0.005] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border-color/30 pb-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-extrabold text-violet-400 shrink-0">2</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Days 11 - 20: Execution</h4>
                </div>
                <div className="space-y-4">
                  {report.planDays11to20?.map((item: string, idx: number) => {
                    const itemKey = `plan2_${idx}`;
                    const isCompleted = !!completedItems[itemKey];
                    return (
                      <div key={idx} className="flex items-start justify-between gap-3 text-zinc-300 text-[11px] leading-relaxed border-b border-border-color/10 pb-2 last:border-b-0">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={() => toggleItemCompleted(itemKey)}
                            className="mt-1 w-3.5 h-3.5 rounded border border-card-border bg-card-bg accent-violet-600 cursor-pointer shrink-0" 
                          />
                          <span className={isCompleted ? "line-through text-zinc-500" : ""}>{item}</span>
                        </label>
                        {user && (
                          <button
                            type="button"
                            onClick={() => handleAddTask(`Plan D11-20: ${item.slice(0, 50)}...`, `Action Plan Phase 2: ${item}`)}
                            disabled={addingTaskMap[itemKey]}
                            className="px-1.5 py-0.5 rounded bg-foreground/[0.04] hover:bg-foreground/[0.08] text-zinc-400 hover:text-white text-[9px] shrink-0 cursor-pointer"
                          >
                            {addingTaskMap[itemKey] ? "..." : "+ Task"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Days 21-30 */}
            <div className="glass-panel rounded-3xl p-6 border border-card-border/60 bg-foreground/[0.005] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border-color/30 pb-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-[10px] font-extrabold text-rose-400 shrink-0">3</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Days 21 - 30: Scale & Sync</h4>
                </div>
                <div className="space-y-4">
                  {report.planDays21to30?.map((item: string, idx: number) => {
                    const itemKey = `plan3_${idx}`;
                    const isCompleted = !!completedItems[itemKey];
                    return (
                      <div key={idx} className="flex items-start justify-between gap-3 text-zinc-300 text-[11px] leading-relaxed border-b border-border-color/10 pb-2 last:border-b-0">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={() => toggleItemCompleted(itemKey)}
                            className="mt-1 w-3.5 h-3.5 rounded border border-card-border bg-card-bg accent-violet-600 cursor-pointer shrink-0" 
                          />
                          <span className={isCompleted ? "line-through text-zinc-500" : ""}>{item}</span>
                        </label>
                        {user && (
                          <button
                            type="button"
                            onClick={() => handleAddTask(`Plan D21-30: ${item.slice(0, 50)}...`, `Action Plan Phase 3: ${item}`)}
                            disabled={addingTaskMap[itemKey]}
                            className="px-1.5 py-0.5 rounded bg-foreground/[0.04] hover:bg-foreground/[0.08] text-zinc-400 hover:text-white text-[9px] shrink-0 cursor-pointer"
                          >
                            {addingTaskMap[itemKey] ? "..." : "+ Task"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    );
  };

  // Simulated progress steps during analysis
  const progressSteps = [
    "Scraping domain meta tags & headers...",
    "Querying SEO organic keywords & visibility API...",
    "Analyzing social media handles & share counts...",
    "Aggregating Similarweb traffic referrals & footprints...",
    "Formatting competitive payload for Gemini AI...",
    "Compiling SWOT Analysis & 30-day growth plans...",
  ];

  // Start progress step simulation
  const startProgressSimulation = () => {
    setIsLoading(true);
    setResult(null);
    setError("");
    setActiveStep(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < progressSteps.length - 1) {
          return prev + 1;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }
      });
    }, 2000);
  };

  const handleAnalyzeComplete = (res: SpyResultResponse) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setResult(res);
    setIsLoading(false);
    fetchHistory(); // Refresh history list
  };

  const handleAnalyzeError = (err: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setError(err);
    setIsLoading(false);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    let html = text
      .replace(/### (.*)/g, '<h4 class="text-sm font-bold text-foreground mt-6 mb-2">$1</h4>')
      .replace(/#### (.*)/g, '<h5 class="text-xs font-bold text-zinc-300 mt-4 mb-1">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\* (.*)/g, '<li class="text-xs text-zinc-400 ml-4 list-disc my-1">$1</li>')
      .replace(/> \[!NOTE\]\s*>\s*(.*)/g, '<div class="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-violet-300 text-xs my-3 flex items-start gap-2"><span class="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0"></span><div>$1</div></div>')
      .replace(/> (.*)/g, '<blockquote class="border-l-2 border-zinc-600 pl-3 italic text-zinc-400 my-2">$1</blockquote>')
      .replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="space-y-1 text-xs text-zinc-300 leading-relaxed" 
      />
    );
  };

  const copyToClipboard = () => {
    if (result?.data?.aiReport) {
      const textToCopy = typeof result.data.aiReport === "string"
        ? result.data.aiReport
        : JSON.stringify(result.data.aiReport, null, 2);
      
      let finalCopyText = textToCopy;
      try {
        const parsed = JSON.parse(textToCopy);
        if (parsed && typeof parsed === "object") {
          // Format it as clean readable text for easy sharing
          finalCopyText = `SWOT COMPETITIVE AUDIT REPORT

EXECUTIVE SUMMARY:
${parsed.executiveSummary || ""}

STRENGTHS:
${parsed.strengths?.map((s: string) => `- ${s}`).join("\n") || ""}

WEAKNESSES:
${parsed.weaknesses?.map((w: string) => `- ${w}`).join("\n") || ""}

OPPORTUNITIES:
${parsed.opportunities?.map((o: string) => `- ${o}`).join("\n") || ""}

THREATS:
${parsed.threats?.map((t: string) => `- ${t}`).join("\n") || ""}

30-DAY TIMELINE:
- Days 1-10:
${parsed.planDays1to10?.map((p: string) => `  * ${p}`).join("\n") || ""}
- Days 11-20:
${parsed.planDays11to20?.map((p: string) => `  * ${p}`).join("\n") || ""}
- Days 21-30:
${parsed.planDays21to30?.map((p: string) => `  * ${p}`).join("\n") || ""}
`;
        }
      } catch (e) {}

      navigator.clipboard.writeText(finalCopyText);
      alert("Comparative Report copied to clipboard!");
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in text-foreground">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🕵️ Spy Competitor Hub
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Conduct real-time competitive analysis, extract telemetry data, and run SWOT comparisons using Gemini.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <CompareForm
        onAnalyzeStart={startProgressSimulation}
        onAnalyzeComplete={handleAnalyzeComplete}
        onAnalyzeError={handleAnalyzeError}
      />

      {/* History Archive list */}
      {!isLoading && !result && historyList.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-color pb-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              📜 Past Compare Audits
            </h3>
            <span className="text-[10px] text-zinc-550 font-medium">Select a past run to view telemetry instantly</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyList.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                className="p-4 rounded-2xl bg-card-bg/20 border border-card-border/80 hover:border-violet-500/30 hover:scale-[1.01] hover:bg-card-bg/40 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white font-bold truncate">
                    <span className="text-violet-400 font-extrabold">{item.targets[0] || "Target A"}</span>
                    <span className="text-zinc-500 text-[10px] lowercase font-normal">vs</span>
                    <span className="text-cyan-400 font-extrabold">{item.targets[1] || "Target B"}</span>
                  </div>
                  <p className="text-[9px] text-zinc-550 mt-1">
                    Expires: {new Date(item.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-[10px] text-violet-400 group-hover:text-violet-300 font-bold text-right transition-colors">
                  Load Audit &gt;
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="glass-panel rounded-3xl p-8 max-w-4xl mx-auto space-y-6 text-center animate-pulse-slow">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Running Spy Audits</h3>
              <p className="text-zinc-400 text-xs">This takes about 10-15 seconds to fetch data and query Gemini...</p>
            </div>
          </div>
          
          <div className="max-w-md mx-auto bg-foreground/[0.02] border border-card-border rounded-2xl p-4 text-left space-y-2">
            {progressSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs transition-opacity duration-300">
                {idx < activeStep ? (
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                ) : idx === activeStep ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
                )}
                <span className={idx === activeStep ? "text-cyan-400 font-medium" : idx < activeStep ? "text-zinc-400" : "text-zinc-650"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {result && result.data && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Side-by-Side Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Site Card */}
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-violet-500 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={result.data.companyA.metadata.favicon}
                  alt="Favicon"
                  className="w-10 h-10 rounded-xl bg-violet-600/10 p-1 object-contain shrink-0 border border-violet-500/20"
                  onError={(e) => { (e.target as any).src = "https://www.google.com/s2/favicons?sz=64&domain=google.com"; }}
                />
                <div>
                  <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider block">Primary Brand / Company A</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{result.data.companyA.metadata.title}</h3>
                  <a
                    href={result.data.companyA.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-violet-400 text-xs transition-colors truncate block max-w-sm"
                  >
                    {result.data.companyA.url}
                  </a>
                  <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed">{result.data.companyA.metadata.description}</p>
                </div>
              </div>
            </div>

            {/* Competitor Site Card */}
            <div className="glass-panel rounded-3xl p-6 border-l-4 border-cyan-500 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={result.data.companyB.metadata.favicon}
                  alt="Favicon"
                  className="w-10 h-10 rounded-xl bg-cyan-600/10 p-1 object-contain shrink-0 border border-cyan-500/20"
                  onError={(e) => { (e.target as any).src = "https://www.google.com/s2/favicons?sz=64&domain=google.com"; }}
                />
                <div>
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Competitor Brand / Company B</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{result.data.companyB.metadata.title}</h3>
                  <a
                    href={result.data.companyB.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-cyan-400 text-xs transition-colors truncate block max-w-sm"
                  >
                    {result.data.companyB.url}
                  </a>
                  <p className="text-zinc-400 text-[11px] mt-2 leading-relaxed">{result.data.companyB.metadata.description}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Social Telemetry Details Grid */}
          {((result.data.companyA.socialTelemetry && result.data.companyA.socialTelemetry.length > 0) || 
            (result.data.companyB.socialTelemetry && result.data.companyB.socialTelemetry.length > 0)) && (
            <div className="glass-panel rounded-3xl p-6 space-y-6">
              {/* Platform Selector Tabs */}
              <div className="flex flex-col gap-4 border-b border-border-color pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    📱 Social Presence Telemetry Comparison
                  </h3>
                  <span className="text-[10px] text-zinc-550 font-medium">Select platform to inspect details</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {["instagram", "youtube", "tiktok", "twitter", "facebook", "linkedin"].map((platform) => {
                    const telemetryA = result.data?.companyA?.socialTelemetry?.find(t => t.platform === platform);
                    const telemetryB = result.data?.companyB?.socialTelemetry?.find(t => t.platform === platform);
                    const isAnyLinkValid = (telemetryA?.isLinkValid) || (telemetryB?.isLinkValid);
                    const isSelected = activePlatformTab === platform;
                    
                    const platformLabels: Record<string, string> = {
                      instagram: "📸 Instagram",
                      youtube: "🎥 YouTube",
                      tiktok: "🎵 TikTok",
                      twitter: "🐦 Twitter / X",
                      facebook: "👥 Facebook",
                      linkedin: "💼 LinkedIn"
                    };
                    
                    return (
                      <button
                        key={platform}
                        onClick={() => setActivePlatformTab(platform)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-transparent shadow-md"
                            : isAnyLinkValid
                              ? "bg-card-bg/40 border-card-border/80 text-zinc-300 hover:text-white hover:border-zinc-700"
                              : "bg-card-bg/10 border-card-border/20 text-zinc-500 line-through decoration-zinc-650"
                        }`}
                      >
                        {platformLabels[platform] || platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company A Telemetry */}
                {(() => {
                  const telemetry = result.data?.companyA?.socialTelemetry?.find(t => t.platform === activePlatformTab);
                  if (!telemetry) return <div className="text-zinc-600 text-xs italic">No telemetry data for this platform.</div>;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border-color/50 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                          Company A ({telemetry.platform.toUpperCase()})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          telemetry.isLinkValid
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {telemetry.isLinkValid ? "✓ Active" : "✗ Unreachable"}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Handle Name</span>
                          <span className="text-white font-bold">{telemetry.handle}</span>
                          <p className={`text-[10px] font-mono mt-0.5 ${
                            telemetry.isLinkValid ? "text-zinc-400" : "text-red-400 font-semibold"
                          }`}>{telemetry.linkStatusText}</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Primary Content Type</span>
                          <span className="text-zinc-300">{telemetry.contentType}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Estimated Virality Score</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500" 
                                style={{ width: `${telemetry.viralityScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold text-white shrink-0">
                              {telemetry.viralityScore}/100
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Uniqueness Factors</span>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-400 text-[11px]">
                            {telemetry.uniquenessFactors.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Actionable Improvements</span>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-400 text-[11px]">
                            {telemetry.improvementPoints.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Company B Telemetry */}
                {(() => {
                  const telemetry = result.data?.companyB?.socialTelemetry?.find(t => t.platform === activePlatformTab);
                  if (!telemetry) return <div className="text-zinc-600 text-xs italic">No telemetry data for this platform.</div>;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border-color/50 pb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          Company B ({telemetry.platform.toUpperCase()})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          telemetry.isLinkValid
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {telemetry.isLinkValid ? "✓ Active" : "✗ Unreachable"}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Handle Name</span>
                          <span className="text-white font-bold">{telemetry.handle}</span>
                          <p className={`text-[10px] font-mono mt-0.5 ${
                            telemetry.isLinkValid ? "text-zinc-400" : "text-red-400 font-semibold"
                          }`}>{telemetry.linkStatusText}</p>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Primary Content Type</span>
                          <span className="text-zinc-300">{telemetry.contentType}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Estimated Virality Score</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500" 
                                style={{ width: `${telemetry.viralityScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold text-white shrink-0">
                              {telemetry.viralityScore}/100
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Uniqueness Factors</span>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-400 text-[11px]">
                            {telemetry.uniquenessFactors.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Actionable Improvements</span>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-400 text-[11px]">
                            {telemetry.improvementPoints.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Metrics */}
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-wider border-b border-border-color pb-3">
              📊 Numerical Target Benchmarks
            </h3>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-color text-zinc-500 font-semibold">
                    <th className="py-3 px-2">Metric Channel</th>
                    <th className="py-3 px-2">Company A (Primary)</th>
                    <th className="py-3 px-2">Company B (Competitor)</th>
                    <th className="py-3 px-2 text-right">Delta / Comparison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  
                  {/* SEO Metrics */}
                  {result.data.companyA.seo && result.data.companyB.seo && (
                    <>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">SEO Visibility Score</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.seo.visibilityScore}%</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.seo.visibilityScore}%</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.seo.visibilityScore >= result.data.companyB.seo.visibilityScore
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.seo.visibilityScore >= result.data.companyB.seo.visibilityScore ? "+" : ""}
                            {result.data.companyA.seo.visibilityScore - result.data.companyB.seo.visibilityScore}%
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Organic Keywords</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.seo.organicKeywords.toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.seo.organicKeywords.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.seo.organicKeywords >= result.data.companyB.seo.organicKeywords
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.seo.organicKeywords >= result.data.companyB.seo.organicKeywords ? "+" : ""}
                            {(result.data.companyA.seo.organicKeywords - result.data.companyB.seo.organicKeywords).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Total Backlinks</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.seo.backlinksCount.toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.seo.backlinksCount.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.seo.backlinksCount >= result.data.companyB.seo.backlinksCount
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.seo.backlinksCount >= result.data.companyB.seo.backlinksCount ? "+" : ""}
                            {(result.data.companyA.seo.backlinksCount - result.data.companyB.seo.backlinksCount).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Social Metrics */}
                  {result.data.companyA.social && result.data.companyB.social && (
                    <>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Facebook Share Engagement</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.social.facebookShares.toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.social.facebookShares.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.social.facebookShares >= result.data.companyB.social.facebookShares
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.social.facebookShares >= result.data.companyB.social.facebookShares ? "+" : ""}
                            {(result.data.companyA.social.facebookShares - result.data.companyB.social.facebookShares).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Reddit Share Mentions</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.social.redditShares.toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.social.redditShares.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.social.redditShares >= result.data.companyB.social.redditShares
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.social.redditShares >= result.data.companyB.social.redditShares ? "+" : ""}
                            {(result.data.companyA.social.redditShares - result.data.companyB.social.redditShares).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* AI Footprint Metrics */}
                  {result.data.companyA.ai && result.data.companyB.ai && (
                    <>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">AI Search Engine Referrals (est)</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.ai.referralsFromAI.toLocaleString()}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.ai.referralsFromAI.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            result.data.companyA.ai.referralsFromAI >= result.data.companyB.ai.referralsFromAI
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {result.data.companyA.ai.referralsFromAI >= result.data.companyB.ai.referralsFromAI ? "+" : ""}
                            {(result.data.companyA.ai.referralsFromAI - result.data.companyB.ai.referralsFromAI).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Similarweb Global Rank</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.ai.similarwebGlobalRank?.toLocaleString() || "N/A"}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.ai.similarwebGlobalRank?.toLocaleString() || "N/A"}</td>
                        <td className="py-3 px-2 text-right">
                          {result.data.companyA.ai.similarwebGlobalRank && result.data.companyB.ai.similarwebGlobalRank ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              result.data.companyA.ai.similarwebGlobalRank <= result.data.companyB.ai.similarwebGlobalRank
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}>
                              {/* Lower rank is better */}
                              {result.data.companyA.ai.similarwebGlobalRank <= result.data.companyB.ai.similarwebGlobalRank ? "Lead" : "Behind"}
                            </span>
                          ) : "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-white">Similarweb Bounce Rate</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyA.ai.bounceRate}</td>
                        <td className="py-3 px-2 text-zinc-350">{result.data.companyB.ai.bounceRate}</td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Telemetry</span>
                        </td>
                      </tr>
                    </>
                  )}

                </tbody>
              </table>
            </div>
          </div>

          {/* Gemini AI SWOT & Strategy Report */}
          {result.data.aiReport && (
            <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-glow-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    🤖 Gemini SWOT & Replication Report
                  </h3>
                </div>
                
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3.5 py-1.5 rounded-xl bg-card-bg border border-card-border text-zinc-300 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Report
                </button>
              </div>

              <div className="p-4 md:p-6 bg-foreground/[0.01] border border-card-border/60 rounded-2xl">
                {(() => {
                  let parsedReport = null;
                  try {
                    parsedReport = typeof result.data.aiReport === "string" ? JSON.parse(result.data.aiReport) : result.data.aiReport;
                  } catch (e) {
                    // Raw markdown string fallback
                  }

                  if (parsedReport && typeof parsedReport === "object" && parsedReport.strengths) {
                    return renderStructuredReport(parsedReport);
                  } else {
                    return renderMarkdown(typeof result.data.aiReport === "string" ? result.data.aiReport : JSON.stringify(result.data.aiReport));
                  }
                })()}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
