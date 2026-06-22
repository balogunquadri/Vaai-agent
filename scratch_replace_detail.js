const fs = require('fs');

const filePath = 'c:/Users/USER/Desktop/viai/vaai/app/dashboard/briefing/[id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the isReplyOpen state hook
const targetStateStr = '  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);';
const stateIndex = content.indexOf(targetStateStr);
if (stateIndex === -1) {
  console.error('Could not find statusMessage state hook');
  process.exit(1);
}

const stateInsert = '\n  const [isReplyOpen, setIsReplyOpen] = useState(false);';
content = content.substring(0, stateIndex + targetStateStr.length) + stateInsert + content.substring(stateIndex + targetStateStr.length);

// 2. Replace from return ( to the end of the file
const returnIndex = content.indexOf('  return (');
if (returnIndex === -1) {
  console.error('Could not find return statement start');
  process.exit(1);
}

const replacement = `  return (
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
                  onClick={() => setActiveCategory(cat.id)}
                  className={\`w-full px-4 py-3 rounded-xl border border-transparent text-xs font-bold transition-all cursor-pointer flex items-center justify-between \${themeColor}\`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={\`shrink-0 \${isSelected ? "" : "opacity-60"}\`}>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                  <span className={\`px-2 py-0.5 rounded text-[10px] font-extrabold \${
                    isSelected ? "bg-foreground/[0.04]" : "text-zinc-500 bg-foreground/[0.02]"
                  }\`}>
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
            <div className={\`p-2.5 rounded-xl bg-foreground/[0.03] \${
              activeCategory === "email"
                ? "text-blue-400"
                : activeCategory === "messages"
                ? "text-emerald-400"
                : activeCategory === "mentions"
                ? "text-violet-400"
                : activeCategory === "tasks"
                ? "text-amber-400"
                : "text-rose-400"
            }\`}>
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
                      <div className={\`p-2 rounded-xl bg-foreground/[0.03] shrink-0 \${
                        item.channel === "gmail" ? "text-red-500" : item.channel === "whatsapp" ? "text-emerald-500" : "text-blue-500"
                      }\`}>
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
                <svg className={\`w-3.5 h-3.5 \${composingAI ? "animate-spin" : ""}\`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z\" clipRule=\"evenodd\" />
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
                <div className={\`p-3 rounded-xl border text-[11px] font-semibold leading-normal \${
                  statusMessage.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-red-500/10 border-red-500/25 text-red-400"
                }\`}>
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
`;

content = content.substring(0, returnIndex) + replacement;
fs.writeFileSync(filePath, content, 'utf8');
console.log('Briefing Details sub-page updated successfully!');
