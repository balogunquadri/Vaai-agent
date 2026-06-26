"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  TickDouble01Icon,
  PlayIcon,
  Settings01Icon,
  FolderOpenIcon,
  AlertCircleIcon,
  UserIcon,
  PlugIcon,
} from "@hugeicons/core-free-icons";

// Type definitions for Dashboard States
interface PriorityItem {
  app: string;
  title: string;
  time: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface BriefData {
  importantCount: number;
  priorityCount: number;
  followUpsCount: number;
  todayBrief: string;
  priorityItems: PriorityItem[];
}

const platformRegistry: Record<string, { name: string; brandColor: string; icon: React.ReactNode }> = {
  gmail: {
    name: "Gmail",
    brandColor: "bg-red-500",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    )
  },
  whatsapp: {
    name: "WhatsApp",
    brandColor: "bg-emerald-500",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z" />
      </svg>
    )
  },
  slack: {
    name: "Slack",
    brandColor: "bg-amber-500",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z" />
      </svg>
    )
  },
  outlook: {
    name: "Outlook",
    brandColor: "bg-blue-600",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z" />
      </svg>
    )
  },
  discord: {
    name: "Discord",
    brandColor: "bg-indigo-600",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.27 4.73a16.14 16.14 0 0 0-4.07-1.27l-.32.74a14.28 14.28 0 0 0-5.76 0l-.33-.74a16.14 16.14 0 0 0-4.07 1.27C1.66 9.42.5 14.58 1.13 19.67A16.14 16.14 0 0 0 6.08 22c.42-.55.79-1.15 1.1-1.79a11.51 11.51 0 0 1-1.78-.85l.26-.2c3.48 1.61 7.28 1.61 10.68 0l.26.2c-.56.33-1.16.62-1.78.85.31.64.68 1.24 1.1 1.79a16.14 16.14 0 0 0 4.95-2.33c.77-5.86-.53-10.9-4.34-14.94zM9 14.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zm6 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />
      </svg>
    )
  },
  telegram: {
    name: "Telegram",
    brandColor: "bg-sky-500",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.05 1.95c-.2-.2-.51-.25-.76-.1l-19.8 8.1c-.3.12-.48.43-.44.75s.28.56.58.6l5.22 1.3 2.92 5.1c.15.26.43.41.73.4.3 0 .57-.17.69-.45l1.98-4.5 5.58 4.2c.2.15.48.17.7.05s.33-.37.28-.62l-3-14.7c-.05-.28-.24-.5-.51-.57l-4.52.88 4.7 3.52c.2.15.5.07.6-.17l1-2.3zM9.54 15.56l-.3 2.94 1.4-1.92-.1-1.02z" />
      </svg>
    )
  },
  jira: {
    name: "Jira",
    brandColor: "bg-blue-600",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.2 2a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8h6.4c.4 0 .8-.4.8-.8V2.8a.8.8 0 0 0-.8-.8h-6.4zm-6.1 6.1a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8h6.4c.4 0 .8-.4.8-.8V8.9a.8.8 0 0 0-.8-.8H6.1zm12.2 0a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8H21.2c.4 0 .8-.4.8-.8V8.9a.8.8 0 0 0-.8-.8h-2.7z" />
      </svg>
    )
  },
  notion: {
    name: "Notion",
    brandColor: "bg-zinc-800",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 3v12h1.5v-3.5L12 18V6H9.5v5.5L6 6zM18 6h-4.5v12H18v-4.5h-2.5v1.5h1v1.5h-1v-4.5h2.5zm-5 0H9.5v1.5H13zm0 3H9.5v1.5H13z" />
      </svg>
    )
  },
  github: {
    name: "GitHub",
    brandColor: "bg-zinc-800",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    )
  },
  linkedin: {
    name: "LinkedIn",
    brandColor: "bg-blue-700",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    )
  }
};

const getPlatformMeta = (platformId: string) => {
  if (platformRegistry[platformId]) {
    return platformRegistry[platformId];
  }
  return {
    name: platformId.charAt(0).toUpperCase() + platformId.slice(1).replace("_", " "),
    brandColor: "bg-violet-600",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  };
};

