"use client";

import React, { useState } from "react";
import { SpyOptions, SpyResultResponse } from "../../../types/spy";

interface CompareFormProps {
  onAnalyzeStart: () => void;
  onAnalyzeComplete: (result: SpyResultResponse) => void;
  onAnalyzeError: (error: string) => void;
}

export default function CompareForm({
  onAnalyzeStart,
  onAnalyzeComplete,
  onAnalyzeError,
}: CompareFormProps) {
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [options, setOptions] = useState<SpyOptions>({
    seoAudit: true,
    socialPresence: true,
    aiFootprint: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!urlA.trim() || !urlB.trim()) {
      setError("Please specify both primary and competitor targets (domains, handles, or links).");
      return;
    }

    // Ensure at least one check is active
    if (!options.seoAudit && !options.socialPresence && !options.aiFootprint) {
      setError("Please check at least one analysis target ('SEO Audit', 'Social Presence', or 'AI Footprint').");
      return;
    }

    setIsLoading(true);
    onAnalyzeStart();

    const pollJobStatus = (jobId: string) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/spy/status?jobId=${jobId}`);
          if (!res.ok) {
            throw new Error("Failed to fetch job status.");
          }
          const pollResult = await res.json();
          if (pollResult.success) {
            if (pollResult.status === "completed") {
              clearInterval(interval);
              setIsLoading(false);
              onAnalyzeComplete({
                success: true,
                data: pollResult.data
              });
            } else if (pollResult.status === "failed") {
              clearInterval(interval);
              setIsLoading(false);
              const errMsg = pollResult.error || "Intelligence generation failed in background.";
              setError(errMsg);
              onAnalyzeError(errMsg);
            }
            // If status is "pending" or "running", just continue polling
          } else {
            clearInterval(interval);
            setIsLoading(false);
            const errMsg = pollResult.error || "Error checking job status.";
            setError(errMsg);
            onAnalyzeError(errMsg);
          }
        } catch (err: any) {
          clearInterval(interval);
          setIsLoading(false);
          const errMsg = err.message || "Failed during status polling.";
          setError(errMsg);
          onAnalyzeError(errMsg);
        }
      }, 2000);
    };

    try {
      const response = await fetch("/api/spy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urlA: urlA.trim(),
          urlB: urlB.trim(),
          options,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.fromCache) {
          setIsLoading(false);
          onAnalyzeComplete(result);
        } else {
          pollJobStatus(result.jobId);
        }
      } else {
        const errorMsg = result.error || "Failed to retrieve spy reports.";
        setError(errorMsg);
        onAnalyzeError(errorMsg);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = "Network error. Please check your connection and try again.";
      setError(errorMsg);
      onAnalyzeError(errorMsg);
      setIsLoading(false);
    }
  };

  const toggleOption = (key: keyof SpyOptions) => {
    setOptions((prev: SpyOptions) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 max-w-4xl mx-auto shadow-xl"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white tracking-wide">
          🕵️ Competitor Target Configuration
        </h2>
        <p className="text-zinc-400 text-xs">
          Provide your primary target and a competitor's target (domains, handles, video links, etc.) to run side-by-side analysis and generate AI growth strategies.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
          <svg
            className="w-4 h-4 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Your Target / Handle / URL A
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 text-xs">
              Target A:
            </span>
            <input
              type="text"
              required
              disabled={isLoading}
              placeholder="e.g. mysite.com or @mybrand"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              className="w-full pl-22 pr-4 py-3 bg-card-bg/60 border border-card-border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Competitor Target / Handle / URL B
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-cyan-400 text-xs font-semibold">
              Target B:
            </span>
            <input
              type="text"
              required
              disabled={isLoading}
              placeholder="e.g. competitor.com or @competitor"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              className="w-full pl-22 pr-4 py-3 bg-card-bg/60 border border-card-border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Checkboxes Wrapper */}
      <div className="space-y-3">
        <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
          Select Intel Layers to Fetch
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* SEO Checkbox */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => toggleOption("seoAudit")}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none disabled:opacity-50 ${
              options.seoAudit
                ? "bg-violet-600/10 border-violet-500/40 text-white"
                : "bg-card-bg/30 border-card-border text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="mt-0.5">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  options.seoAudit
                    ? "bg-violet-500 border-violet-400"
                    : "border-zinc-600 bg-transparent"
                }`}
              >
                {options.seoAudit && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold leading-normal">SEO Audit</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                Organic visibility, keywords volume, and backlink count.
              </p>
            </div>
          </button>

          {/* Social Presence Checkbox */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => toggleOption("socialPresence")}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none disabled:opacity-50 ${
              options.socialPresence
                ? "bg-cyan-600/10 border-cyan-500/40 text-white"
                : "bg-card-bg/30 border-card-border text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="mt-0.5">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  options.socialPresence
                    ? "bg-cyan-500 border-cyan-400"
                    : "border-zinc-600 bg-transparent"
                }`}
              >
                {options.socialPresence && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold leading-normal">Social Presence</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                Public profile share metrics and verified handle analysis.
              </p>
            </div>
          </button>

          {/* AI Footprint Checkbox */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => toggleOption("aiFootprint")}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none disabled:opacity-50 ${
              options.aiFootprint
                ? "bg-pink-600/10 border-pink-500/40 text-white"
                : "bg-card-bg/30 border-card-border text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="mt-0.5">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  options.aiFootprint
                    ? "bg-pink-500 border-pink-400"
                    : "border-zinc-600 bg-transparent"
                }`}
              >
                {options.aiFootprint && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold leading-normal">AI Footprint</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                Similarweb global rankings, referral volume, and AI discovery.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Running Audits...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Execute Spy Audits
            </>
          )}
        </button>
      </div>
    </form>
  );
}
