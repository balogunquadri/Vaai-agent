"use client";
 
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "./AuthProvider";
import {
  Grid2X2Icon,
  AiBrain01Icon,
  NotebookIcon,
  AiSearchIcon,
  PlugIcon,
  BellIcon,
  Settings01Icon,
  CircleDollarSignIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
 
export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, profile } = useAuth();
 
  const mainNavItems = [
    { label: "Dashboard", icon: Grid2X2Icon, bg: "bg-blue-600", path: "/dashboard" },
    { label: "AI Agent", icon: AiBrain01Icon, bg: "bg-purple-600", path: "/dashboard/ai-agent" },
    { label: "Briefing", icon: NotebookIcon, bg: "bg-amber-600", path: "/dashboard/briefing" },
    { label: "Spy", icon: AiSearchIcon, bg: "bg-cyan-600", path: "/dashboard/spy" },
    { label: "Integrations", icon: PlugIcon, bg: "bg-pink-600", path: "/dashboard/integrations" },
    { label: "Alerts", icon: BellIcon, bg: "bg-rose-600", path: "/dashboard/alerts" },
    { label: "Settings", icon: Settings01Icon, bg: "bg-zinc-600", path: "/dashboard/settings" },
  ];
 
  const bottomNavItems = [
    { label: "Plans", icon: CircleDollarSignIcon, bg: "bg-emerald-600", path: "/dashboard/plans" },
    { label: "Pricing Settings", icon: CircleDollarSignIcon, bg: "bg-emerald-600", path: "/dashboard/settings?tab=pricing" },
  ];

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isItemActive = (itemPath: string) => {
    // Check if pathname matches or is subpath
    if (itemPath.includes("?")) {
      const basePath = itemPath.split("?")[0];
      const tabName = itemPath.split("=")[1];
      return pathname === basePath && typeof window !== "undefined" && window.location.search.includes(tabName);
    }
    return pathname === itemPath;
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar-bg border-r border-border-color transition-all duration-300 relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header: Logo & Toggle */}
      <div className="flex items-center justify-between p-5 border-b border-border-color">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={() => handleNavigation("/")}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shrink-0 cursor-pointer"
          >
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
          </button>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground font-sans">
              V-AI<span className="text-cyan-400 font-extrabold">.</span>
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-zinc-400 hover:text-foreground p-1.5 rounded-lg hover:bg-foreground/[0.05] transition-colors cursor-pointer ${
            isCollapsed ? "absolute right-0 translate-x-1/2 top-5 bg-sidebar-bg border border-border-color rounded-full z-20" : ""
          }`}
        >
          <HugeiconsIcon
            icon={isCollapsed ? ArrowRight01Icon : ArrowLeft01Icon}
            size={18}
          />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {mainNavItems.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 group cursor-pointer ${
                isActive
                  ? "bg-foreground/[0.05] text-foreground shadow-inner"
                  : "text-zinc-400 hover:bg-foreground/[0.05] hover:text-foreground"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${item.bg} shadow-md group-hover:scale-105 transition-transform duration-200`}
              >
                <HugeiconsIcon icon={item.icon} size={16} strokeWidth={2} />
              </div>
              {!isCollapsed && (
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border-color space-y-2">
        {bottomNavItems.map((item) => {
          const isActive = isItemActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 group cursor-pointer ${
                isActive
                  ? "bg-foreground/[0.05] text-foreground shadow-inner"
                  : "text-zinc-400 hover:bg-foreground/[0.05] hover:text-foreground"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${item.bg} shadow-md group-hover:scale-105 transition-transform duration-200`}
              >
                <HugeiconsIcon icon={item.icon} size={16} strokeWidth={2} />
              </div>
              {!isCollapsed && (
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* User Profile Widget */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 border-t border-border-color/60 mt-1 mb-1">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name || "Avatar"} className="w-full h-full object-cover" />
              ) : (
                (profile?.name || user.email || "U").substring(0, 1).toUpperCase()
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{profile?.name || user.email.split("@")[0]}</p>
                <p className="text-[9px] text-zinc-500 truncate leading-none mt-0.5">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-zinc-400 hover:bg-foreground/[0.05] hover:text-foreground transition-all duration-200 group cursor-pointer"
          title={isCollapsed ? `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode` : undefined}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
              theme === "dark" ? "bg-amber-500" : "bg-indigo-600"
            } shadow-md group-hover:scale-105 transition-transform duration-200`}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium tracking-wide">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
