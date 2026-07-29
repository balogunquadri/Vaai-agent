"use client";

import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items: FaqItem[] = [
    {
      question: "How secure is my connected app data?",
      answer: "Extremely. Va-Ai operates as a stateless orchestration engine. All credential tokens are encrypted in our SOC-2 compliant secure vault. We never persist your emails, chats, or document contents on our servers, and we enforce a strict policy against training LLM models on your private data.",
    },
    {
      question: "Which messaging channels do you support?",
      answer: "We support Slack channels, WhatsApp Business, Telegram chats, and Outlook/Gmail inbox channels. You can read, draft responses, and receive real-time notifications across all of them inside your personal sandbox.",
    },
    {
      question: "Can I build custom multi-step automation flows?",
      answer: "Yes. Using our visual trigger editor, you can chain events together. For example: 'When a new Zoom meeting transcript is generated, extract the action items, save them into Google Docs, and notify the engineering team in Slack.'",
    },
    {
      question: "Are there limit constraints on file summaries?",
      answer: "Our Free Tier supports summarizing files up to 10MB (Google Docs, Canva, etc.). The Pro Tier unlocks processing capacities up to 100MB per file with context support for entire Google Drive folders, Notion wikis, and extensive Jira backlogs.",
    },
    {
      question: "Is there support for enterprise self-hosting?",
      answer: "Yes, our Enterprise workspace plan supports self-hosting the Va-Ai gateway via Docker containers inside your private AWS, GCP, or Azure cloud architectures. Contact our developer team for details.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 bg-[#05021a] overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-cyan-950/10 blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-xs uppercase tracking-widest font-extrabold text-cyan-400 mb-3">
            Questions & Answers
          </h2>
          <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? "bg-zinc-950/60 border-violet-500/20 shadow-md shadow-violet-500/5"
                    : "bg-black/20 border-white/5 hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                >
                  <span className="text-sm font-bold text-white pr-4">{item.question}</span>
                  <div className={`w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-violet-400" : ""}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-4 animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
