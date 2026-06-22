"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { insforge } from "@/lib/insforge";

export default function SignUp() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If already signed in, redirect to home page
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await insforge.auth.signUp({
        email,
        password,
        name,
        redirectTo: window.location.origin + "/sign-in",
      });

      if (error) {
        setErrorMsg(error.message || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      if (data) {
        if (data.requireEmailVerification) {
          setSuccessMsg("Account created! Please check your email to verify your address.");
          setLoading(false);
        } else {
          // Logged in automatically
          await refreshUser();
          try {
            // auto-subscribe to starter plan (creates Stripe customer and marks starter in metadata)
            await fetch("/api/stripe/auto-subscribe-starter", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name }),
            });
          } catch (e) {
            console.warn("auto-subscribe failed:", e);
          }

          // send confirmation email via Resend
          try {
            await fetch("/api/emails/send-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name }),
            });
          } catch (e) {
            console.warn("send-confirmation failed:", e);
          }

          router.push("/");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030014] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030014] px-6 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[80px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[80px] -z-10 animate-pulse" />

      {/* Grid Dots */}
      <div className="absolute inset-0 grid-dots opacity-20 -z-20" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 relative shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push("/");
            }}
            className="flex items-center gap-2 group cursor-pointer mb-4"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              V-AI<span className="text-cyan-400 font-extrabold">.</span>
            </span>
          </a>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            Create Account
          </h2>
          <p className="text-zinc-400 text-sm">
            Get started with your unified virtual assistant workspace
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-zinc-950/60 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-zinc-950/60 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-950/60 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none cursor-pointer mt-2 disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-400 rounded-xl" />
            <div className="w-full py-3 rounded-xl bg-zinc-950/90 hover:bg-zinc-950/20 text-white font-medium text-sm transition-all duration-300 relative flex items-center justify-center gap-1.5">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign Up"
              )}
            </div>
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <a
            href="/sign-in"
            onClick={(e) => {
              e.preventDefault();
              router.push("/sign-in");
            }}
            className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
