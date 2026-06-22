"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  UserIcon,
  PaintBrushIcon,
  AiBrain01Icon,
  NotebookIcon,
  BellIcon,
  PlugIcon,
  CircleDollarSignIcon,
  TickDouble01Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";

const COLOR_OPTIONS: Record<string, { name: string; hex: string; glow: string; style: string }> = {
  violet: { name: "Violet", hex: "#8b5cf6", glow: "rgba(139, 92, 246, 0.15)", style: "bg-violet-500 border-violet-400" },
  rose: { name: "Rose", hex: "#f43f5e", glow: "rgba(244, 63, 94, 0.15)", style: "bg-rose-500 border-rose-400" },
  emerald: { name: "Emerald", hex: "#10b981", glow: "rgba(16, 185, 129, 0.15)", style: "bg-emerald-500 border-emerald-400" },
  amber: { name: "Amber", hex: "#f59e0b", glow: "rgba(245, 158, 11, 0.15)", style: "bg-amber-500 border-amber-400" },
  blue: { name: "Blue", hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.15)", style: "bg-blue-500 border-blue-400" },
  cyan: { name: "Cyan", hex: "#06b6d4", glow: "rgba(6, 182, 212, 0.15)", style: "bg-cyan-500 border-cyan-400" },
  zinc: { name: "Zinc", hex: "#71717a", glow: "rgba(113, 113, 122, 0.15)", style: "bg-zinc-500 border-zinc-400" },
};

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "UTC",
];

