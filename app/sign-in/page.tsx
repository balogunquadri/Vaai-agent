"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { insforge } from "@/lib/insforge";

export default function SignIn() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If already signed in, redirect to home page
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await insforge.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      if (data) {
        await refreshUser();
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await insforge.auth.signInWithOAuth("google", {
        redirectTo: window.location.origin,
      });
      if (error) {
        setErrorMsg(error.message || "Could not sign in with Google.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
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
            Welcome Back
          </h2>
          <p className="text-zinc-400 text-sm">
            Sign in to access your unified virtual assistant workspace
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              >
                Password
              </label>
            </div>
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
                "Sign In"
              )}
            </div>
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <span className="relative px-3 bg-[#0a061b] text-xs text-zinc-500 uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Google Workspace</span>
        </button>

        <p className="mt-8 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <a
            href="/sign-up"
            onClick={(e) => {
              e.preventDefault();
              router.push("/sign-up");
            }}
            className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Create account
          </a>
        </p>
      </div>
    </div>
  );
}
