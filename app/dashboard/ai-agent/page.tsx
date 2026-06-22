"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBrain01Icon,
  NotebookIcon,
  PlayIcon,
  TickDouble01Icon,
  BubbleChatIcon,
  ArrowUp01Icon,
  Delete02Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export default function AIAgentPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Array<any>>([]);
  const [uploading, setUploading] = useState(false);
  const [briefSummary, setBriefSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Initial configuration: check expiration & load history
  useEffect(() => {
    if (!user) return;

    const key = `vaai_ai_chat_history_${user.id}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const { messages: storedMessages, lastUpdated } = JSON.parse(stored);
        
        // Expiration check: 1 day (24 hours) = 86,400,000 milliseconds
        const now = Date.now();
        const difference = now - new Date(lastUpdated).getTime();
        
        if (difference < 86400000) {
          setMessages(storedMessages);
        } else {
          // Clear history older than 1 day
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.error("Failed to parse stored chat history:", e);
      }
    }

    // Fetch latest briefing for Recent Summary section
    const fetchLatestBrief = async () => {
      try {
        const res = await fetch(`/api/briefing?userId=${user.id}`);
        const data = await res.json();
        if (data.success && data.briefs && data.briefs.length > 0) {
          // Extract plain-text summary and filter out markdown header tags
          const latestSummary = data.briefs[0].summaryText || "";
          setBriefSummary(latestSummary);
        }
      } catch (err) {
        console.error("Failed to load briefing summary:", err);
      }
    };

    fetchLatestBrief();
  }, [user]);

  // 2. Save history on state change
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const key = `vaai_ai_chat_history_${user.id}`;
    localStorage.setItem(key, JSON.stringify({
      messages,
      lastUpdated: new Date().toISOString()
    }));
  }, [messages, user]);

  // Scroll to bottom helper
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // 3. Clear conversation / New Session logic
  const handleNewConversation = () => {
    if (!user) return;
    setMessages([]);
    setQuickReplies([]);
    const key = `vaai_ai_chat_history_${user.id}`;
    localStorage.removeItem(key);
  };

  // 4. Quick suggestions options mapping
  const quickSuggestions = [
    { label: "Check Gmail inbox", query: "Check my Gmail inbox for any recent unread messages." },
    { label: "Check WhatsApp chats", query: "Fetch my latest WhatsApp messages and summarize them." },
    { label: "Post Slack message", query: "Post a message update alert to Slack channel #dev-ops saying 'Landing page changes are passing deployment tests.'" },
    { label: "Post LinkedIn update", query: "Publish a LinkedIn update about launching the V-AI assistant workspace." },
  ];

  // 5. Send message loop
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending || !user) return;
    
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsSending(true);
    setQuickReplies([]);

    // Prepare history payload for API (role maps: user -> user, model -> model)
    const historyPayload = messages.map(m => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          prompt: textToSend,
          history: historyPayload,
          attachments: attachments
        })
      });

      if (!response.ok) {
        throw new Error(response.statusText || "Failed to initiate streaming chat.");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Null response body reader.");

      // Setup a placeholder AI response message
      const aiMsgId = `ai_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          text: "",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true
        }
      ]);

      let accumulatedText = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE formatted strings (data: {...}\n\n)
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6).trim());
              if (data.text) {
                accumulatedText += data.text;
                // Update messages state chunk-by-chunk for typewriter effect
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              }
              if (data.error) {
                accumulatedText += `\n\n[Error: ${data.error}]`;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg
                  )
                );
              }
            } catch (err) {
              // Ignore partial JSON parsing errors on split chunks
            }
          }
        }
      }

      // Finish streaming, strip out quick replies from raw response text if parsed
      let cleanResponse = accumulatedText;
      let parsedReplies: string[] = [];
      const repliesMatch = accumulatedText.match(/\[QUICK_REPLIES\]([\s\S]*?)\[\/QUICK_REPLIES\]/);
      
      if (repliesMatch) {
        cleanResponse = accumulatedText.replace(/\[QUICK_REPLIES\][\s\S]*?\[\/QUICK_REPLIES\]/, "").trim();
        parsedReplies = repliesMatch[1]
          .split("\n")
          .map(r => r.replace(/^[\*\-\d\.\s]+/, "").trim())
          .filter(r => r !== "");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, text: cleanResponse, isStreaming: false } : msg
        )
      );

      if (parsedReplies.length > 0) {
        setQuickReplies(parsedReplies);
      } else {
        // Fallback generic follow-up prompt replies
        setQuickReplies(["Check status", "Thanks!", "Explain this further"]);
      }

    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: `Failed to connect with V-AI Assistant: ${err.message || "Unknown communication error."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("user", JSON.stringify(user));
      form.append("profile", JSON.stringify(profile || {}));

      const res = await fetch("/api/ai-agent/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setAttachments((prev) => [...prev, data.file]);
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      // clear file input value to allow re-upload same file
      (e.target as HTMLInputElement).value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter(a => a.id !== id));
  };

  // 6. Text to HTML parser for tables, headings, code, lists, and links
  const renderMarkdown = (text: string) => {
    if (!text) return "";

    let html = text;

    // A. Code Blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="bg-[#0b0825] border border-border-color/60 p-4 rounded-xl text-xs overflow-x-auto my-3 text-cyan-400 font-mono"><code class="language-${lang}">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
    });

    // B. Tables parsing
    const lines = html.split("\n");
    let inTable = false;
    let tableRows: string[] = [];
    const parsedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        if (!inTable) {
          inTable = true;
          tableRows = [line];
        } else {
          tableRows.push(line);
        }
      } else {
        if (inTable) {
          inTable = false;
          parsedLines.push(renderTableHtml(tableRows));
        }
        parsedLines.push(line);
      }
    }
    if (inTable) {
      parsedLines.push(renderTableHtml(tableRows));
    }

    html = parsedLines.join("\n");

    // C. Markdown Headings
    html = html.replace(/### (.*)/g, '<h4 class="text-sm font-bold text-white mt-4 mb-2">$1</h4>');
    html = html.replace(/## (.*)/g, '<h3 class="text-base font-bold text-white mt-5 mb-2">$1</h3>');
    html = html.replace(/# (.*)/g, '<h2 class="text-lg font-bold text-white mt-6 mb-3">$1</h2>');

    // D. Bold / Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="text-zinc-300 italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="text-zinc-300 italic">$1</em>');

    // E. Lists
    html = html.replace(/^\s*[\*\-]\s+(.*)/gm, '<li class="text-xs text-zinc-300 ml-4 list-disc my-1">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li class="text-xs text-zinc-300 ml-4 list-decimal my-1">$1</li>');

    // F. Inline Code
    html = html.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono text-[11px]">$1</code>');

    // G. Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-violet-400 hover:underline">$1</a>');

    // H. Linebreaks
    html = html.replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className="space-y-1 text-xs text-zinc-300 leading-relaxed max-w-none break-words" 
      />
    );
  };

  const renderTableHtml = (rows: string[]) => {
    if (rows.length < 2) return rows.join("\n");
    const isSeparator = (r: string) => r.includes("---");
    const filteredRows = rows.filter(r => !isSeparator(r));

    const headers = filteredRows[0].split("|").map(h => h.trim()).filter(h => h !== "");
    const bodyRows = filteredRows.slice(1).map(r => r.split("|").map(cell => cell.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1));

    const headerHtml = `<thead><tr class="border-b border-border-color bg-foreground/[0.02]">${headers.map(h => `<th class="px-4 py-2 text-left text-xs font-bold text-white">${h}</th>`).join("")}</tr></thead>`;
    const bodyHtml = `<tbody>${bodyRows.map(row => `<tr class="border-b border-border-color/40 hover:bg-foreground/[0.01]">${row.map(cell => `<td class="px-4 py-2 text-xs text-zinc-300">${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;

    return `<div class="overflow-x-auto my-4 border border-border-color rounded-xl bg-card-bg/25"><table class="min-w-full border-collapse">${headerHtml}${bodyHtml}</table></div>`;
  };

  // 7. Renders inline Platform Badge for Gmail, WhatsApp, Slack, etc. if mentioned
  const getPlatformBadges = (text: string) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    const badges = [];

    if (lower.includes("gmail") || lower.includes("email")) {
      badges.push(
        <span key="gmail" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Gmail
        </span>
      );
    }
    if (lower.includes("whatsapp")) {
      badges.push(
        <span key="whatsapp" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
          </svg>
          WhatsApp
        </span>
      );
    }
    if (lower.includes("slack")) {
      badges.push(
        <span key="slack" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
          </svg>
          Slack
        </span>
      );
    }
    if (lower.includes("outlook")) {
      badges.push(
        <span key="outlook" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z"/>
          </svg>
          Outlook
        </span>
      );
    }
    if (lower.includes("discord")) {
      badges.push(
        <span key="discord" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.27 4.73a16.14 16.14 0 0 0-4.07-1.27l-.32.74a14.28 14.28 0 0 0-5.76 0l-.33-.74a16.14 16.14 0 0 0-4.07 1.27C1.66 9.42.5 14.58 1.13 19.67A16.14 16.14 0 0 0 6.08 22c.42-.55.79-1.15 1.1-1.79a11.51 11.51 0 0 1-1.78-.85l.26-.2c3.48 1.61 7.28 1.61 10.68 0l.26.2c-.56.33-1.16.62-1.78.85.31.64.68 1.24 1.1 1.79a16.14 16.14 0 0 0 4.95-2.33c.77-5.86-.53-10.9-4.34-14.94zM9 14.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zm6 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/>
          </svg>
          Discord
        </span>
      );
    }
    if (lower.includes("linkedin")) {
      badges.push(
        <span key="linkedin" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-650/10 border border-blue-600/20 text-blue-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          LinkedIn
        </span>
      );
    }
    if (lower.includes("telegram")) {
      badges.push(
        <span key="telegram" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-bold uppercase shrink-0">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.82-.67 3.88-.93 5.28-.11.59-.33.79-.54.81-.46.04-.81-.3-.12-.76-.08-.05-.83-.54-.93-.61-.31-.22-.52-.36-.18-.89.08-.12.72-.65 1.41-1.3.15-.14.28-.27.28-.29 0-.05-.07-.03-.15.01-.1.05-.98.63-2.76 1.83-.26.18-.49.26-.69.26-.22 0-.64-.12-.96-.22-.39-.13-.7-.2-.67-.42.02-.11.16-.23.44-.35 1.74-.76 2.9-.17 3.48-1.23.11-.2.23-.42.23-.44 0-.03-.02-.03-.05-.02-.06.01-.54.12-.76.16-.14.02-.27.03-.33-.01-.06-.05-.1-.19-.04-.33.09-.22.42-.51.98-.51.46 0 .81.25.96.6.08.19.08.35.03.5z"/>
          </svg>
          Telegram
        </span>
      );
    }

    if (badges.length === 0) return null;
    return <div className="flex flex-wrap gap-1 mt-2">{badges}</div>;
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto space-y-6 text-foreground flex flex-col h-screen overflow-hidden relative">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-border-color pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HugeiconsIcon icon={AiBrain01Icon} size={18} />
            </span>
            V-AI Agent Console
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Your unified cross-platform workspace agent
          </p>
        </div>

        <button
          onClick={handleNewConversation}
          disabled={messages.length === 0}
          className="px-3 py-1.5 rounded-xl bg-card-bg/60 border border-border-color text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Clear session history"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          New Conversation
        </button>
      </div>

      {/* Scrollable Container for Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-4">

        {/* 2. Recent Summary Section */}
        {showSummary && briefSummary && (
          <div className="glass-panel border border-border-color rounded-2xl p-4 bg-foreground/[0.01] shrink-0 relative transition-all animate-fade-in flex flex-col gap-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <HugeiconsIcon icon={NotebookIcon} size={11} />
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Latest Briefing Summary Updates</span>
              </div>
              <button 
                onClick={() => setShowSummary(false)} 
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed max-w-4xl line-clamp-2">
              {briefSummary.replace(/[#*`]/g, "")}
            </p>
          </div>
        )}

        {/* 3. Messages stack */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 animate-pulse">
              <HugeiconsIcon icon={BubbleChatIcon} size={28} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-normal">Start chatting with V-AI Agent</h2>
              <p className="text-zinc-400 text-xs mt-2 max-w-sm leading-relaxed">
                Connect and manage all your workspace tools. Check unread emails, read chats, post status alerts, send updates, and execute workflows interactively.
              </p>
            </div>

            {/* 4. Quick Suggestions cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-4">
              {quickSuggestions.map((sug) => (
                <button
                  key={sug.label}
                  onClick={() => handleSendMessage(sug.query)}
                  className="p-4 rounded-xl border border-border-color bg-card-bg/25 text-left text-zinc-400 hover:text-white hover:border-violet-500/35 hover:bg-card-bg/40 cursor-pointer transition-all flex flex-col justify-between h-[100px] text-xs font-medium"
                >
                  <span className="text-white font-bold leading-normal">{sug.label}</span>
                  <span className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 mt-1">{sug.query}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-grow space-y-5 px-1">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3 w-full animate-fade-in`}
                >
                  {/* AI Logo */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                      <HugeiconsIcon icon={AiBrain01Icon} size={14} />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 border ${
                    isUser
                      ? "bg-violet-600/10 border-violet-500/25 text-white"
                      : "bg-[#040117]/60 border-border-color text-zinc-300"
                  }`}>
                    {/* Render message body */}
                    {renderMarkdown(msg.text)}

                    {/* Platform Logos matching */}
                    {!isUser && getPlatformBadges(msg.text)}

                    {/* Timestamp */}
                    <div className="text-[9px] text-zinc-500 mt-2 text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI thinking / fetching data indicator */}
            {isSending && (
              <div className="flex justify-start items-start gap-3 w-full animate-pulse">
                <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                  <HugeiconsIcon icon={AiBrain01Icon} size={14} className="animate-spin" />
                </div>
                <div className="bg-[#040117]/40 border border-border-color/60 rounded-2xl px-5 py-4 max-w-[200px] flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Calling Tools...</span>
                </div>
              </div>
            )}

            {/* Bottom scroll anchor */}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* 5. Follow-up suggestions pills (show only when AI message has finished streaming and not loading) */}
      {!isSending && quickReplies.length > 0 && messages.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 justify-start items-center shrink-0">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Suggestions:</span>
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleSendMessage(reply)}
              className="px-3.5 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 text-[10px] font-semibold transition-all cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* 6. Chat input block */}
      <div className="border-t border-border-color pt-4 pb-2 shrink-0">
        {/* Attachments upload UI */}
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="file"
              accept="image/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <span className="px-3 py-1 rounded-lg bg-foreground/[0.03] border border-border-color text-[12px]">{uploading ? 'Uploading...' : 'Attach file'}</span>
          </label>

          <div className="flex gap-2 items-center">
            {attachments.map((a) => (
              <div key={a.id} className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-foreground/[0.02] border border-border-color text-xs">
                <a href={a.url} target="_blank" rel="noreferrer" className="underline text-violet-300">{a.name}</a>
                <button onClick={() => removeAttachment(a.id)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
            ))}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex items-center gap-3 bg-card-bg/40 border border-border-color rounded-2xl px-4 py-3 focus-within:border-violet-500/60 transition-colors"
        >
          <input
            type="text"
            required
            placeholder={isSending ? "Please wait for AI response..." : "Ask V-AI to list emails, send WhatsApps, check Slack..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isSending}
            className="flex-grow bg-transparent border-none text-xs text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={isSending || !inputVal.trim()}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
          </button>
        </form>
      </div>

    </div>
  );
}
