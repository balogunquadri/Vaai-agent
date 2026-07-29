"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-[#030014]/80 backdrop-blur-md border-b border-white/5 py-4"
          : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform duration-300">
            <svg
              className="w-5 h-5 text-white"
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
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-400 blur-sm opacity-55 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            Va-Ai<span className="text-cyan-400 font-extrabold">.</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", id: "features" },
            { label: "Integrations", id: "integrations" },
            { label: "AI Playground", id: "playground" },
            { label: "Pricing", id: "pricing" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 cursor-pointer relative py-1 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || "User"}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                    {(profile?.name || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-zinc-300">
                  Dashboard
                </span>
              </button>
              <button
                onClick={signOut}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => router.push("/sign-in")}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => router.push("/sign-up")}
                className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-400 rounded-xl" />
                <div className="px-6 py-2.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-950/20 text-white font-medium text-sm transition-all duration-300 relative flex items-center gap-1.5">
                  <span>Try Assistant</span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white focus:outline-none cursor-pointer p-1"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[73px] left-0 right-0 bottom-0 bg-[#030014]/95 backdrop-blur-lg border-t border-white/5 z-40 flex flex-col p-6 animate-fade-in">
          <div className="flex flex-col gap-6 mt-4">
            {[
              { label: "Features", id: "features" },
              { label: "Integrations", id: "integrations" },
              { label: "AI Playground", id: "playground" },
              { label: "Pricing", id: "pricing" },
              { label: "FAQ", id: "faq" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-left text-lg font-medium text-zinc-300 hover:text-white py-2 border-b border-white/5 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-4 mb-8">
            {loading ? (
              <div className="w-full h-12 bg-white/5 rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full cursor-pointer"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || "User"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-sm font-bold text-violet-300">
                      {(profile?.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-white">
                      Go to Dashboard
                    </span>
                    <span className="text-xs text-zinc-500">{user.email}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-center py-3 text-zinc-400 font-medium border border-white/5 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/sign-in");
                  }}
                  className="w-full text-center py-3 text-zinc-300 font-medium border border-white/10 rounded-xl hover:bg-white/5 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push("/sign-up");
                  }}
                  className="w-full text-center py-3 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  Try Assistant Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