const mcpToolsRegistry: Record<string, string[]> = {
  gmail: ["gmail_list_messages", "gmail_get_message", "gmail_create_draft"],
  whatsapp: ["whatsapp_get_recent_messages", "whatsapp_read_chat_history", "whatsapp_send_message", "whatsapp_search_chats", "whatsapp_summarize_conversations", "whatsapp_get_contact_details", "whatsapp_list_groups", "whatsapp_fetch_group_messages", "whatsapp_send_group_message"],
  slack: ["slack_list_channels", "slack_post_message"],
  outlook: ["outlook_list_messages", "outlook_send_message"],
  discord: ["discord_post_message"],
  telegram: ["telegram_send_message"],
  notion: ["notion_get_page", "notion_append_block"],
  jira: ["jira_get_issue", "jira_create_issue"],
  github: ["github_list_repos", "github_get_pull_requests", "github_create_issue"],
  teams: ["teams_list_channels", "teams_send_message"],
  lark: ["lark_get_chat_history", "lark_send_message"],
  instagram: ["instagram_get_feed", "instagram_get_messages"],
  x_twitter: ["x_post_tweet", "x_search_mentions"],
  threads: ["threads_post_update", "threads_get_user_profile"],
  toggl: ["toggl_start_timer", "toggl_stop_timer"],
  calendly: ["calendly_get_events"],
  google_calendar: ["gcal_list_events", "gcal_create_event"],
  google_drive: ["gdrive_search_files", "gdrive_download_file"],
  trello: ["trello_get_boards", "trello_create_card"],
  asana: ["asana_get_tasks", "asana_create_task"],
  meet: ["meet_create_event"],
  zoom: ["zoom_create_meeting"],
  manus: ["manus_run_agent"],
  zapier: ["zapier_trigger_zap"],
  tango: ["tango_get_workflows"]
};

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [connectedAppRows, setConnectedAppRows] = useState<any[]>([]);

  const connectedPlatforms = Object.keys(connections).filter((key) => connections[key] === true);
  const activeTabsList = ["gmail", "whatsapp", ...connectedPlatforms.filter(p => p !== "gmail" && p !== "whatsapp")];
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<string>("gmail");
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gmailEmails, setGmailEmails] = useState<any[]>([]);
  const [whatsappChats, setWhatsappChats] = useState<any[]>([]);
  const [gmailQuery, setGmailQuery] = useState<string>("");
  const [whatsappQuery, setWhatsappQuery] = useState<string>("");
  const [loadingRawData, setLoadingRawData] = useState<boolean>(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<"gmail" | "whatsapp">("gmail");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeActionType, setComposeActionType] = useState<"send" | "draft">("send");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState<"gmail" | "whatsapp">("gmail");
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalTool, setTerminalTool] = useState("gmail_list_messages");
  const [terminalArgs, setTerminalArgs] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [terminalExecuting, setTerminalExecuting] = useState(false);

  // Load connection states from DB and LocalStorage
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

      // Save connected rows for display (sorted by updated_at desc)
      const connectedRows = (data || []).filter((r: any) => r.connected).sort((a: any, b: any) => {
        const ta = new Date(a.updated_at || 0).getTime();
        const tb = new Date(b.updated_at || 0).getTime();
        return tb - ta;
      });
      setConnectedAppRows(connectedRows);

      // Synchronize client-side localStorage access token state with Gmail connection map
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

  // Fetch data from connected platforms to generate the dashboard brief on the server side
  const generateDashboardBrief = async (activeConnections: Record<string, boolean>, forceRefresh = false, currentBriefData: BriefData | null = null) => {
    if (!user) return;
    
    // Only set loading to true if we don't have cached data, or if we are force-refreshing
    if (!currentBriefData || forceRefresh) {
      setLoadingBrief(true);
    }
    setErrorMessage("");

    try {
      const res = await fetch("/api/dashboard/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to compile workspace briefing data.");
      }

      const data = await res.json();
      setBriefData(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to contact briefing server.");
    } finally {
      setLoadingBrief(false);
    }
  };

  // Fetch recent stream items for the selected active tab
  const fetchActiveTabFeed = async (platformId: string) => {
    if (!user) return;
    setLoadingFeed(true);
    try {
      const res = await fetch(`/api/mcp/feed?userId=${user.id}&platformId=${platformId}`);
      const data = await res.json();
      if (data.success) {
        setFeedItems(data.items || []);
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error("Error fetching active tab feed:", err);
      setFeedItems([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleRefresh = async () => {
    const activeConns = await fetchConnections();
    await generateDashboardBrief(activeConns, true, briefData);
  };

  const handleGmailUnauthorized = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gmail_access_token");
      localStorage.removeItem("gmail_connected");
    }
    setConnections(prev => ({ ...prev, gmail: false }));
    if (user) {
      try {
        await insforge.database
          .from("integrations")
          .update({ connected: false, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("platform", "gmail");
      } catch (err) {
        console.error("Failed to mark Gmail disconnected in DB:", err);
      }
    }
  };

  const fetchGmailEmails = async (query = "") => {
    setLoadingRawData(true);
    try {
      const queryParam = query ? `&q=${encodeURIComponent(query)}` : "";
      const listRes = await fetchWithTokenRetry(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5${queryParam}`
      );
      if (listRes.status === 401) {
        await handleGmailUnauthorized();
        return;
      }
      if (listRes.ok) {
        const listData = await listRes.json();
        const messages = listData.messages || [];
        const detailsPromises = messages.map(async (msg: any) => {
          const detailRes = await fetchWithTokenRetry(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
          );
          if (detailRes.status === 401) {
            await handleGmailUnauthorized();
            return null;
          }
          if (!detailRes.ok) return null;
          const detailData = await detailRes.json();
          const headers = detailData.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
          return {
            id: msg.id,
            from: fromHeader,
            subject: subjectHeader,
            date: dateHeader,
            snippet: detailData.snippet || "",
          };
        });
        const emails = (await Promise.all(detailsPromises)).filter(Boolean);
        setGmailEmails(emails);
      }
    } catch (err) {
      console.error("Failed to fetch Gmail emails:", err);
    } finally {
      setLoadingRawData(false);
    }
  };

  const constructRawEmail = (to: string, subject: string, body: string) => {
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      body
    ];
    const emailStr = emailLines.join("\r\n");
    const encoded = btoa(unescape(encodeURIComponent(emailStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encoded;
  };

  const handleSendGmail = async (to: string, subject: string, body: string, actionType: "send" | "draft") => {
    try {
      const raw = constructRawEmail(to, subject, body);
      const url = actionType === "send"
        ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
        : `https://gmail.googleapis.com/gmail/v1/users/me/drafts`;
      
      const requestBody = actionType === "send" ? { raw } : { message: { raw } };

      const res = await fetchWithTokenRetry(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (res.status === 401) {
        await handleGmailUnauthorized();
        alert("Gmail session expired. Please reconnect your Google account.");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to perform Gmail action.");
      }

      alert(actionType === "send" ? "Email sent successfully!" : "Draft created successfully!");
      setIsComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      fetchGmailEmails();
    } catch (err: any) {
      alert(err.message || "Failed to send email.");
    }
  };

  const searchWhatsAppChats = async (query = "") => {
    if (!user) return;
    if (!query) {
      const activeConns = await fetchConnections();
      generateDashboardBrief(activeConns, false, briefData);
      return;
    }
    setLoadingRawData(true);
    try {
      const res = await fetch("/api/whatsapp/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          toolName: "whatsapp_search_chats",
          args: { query }
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.result)) {
        setWhatsappChats(data.result.map((c: any) => ({
          chatId: c.id,
          name: c.name,
          lastMessage: c.lastMessage || "No messages",
          timestamp: c.timestamp ? new Date(c.timestamp).toLocaleString() : "N/A",
          isGroup: c.isGroup
        })));
      }
    } catch (err) {
      console.error("Failed to search WhatsApp chats:", err);
    } finally {
      setLoadingRawData(false);
    }
  };

  const handleSendWhatsApp = async (to: string, message: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/whatsapp/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          toolName: "whatsapp_send_message",
          args: { to, message }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("WhatsApp message sent successfully!");
        setIsComposeOpen(false);
        setComposeTo("");
        setComposeBody("");
        const activeConns = await fetchConnections();
        generateDashboardBrief(activeConns, false, briefData);
      } else {
        throw new Error(data.error || "Failed to send message.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send WhatsApp message.");
    }
  };

  const viewGmailMessageDetails = async (messageId: string) => {
    setIsDetailOpen(true);
    setDetailType("gmail");
    setSelectedMessage(null);
    try {
      const detailRes = await fetchWithTokenRetry(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`
      );
      if (detailRes.status === 401) {
        await handleGmailUnauthorized();
        setIsDetailOpen(false);
        alert("Gmail session expired. Please reconnect your Google account.");
        return;
      }
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const headers = detailData.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
        
        const extractEmailBody = (part: any): string => {
          if (!part) return "";
          if (part.body?.data && part.mimeType === "text/plain") {
            try {
              const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              return decodeURIComponent(escape(decoded));
            } catch (e) {
              try {
                return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              } catch (_) {
                return "";
              }
            }
          }
          if (part.parts && part.parts.length > 0) {
            for (const subpart of part.parts) {
              const body = extractEmailBody(subpart);
              if (body) return body;
            }
          }
          return "";
        };

        const extractHtmlFallback = (part: any): string => {
          if (!part) return "";
          if (part.body?.data && part.mimeType === "text/html") {
            try {
              const decoded = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              return decodeURIComponent(escape(decoded)).replace(/<[^>]*>/g, ' ');
            } catch (e) {
              try {
                return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/')).replace(/<[^>]*>/g, ' ');
              } catch (_) {
                return "";
              }
            }
          }
          if (part.parts && part.parts.length > 0) {
            for (const subpart of part.parts) {
              const body = extractHtmlFallback(subpart);
              if (body) return body;
            }
          }
          return "";
        };

        const bodyText = extractEmailBody(detailData.payload) || extractHtmlFallback(detailData.payload) || detailData.snippet || "No body content.";

        setSelectedMessage({
          id: messageId,
          from: fromHeader,
          subject: subjectHeader,
          date: dateHeader,
          snippet: detailData.snippet || "",
          body: bodyText
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewWhatsAppChatHistory = async (chatId: string, name: string) => {
    if (!user) return;
    setIsDetailOpen(true);
    setDetailType("whatsapp");
    setSelectedChat(null);
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
      if (data.success && data.result) {
        setSelectedChat({
          chatId,
          name,
          messages: data.result.messages || []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunTerminalMcp = async () => {
    if (!user) return;
    setTerminalExecuting(true);
    setTerminalOutput("");
    try {
      let argsObj: any = {};
      if (terminalArgs.trim()) {
        try {
          argsObj = JSON.parse(terminalArgs);
        } catch (e) {
          throw new Error("Invalid arguments JSON. Must be a valid JSON object.");
        }
      }

      if (terminalTool.startsWith("gmail_")) {
        if (terminalTool === "gmail_list_messages") {
          const queryParam = argsObj.q ? `&q=${encodeURIComponent(argsObj.q)}` : "";
          const listRes = await fetchWithTokenRetry(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5${queryParam}`
          );
          if (listRes.status === 401) {
            await handleGmailUnauthorized();
            throw new Error("Gmail session expired. Reconnect your Google account.");
          }
          const listData = await listRes.json();
          setTerminalOutput(JSON.stringify(listData, null, 2));
        } else if (terminalTool === "gmail_get_message") {
          if (!argsObj.id) throw new Error("Missing required argument 'id'");
          const detailRes = await fetchWithTokenRetry(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${argsObj.id}`
          );
          if (detailRes.status === 401) {
            await handleGmailUnauthorized();
            throw new Error("Gmail session expired. Reconnect your Google account.");
          }
          const detailData = await detailRes.json();
          setTerminalOutput(JSON.stringify(detailData, null, 2));
        } else if (terminalTool === "gmail_create_draft") {
          if (!argsObj.to || !argsObj.subject || !argsObj.body) {
            throw new Error("Missing required arguments. Need 'to', 'subject', and 'body'.");
          }
          const raw = constructRawEmail(argsObj.to, argsObj.subject, argsObj.body);
          const res = await fetchWithTokenRetry(
            `https://gmail.googleapis.com/gmail/v1/users/me/drafts`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ message: { raw } })
            }
          );
          if (res.status === 401) {
            await handleGmailUnauthorized();
            throw new Error("Gmail session expired. Reconnect your Google account.");
          }
          const draftData = await res.json();
          setTerminalOutput(JSON.stringify(draftData, null, 2));
        } else {
          throw new Error("Unsupported Gmail tool");
        }
      } else if (terminalTool.startsWith("whatsapp_")) {
        const res = await fetch("/api/whatsapp/mcp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            toolName: terminalTool,
            args: argsObj
          })
        });
        const data = await res.json();
        setTerminalOutput(JSON.stringify(data, null, 2));
      } else {
        // Unify other platforms under the /api/mcp/execute endpoint
        const res = await fetch("/api/mcp/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            platformId: activeTab,
            toolName: terminalTool,
            args: argsObj
          })
        });
        const data = await res.json();
        setTerminalOutput(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setTerminalOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setTerminalExecuting(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Step 1: Fetch connection states immediately
      fetchConnections().then((activeConns) => {
        // Step 2: Retrieve cached briefing immediately
        fetch(`/api/dashboard/brief?userId=${user.id}`)
          .then((res) => res.json())
          .then((data) => {
            let loadedCache: BriefData | null = null;
            if (data.success && data.cached) {
              loadedCache = data.cached;
              setBriefData(data.cached);
              setLoadingBrief(false);
            }
            // Always generate/fetch raw data in background, passing loadedCache to avoid loading skeleton if cache exists
            generateDashboardBrief(activeConns, false, loadedCache);
          })
          .catch((err) => {
            console.error("Error loading cached brief:", err);
            generateDashboardBrief(activeConns, false, null);
          });
      });
    }
  }, [user]);

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

  // Connected Apps listing configuration
  const topAppsList = [
    {
      id: "gmail",
      name: "Gmail",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      brandColor: "bg-red-500",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
        </svg>
      ),
      brandColor: "bg-emerald-500",
    },
    {
      id: "slack",
      name: "Slack",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
        </svg>
      ),
      brandColor: "bg-amber-500",
    },
    {
      id: "outlook",
      name: "Outlook",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z"/>
        </svg>
      ),
      brandColor: "bg-blue-600",
    },
  ];

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">
      
      {/* Personalized Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <HugeiconsIcon icon={UserIcon} size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, <span className="text-gradient font-extrabold">{profile?.name || user?.email?.split("@")[0] || "User"}</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Workspace Overview &bull; {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Global Action Header */}
        <button
          onClick={handleRefresh}
          disabled={loadingBrief}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition-all"
        >
          <HugeiconsIcon icon={PlayIcon} size={14} className={loadingBrief ? "animate-spin" : ""} />
          {loadingBrief ? "Updating brief..." : "Refresh / Regenerate"}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Important Stats Card */}
        <div className="glass-panel rounded-3xl p-6 border border-border-color relative overflow-hidden group hover:scale-[1.01] hover:border-red-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Important Items</span>
              <p className="text-4xl font-extrabold text-white mt-1">
                {loadingBrief ? "..." : briefData?.importantCount ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} />
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-500" />
        </div>

        {/* Priority Stats Card */}
        <div className="glass-panel rounded-3xl p-6 border border-border-color relative overflow-hidden group hover:scale-[1.01] hover:border-violet-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Priority Tasks</span>
              <p className="text-4xl font-extrabold text-white mt-1">
                {loadingBrief ? "..." : briefData?.priorityCount ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <HugeiconsIcon icon={AiBrain01Icon} size={20} />
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-500" />
        </div>

        {/* Follow-ups Stats Card */}
        <div className="glass-panel rounded-3xl p-6 border border-border-color relative overflow-hidden group hover:scale-[1.01] hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Required Follow-ups</span>
              <p className="text-4xl font-extrabold text-white mt-1">
                {loadingBrief ? "..." : briefData?.followUpsCount ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <HugeiconsIcon icon={TickDouble01Icon} size={20} />
            </div>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500" />
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Column 1: Today's Brief Card */}
        <div className="glass-panel rounded-3xl border border-border-color overflow-hidden bg-foreground/[0.01] p-6 space-y-5 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-border-color/60 pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={AiBrain01Icon} size={18} className="text-violet-400 animate-pulse" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Today's AI Briefing</h3>
            </div>

            {/* Source app indicator badges */}
            <div className="flex items-center gap-1.5 flex-wrap max-w-[200px] justify-end">
              {Object.keys(connections)
                .filter((key) => connections[key] === true)
                .map((platformId) => {
                  const meta = getPlatformMeta(platformId);
                  return (
                    <span
                      key={platformId}
                      className="p-1.5 rounded-lg bg-foreground/[0.03] border border-border-color/60 text-zinc-400 shrink-0"
                      title={`${meta.name} Connected`}
                    >
                      {meta.icon}
                    </span>
                  );
                })}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[220px]">
            {loadingBrief ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-xs font-medium">Analyzing logs and creating your workspace brief...</p>
              </div>
            ) : briefData?.todayBrief ? (
              renderMarkdown(briefData.todayBrief)
            ) : (
              <div className="text-center py-6 text-zinc-500 italic text-xs">
                No summary brief could be compiled. Connect integrations to begin.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Connected Apps Overview */}
        <div className="glass-panel rounded-3xl border border-border-color overflow-hidden bg-foreground/[0.01] p-6 space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-border-color/60 pb-3">
            <HugeiconsIcon icon={FolderOpenIcon} size={18} className="text-violet-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Connected App Channels</h3>
          </div>

          <div className="space-y-4 flex-1">
            {connectedAppRows && connectedAppRows.length > 0 ? (
              connectedAppRows.slice(0, 4).map((row: any) => {
                const meta = getPlatformMeta(row.platform);
                return (
                  <div
                    key={row.platform}
                    className="flex items-center justify-between p-3 rounded-2xl bg-card-bg/50 border border-border-color/40 hover:bg-card-bg/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${meta.brandColor}`}>
                        {meta.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-none mb-1">{meta.name}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${row.connected ? "text-emerald-400" : "text-zinc-500"}`}>
                          {row.connected ? "Active" : "Offline"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/dashboard/integrations"
                      className="p-1.5 rounded-lg bg-foreground/[0.03] border border-border-color text-zinc-400 hover:text-foreground hover:bg-foreground/[0.08] transition-all"
                      title={`Manage ${meta.name}`}
                    >
                      <HugeiconsIcon icon={Settings01Icon} size={14} />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-400 mb-4">No connected applications were found for your workspace.</p>
                <Link
                  href="/dashboard/integrations"
                  className="inline-flex px-4 py-2 bg-foreground/[0.03] border border-border-color hover:bg-foreground/[0.08] text-foreground rounded-2xl text-xs font-bold tracking-wide transition-all"
                >
                  Connect Integrations
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/integrations"
              className="w-full py-3 bg-foreground/[0.03] border border-border-color hover:bg-foreground/[0.08] text-foreground rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              Go to Integrations Grid
            </Link>
          </div>
        </div>

        {/* Column 3: Priority Items Card */}
        <div className="glass-panel rounded-3xl border border-border-color overflow-hidden bg-foreground/[0.01] p-6 space-y-5 flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-border-color/60 pb-3">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-red-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Priority Tasks</h3>
          </div>

          <div className="space-y-4 flex-1">
            {loadingBrief ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-8 h-8 border-3 border-red-500/35 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-xs font-medium">Extracting priority tasks...</p>
              </div>
            ) : briefData?.priorityItems && briefData.priorityItems.length > 0 ? (
              briefData.priorityItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-card-bg border border-border-color/60 flex items-start gap-4 hover:border-border-color transition-colors"
                >
                  {/* App icon container */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                    getPlatformMeta(item.app).brandColor
                  }`}>
                    {getPlatformMeta(item.app).icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-normal line-clamp-2">{item.description}</p>
                    
                    {/* Priority indicator */}
                    <div className="pt-1 flex">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold tracking-wider border ${
                        item.priority === "high" 
                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : item.priority === "medium"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500 italic text-xs">
                No priority items found. Check back once you have connected integrations.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Live Data Streams Section */}
      <div className="glass-panel rounded-3xl border border-border-color p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color/60 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              Live Connected App Streams
            </h2>
            <p className="text-zinc-400 text-xs">
              Real-time message feeds consumed directly from your active integrations.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-2 bg-foreground/[0.03] p-1.5 rounded-2xl border border-border-color/60">
            {activeTabsList.map((platformId) => {
              const meta = getPlatformMeta(platformId);
              const isSelected = activeTab === platformId;
              return (
                <button
                  key={platformId}
                  onClick={() => setActiveTab(platformId)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${meta.brandColor} text-white shadow-md`
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {meta.icon}
                  {meta.name}
                </button>
              );
            })}

            {/* Direct integrations grid shortcut link */}
            <Link
              href="/dashboard/integrations"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-foreground/[0.08] transition-all flex items-center gap-1.5 border border-dashed border-zinc-700/60 cursor-pointer"
            >
              <HugeiconsIcon icon={PlugIcon} size={14} />
              <span>Connect App</span>
            </Link>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          {activeTab === "gmail" && (
            <div className="space-y-4 animate-fade-in">
              {!connections.gmail ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Gmail integration is offline</h3>
                    <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                      Connect your Gmail account to start consuming and displaying your latest inbox messages.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/integrations"
                    className="inline-flex px-4 py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all"
                  >
                    Set up Gmail
                  </Link>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg/25 p-4 rounded-2xl border border-border-color/40">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        value={gmailQuery}
                        onChange={(e) => setGmailQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchGmailEmails(gmailQuery)}
                        placeholder="Search emails (e.g. is:unread)..."
                        className="w-full md:w-64 px-3 py-2 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={() => fetchGmailEmails(gmailQuery)}
                        className="px-3 py-2 bg-violet-600/10 hover:bg-violet-600/30 border border-violet-500/20 text-violet-400 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Search
                      </button>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => {
                          setComposeType("gmail");
                          setComposeTo("");
                          setComposeSubject("");
                          setComposeBody("");
                          setIsComposeOpen(true);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Compose Email
                      </button>
                      <button
                        onClick={() => {
                          setTerminalTool("gmail_list_messages");
                          setTerminalArgs('{\n  "q": "is:unread"\n}');
                          setTerminalOutput("");
                          setIsTerminalOpen(true);
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                        Gmail MCP Console
                      </button>
                    </div>
                  </div>

                  {loadingRawData ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="w-8 h-8 border-3 border-red-500/35 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-zinc-500 text-xs font-medium">Loading recent emails...</p>
                    </div>
                  ) : gmailEmails.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 italic text-xs bg-background/20 rounded-2xl border border-border-color/40">
                      No emails found in this feed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {gmailEmails.map((email: any) => (
                        <div
                          key={email.id}
                          className="p-5 rounded-2xl bg-card-bg/40 border border-border-color hover:border-red-500/20 hover:bg-card-bg/60 transition-all duration-300 flex flex-col md:flex-row justify-between gap-4 items-start"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-500/10 border border-red-500/25 text-red-400">
                                Gmail
                              </span>
                              <span className="text-xs font-bold text-white">{email.from}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {email.date ? new Date(email.date).toLocaleString() : "Date unknown"}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-200">{email.subject}</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{email.snippet}</p>
                          </div>
                          
                          <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto">
                            <button
                              onClick={() => viewGmailMessageDetails(email.id)}
                              className="flex-1 md:w-28 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold border border-zinc-700 transition-all cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setComposeType("gmail");
                                const emailMatch = email.from.match(/<([^>]+)>/);
                                const toEmail = emailMatch ? emailMatch[1] : email.from;
                                setComposeTo(toEmail);
                                setComposeSubject(`Re: ${email.subject.startsWith("Re:") ? "" : "Re: "}${email.subject}`);
                                setComposeBody(`\n\nOn ${email.date}, ${email.from} wrote:\n> ${email.snippet}`);
                                setIsComposeOpen(true);
                              }}
                              className="flex-1 md:w-28 py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "whatsapp" && (
            <div className="space-y-4 animate-fade-in">
              {!connections.whatsapp ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">WhatsApp integration is offline</h3>
                    <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                      Connect your WhatsApp account to start consuming and displaying your latest chat streams.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/integrations"
                    className="inline-flex px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                  >
                    Set up WhatsApp
                  </Link>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg/25 p-4 rounded-2xl border border-border-color/40">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        value={whatsappQuery}
                        onChange={(e) => setWhatsappQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchWhatsAppChats(whatsappQuery)}
                        placeholder="Search chats by name..."
                        className="w-full md:w-64 px-3 py-2 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => searchWhatsAppChats(whatsappQuery)}
                        className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Search
                      </button>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => {
                          setComposeType("whatsapp");
                          setComposeTo("");
                          setComposeBody("");
                          setIsComposeOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Send Message
                      </button>
                      <button
                        onClick={() => {
                          setTerminalTool("whatsapp_get_recent_messages");
                          setTerminalArgs('{\n  "limit": 5\n}');
                          setTerminalOutput("");
                          setIsTerminalOpen(true);
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="4 17 10 11 4 5" />
                          <line x1="12" y1="19" x2="20" y2="19" />
                        </svg>
                        WhatsApp MCP Console
                      </button>
                    </div>
                  </div>

                  {loadingRawData ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="w-8 h-8 border-3 border-emerald-500/35 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-zinc-500 text-xs font-medium">Loading WhatsApp chats...</p>
                    </div>
                  ) : whatsappChats.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 italic text-xs bg-background/20 rounded-2xl border border-border-color/40">
                      No WhatsApp chats found in this feed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {whatsappChats.map((chat: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-card-bg/40 border border-border-color hover:border-emerald-500/20 hover:bg-card-bg/60 transition-all duration-300 flex flex-col md:flex-row justify-between gap-4 items-start"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                                WhatsApp
                              </span>
                              <span className="text-xs font-bold text-white">{chat.name}</span>
                              {chat.isGroup && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-500/10 border border-blue-500/25 text-blue-400 uppercase">
                                  Group
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {chat.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium italic">
                              "{chat.lastMessage}"
                            </p>
                          </div>

                          <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto">
                            <button
                              onClick={() => viewWhatsAppChatHistory(chat.chatId, chat.name)}
                              className="flex-1 md:w-28 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold border border-zinc-700 transition-all cursor-pointer"
                            >
                              Chat History
                            </button>
                            <button
                              onClick={() => {
                                setComposeType("whatsapp");
                                setComposeTo(chat.chatId);
                                setComposeBody("");
                                setIsComposeOpen(true);
                              }}
                              className="flex-1 md:w-28 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Reply / Message
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!["gmail", "whatsapp"].includes(activeTab) && (
            <div className="space-y-4 animate-fade-in">
              {/* Action Bar */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg/25 p-4 rounded-2xl border border-border-color/40">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Filter ${getPlatformMeta(activeTab).name} items...`}
                    className="w-full md:w-64 px-3 py-2 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      const tools = mcpToolsRegistry[activeTab] || [];
                      const defaultTool = tools[0] || `${activeTab}_`;
                      setTerminalTool(defaultTool);
                      if (defaultTool === "slack_post_message") {
                        setTerminalArgs('{\n  "channel": "general",\n  "text": "Hello from dashboard!"\n}');
                      } else if (defaultTool === "github_create_issue") {
                        setTerminalArgs('{\n  "repo": "vaai-core",\n  "title": "Bug Title",\n  "body": "Bug Description"\n}');
                      } else if (defaultTool === "notion_get_page") {
                        setTerminalArgs('{\n  "pageId": "oauth-specs"\n}');
                      } else if (defaultTool === "jira_get_issue") {
                        setTerminalArgs('{\n  "issueKey": "SEC-402"\n}');
                      } else {
                        setTerminalArgs('{}');
                      }
                      setTerminalOutput("");
                      setIsTerminalOpen(true);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    {getPlatformMeta(activeTab).name} MCP Console
                  </button>
                </div>
              </div>

              {loadingFeed ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-zinc-500 text-xs font-medium">Loading stream items...</p>
                </div>
              ) : feedItems.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 italic text-xs bg-background/20 rounded-2xl border border-border-color/40">
                  No stream items found in this feed.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {feedItems
                    .filter((item) => {
                      if (!searchQuery) return true;
                      const textMatch = item.text?.toLowerCase().includes(searchQuery.toLowerCase());
                      const titleMatch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
                      const userMatch = item.user?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        item.from?.toLowerCase().includes(searchQuery.toLowerCase());
                      return textMatch || titleMatch || userMatch;
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-card-bg/40 border border-border-color hover:border-violet-500/20 hover:bg-card-bg/60 transition-all duration-300 flex flex-col md:flex-row justify-between gap-4 items-start"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase text-white ${getPlatformMeta(activeTab).brandColor}`}>
                              {getPlatformMeta(activeTab).name}
                            </span>
                            {item.user && (
                              <span className="text-xs font-bold text-white">{item.user}</span>
                            )}
                            {item.from && (
                              <span className="text-xs font-bold text-white">{item.from}</span>
                            )}
                            {item.repo && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                                {item.repo}
                              </span>
                            )}
                            {item.priority && (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                                item.priority === "critical" || item.priority === "high"
                                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              }`}>
                                {item.priority}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {item.time ? new Date(item.time).toLocaleString() : "Just now"}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-200">{item.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose Form Modal (Gmail & WhatsApp) */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-border-color p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {composeType === "gmail" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    New Gmail Message
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    New WhatsApp Message
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Recipient ({composeType === "gmail" ? "Email Address" : "Phone / Chat JID"})
                </label>
                <input
                  type="text"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder={composeType === "gmail" ? "email@example.com" : "e.g. 1234567890@s.whatsapp.net"}
                  className="w-full px-3.5 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              {composeType === "gmail" && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full px-3.5 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Message Body</label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none font-sans"
                />
              </div>

              {composeType === "gmail" && (
                <div className="flex items-center gap-4 bg-background/50 p-2.5 rounded-xl border border-border-color">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Action Type:</span>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="composeAction"
                      checked={composeActionType === "send"}
                      onChange={() => setComposeActionType("send")}
                      className="accent-violet-500"
                    />
                    Send Directly
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="composeAction"
                      checked={composeActionType === "draft"}
                      onChange={() => setComposeActionType("draft")}
                      className="accent-violet-500"
                    />
                    Create Draft
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (composeType === "gmail") {
                    handleSendGmail(composeTo, composeSubject, composeBody, composeActionType);
                  } else {
                    handleSendWhatsApp(composeTo, composeBody);
                  }
                }}
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                  composeType === "gmail" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {composeType === "gmail" ? (composeActionType === "send" ? "Send Email" : "Create Draft") : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message/Chat Detail Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-border-color p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {detailType === "gmail" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    Email Reader
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    WhatsApp Conversation
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
              {detailType === "gmail" ? (
                selectedMessage ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-background border border-border-color/60 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">From</span>
                        <span className="text-zinc-400 font-mono">{selectedMessage.date}</span>
                      </div>
                      <p className="text-white font-bold">{selectedMessage.from}</p>
                      
                      <div className="border-t border-border-color/40 my-2 pt-2">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Subject</span>
                        <p className="text-violet-300 font-bold mt-0.5">{selectedMessage.subject}</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-background/40 border border-border-color whitespace-pre-wrap leading-relaxed text-zinc-300 font-mono text-[11px] overflow-x-auto">
                      {selectedMessage.body}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 border-3 border-red-500/35 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs">Fetching full email content...</p>
                  </div>
                )
              ) : (
                selectedChat ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-background border border-border-color/60 rounded-xl">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Chatting with</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{selectedChat.name}</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedChat.messages.length === 0 ? (
                        <p className="text-center text-zinc-500 italic text-xs py-6">No message history available in local cache.</p>
                      ) : (
                        selectedChat.messages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              msg.from === "Me"
                                ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 ml-auto"
                                : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-200"
                            }`}
                          >
                            <span className="text-[9px] font-bold text-zinc-500 mb-0.5">{msg.from}</span>
                            <p>{msg.body}</p>
                            <span className="text-[8px] text-zinc-500 self-end mt-1.5 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 border-3 border-emerald-500/35 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 text-xs">Loading chat conversation history...</p>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-color/40 pt-3">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              {detailType === "gmail" && selectedMessage && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setComposeType("gmail");
                    const emailMatch = selectedMessage.from.match(/<([^>]+)>/);
                    const toEmail = emailMatch ? emailMatch[1] : selectedMessage.from;
                    setComposeTo(toEmail);
                    setComposeSubject(`Re: ${selectedMessage.subject.startsWith("Re:") ? "" : "Re: "}${selectedMessage.subject}`);
                    setComposeBody(`\n\nOn ${selectedMessage.date}, ${selectedMessage.from} wrote:\n> ${selectedMessage.snippet}`);
                    setIsComposeOpen(true);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reply
                </button>
              )}
              {detailType === "whatsapp" && selectedChat && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setComposeType("whatsapp");
                    setComposeTo(selectedChat.chatId);
                    setComposeBody("");
                    setIsComposeOpen(true);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom MCP Terminal Command Console */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-border-color p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                Interactive MCP Terminal Console
              </h3>
              <button
                onClick={() => setIsTerminalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Input Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Select MCP Tool</label>
                  <select
                    value={terminalTool}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTerminalTool(val);
                      if (val === "gmail_list_messages") {
                        setTerminalArgs('{\n  "q": "is:unread"\n}');
                      } else if (val === "gmail_get_message") {
                        setTerminalArgs('{\n  "id": ""\n}');
                      } else if (val === "gmail_create_draft") {
                        setTerminalArgs('{\n  "to": "email@example.com",\n  "subject": "Hello",\n  "body": "World"\n}');
                      } else if (val === "whatsapp_get_recent_messages") {
                        setTerminalArgs('{\n  "limit": 5\n}');
                      } else if (val === "whatsapp_read_chat_history") {
                        setTerminalArgs('{\n  "chatId": ""\n}');
                      } else if (val === "whatsapp_send_message") {
                        setTerminalArgs('{\n  "to": "",\n  "message": "Hello from dashboard"\n}');
                      } else if (val === "slack_post_message") {
                        setTerminalArgs('{\n  "channel": "general",\n  "text": "Hello from dashboard!"\n}');
                      } else if (val === "github_create_issue") {
                        setTerminalArgs('{\n  "repo": "vaai-core",\n  "title": "Bug Title",\n  "body": "Bug Description"\n}');
                      } else if (val === "notion_get_page") {
                        setTerminalArgs('{\n  "pageId": "oauth-specs"\n}');
                      } else if (val === "jira_get_issue") {
                        setTerminalArgs('{\n  "issueKey": "SEC-402"\n}');
                      } else {
                        setTerminalArgs('{}');
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground focus:outline-none focus:border-violet-500"
                  >
                    {activeTabsList.map((tabId) => {
                      const tools = mcpToolsRegistry[tabId] || [];
                      const meta = getPlatformMeta(tabId);
                      if (tools.length === 0) return null;
                      return (
                        <optgroup key={tabId} label={`${meta.name} Tools`}>
                          {tools.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Arguments (JSON format)
                  </label>
                  <textarea
                    value={terminalArgs}
                    onChange={(e) => setTerminalArgs(e.target.value)}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500 font-mono resize-none"
                  />
                </div>

                <button
                  onClick={handleRunTerminalMcp}
                  disabled={terminalExecuting}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {terminalExecuting ? "Executing custom MCP..." : "Run Tool Call"}
                </button>
              </div>

              {/* JSON Result Display Column */}
              <div className="flex flex-col h-full">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Response Payload</label>
                <div className="flex-1 min-h-[200px] md:min-h-0 bg-background/50 border border-border-color rounded-xl p-4 overflow-auto font-mono text-[10px] text-emerald-400 whitespace-pre-wrap leading-relaxed animate-fade-in">
                  {terminalExecuting ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span>Running tool on MCP host...</span>
                    </div>
                  ) : terminalOutput ? (
                    terminalOutput
                  ) : (
                    <span className="text-zinc-600">MCP server output will be rendered here.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTerminalOpen(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
