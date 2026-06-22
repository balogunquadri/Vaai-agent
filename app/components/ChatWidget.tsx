"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

const TONE_OPTIONS = [
  { id: "Warm & Engaging", name: "Warm & Engaging", emoji: "😊", desc: "Friendly and conversational" },
  { id: "Professional", name: "Professional", emoji: "💼", desc: "Formal and business-like" },
  { id: "Empathetic", name: "Empathetic", emoji: "❤️", desc: "Understanding and supportive" },
  { id: "Action-Oriented", name: "Action-Oriented", emoji: "⚡", desc: "Direct and task-focused" },
  { id: "Strategic", name: "Strategic", emoji: "🧠", desc: "Strategic and high-level" },
  { id: "Socratic", name: "Socratic", emoji: "💬", desc: "Thought-provoking questions" },
  { id: "Vigilant", name: "Vigilant", emoji: "🛡️", desc: "Security and warning focused" },
  { id: "Visual", name: "Visual", emoji: "📊", desc: "Clean and bulleted formatting" }
];

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Hello! I am V-AI, your virtual assistant. How can I help you manage your workspace operations today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Theme and Mood states
  const [tone, setTone] = useState("Warm & Engaging");

  // Dragging states
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Pointer dragging event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging when clicking buttons, inputs, option lists or horizontal scrolling selector
    if (
      (e.target as HTMLElement).closest("button") || 
      (e.target as HTMLElement).closest("select") ||
      (e.target as HTMLElement).closest(".mood-selector")
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffset({ x: offset.x, y: offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Set offset bounds to keep it roughly on screen
    const newX = initialOffset.x + dx;
    const newY = initialOffset.y + dy;
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if capture was lost
    }
  };

  // Parse custom format helper
  const parseMessageText = (text: string) => {
    if (!text) return "";
    // Remove the replies section from the primary message balloon
    let clean = text.split("[QUICK_REPLIES]")[0].trim();
    
    // Replace bold syntax
    clean = clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Replace markdown list bullets
    clean = clean.replace(/^\s*[•\-\*]\s*(.*)/gm, "<li class='ml-4 list-disc text-zinc-300 dark:text-zinc-400'>$1</li>");
    
    return clean;
  };

  const extractReplies = (text: string): string[] => {
    if (!text || !text.includes("[QUICK_REPLIES]")) return [];
    try {
      const block = text.split("[QUICK_REPLIES]")[1].split("[/QUICK_REPLIES]")[0];
      return block
        .split("\n")
        .map(line => line.replace(/^[\s\-•\*]+/, "").trim())
        .filter(line => line.length > 0);
    } catch (err) {
      return [];
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg = textToSend.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInputValue("");
    setIsSending(true);

    // Add empty placeholder for AI response to update in stream
    setMessages(prev => [...prev, { sender: "ai", text: "" }]);

    try {
      // Map message history to backend payload (exclude final empty AI message)
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "demo_user",
          prompt: userMsg,
          history: historyPayload,
          tone: tone
        })
      });

      if (!res.ok) {
        throw new Error("Failed to call V-AI agent");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Null body reader");

      const decoder = new TextDecoder();
      let done = false;
      let aiText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.replace("data: ", ""));
                if (parsed.text) {
                  aiText += parsed.text;
                  setMessages(prev => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    if (last && last.sender === "ai") {
                      last.text = aiText;
                    }
                    return copy;
                  });
                }
              } catch (e) {
                // Ignore partial JSON parsing errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.sender === "ai") {
          last.text = "Connection error. Ensure GEMINI_API_KEY is configured in your server env.";
        }
        return copy;
      });
    } finally {
      setIsSending(false);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const replies = lastMessage && lastMessage.sender === "ai" ? extractReplies(lastMessage.text) : [];

  return (
    <>
      {/* Floating launcher icon button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center text-white cursor-pointer group"
          title="Open AI Workspace Assistant"
        >
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`
          }}
          className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] h-[520px] bg-background border border-border-color shadow-2xl rounded-3xl flex flex-col overflow-hidden transition-shadow duration-300"
        >
          {/* Header (Draggable Zone) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="px-5 py-4 bg-foreground/[0.02] border-b border-border-color flex items-center justify-between cursor-grab active:cursor-grabbing select-none shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center text-white shadow shadow-violet-500/25">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-foreground">V-AI Workspace Agent</h4>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-zinc-500 font-medium font-mono">Gemini-Managed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Minimize/Hide Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-foreground/[0.02] border border-border-color text-zinc-400 hover:text-foreground transition-all cursor-pointer"
                title="Hide Chat Modal"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI Mood Selector Ribbon */}
          <div className="mood-selector px-4 py-2.5 bg-foreground/[0.02] border-b border-border-color flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth shrink-0 select-none">
            <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>🎭</span> Mood:
            </span>
            <div className="flex gap-1.5">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTone(opt.id)}
                  className={`px-2.5 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-all duration-200 shrink-0 cursor-pointer ${
                    tone === opt.id
                      ? "bg-primary border-primary/20 text-white shadow-sm scale-105"
                      : "bg-background border-border-color text-zinc-400 hover:border-zinc-500 hover:text-foreground"
                  }`}
                  title={opt.desc}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Bubble List Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg, index) => {
              const isAi = msg.sender === "ai";
              
              // If empty text (waiting for response stream)
              if (isAi && !msg.text) {
                return (
                  <div key={index} className="flex justify-start">
                    <div className="max-w-[75%] p-3.5 rounded-2xl bg-foreground/[0.03] border border-border-color text-zinc-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex ${isAi ? "justify-start" : "justify-end"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl border text-left leading-relaxed ${
                      isAi
                        ? "bg-foreground/[0.02] border-border-color text-foreground rounded-tl-sm font-sans"
                        : "bg-primary border-primary/20 text-white rounded-tr-sm"
                    }`}
                  >
                    {isAi ? (
                      <div className="space-y-1">
                        {parseMessageText(msg.text).split("\n").map((line, lIdx) => {
                          if (line.startsWith("<li")) {
                            return <span key={lIdx} dangerouslySetInnerHTML={{ __html: line }} />;
                          }
                          return <p key={lIdx} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: line }} />;
                        })}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Options Bar */}
          {replies.length > 0 && !isSending && (
            <div className="px-5 py-2 flex flex-wrap gap-2 shrink-0 justify-start max-h-[85px] overflow-y-auto no-scrollbar">
              {replies.map((reply, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => handleSendMessage(reply)}
                  className="px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-border-color hover:bg-foreground/[0.08] hover:border-zinc-500 text-zinc-400 hover:text-foreground text-[10px] font-semibold transition-all cursor-pointer"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-4 border-t border-border-color bg-foreground/[0.01] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Chat in '${tone}' tone...`}
              disabled={isSending}
              className="flex-1 px-4 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
