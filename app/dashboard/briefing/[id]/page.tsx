"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  NotebookIcon,
  ArrowLeft01Icon,
  AlertCircleIcon,
  PlayIcon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";

interface LogItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  time: string;
  channel: "gmail" | "whatsapp" | "slack" | "github";
  recipient: string;
  recipientAddress: string;
  extraDetails?: any;
}

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

export default function BriefingDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialCategory = searchParams.get("category") || "email";

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  
  // Real-time connections
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  // Logs list state
  const [items, setItems] = useState<LogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LogItem | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Compose Panel State
  const [replyChannel, setReplyChannel] = useState<"gmail" | "whatsapp">("gmail");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [tone, setTone] = useState("professional");
  const [composingAI, setComposingAI] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  // Default mock items mapping
  const getMockItems = (category: string): LogItem[] => {
    switch (category) {
      case "email":
        return [
          {
            id: "gmail_mock_1",
            title: "Re: Request to Schedule Appointment and Update with Google",
            subtitle: "From:Customer <accounts@Customer.com>",
            content: "Lets schedule new appointment with harry On Mon, 8 Jun 2026 at 11:52 AM Saloni wrote: HiCustomer, Thank you for reaching out. I'd be happy to schedule a call to discuss the current status and",
            time: "03:53 PM",
            channel: "gmail",
            recipient: "Customer",
            recipientAddress: "accounts@Customer.com"
          },
          {
            id: "gmail_mock_2",
            title: "Arcjet Security Briefing: AI Trip Planner — Jun 1 – Jun 7",
            subtitle: "From: Arcjet Reports <reports@arcjet.com>",
            content: "0 threats blocked for AI Trip Planner this week",
            time: "01:49 PM",
            channel: "gmail",
            recipient: "Arcjet Reports",
            recipientAddress: "reports@arcjet.com"
          }
        ];
      case "messages":
        return [
          {
            id: "wa_mock_1",
            title: "Customer (WhatsApp)",
            subtitle: "From: +91 98765 43210 (WhatsApp)",
            content: "Can you send over the link to schedule the appointment? I need it as soon as possible.",
            time: "03:45 PM",
            channel: "whatsapp",
            recipient: "Customer",
            recipientAddress: "+919876543210"
          },
          {
            id: "wa_mock_2",
            title: "Sarah (Slack)",
            subtitle: "Slack Notification",
            content: "The new landing page changes are live on staging. Please verify.",
            time: "02:30 PM",
            channel: "slack",
            recipient: "Sarah",
            recipientAddress: "@sarah"
          }
        ];
      case "mentions":
        return [
          {
            id: "github_mock_1",
            title: "GitHub Mention",
            subtitle: "@Customer on PR #87",
            content: "Please review the domain renewal flow and confirm if the notifications are configured correctly.",
            time: "01:10 PM",
            channel: "github",
            recipient: "Customer",
            recipientAddress: "@Customer"
          }
        ];
      case "tasks":
        return [
          {
            id: "task_mock_1",
            title: "Renew 'aicareerguru.xyz' domain",
            subtitle: "Urgency: High",
            content: "The domain has expired. Hostinger has issued a 'last chance' warning.",
            time: "Due Today",
            channel: "gmail",
            recipient: "Hostinger",
            recipientAddress: "billing@hostinger.com"
          },
          {
            id: "task_mock_2",
            title: "Schedule appointment withCustomer",
            subtitle: "Urgency: Medium",
            content: "Coordinate with Harry to provide availability for Mon, 8 Jun 2026.",
            time: "Due Tomorrow",
            channel: "whatsapp",
            recipient: "Customer",
            recipientAddress: "+919876543210"
          },
          {
            id: "task_mock_3",
            title: "Set up Zapier access restrictions",
            subtitle: "Urgency: Medium",
            content: "Review security alerts for Zapier access to Google account.",
            time: "Due in 3 days",
            channel: "gmail",
            recipient: "Google Security",
            recipientAddress: "no-reply@accounts.google.com"
          }
        ];
      case "followUps":
        return [
          {
            id: "follow_mock_1",
            title: "Respond toCustomer to schedule an appointment",
            subtitle: "Pending Client:Customer",
            content: "Provide availability and secure scheduling link for the upcoming week.",
            time: "Last contacted: 3h ago",
            channel: "gmail",
            recipient: "Customer",
            recipientAddress: "accounts@Customer.com"
          }
        ];
      default:
        return [];
    }
  };

  // Fetch connection status
  const fetchConnections = async () => {
    if (!user) return {};
    try {
      const { data } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id);

      const statusMap: Record<string, boolean> = {};
      data?.forEach((row: any) => {
        statusMap[row.platform] = row.connected;
      });

      if (statusMap.gmail && typeof window !== "undefined") {
        try {
          const res = await fetch(`/api/auth/gmail/token?userId=${user.id}`);
          if (res.ok) {
            const tokenData = await res.json();
            if (tokenData.accessToken) {
              localStorage.setItem("gmail_access_token", tokenData.accessToken);
              localStorage.setItem("gmail_connected", "true");
            } else {
              statusMap.gmail = false;
              localStorage.removeItem("gmail_access_token");
              localStorage.removeItem("gmail_connected");
            }
          } else {
            statusMap.gmail = false;
            localStorage.removeItem("gmail_access_token");
            localStorage.removeItem("gmail_connected");
          }
        } catch (err) {
          console.error("Failed to sync Gmail token:", err);
        }
      } else if (typeof window !== "undefined") {
        localStorage.removeItem("gmail_access_token");
        localStorage.removeItem("gmail_connected");
      }
      
      // WhatsApp status check
      try {
        const waStatusRes = await fetch(`/api/whatsapp/status?userId=${user.id}`);
        const waStatusData = await waStatusRes.json();
        if (waStatusData.success) {
          statusMap.whatsapp = waStatusData.state === "connected";
        }
      } catch (err) {
        console.error(err);
      }

      setConnections(statusMap);
      return statusMap;
    } catch (e) {
      console.error(e);
      return {};
    }
  };

  // Fetch Page Data
  useEffect(() => {
    if (!user) return;

    const loadPageData = async () => {
      setLoading(true);
      const activeConns = await fetchConnections();
      
      try {
        // Fetch briefing logs
        const res = await fetch(`/api/briefing?userId=${user.id}`);
        const data = await res.json();
        
        let foundBrief: BriefingResult | null = null;
        if (data.success && data.briefs && data.briefs.length > 0) {
          if (id === "latest") {
            foundBrief = data.briefs[0];
          } else {
            foundBrief = data.briefs.find((b: any) => b.id === id) || null;
          }
        }
        
        if (foundBrief) {
          setBriefing(foundBrief);
        } else {
          // Static Welcome fallback briefing
          setBriefing({
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
          });
        }

        // Fetch logs for active category
        await loadCategoryLogs(activeCategory, activeConns);

      } catch (err) {
        console.error("Failed loading details page data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [user, id, activeCategory]);

  const fetchWithTokenRetry = async (url: string, init?: RequestInit): Promise<Response> => {
    let accessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
    let res = await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401 && user) {
      try {
        const refreshRes = await fetch(`/api/auth/gmail/token?userId=${user.id}`);
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          if (tokenData.accessToken) {
            localStorage.setItem("gmail_access_token", tokenData.accessToken);
            localStorage.setItem("gmail_connected", "true");
            res = await fetch(url, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${tokenData.accessToken}`,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error retrying Gmail request with refreshed token:", err);
      }
    }
    return res;
  };

  const loadCategoryLogs = async (category: string, activeConns: Record<string, boolean>) => {
    setChatHistory([]);
    
    // 1. If category is Email and Gmail is connected, try to fetch real emails
    if (category === "email" && activeConns.gmail) {
      try {
        const listRes = await fetchWithTokenRetry(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5`
        );
        if (listRes.status === 401) {
          localStorage.removeItem("gmail_access_token");
          localStorage.removeItem("gmail_connected");
          setConnections(prev => ({ ...prev, gmail: false }));
          if (user) {
            await insforge.database
              .from("integrations")
              .update({ connected: false, updated_at: new Date().toISOString() })
              .eq("user_id", user.id)
              .eq("platform", "gmail");
          }
          return;
        }
        if (listRes.ok) {
          const listData = await listRes.json();
          const messages = listData.messages || [];
          
          const detailsPromises = messages.map(async (msg: any) => {
            const detailRes = await fetchWithTokenRetry(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
            );
              if (!detailRes.ok) return null;
              const detailData = await detailRes.json();
              const headers = detailData.payload?.headers || [];
              const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
              const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
              const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

              // Clean fromHeader to extract name & address
              let name = fromHeader;
              let emailAddr = fromHeader;
              const match = fromHeader.match(/(.*)<(.*)>/);
              if (match) {
                name = match[1].trim();
                emailAddr = match[2].trim();
              }

              return {
                id: msg.id,
                title: subjectHeader,
                subtitle: `From: ${fromHeader}`,
                content: detailData.snippet || "New message received.",
                time: new Date(dateHeader).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                channel: "gmail" as const,
                recipient: name,
                recipientAddress: emailAddr
              };
            });
            const realEmails = (await Promise.all(detailsPromises)).filter(Boolean) as LogItem[];
            if (realEmails.length > 0) {
              setItems(realEmails);
              setSelectedItem(realEmails[0]);
              return;
            }
          }
        } catch (e) {
          console.error("Gmail live load error:", e);
        }
      }

    // 2. If category is Messages and WhatsApp is connected, fetch real WhatsApp chats
    if (category === "messages" && activeConns.whatsapp) {
      try {
        const res = await fetch("/api/whatsapp/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            toolName: "whatsapp_get_recent_messages",
            args: { limit: 5 },
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.result)) {
          const liveChats = data.result.map((chat: any) => ({
            id: chat.chatId,
            title: chat.name || chat.chatId.split("@")[0],
            subtitle: `ID: ${chat.chatId}`,
            content: chat.lastMessage || "No messages",
            time: chat.timestamp || "Today",
            channel: "whatsapp" as const,
            recipient: chat.name || chat.chatId.split("@")[0],
            recipientAddress: chat.chatId
          }));

          if (liveChats.length > 0) {
            setItems(liveChats);
            setSelectedItem(liveChats[0]);
            loadWhatsAppChatHistory(liveChats[0].id);
            return;
          }
        }
      } catch (err) {
        console.error("WhatsApp live load error:", err);
      }
    }

    // Fallback to local mock data
    const mockItems = getMockItems(category);
    setItems(mockItems);
    if (mockItems.length > 0) {
      setSelectedItem(mockItems[0]);
    } else {
      setSelectedItem(null);
    }
  };

  const loadWhatsAppChatHistory = async (chatId: string) => {
    if (!connections.whatsapp || !user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/whatsapp/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          toolName: "whatsapp_read_chat_history",
          args: { chatId }
        })
      });
      const data = await res.json();
      if (data.success && data.result && Array.isArray(data.result.messages)) {
        setChatHistory(data.result.messages);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectLogItem = (item: LogItem) => {
    setSelectedItem(item);
    setRecipientName(item.recipient);
    setRecipientAddress(item.recipientAddress);
    setReplyChannel(item.channel === "whatsapp" ? "whatsapp" : "gmail");
    setSubject(item.channel === "gmail" ? `Re: ${item.title}` : "");
    setStatusMessage(null);

    if (item.channel === "whatsapp") {
      loadWhatsAppChatHistory(item.id);
    } else {
      setChatHistory([]);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setRecipientName(selectedItem.recipient);
      setRecipientAddress(selectedItem.recipientAddress);
      setReplyChannel(selectedItem.channel === "whatsapp" ? "whatsapp" : "gmail");
      setSubject(selectedItem.channel === "gmail" ? `Re: ${selectedItem.title}` : "");
    }
  }, [selectedItem]);

  // AI compose helper call
  const handleComposeAI = async () => {
    if (!selectedItem) return;
    setComposingAI(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/briefing/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: selectedItem.content,
          recipientName,
          replyChannel,
          tone
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.subject && replyChannel === "gmail") {
          setSubject(data.subject);
        }
        setMessageText(data.message);
      } else {
        throw new Error(data.error || "Failed to generate reply draft.");
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ text: e.message || "Failed to call AI Draft Helper.", type: "error" });
    } finally {
      setComposingAI(false);
    }
  };

  // Dispatch message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress || !messageText || !user) return;
    setSendingMessage(true);
    setStatusMessage(null);

    try {
      if (replyChannel === "whatsapp") {
        if (!connections.whatsapp) {
          throw new Error("WhatsApp account not connected. Please connect WhatsApp under Integrations settings.");
        }
        const res = await fetch("/api/whatsapp/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            toolName: "whatsapp_send_message",
            args: {
              to: recipientAddress,
              message: messageText
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          setStatusMessage({ text: "WhatsApp message successfully sent!", type: "success" });
          setMessageText("");
          // Refresh chat history
          loadWhatsAppChatHistory(recipientAddress);
        } else {
          throw new Error(data.error || "Failed to deliver WhatsApp message.");
        }
      } else {
        // Mock sending email
        setTimeout(() => {
          setStatusMessage({ 
            text: `[Simulation Mode] Draft email queued for ${recipientAddress}. (Subject: "${subject}")`, 
            type: "success" 
          });
          setMessageText("");
        }, 1200);
      }
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ text: e.message || "Failed to dispatch message.", type: "error" });
    } finally {
      setSendingMessage(false);
    }
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
        <p className="text-zinc-400 text-xs">Loading logs details...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">
      
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-border-color pb-5">
        <Link 
          href="/dashboard/briefing"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors w-fit"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Hub
        </Link>
        <h1 className="text-2xl font-bold text-foreground ml-2">Dashboard</h1>
      </div>

      {/* Row 1: Today's Briefing Card */}
      {briefing && (
        <div className="glass-panel rounded-3xl border border-border-color overflow-hidden bg-foreground/[0.01] p-6 md:p-8 space-y-6 flex flex-col relative">
          
          {/* Top Indicator & Pills inline */}
          <div className="flex items-center flex-wrap gap-3">
            <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C8.8 12.1 8 10.61 8 9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.61-.8 3.1-2.15 4.1z" />
              </svg>
            </div>
            
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[9px] font-bold">
                {briefing.categories?.email?.count ?? 0} Email
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold">
                {briefing.categories?.messages?.count ?? 0} Messages
              </span>
              <span className="px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/25 text-violet-400 text-[9px] font-bold">
                {briefing.categories?.mentions?.count ?? 0} Mentions
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] font-bold">
                {briefing.categories?.tasks?.count ?? 0} Tasks
              </span>
              <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[9px] font-bold">
                {briefing.categories?.followUps?.count ?? 0} Follow-Ups
              </span>
            </div>

            <span className="text-zinc-500 text-[10px] ml-auto shrink-0">
              {new Date(briefing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Title & Narrative */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
              {briefing.scheduleName}
            </h2>
            <div className="text-zinc-300 text-sm leading-relaxed max-w-5xl">
              {renderMarkdown(briefing.summaryText)}
            </div>
          </div>

        </div>
      )}

      {/* Split categories / items details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Column: CATEGORIES (Vertical selection) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categories</h3>
          
          <div className="flex flex-col gap-2 bg-card-bg/20 border border-border-color/40 p-2.5 rounded-2xl">
            {CATEGORY_META.map((cat) => {
              const isSelected = activeCategory === cat.id;
              const count = briefing?.categories?.[cat.id as keyof typeof briefing.categories]?.count ?? 0;

              let themeColor = "text-zinc-500 hover:text-zinc-300";
              if (isSelected) {
                if (cat.id === "email") themeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                else if (cat.id === "messages") themeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                else if (cat.id === "mentions") themeColor = "bg-violet-500/10 text-violet-400 border-violet-500/20";
                else if (cat.id === "tasks") themeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                else if (cat.id === "followUps") themeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    router.replace(`/dashboard/briefing/${id}?category=${cat.id}`);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border border-transparent text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${themeColor}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`shrink-0 ${isSelected ? "" : "opacity-60"}`}>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    isSelected ? "bg-foreground/[0.04]" : "text-zinc-500 bg-foreground/[0.02]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Items list */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border-color/30">
            <div className={`p-2.5 rounded-xl bg-foreground/[0.03] ${
              activeCategory === "email"
                ? "text-blue-400"
                : activeCategory === "messages"
                ? "text-emerald-400"
                : activeCategory === "mentions"
                ? "text-violet-400"
                : activeCategory === "tasks"
                ? "text-amber-400"
                : "text-rose-400"
            }`}>
              {CATEGORY_META.find(c => c.id === activeCategory)?.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white capitalize">{activeCategory === "followUps" ? "Follow-ups" : activeCategory}</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">{items.length} items</p>
            </div>
          </div>

          {/* List content */}
          {items.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-border-color/50 p-12 text-center text-zinc-500 text-xs italic">
              No communication logs detected under the "{activeCategory}" filter for this session.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-card-bg/20 border border-border-color/50 flex flex-col justify-between gap-3 relative"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-foreground/[0.03] shrink-0 ${
                        item.channel === "gmail" ? "text-red-500" : item.channel === "whatsapp" ? "text-emerald-500" : "text-blue-500"
                      }`}>
                        {item.channel === "gmail" ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                          </svg>
                        ) : item.channel === "whatsapp" ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 hover:underline cursor-pointer">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">{item.time}</span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed pl-1">
                    {item.content}
                  </p>

                  <div className="flex justify-end pt-1 shrink-0">
                    <button
                      onClick={() => {
                        selectLogItem(item);
                        setIsReplyOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/35 border border-violet-500/25 text-violet-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* AI Compose Drawer */}
      {isReplyOpen && selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsReplyOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#030014] border-l border-border-color h-full shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-border-color/60 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <HugeiconsIcon icon={AiBrain01Icon} size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">AI Reply Assistant</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Generate smart response to {selectedItem.recipient || "sender"}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsReplyOpen(false)}
                className="p-1.5 rounded-lg hover:bg-card-bg border border-transparent hover:border-border-color text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Original content preview */}
            <div className="my-5 p-4 rounded-xl bg-card-bg/25 border border-border-color/40 space-y-2 text-xs shrink-0">
              <div className="flex justify-between items-center text-zinc-500 text-[10px]">
                <span className="font-semibold">{selectedItem.subtitle}</span>
                <span>{selectedItem.time}</span>
              </div>
              <h4 className="font-bold text-white line-clamp-1">{selectedItem.title}</h4>
              <p className="text-zinc-400 line-clamp-3 leading-relaxed mt-1">{selectedItem.content}</p>
            </div>

            {/* AI Compose Form */}
            <form onSubmit={handleSendMessage} className="space-y-4 flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Channel</label>
                  <select
                    value={replyChannel}
                    onChange={(e) => setReplyChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="assertive">Assertive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Recipient Contact</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. name or phone/email"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {replyChannel === "gmail" && (
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Subject line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              )}

              {/* Generate Draft Button */}
              <button
                type="button"
                onClick={handleComposeAI}
                disabled={composingAI}
                className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <svg className={`w-3.5 h-3.5 ${composingAI ? "animate-spin" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {composingAI ? "Generating AI Draft..." : "Generate AI Reply"}
              </button>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Draft Reply</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Draft message will appear here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-xl border text-[11px] font-semibold leading-normal ${
                  statusMessage.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-red-500/10 border-red-500/25 text-red-400"
                }`}>
                  {statusMessage.text}
                </div>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={sendingMessage || !messageText}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 transition-all"
              >
                {sendingMessage ? "Sending..." : replyChannel === "whatsapp" ? "Send WhatsApp Message" : "Send Email"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
