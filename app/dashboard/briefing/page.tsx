"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  NotebookIcon,
  Settings01Icon,
  FolderOpenIcon,
  AlertCircleIcon,
  PlayIcon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";

interface CategoryInfo {
  count: number;
  summary: string;
}

interface BriefingResult {
  id: string;
  scheduleName: string;
  createdAt: string;
  importantCount: number;
  priorityCount: number;
  followUpsCount: number;
  summaryText: string;
  categories: {
    email: CategoryInfo;
    messages: CategoryInfo;
    mentions: CategoryInfo;
    tasks: CategoryInfo;
    followUps: CategoryInfo;
  };
}

interface BriefingSchedule {
  id: string;
  name: string;
  description: string;
  selectedApps: string[];
  selectedCategories: string[];
  scheduledTime: string;
  frequency: string;
  priorityLevel: string;
  lastRun: string | null;
  nextRun: string;
}

interface ParsedBriefItem {
  id: string;
  app: "gmail" | "whatsapp" | "system";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  time?: string;
}

const parseBriefingToItems = (brief: BriefingResult | null): ParsedBriefItem[] => {
  if (!brief || !brief.summaryText) return [];
  
  const lines = brief.summaryText.split("\n");
  const items: ParsedBriefItem[] = [];
  let index = 0;
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    // Match lines starting with *, -, or numbers
    if (trimmed.startsWith("*") || trimmed.startsWith("-") || /^\d+\./.test(trimmed)) {
      // Strip the bullet symbol
      let content = trimmed.replace(/^[\*\-\d\.]+\s*/, "").trim();
      if (!content) return;
      
      // Look for bold title: **Title**: Description or **Title** Description
      let title = "Update";
      let description = content;
      
      const boldMatch = content.match(/^\*\*(.*?)\*\*[:\-\s]*(.*)/);
      if (boldMatch) {
        title = boldMatch[1];
        description = boldMatch[2] || boldMatch[1];
      }
      
      // Clean up description if title is repeated
      if (description.startsWith(title)) {
        description = description.substring(title.length).replace(/^[:\-\s]+/, "");
      }
      
      // Determine app source based on keywords
      let app: "gmail" | "whatsapp" | "system" = "system";
      const descLower = description.toLowerCase();
      const titleLower = title.toLowerCase();
      
      if (
        descLower.includes("email") || 
        descLower.includes("gmail") || 
        descLower.includes("invoice") || 
        descLower.includes("billing") ||
        titleLower.includes("email") ||
        titleLower.includes("gmail")
      ) {
        app = "gmail";
      } else if (
        descLower.includes("whatsapp") || 
        descLower.includes("chat") || 
        descLower.includes("message") ||
        titleLower.includes("whatsapp") ||
        titleLower.includes("chat") ||
        titleLower.includes("message")
      ) {
        app = "whatsapp";
      } else {
        // Fallback/alternate
        app = index % 2 === 0 ? "gmail" : "whatsapp";
      }
      
      // Determine priority level
      let priority: "high" | "medium" | "low" = "medium";
      if (
        descLower.includes("critical") || 
        descLower.includes("urgent") || 
        descLower.includes("expedite") ||
        titleLower.includes("critical") ||
        titleLower.includes("urgent")
      ) {
        priority = "high";
      } else if (
        descLower.includes("follow-up") || 
        descLower.includes("followup") || 
        descLower.includes("check") ||
        titleLower.includes("follow")
      ) {
        priority = "low";
      }
      
      items.push({
        id: `parsed_${index++}`,
        app,
        title,
        description,
        priority,
        time: new Date(brief.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });
  
  // If no bullet points were found, let's create a single general item
  if (items.length === 0) {
    items.push({
      id: "general_item",
      app: "system",
      title: brief.scheduleName || "Digest Summary",
      description: brief.summaryText.replace(/[#*`\n]/g, " ").trim(),
      priority: "medium",
      time: new Date(brief.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }
  
  return items;
};


const CATEGORY_META = [
  {
    id: "email",
    name: "Email",
    color: "from-red-500/10 to-orange-500/10 border-red-500/20 text-red-400",
    badgeColor: "bg-red-500/10 border-red-500/20 text-red-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: "messages",
    name: "Messages",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400",
    badgeColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    id: "mentions",
    name: "Mentions",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400",
    badgeColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    )
  },
  {
    id: "tasks",
    name: "Tasks",
    color: "from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 text-violet-400",
    badgeColor: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    id: "followUps",
    name: "Follow-ups",
    color: "from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-400",
    badgeColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const APP_METADATA = [
  {
    id: "gmail",
    name: "Gmail",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    ),
    brandColor: "text-red-500",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
      </svg>
    ),
    brandColor: "text-emerald-500",
  },
  {
    id: "slack",
    name: "Slack",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
      </svg>
    ),
    brandColor: "text-amber-400",
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z"/>
      </svg>
    ),
    brandColor: "text-blue-500",
  }
];

export default function BriefingHubPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<BriefingSchedule[]>([]);
  const [briefs, setBriefs] = useState<BriefingResult[]>([]);
  const [activeBrief, setActiveBrief] = useState<BriefingResult | null>(null);
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [activeRightTab, setActiveRightTab] = useState<"schedules" | "history">("schedules");
  const [runningSchedules, setRunningSchedules] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "email",
    "messages",
    "tasks",
    "followUps"
  ]);
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [frequency, setFrequency] = useState("daily");
  const [priorityLevel, setPriorityLevel] = useState("medium");

  const fetchConnections = async () => {
    if (!user) return {};
    try {
      const { data, error } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching integrations:", error);
        return {};
      }

      const statusMap: Record<string, boolean> = {};
      data?.forEach((row: any) => {
        statusMap[row.platform] = row.connected;
      });

      // Synchronize client-side localStorage access token state with Gmail connection map
      if (typeof window !== "undefined") {
        const hasToken = !!localStorage.getItem("gmail_access_token");
        statusMap.gmail = hasToken && (statusMap.gmail ?? false);
      }

      // Check active WhatsApp session status from server in background
      try {
        const waStatusRes = await fetch(`/api/whatsapp/status?userId=${user.id}`);
        const waStatusData = await waStatusRes.json();
        if (waStatusData.success) {
          statusMap.whatsapp = waStatusData.state === "connected";
        }
      } catch (err) {
        console.error("Failed to fetch background WhatsApp status:", err);
      }

      setConnections(statusMap);
      return statusMap;
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/briefing?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        const retrievedSchedules = data.schedules || [];
        const retrievedBriefs = data.briefs || [];
        
        const fallbackBrief: BriefingResult = {
          id: "latest",
          scheduleName: "Domain Renewal,Customer Appointment & Security Alerts — Jun 8",
          createdAt: "2026-06-08T11:38:00.000Z",
          importantCount: 3,
          priorityCount: 2,
          followUpsCount: 1,
          summaryText: "Today's briefing highlights an urgent task to renew your 'aicareerguru.xyz' domain, which has already expired, along with a request fromCustomer to schedule a new appointment with Harry and provide your availability. Several security alerts were also received regarding new device sign-ins across various accounts and Zapier access to your Google account. Additionally, you received updates on cash back processing and general notifications.",
          categories: {
            email: { count: 15, summary: "0 threats blocked for AI Trip Planner this week" },
            messages: { count: 20, summary: "View details" },
            mentions: { count: 1, summary: "Nothing new" },
            tasks: { count: 3, summary: "Customer requested to schedule an appointment to discuss the current..." },
            followUps: { count: 1, summary: "Respond toCustomer to schedule an appointment." }
          }
        };

        const fallbackSchedule: BriefingSchedule = {
          id: "fallback_schedule_1",
          name: "Morning Updates",
          description: "Daily morning briefing",
          selectedApps: ["gmail", "whatsapp"],
          selectedCategories: ["email", "messages", "tasks", "followUps"],
          scheduledTime: "09:00",
          frequency: "daily",
          priorityLevel: "high",
          lastRun: null,
          nextRun: new Date().toISOString()
        };

        setSchedules(retrievedSchedules.length > 0 ? retrievedSchedules : [fallbackSchedule]);
        setBriefs(retrievedBriefs.length > 0 ? retrievedBriefs : [fallbackBrief]);
        
        if (retrievedBriefs.length > 0) {
          setActiveBrief(retrievedBriefs[0]);
        } else {
          setActiveBrief(fallbackBrief);
        }
      }
    } catch (e) {
      console.error("Failed to load briefings page data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchData();
    }
  }, [user]);

  // Pre-populate when opening modal
  useEffect(() => {
    if (isModalOpen) {
      const active = Object.keys(connections).filter(k => connections[k]);
      setSelectedApps(active);
    }
  }, [isModalOpen, connections]);

  const handleRunScheduleNow = async (scheduleId: string) => {
    if (!user) return;
    setRunningSchedules(prev => ({ ...prev, [scheduleId]: true }));
    try {
      const res = await fetch("/api/briefing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          scheduleId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully generated briefing result for "${data.brief.scheduleName}"!`);
        fetchData();
      } else {
        alert(data.error || "Failed to compile briefing");
      }
    } catch (err: any) {
      alert(err.message || "Failed to run briefing task.");
    } finally {
      setRunningSchedules(prev => ({ ...prev, [scheduleId]: false }));
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !scheduledTime) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          description,
          selectedApps,
          selectedCategories,
          scheduledTime,
          frequency,
          priorityLevel
        })
      });
      const data = await res.json();
      if (data.success) {
        // Reset and close
        setName("");
        setDescription("");
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to create briefing schedule");
      }
    } catch (err) {
      console.error(err);
      alert("Error registering custom scheduled task.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAppSelection = (appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Clean Markdown-to-HTML formatter to render the generated brief beautifully
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    let html = text
      .replace(/### (.*)/g, '<h4 class="text-sm font-bold text-foreground mt-4 mb-2">$1</h4>')
      .replace(/#### (.*)/g, '<h5 class="text-xs font-bold text-zinc-300 mt-3 mb-1">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\* (.*)/g, '<li class="text-xs text-zinc-400 ml-4 list-disc my-1">$1</li>')
      .replace(/> \[!NOTE\]\s*>\s*(.*)/g, '<div class="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-2xl text-violet-300 text-[11px] my-3 leading-relaxed flex items-start gap-2"><span class="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0"></span><div>$1</div></div>')
      .replace(/> (.*)/g, '<blockquote class="border-l-2 border-zinc-600 pl-3 italic text-zinc-400 my-2">$1</blockquote>')
      .replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="space-y-1 text-xs text-zinc-300 leading-relaxed max-w-none" 
      />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-xs">Loading briefings center...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Briefing</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Daily digests generated from all your connected platforms.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-card-bg/60 border border-border-color text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
          </svg>
          Sync Live
        </button>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Row 1: Today's Top Briefing Card */}
        {activeBrief && (
          <div className="glass-panel rounded-3xl border border-border-color overflow-hidden bg-foreground/[0.01] p-6 md:p-8 space-y-6 flex flex-col relative">
            
            {/* Top Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C8.8 12.1 8 10.61 8 9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.61-.8 3.1-2.15 4.1z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-wider">Today's Top Briefing</span>
                <span className="text-zinc-500 text-[10px]">&bull;</span>
                <span className="text-zinc-400 text-[10px]">
                  {new Date(activeBrief.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Title & Narrative */}
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  {activeBrief.scheduleName}
                </h2>
                <Link
                  href={`/dashboard/briefing/${activeBrief.id}`}
                  className="text-violet-400 hover:text-violet-350 font-bold text-xs tracking-wide shrink-0 flex items-center gap-0.5 hover:translate-x-0.5 transition-transform"
                >
                  View Details &gt;
                </Link>
              </div>
              <div className="text-zinc-300 text-sm leading-relaxed max-w-5xl">
                {renderMarkdown(activeBrief.summaryText)}
              </div>
            </div>

            {/* Pill row at bottom */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[11px] font-bold">
                {activeBrief.categories?.email?.count ?? 0} Email
              </span>
              <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[11px] font-bold">
                {activeBrief.categories?.messages?.count ?? 0} Messages
              </span>
              <span className="px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-[11px] font-bold">
                {activeBrief.categories?.mentions?.count ?? 0} Mentions
              </span>
              <span className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[11px] font-bold">
                {activeBrief.categories?.tasks?.count ?? 0} Tasks
              </span>
              <span className="px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[11px] font-bold">
                {activeBrief.categories?.followUps?.count ?? 0} Follow-Ups
              </span>
            </div>

          </div>
        )}

        {/* Row 2: CATEGORIES */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CATEGORY_META.map((cat) => {
              const catData = activeBrief?.categories?.[cat.id as keyof typeof activeBrief.categories] || {
                count: 0,
                summary: "No logs analyzed."
              };

              let borderTheme = "border-blue-500/20 bg-blue-500/5 text-blue-400";
              let badgeTheme = "bg-blue-500/10 text-blue-400";
              if (cat.id === "messages") {
                borderTheme = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
                badgeTheme = "bg-emerald-500/10 text-emerald-400";
              } else if (cat.id === "mentions") {
                borderTheme = "border-violet-500/20 bg-violet-500/5 text-violet-400";
                badgeTheme = "bg-violet-500/10 text-violet-400";
              } else if (cat.id === "tasks") {
                borderTheme = "border-amber-500/20 bg-amber-500/5 text-amber-400";
                badgeTheme = "bg-amber-500/10 text-amber-400";
              } else if (cat.id === "followUps") {
                borderTheme = "border-rose-500/20 bg-rose-500/5 text-rose-400";
                badgeTheme = "bg-rose-500/10 text-rose-400";
              }

              return (
                <div
                  key={cat.id}
                  onClick={() => router.push(`/dashboard/briefing/${activeBrief?.id || "latest"}?category=${cat.id}`)}
                  className={`p-5 rounded-2xl border ${borderTheme} hover:scale-[1.02] transition-transform cursor-pointer flex flex-col justify-between min-h-[140px]`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-white leading-none capitalize">{cat.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold leading-none ${badgeTheme}`}>
                      {catData.count}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 line-clamp-3 mt-4 leading-relaxed">
                    {catData.summary || "No active logs."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: CUSTOM SCHEDULES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border-color/30 pb-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custom Schedules</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-violet-400 hover:text-violet-350 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3">
            {schedules.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs italic bg-card-bg/25 border border-border-color/30 rounded-2xl">
                No custom scheduled briefings active. Configure one using the + Add button.
              </div>
            ) : (
              schedules.map((sched) => (
                <div
                  key={sched.id}
                  className="flex items-center justify-between p-4 bg-card-bg/30 border border-border-color/50 rounded-2xl hover:border-violet-500/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-normal">{sched.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">
                        {sched.frequency} at {sched.scheduledTime} &bull; {(sched.selectedApps || []).join(", ")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunScheduleNow(sched.id);
                      }}
                      disabled={runningSchedules[sched.id]}
                      className="p-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/30 border border-violet-500/25 text-violet-400 cursor-pointer disabled:opacity-50 transition-all"
                      title="Compile Briefing Now"
                    >
                      <svg className={`w-3.5 h-3.5 ${runningSchedules[sched.id] ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                      </svg>
                    </button>
                    
                    <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-extrabold uppercase leading-none">
                      {sched.priorityLevel === "high" ? "High" : sched.priorityLevel === "medium" ? "Med" : "Low"}
                    </span>
                    
                    {/* Toggle Switch */}
                    <div className="w-8 h-4 rounded-full bg-violet-600/30 border border-violet-500/40 p-0.5 flex justify-end cursor-pointer">
                      <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 4: PAST BRIEFINGS */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Past Briefings</h3>
          
          <div className="space-y-2">
            {briefs.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs italic bg-card-bg/25 border border-border-color/30 rounded-2xl">
                No briefings generated yet by background scheduler.
              </div>
            ) : (
              briefs.map((brief) => (
                <Link
                  key={brief.id}
                  href={`/dashboard/briefing/${brief.id}`}
                  className="flex items-center justify-between p-4 bg-card-bg/30 border border-border-color/50 rounded-2xl hover:bg-card-bg/50 hover:border-violet-500/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-normal">
                        Daily Briefing &mdash; {new Date(brief.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(brief.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-zinc-500 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Scheduler Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="glass-panel w-full max-w-lg rounded-3xl border border-border-color p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={NotebookIcon} size={20} className="text-amber-500" />
                <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Create Briefing Schedule</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Workspace Digest"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Describe the purpose of this scheduled task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                />
              </div>

              {/* Connected Apps Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Integrations Channels</label>
                <div className="flex flex-wrap gap-2.5">
                  {APP_METADATA.map((app) => {
                    const isConnected = !!connections[app.id];
                    const isSelected = selectedApps.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        type="button"
                        disabled={!isConnected}
                        onClick={() => toggleAppSelection(app.id)}
                        className={`px-3.5 py-2 rounded-xl border text-[11px] font-bold capitalize transition-all flex items-center gap-2 ${
                          !isConnected
                            ? "bg-card-bg/10 border-border-color/10 text-zinc-600 opacity-40 cursor-not-allowed"
                            : isSelected
                            ? "bg-violet-500/10 border-violet-500/40 text-violet-400 cursor-pointer"
                            : "bg-card-bg/40 border-border-color text-zinc-300 hover:text-white cursor-pointer"
                        }`}
                        title={isConnected ? `Select ${app.name}` : `${app.name} is not connected`}
                      >
                        <span className={!isConnected ? "text-zinc-600" : app.brandColor}>{app.icon}</span>
                        <span>{app.name}</span>
                        {!isConnected && <span className="text-[8px] opacity-60 font-medium tracking-normal">(Disconnected)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Categories */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Log Categories Filter</label>
                <div className="flex flex-wrap gap-2.5">
                  {CATEGORY_META.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategorySelection(cat.id)}
                      className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        selectedCategories.includes(cat.id)
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                          : "bg-card-bg/40 border-border-color text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time, Frequency, Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Scheduled Time</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Urgency Filter</label>
                  <select
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="high">High Only</option>
                    <option value="medium">Medium & Up</option>
                    <option value="low">Low & Up</option>
                  </select>
                </div>
              </div>

              {/* Form Submission */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-foreground/[0.03] border border-border-color text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 transition-all"
                >
                  {submitting ? "Saving Schedule..." : "Activate schedule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}