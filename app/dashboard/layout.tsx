"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    setResendStatus("idle");
    try {
      const response = await fetch("/api/emails/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: profile?.name || "" }),
      });
      if (response.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch (err) {
      console.error(err);
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const isUnverified = profile !== null && profile.confirmed === false;
  const isSubRoute = pathname !== "/dashboard";

  return (
    <div
      className="flex min-h-screen bg-background text-foreground overflow-hidden"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      data-dashboard-theme="dark"
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: "transparent" }}>
        
        {/* Verification Alert Banner */}
        {isUnverified && (
          <div className="mx-8 mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <p className="font-medium text-zinc-300">
                <span className="text-amber-400 font-bold">Verification Pending:</span> Please verify your email to unlock all advanced assistant features (Spy, Integrations, Triggers, Briefings).
              </p>
            </div>
            <button
              onClick={handleResend}
              disabled={resending || resendStatus === "sent"}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wide uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {resending ? "Sending..." : resendStatus === "sent" ? "Sent ✓" : "Resend Link"}
            </button>
          </div>
        )}

        {/* Content Area or Lock Screen */}
        {isUnverified && isSubRoute ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl text-center space-y-6 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Email Verification Required
                </h2>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                  To view and configure this feature, you must first verify your email address. Check your inbox for the link we sent to <span className="text-zinc-200 font-medium">{user.email}</span>.
                </p>
              </div>

              {resendStatus === "error" && (
                <p className="text-red-400 text-[10px] font-semibold">
                  Failed to resend confirmation email. Please try again later.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleResend}
                  disabled={resending || resendStatus === "sent"}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : resendStatus === "sent" ? (
                    "Verification Link Sent ✓"
                  ) : (
                    "Resend Verification Link"
                  )}
                </button>
                
                <button
                  onClick={() => signOut()}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