function SettingsContent() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [assistantContext, setAssistantContext] = useState("");

  const [theme, setTheme] = useState("dark");
  const [primaryColor, setPrimaryColor] = useState("violet");

  const [aiTone, setAiTone] = useState("Warm & Engaging");

  const [briefingCategories, setBriefingCategories] = useState<string[]>([]);
  const [briefingFreq, setBriefingFreq] = useState("daily");
  const [briefingTime, setBriefingTime] = useState("08:00");

  const [alertNotifyMethod, setAlertNotifyMethod] = useState("in-app");
  const [alertKeywords, setAlertKeywords] = useState("");
  const [alertPriority, setAlertPriority] = useState("high");
  const [alertWaCopy, setAlertWaCopy] = useState(false);

  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});

  const [plan, setPlan] = useState("Pro");
  const [billingStatus, setBillingStatus] = useState("Active");
  const [renewalDate, setRenewalDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);

  // Apply Accent Color directly to CSS root
  const applyThemeStyle = (color: string, mode: string) => {
    const opt = COLOR_OPTIONS[color] || COLOR_OPTIONS.violet;
    document.documentElement.style.setProperty("--primary", opt.hex);
    document.documentElement.style.setProperty("--primary-glow", opt.glow);

    if (mode === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/settings?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setName(s.profile.name);
        setPhone(s.profile.phone);
        setAvatarUrl(s.profile.avatar_url);
        setTimezone(s.profile.timezone);
        setAssistantContext(s.profile.assistant_context);

        setTheme(s.appearance.theme);
        setPrimaryColor(s.appearance.primary_color);

        setAiTone(s.ai_agent.tone);

        setBriefingCategories(s.briefing.default_categories);
        setBriefingFreq(s.briefing.frequency);
        setBriefingTime(s.briefing.scheduled_time);

        setAlertNotifyMethod(s.alerts.default_notification_method);
        setAlertKeywords(s.alerts.keyword_filter);
        setAlertPriority(s.alerts.default_priority);
        setAlertWaCopy(s.alerts.enable_whatsapp_copy || false);

        setPlan(s.billing.plan);
        setBillingStatus(s.billing.status);
        setRenewalDate(s.billing.renewal_date);
        setAutoRenew(s.billing.auto_renew);

        applyThemeStyle(s.appearance.primary_color, s.appearance.theme);
      }

      // Fetch integrations status
      const { data: connectionRows } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id);

      const statusMap: Record<string, boolean> = {};
      connectionRows?.forEach((row: any) => {
        statusMap[row.platform] = row.connected;
      });
      setIntegrations(statusMap);

    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveSuccess(false);

    const updatedSettings = {
      profile: {
        name,
        phone,
        avatar_url: avatarUrl,
        timezone,
        assistant_context: assistantContext,
      },
      appearance: {
        theme,
        primary_color: primaryColor,
      },
      ai_agent: {
        tone: aiTone,
      },
      briefing: {
        default_categories: briefingCategories,
        frequency: briefingFreq,
        scheduled_time: briefingTime,
      },
      alerts: {
        default_notification_method: alertNotifyMethod,
        keyword_filter: alertKeywords,
        default_priority: alertPriority,
        enable_whatsapp_copy: alertWaCopy,
      },
      billing: {
        plan,
        status: billingStatus,
        renewal_date: renewalDate || new Date(Date.now() + 3600 * 24 * 30 * 1000).toISOString(),
        auto_renew: autoRenew,
      },
    };

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          settings: updatedSettings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        applyThemeStyle(primaryColor, theme);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings configuration.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setBriefingCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleToggleIntegration = async (platformId: string) => {
    if (!user) return;
    const isConnected = !!integrations[platformId];
    try {
      const { data: existing } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id)
        .eq("platform", platformId)
        .maybeSingle();

      if (existing) {
        await insforge.database
          .from("integrations")
          .update({
            connected: !isConnected,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await insforge.database.from("integrations").insert([
          {
            user_id: user.id,
            platform: platformId,
            connected: !isConnected,
          },
        ]);
      }
      setIntegrations((prev) => ({ ...prev, [platformId]: !isConnected }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgradePlan = async (selectedPlan: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const updatedSettings = {
        profile: { name, phone, avatar_url: avatarUrl, timezone, assistant_context: assistantContext },
        appearance: { theme, primary_color: primaryColor },
        ai_agent: { tone: aiTone },
        briefing: { default_categories: briefingCategories, frequency: briefingFreq, scheduled_time: briefingTime },
        alerts: { default_notification_method: alertNotifyMethod, keyword_filter: alertKeywords, default_priority: alertPriority, enable_whatsapp_copy: alertWaCopy },
        billing: {
          plan: selectedPlan,
          status: "Active",
          renewal_date: new Date(Date.now() + 3600 * 24 * 30 * 1000).toISOString(),
          auto_renew: true,
        },
      };

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, settings: updatedSettings }),
      });
      const data = await res.json();
      if (data.success) {
        setPlan(selectedPlan);
        setRenewalDate(updatedSettings.billing.renewal_date);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "appearance", name: "Appearance", icon: PaintBrushIcon },
    { id: "ai_agent", name: "AI Agent", icon: AiBrain01Icon },
    { id: "briefing", name: "Briefings", icon: NotebookIcon },
    { id: "alerts", name: "Alert Rules", icon: BellIcon },
    { id: "integrations", name: "Integrations", icon: PlugIcon },
    { id: "pricing", name: "Plan & Billing", icon: CircleDollarSignIcon },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-xs">Loading application settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Settings01Icon} size={24} className="text-primary" />
            Workspace Settings Center
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Customize layout, model tones, briefing schedules, and subscription plan billing options.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-2xl animate-fade-in flex items-center gap-2">
          <HugeiconsIcon icon={TickDouble01Icon} size={16} />
          Settings Saved & Applied Successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Tabs Nav */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-3 border border-border-color space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.push(`/dashboard/settings?tab=${tab.id}`);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "text-zinc-400 border border-transparent hover:bg-foreground/[0.03] hover:text-white"
                }`}
              >
                <HugeiconsIcon icon={tab.icon} size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Right Tab Contents */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 md:p-8 border border-border-color">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* 1. Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">User Profile settings</h3>
                  <p className="text-[10px] text-zinc-500">Configure public display parameters, timezone, and custom assistant behavior background context.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Harry Potter"
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Phone number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Avatar Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Avatar Selection</label>
                  <div className="flex items-center gap-4">
                    {/* Current avatar preview */}
                    <div className="w-12 h-12 rounded-full border border-border-color overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-sm">U</span>
                      )}
                    </div>
                    {/* Quick selection templates */}
                    <div className="flex items-center gap-2">
                      {AVATAR_OPTIONS.map((url, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setAvatarUrl(url)}
                          className={`w-10 h-10 rounded-full border overflow-hidden transition-all cursor-pointer ${
                            avatarUrl === url ? "border-primary scale-105" : "border-border-color hover:border-zinc-500"
                          }`}
                        >
                          <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Or input custom avatar image URL"
                        className="px-3 py-2 bg-card-bg/60 border border-border-color rounded-xl text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Primary Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full max-w-md px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assistant Context */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">AI Assistant Profile Context</label>
                  <p className="text-[9px] text-zinc-500 mb-1">Outline your job description, focus areas, and instructions to help the AI format briefings and alert responder recommendations specifically to your daily workflow.</p>
                  <textarea
                    rows={4}
                    value={assistantContext}
                    onChange={(e) => setAssistantContext(e.target.value)}
                    placeholder="Describe your role e.g. I am a lead engineer managing product releases. Filter alert digests and highlight build failures or critical pipeline deployments..."
                    className="w-full p-4 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* 2. Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Appearance & Colors</h3>
                  <p className="text-[10px] text-zinc-500">Configure visual themes, styles, and custom accent primary color palettes applied app-wide.</p>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Interface Mode</label>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col gap-1.5 cursor-pointer items-start ${
                        theme === "dark" ? "bg-primary/10 border-primary text-primary" : "bg-card-bg/40 border-border-color text-zinc-400"
                      }`}
                    >
                      <span className="font-extrabold">Sleek Dark Mode</span>
                      <span className="text-[9px] text-zinc-500">Ideal for night time workspaces.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`px-4 py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col gap-1.5 cursor-pointer items-start ${
                        theme === "light" ? "bg-primary/10 border-primary text-primary" : "bg-card-bg/40 border-border-color text-zinc-400"
                      }`}
                    >
                      <span className="font-extrabold">Premium Light Mode</span>
                      <span className="text-[9px] text-zinc-500">High contrast for clear daylight reading.</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Accent Color */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Theme Primary Accent Color</label>
                  <p className="text-[9px] text-zinc-500 mb-2">Changing the color transforms the layout highlights, menu indicators, and action triggers across all pages.</p>
                  
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(COLOR_OPTIONS).map((colorId) => {
                      const color = COLOR_OPTIONS[colorId];
                      const isSelected = primaryColor === colorId;
                      return (
                        <button
                          type="button"
                          key={colorId}
                          onClick={() => setPrimaryColor(colorId)}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-card-bg/40 border-border-color text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border border-black/40 ${color.style}`} />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI Agent Settings */}
            {activeTab === "ai_agent" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">AI Agent Responder Settings</h3>
                  <p className="text-[10px] text-zinc-500">Select model personalities and voice formats used during transactional briefings and email composer drafting.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">AI Agent Reply Persona Tone</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { tone: "Warm & Engaging", desc: "Friendly, encouraging, conversational default responder." },
                      { tone: "Professional", desc: "Corporate, concise, formal email correspondence." },
                      { tone: "Empathetic", desc: "Highly understanding, supportive, sensitive customer support." },
                      { tone: "Action-Oriented", desc: "Task-centric, straightforward, instructions-driven bulletins." },
                      { tone: "Strategic", desc: "High-level planning context, corporate roadmaps alignment." },
                      { tone: "Socratic", desc: "Analytical, question-driven, diagnostics and debugging style." },
                      { tone: "Vigilant", desc: "Security-focused, immediate warning highlights, emergency responder." },
                      { tone: "Visual", desc: "Bullet-pointed summary blocks, clean formatting structures." },
                    ].map((item) => {
                      const isSelected = aiTone === item.tone;
                      return (
                        <button
                          type="button"
                          key={item.tone}
                          onClick={() => setAiTone(item.tone)}
                          className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-card-bg/40 border-border-color text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {item.tone === "Warm & Engaging" && <span className="text-[9px] bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded">Default</span>}
                            {item.tone}
                          </span>
                          <span className="text-[9px] text-zinc-500 leading-normal">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Briefing Settings */}
            {activeTab === "briefing" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Briefing Compiler Configuration</h3>
                  <p className="text-[10px] text-zinc-500">Define compile categories and default timing schedules used on the Briefing Hub page.</p>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Default Categories to Fetch</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "email", name: "Emails & Inboxes" },
                      { id: "messages", name: "Chats & Messages" },
                      { id: "mentions", name: "Client Mentions" },
                      { id: "tasks", name: "Action Tasks" },
                      { id: "followUps", name: "Follow-Up Flags" },
                    ].map((cat) => {
                      const isSelected = briefingCategories.includes(cat.id);
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-card-bg/40 border-border-color text-zinc-400 hover:text-white"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequency */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Default Frequency</label>
                    <select
                      value={briefingFreq}
                      onChange={(e) => setBriefingFreq(e.target.value)}
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="daily">Daily Morning Updates</option>
                      <option value="weekly">Once Weekly Compile</option>
                      <option value="monthly">Once Monthly Summary</option>
                    </select>
                  </div>

                  {/* Scheduled Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Schedule Time</label>
                    <input
                      type="time"
                      value={briefingTime}
                      onChange={(e) => setBriefingTime(e.target.value)}
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Alert Settings */}
            {activeTab === "alerts" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Background Monitoring & Alerts settings</h3>
                  <p className="text-[10px] text-zinc-500">Configure parameters, threshold rules, and default notification copy filters used on the Alerts dashboard.</p>
                </div>

                {/* Keywords filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between">
                    <span>Default Conditions Keyword Filter</span>
                    <span className="text-[9px] text-zinc-500">Comma-separated words</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={alertKeywords}
                    onChange={(e) => setAlertKeywords(e.target.value)}
                    placeholder="e.g. failed,error,revoke,unauthorized,deploy"
                    className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Priority */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Default Priority Level</label>
                    <select
                      value={alertPriority}
                      onChange={(e) => setAlertPriority(e.target.value)}
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="low">Low priority trigger</option>
                      <option value="medium">Medium priority trigger</option>
                      <option value="high">High priority trigger</option>
                      <option value="critical">Critical priority trigger</option>
                    </select>
                  </div>

                  {/* Notification Method */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Notification Method</label>
                    <select
                      value={alertNotifyMethod}
                      onChange={(e) => setAlertNotifyMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="in-app">In-App Notification Only</option>
                      <option value="email">Transmit email summaries</option>
                      <option value="whatsapp">Transmit WhatsApp copies</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp copy toggle */}
                <div className="flex items-center justify-between p-4 bg-card-bg/30 border border-border-color rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white leading-normal">Transmit Critical Warning Copies to WhatsApp</h4>
                    <p className="text-[9px] text-zinc-500">Requires active connected WhatsApp JID integration.</p>
                  </div>
                  <div
                    onClick={() => setAlertWaCopy(!alertWaCopy)}
                    className={`w-9 h-5 rounded-full p-0.5 flex cursor-pointer transition-colors ${
                      alertWaCopy ? "bg-primary justify-end" : "bg-card-bg border border-border-color justify-start"
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md"></div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Integration Settings */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Platform Integrations</h3>
                  <p className="text-[10px] text-zinc-500">Quickly toggle platform connectivity settings for alerts monitoring background cron evaluate tasks.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "gmail", name: "Gmail Email integration", desc: "Fetches user inbox mails, VIP threads, and drafts." },
                    { id: "whatsapp", name: "WhatsApp messaging connection", desc: "Retrieves logs of recent chat groups." },
                    { id: "slack", name: "Slack workspace hooks", desc: "Simulates team project devOps alerts." },
                    { id: "outlook", name: "Outlook calendar & mail logs", desc: "Synchronizes personal scheduling invites." },
                  ].map((plat) => {
                    const isConnected = !!integrations[plat.id];
                    return (
                      <div
                        key={plat.id}
                        className="flex justify-between items-center p-4 bg-card-bg/30 border border-border-color rounded-2xl"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white leading-normal">{plat.name}</h4>
                          <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{plat.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleIntegration(plat.id)}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                            isConnected
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                          }`}
                        >
                          {isConnected ? "Connected" : "Disconnected"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Pricing & Billing */}
            {activeTab === "pricing" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Pricing Plan & Subscriptions</h3>
                  <p className="text-[10px] text-zinc-500">Manage plan subscriptions, renew active cards, and modify pricing options.</p>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-primary uppercase font-extrabold tracking-wider">Active plan tier</span>
                    <h4 className="text-sm font-extrabold text-white">{plan} Workspace Edition</h4>
                    <p className="text-[9px] text-zinc-400 mt-0.5">
                      Status: <span className="text-emerald-400 font-semibold">{billingStatus}</span> &bull; Renews: {new Date(renewalDate || Date.now() + 3600*24*30*1000).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-bold">Auto-Renewal</span>
                    <div
                      onClick={() => setAutoRenew(!autoRenew)}
                      className={`w-9 h-5 rounded-full p-0.5 flex cursor-pointer transition-colors ${
                        autoRenew ? "bg-primary justify-end" : "bg-card-bg border border-border-color justify-start"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md"></div>
                    </div>
                  </div>
                </div>

                {/* Plan Selector Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {[
                    { id: "Free", name: "Free Tier", price: "$0", features: ["1 alert monitor rule", "Daily briefings digest", "Gmail sync basic"] },
                    { id: "Pro", name: "Pro Edition", price: "$29/mo", features: ["Unlimited rules", "Real-time checks (Trigger.dev)", "AI responder drafts", "Slack & WhatsApp integrations"] },
                    { id: "Enterprise", name: "Enterprise", price: "$99/mo", features: ["Dedicated model weights", "Custom Webhooks JID integration", "Priority 24/7 support tier", "SOC-2 compliant access logs"] },
                  ].map((p) => {
                    const isActive = plan === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-all relative ${
                          isActive ? "border-primary bg-primary/[0.02] shadow-lg shadow-primary/5" : "border-border-color bg-card-bg/20"
                        }`}
                      >
                        {isActive && <span className="absolute -top-2.5 right-4 bg-primary text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">Active</span>}
                        <div>
                          <h4 className="text-xs font-bold text-white leading-normal">{p.name}</h4>
                          <p className="text-lg font-extrabold text-white mt-1 leading-none">{p.price}</p>
                          <ul className="space-y-1.5 mt-4">
                            {p.features.map((f, i) => (
                              <li key={i} className="text-[9px] text-zinc-400 flex items-center gap-1.5 leading-normal">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpgradePlan(p.id)}
                          className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-transparent"
                              : "bg-primary text-white hover:bg-primary-glow border border-primary/20"
                          }`}
                          disabled={isActive}
                        >
                          {isActive ? "Current Plan" : `Upgrade to ${p.id}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Buttons */}
            <div className="pt-4 border-t border-border-color/30 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => loadSettings()}
                className="px-4 py-2.5 rounded-xl border border-border-color text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Reset Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving configurations..." : "Save Config Options"}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-xs">Loading settings page...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
