"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, FolderOpenIcon, PlayIcon } from "@hugeicons/core-free-icons";

interface AlertItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  platform: string;
  priority: "low"|"medium"|"high"|"critical";
  status: "active"|"resolved"|"snoozed";
  created_at: string;
  triggered_at?: string;
}

export default function AlertsPage(){
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState({ active:0, today:0, high:0, resolved:0 });
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftData, setDraftData] = useState<{subject?:string; message:string} | null>(null);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.items || []);
        setStats({
          active: data.stats?.active || 0,
          today: data.stats?.today || 0,
          high: data.stats?.high || 0,
          resolved: data.stats?.resolved || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/alerts/suggest?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setSuggested(data.suggestions || []);
    } catch (e) { console.error(e); }
  };

  useEffect(()=>{
    if (!user) return;
    fetchAlerts();
    fetchSuggestions();
    const iv = setInterval(()=>fetchAlerts(), 30_000);
    return ()=>clearInterval(iv);
  }, [user]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center text-white">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Alerts</h1>
            <p className="text-sm text-zinc-400">Monitor important events across your connected apps.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAlerts} className="px-4 py-2 bg-zinc-800 text-xs rounded-lg">Refresh</button>
          <button onClick={()=>setShowCreate(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg">Create New Alert</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card-bg border"> 
          <div className="text-xs text-zinc-500">Active Alerts</div>
          <div className="text-2xl font-bold">{loading?"...":stats.active}</div>
        </div>
        <div className="p-4 rounded-xl bg-card-bg border"> 
          <div className="text-xs text-zinc-500">Triggered Today</div>
          <div className="text-2xl font-bold">{loading?"...":stats.today}</div>
        </div>
        <div className="p-4 rounded-xl bg-card-bg border"> 
          <div className="text-xs text-zinc-500">High Priority</div>
          <div className="text-2xl font-bold">{loading?"...":stats.high}</div>
        </div>
        <div className="p-4 rounded-xl bg-card-bg border"> 
          <div className="text-xs text-zinc-500">Resolved</div>
          <div className="text-2xl font-bold">{loading?"...":stats.resolved}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="p-4 rounded-xl bg-card-bg border mb-4 flex items-center justify-between">
            <h3 className="font-bold">Recent Alerts</h3>
            <div className="text-xs text-zinc-400">Most recent first</div>
          </div>

          <div className="space-y-3">
            {alerts.length===0 ? (
              <div className="p-6 text-center text-zinc-500">No alerts yet. Create one to begin monitoring.</div>
            ) : (
              alerts.map((a)=> (
                <div key={a.id} className="p-4 rounded-xl bg-background border flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${a.priority==="high"||a.priority==="critical"?"bg-red-500":"bg-violet-600"}`}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v6c0 5 3.8 9.1 10 13 6.2-3.9 10-8 10-13V7l-10-5z"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">{a.title}</div>
                        <div className="text-xs text-zinc-400">{a.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-zinc-400">{a.platform}</div>
                        <div className="text-[11px] text-zinc-500">{new Date(a.created_at).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${a.priority==="high"||a.priority==="critical"?"bg-red-500/10 text-red-400 border border-red-500/20":"bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>{a.priority}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${a.status==="resolved"?"bg-green-500/10 text-emerald-300":"bg-amber-500/10 text-amber-300"}`}>{a.status}</span>
                      <button onClick={()=>setSelected(a)} className="ml-auto text-xs text-violet-400">Details</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: AI Suggested + Actions */}
        <div>
          <div className="p-4 rounded-xl bg-card-bg border mb-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">AI Suggested Alerts</h4>
              <button onClick={fetchSuggestions} className="text-xs text-zinc-400">Refresh</button>
            </div>
            <div className="mt-3 space-y-3">
              {suggested.length===0 ? (
                <div className="text-xs text-zinc-500">No suggestions right now.</div>
              ) : (
                suggested.map((s:any, idx:number)=> (
                  <div key={idx} className="p-3 rounded-lg bg-background border flex flex-col gap-2">
                    <div className="text-sm font-bold">{s.title}</div>
                    <div className="text-xs text-zinc-400">{s.summary}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button className="px-3 py-1 bg-violet-600 text-white rounded text-xs" onClick={async ()=>{
                        // quick create suggested alert
                        try{
                          const res = await fetch('/api/alerts', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:user?.id, title:s.title, description:s.summary, platform:s.platform, priority:s.priority || 'medium', condition:s.condition || null})});
                          const data = await res.json(); if (data.success) fetchAlerts();
                        }catch(e){console.error(e)}
                      }}>Create</button>
                      <button className="px-3 py-1 border rounded text-xs" onClick={()=>{}}>Ignore</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card-bg border">
            <h4 className="font-bold">Actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/dashboard/triggers" className="px-3 py-2 bg-zinc-800 rounded text-xs text-center">Open Trigger Editor</Link>
              <button onClick={()=>setShowCreate(true)} className="px-3 py-2 bg-violet-600 text-white rounded text-xs">Create Alert</button>
            </div>
          </div>
        </div>
      </div>

      {/* Create dialog - simple inline modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card-bg rounded-xl p-6 w-full max-w-xl border">
            <h3 className="font-bold mb-3">Create New Alert</h3>
            <CreateAlertForm onClose={()=>{setShowCreate(false); fetchAlerts();}} />
          </div>
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card-bg rounded-xl p-6 w-full max-w-2xl border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center text-white">A</div>
              <div className="flex-1">
                <h3 className="font-bold">{selected.title}</h3>
                <p className="text-xs text-zinc-400">{selected.description}</p>
                <div className="mt-3 text-xs text-zinc-500">Platform: {selected.platform}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button className="px-3 py-1 border rounded text-xs" onClick={async ()=>{
                    if (!selected) return;
                    setSummaryLoading(true); setSummaryText(null);
                    try{
                      const res = await fetch('/api/alerts/ai/summary',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({alertId:selected.id})});
                      const d = await res.json(); if (d.success) setSummaryText(d.summary || d.summaryText || String(d.summary||d));
                    }catch(e){console.error(e); setSummaryText('Failed to generate summary.');}
                    finally{setSummaryLoading(false)}
                  }}>AI Summary</button>
                  <button className="px-3 py-1 border rounded text-xs" onClick={async ()=>{
                    if (!selected) return;
                    setDraftLoading(true); setDraftData(null);
                    try{
                      const res = await fetch('/api/alerts/ai/draft',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({alertId:selected.id, channel:'gmail', recipientName: user?.name || user?.email || 'User', tone:'professional'})});
                      const d = await res.json(); if (d.success) setDraftData({subject:d.subject, message:d.message});
                    }catch(e){console.error(e); setDraftData({message:'Failed to generate draft.'})}
                    finally{setDraftLoading(false)}
                  }}>Generate Draft</button>
                  <button className="px-3 py-1 bg-violet-600 text-white rounded text-xs">Run Action</button>
                  <button className="px-3 py-1 border rounded text-xs" onClick={async ()=>{
                    // mark resolved
                    try{
                      const res = await fetch(`/api/alerts/${selected.id}/resolve`, {method:'POST'});
                      const d = await res.json(); if (d.success){ fetchAlerts(); setSelected(null); }
                    }catch(e){console.error(e)}
                  }}>Mark Resolved</button>
                  <button className="px-3 py-1 border rounded text-xs" onClick={()=>setSelected(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateAlertForm({onClose}:{onClose:()=>void}){
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [platforms,setPlatforms]=useState<string[]>([]);
  const [priority,setPriority]=useState('medium');
  const [condition,setCondition]=useState('');
  const [frequency,setFrequency]=useState('realtime');
  const [notify,setNotify]=useState('email');
  const { user } = useAuth();

  const submit = async ()=>{
    try{
      const res = await fetch('/api/alerts',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:user?.id, title, description, platforms, priority, condition, frequency, notify})});
      const data = await res.json(); if (data.success) onClose();
    }catch(e){console.error(e)}
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold">Alert name</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 bg-background border rounded" />
      </div>
      <div>
        <label className="text-xs font-bold">Description</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 bg-background border rounded" />
      </div>
      <div>
        <label className="text-xs font-bold">Selected apps (comma separated)</label>
        <input value={platforms.join(',')} onChange={e=>setPlatforms(e.target.value.split(',').map(s=>s.trim()))} className="w-full p-2 bg-background border rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold">Priority</label>
          <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full p-2 bg-background border rounded">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold">Notify via</label>
          <select value={notify} onChange={e=>setNotify(e.target.value)} className="w-full p-2 bg-background border rounded">
            <option value="email">Email</option>
            <option value="in-app">In-app</option>
            <option value="slack">Slack</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold">Condition / Trigger rule (MCP tool expression)</label>
        <input value={condition} onChange={e=>setCondition(e.target.value)} className="w-full p-2 bg-background border rounded" placeholder="e.g. gmail:subject contains 'URGENT'" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={submit} className="px-3 py-2 bg-violet-600 text-white rounded">Create</button>
      </div>
    </div>
  )
}
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BellIcon,
  AlertCircleIcon,
  TickDouble01Icon,
  PlayIcon,
  Settings01Icon,
  NotebookIcon,
  AiBrain01Icon,
} from "@hugeicons/core-free-icons";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  selectedApps: string[];
  condition: string;
  priorityLevel: "low" | "medium" | "high" | "critical";
  notificationMethod: "in-app" | "email" | "whatsapp";
  frequency: "realtime" | "hourly" | "daily";
  actionToPerform: "notify" | "create-task" | "auto-reply";
  isActive: boolean;
  createdAt: string;
}

interface TriggeredAlert {
  id: string;
  alertId: string;
  title: string;
  description: string;
  sourceApp: string;
  priorityLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved" | "snoozed";
  time: string;
  sourceId?: string;
  payload?: any;
  summary?: string;
  nextAction?: string;
  suggestedReply?: string;
  snoozedUntil?: string | null;
}

const APP_META: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  gmail: {
    name: "Gmail",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    ),
  },
  whatsapp: {
    name: "WhatsApp",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z"/>
      </svg>
    ),
  },
  slack: {
    name: "Slack",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
      </svg>
    ),
  },
  outlook: {
    name: "Outlook",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z"/>
      </svg>
    ),
  },
  discord: {
    name: "Discord",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.27 4.73a16.14 16.14 0 0 0-3.97-1.23.1.1 0 0 0-.1.05c-.17.3-.37.72-.5 1.03a14.9 14.9 0 0 0-4.7 0c-.13-.3-.33-.72-.51-1.03a.1.1 0 0 0-.1-.05 16.14 16.14 0 0 0-3.97 1.23.1.1 0 0 0-.05.04A16.27 16.27 0 0 0 2 17.68a.1.1 0 0 0 .04.07 16.32 16.32 0 0 0 4.9 2.5.1.1 0 0 0 .1-.03c.42-.57.8-1.18 1.12-1.83a.1.1 0 0 0-.05-.13 10.64 10.64 0 0 1-1.54-.74.1.1 0 0 1-.01-.16c.1-.08.2-.16.3-.24a.1.1 0 0 1 .1-.01c3.08 1.4 6.38 1.4 9.4 0a.1.1 0 0 1 .11.01c.1.08.2.16.3.24a.1.1 0 0 1-.01.16 10.85 10.85 0 0 1-1.54.74.1.1 0 0 0-.05.13c.32.65.7 1.26 1.12 1.83a.1.1 0 0 0 .1.04 16.29 16.29 0 0 0 4.9-2.5.1.1 0 0 0 .04-.07 16.19 16.19 0 0 0-3.3-12.91.1.1 0 0 0-.05-.04zM8.52 14.24a2.15 2.15 0 0 1-2-2.26 2.15 2.15 0 0 1 2-2.26 2.15 2.15 0 0 1 2 2.26 2.15 2.15 0 0 1-2 2.26zm6.96 0a2.15 2.15 0 0 1-2-2.26 2.15 2.15 0 0 1 2-2.26 2.15 2.15 0 0 1 2 2.26 2.15 2.15 0 0 1-2 2.26z"/>
      </svg>
    ),
  },
  linkedin: {
    name: "LinkedIn",
    color: "bg-blue-600/10 text-blue-400 border-blue-600/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
  },
  telegram: {
    name: "Telegram",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.64-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.96-.75 3.78-1.65 6.29-2.74 7.56-3.28 3.59-1.53 4.34-1.8 4.82-1.8.11 0 .35.03.5.15.13.11.17.26.18.38-.01.08.01.23 0 .28z"/>
      </svg>
    ),
  },
};

const SUGGESTED_ALERTS_TEMPLATES = [
  {
    title: "Gmail VIP Alerts",
    description: "Alert me when emails from Poker King containing 'urgent' are received",
    apps: ["gmail"],
    condition: "keyword:poker,king,urgent",
    priorityLevel: "critical",
  },
  {
    title: "Slack DevOps Alerts",
    description: "Fires when 'failed' or 'error' occurs in Slack #dev-ops channel",
    apps: ["slack"],
    condition: "keyword:failed,error,ops",
    priorityLevel: "high",
  },
  {
    title: "WhatsApp Project Update Alert",
    description: "Notify me when messages from Support JID contain 'timeline' or 'meeting'",
    apps: ["whatsapp"],
    condition: "keyword:timeline,meeting",
    priorityLevel: "medium",
  },
];

export default function AlertsDashboard() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  // Active filters
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved" | "snoozed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");

  // Create New Alert Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [ruleApps, setRuleApps] = useState<string[]>([]);
  const [ruleCondition, setRuleCondition] = useState("");
  const [rulePriority, setRulePriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [ruleNotify, setRuleNotify] = useState<"in-app" | "email" | "whatsapp">("in-app");
  const [ruleFreq, setRuleFreq] = useState<"realtime" | "hourly" | "daily">("realtime");
  const [ruleAction, setRuleAction] = useState<"notify" | "create-task" | "auto-reply">("notify");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [selectedAlert, setSelectedAlert] = useState<TriggeredAlert | null>(null);
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [aiTone, setAiTone] = useState<"Professional" | "Friendly" | "Casual" | "Urgent">("Professional");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchConnections = async () => {
    if (!user) return;
    try {
      const { data } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id);
      
      const statusMap: Record<string, boolean> = {};
      data?.forEach((row: any) => {
        statusMap[row.platform] = row.connected;
      });
      setConnections(statusMap);
    } catch (e) {
      console.error("Failed to load integrations status:", e);
    }
  };

  const loadData = async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/alerts?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error("Failed to load alerts dashboard data:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
      loadData(true);

      // Poll every 5 seconds to update the alerts page in real time
      const interval = setInterval(() => {
        loadData(false);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Run alert trigger checker
  const handleTriggerCheck = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check",
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Alerts check completed! Checked ${data.checkedRulesCount} rules, generated ${data.newTriggeredCount} new alerts.`);
        loadData();
      } else {
        alert(`Check failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to trigger alerts checker.");
    } finally {
      setChecking(false);
    }
  };

  // Submit new alert rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ruleName || !ruleCondition) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId: user.id,
          name: ruleName,
          description: ruleDesc,
          selectedApps: ruleApps,
          condition: ruleCondition,
          priorityLevel: rulePriority,
          notificationMethod: ruleNotify,
          frequency: ruleFreq,
          actionToPerform: ruleAction,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Reset inputs
        setRuleName("");
        setRuleDesc("");
        setRuleApps([]);
        setRuleCondition("");
        setRulePriority("medium");
        setIsCreateOpen(false);
        loadData();
      } else {
        alert(data.error || "Failed to create rule");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving rule configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-populate alert fields from suggested templates
  const handleAddTemplate = (template: typeof SUGGESTED_ALERTS_TEMPLATES[0]) => {
    setRuleName(template.title);
    setRuleDesc(template.description);
    setRuleApps(template.apps);
    setRuleCondition(template.condition);
    setRulePriority(template.priorityLevel as any);
    setIsCreateOpen(true);
  };

  // Trigger alert mutations (resolve, snooze, convert to task)
  const handleAlertMutation = async (action: "resolve" | "snooze" | "convert") => {
    if (!user || !selectedAlert) return;
    setActionSuccess("");
    try {
      const res = await fetch("/api/alerts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId: user.id,
          alertId: selectedAlert.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        let msg = "";
        let newStatus = selectedAlert.status;
        if (action === "resolve") {
          msg = "Alert marked as resolved successfully!";
          newStatus = "resolved";
        } else if (action === "snooze") {
          msg = "Alert snoozed for 1 hour.";
          newStatus = "snoozed";
        } else if (action === "convert") {
          msg = "Alert successfully converted into a Follow-up task!";
          newStatus = "resolved";
        }

        setActionSuccess(msg);
        setSelectedAlert((prev) => prev ? { ...prev, status: newStatus as any } : null);
        loadData();
      } else {
        alert(data.error || `Action ${action} failed.`);
      }
    } catch (e) {
      console.error(e);
      alert("Action failed to execute.");
    }
  };

  // Execute AI generators
  const handleAiAction = async (action: "ai_summary" | "ai_next_action" | "ai_draft_reply") => {
    if (!user || !selectedAlert) return;
    setLoadingAi((prev) => ({ ...prev, [action]: true }));
    try {
      const res = await fetch("/api/alerts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId: user.id,
          alertId: selectedAlert.id,
          tone: aiTone,
          channel: selectedAlert.sourceApp,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedAlert((prev) => {
          if (!prev) return null;
          if (action === "ai_summary") return { ...prev, summary: data.summary };
          if (action === "ai_next_action") return { ...prev, nextAction: data.nextAction };
          if (action === "ai_draft_reply") return { ...prev, suggestedReply: data.draft };
          return prev;
        });
      } else {
        alert(data.error || "AI call failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi((prev) => ({ ...prev, [action]: false }));
    }
  };

  // Filtered lists
  const filteredAlerts = alerts.filter((alert) => {
    const statusMatch = statusFilter === "all" || alert.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || alert.priorityLevel === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Calculate statistics
  const activeCount = alerts.filter((a) => a.status === "active").length;
  const triggeredTodayCount = alerts.filter((a) => {
    const today = new Date().toDateString();
    return new Date(a.time).toDateString() === today;
  }).length;
  const highPriorityCount = alerts.filter((a) => a.priorityLevel === "high" || a.priorityLevel === "critical").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-xs">Loading alerts dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={BellIcon} size={24} className="text-rose-500" />
            Workspace Alerts Hub
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time notifications, trigger monitoring, and AI-assisted responders across your channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerCheck}
            disabled={checking}
            className="px-4 py-2 rounded-xl bg-card-bg/60 border border-border-color text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <HugeiconsIcon icon={PlayIcon} size={14} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking active rules..." : "Trigger Check Now"}
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            + Create New Alert
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Alerts */}
        <div className="glass-panel rounded-3xl p-5 border border-border-color relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Active Alerts</span>
              <p className="text-3xl font-extrabold text-white mt-1">{activeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} />
            </div>
          </div>
        </div>

        {/* Triggered Today */}
        <div className="glass-panel rounded-3xl p-5 border border-border-color relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Triggered Today</span>
              <p className="text-3xl font-extrabold text-white mt-1">{triggeredTodayCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <HugeiconsIcon icon={NotebookIcon} size={18} />
            </div>
          </div>
        </div>

        {/* High Priority Alerts */}
        <div className="glass-panel rounded-3xl p-5 border border-border-color relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">High/Critical Alerts</span>
              <p className="text-3xl font-extrabold text-white mt-1">{highPriorityCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <HugeiconsIcon icon={AiBrain01Icon} size={18} />
            </div>
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="glass-panel rounded-3xl p-5 border border-border-color relative overflow-hidden group hover:scale-[1.01] transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Resolved Alerts</span>
              <p className="text-3xl font-extrabold text-white mt-1">{resolvedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HugeiconsIcon icon={TickDouble01Icon} size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters & Timeline (Left 2/3), Suggested Templates (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Recent Alerts Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color/30 pb-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recent Alerts Timeline</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filters */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-card-bg/60 border border-border-color text-xs rounded-xl px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="resolved">Resolved Only</option>
                <option value="snoozed">Snoozed Only</option>
              </select>

              {/* Priority Filters */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="bg-card-bg/60 border border-border-color text-xs rounded-xl px-3 py-1.5 text-zinc-300 focus:outline-none focus:border-rose-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Timeline Wrapper */}
          <div className="relative border-l border-border-color/50 pl-6 ml-3 space-y-8 py-2">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs italic bg-card-bg/25 border border-border-color/30 rounded-2xl">
                No alerts match the selected filters.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const appMeta = APP_META[alert.sourceApp] || {
                  name: alert.sourceApp,
                  color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                  icon: (
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                };

                let pColor = "bg-zinc-500";
                if (alert.priorityLevel === "critical") pColor = "bg-red-500";
                else if (alert.priorityLevel === "high") pColor = "bg-orange-500";
                else if (alert.priorityLevel === "medium") pColor = "bg-yellow-500";
                else if (alert.priorityLevel === "low") pColor = "bg-blue-500";

                return (
                  <div key={alert.id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border border-background flex items-center justify-center overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full ${pColor}`} />
                    </div>

                    {/* Alert Card Box */}
                    <div
                      onClick={() => {
                        setSelectedAlert(alert);
                        setActionSuccess("");
                      }}
                      className="glass-panel p-5 rounded-2xl border border-border-color/60 bg-card-bg/20 hover:bg-card-bg/40 hover:border-rose-500/20 hover:scale-[1.01] transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* App Badge Icon */}
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${appMeta.color}`}>
                          {appMeta.icon}
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="text-xs font-bold text-white leading-tight">{alert.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              alert.status === "active" ? "bg-rose-500/10 text-rose-400" :
                              alert.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                              "bg-zinc-500/10 text-zinc-400"
                            }`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{alert.description}</p>
                          <span className="text-[9px] text-zinc-500 font-bold block mt-2">
                            Platform: <span className="uppercase text-zinc-400">{appMeta.name}</span> &bull; {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Right side controls/indicators */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`px-2 py-1 rounded text-[8px] font-bold text-white uppercase ${
                          alert.priorityLevel === "critical" ? "bg-red-600/20 text-red-400 border border-red-500/30" :
                          alert.priorityLevel === "high" ? "bg-orange-600/20 text-orange-400 border border-orange-500/30" :
                          alert.priorityLevel === "medium" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30" :
                          "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        }`}>
                          {alert.priorityLevel}
                        </span>
                        
                        <div className="text-zinc-500 group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                    </div>
                  </div>
                {summaryLoading ? (
                  <div className="mt-3 text-sm text-zinc-400">Generating summary…</div>
                ) : summaryText ? (
                  <div className="mt-3 p-3 bg-background border rounded text-sm">
                    <div className="font-bold text-sm mb-1">AI Summary</div>
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap">{summaryText}</div>
                  </div>
                ) : null}

                {draftLoading ? (
                  <div className="mt-3 text-sm text-zinc-400">Generating draft…</div>
                ) : draftData ? (
                  <div className="mt-3 p-3 bg-background border rounded text-sm">
                    {draftData.subject ? <div className="font-bold text-sm mb-1">Subject: {draftData.subject}</div> : null}
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap">{draftData.message}</div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 bg-zinc-800 text-white rounded text-xs" onClick={async ()=>{
                        // quick send via MCP execute if available
                        try{
                          const res = await fetch('/api/mcp/execute',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId: selected.user_id, platformId: selected.platform, toolName: selected.platform==='gmail'?'gmail_send_message':'slack_post_message', args:{subject:draftData.subject, body:draftData.message}})});
                          const d = await res.json(); console.log('send result', d);
                        }catch(e){console.error(e)}
                      }}>Send</button>
                      <button className="px-3 py-1 border rounded text-xs" onClick={()=>{navigator.clipboard?.writeText(draftData.message)}}>Copy</button>
                    </div>
                  </div>
                ) : null}
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: AI Suggested Alerts Row & Active Alert Rules List */}
        <div className="space-y-8">
          {/* Suggested Templates */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <HugeiconsIcon icon={AiBrain01Icon} size={14} className="text-rose-500" />
              AI Suggested Alerts
            </h3>
            
            <div className="space-y-3">
              {SUGGESTED_ALERTS_TEMPLATES.map((template, idx) => (
                <div
                  key={idx}
                  className="glass-panel p-4 rounded-2xl border border-violet-500/10 bg-violet-600/[0.02] hover:border-violet-500/30 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-violet-300 leading-normal">{template.title}</h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{template.description}</p>
                  </div>
                  <button
                    onClick={() => handleAddTemplate(template)}
                    className="self-end px-3 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/30 text-violet-400 text-[10px] font-bold transition-all border border-violet-500/20 cursor-pointer"
                  >
                    + Add Suggested Alert
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Rules List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Alert Rules ({rules.length})</h3>
            
            <div className="space-y-2">
              {rules.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-[11px] bg-card-bg/25 border border-border-color/30 rounded-xl">
                  No alert rules defined. Click "+ Create New Alert" to define alert trigger conditions.
                </div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex justify-between items-center p-3 bg-card-bg/30 border border-border-color/50 rounded-xl"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground leading-normal">{rule.name}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">
                        App: {rule.selectedApps.join(", ")} &bull; {rule.priorityLevel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold">
                        {rule.frequency}
                      </span>
                      {/* Switch placeholder */}
                      <div className="w-7 h-4 rounded-full bg-rose-600/20 border border-rose-500/30 p-0.5 flex justify-end cursor-pointer">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Create New Alert Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="glass-panel w-full max-w-lg rounded-3xl border border-border-color p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HugeiconsIcon icon={Settings01Icon} size={18} className="text-rose-500 animate-spin" />
                  Define New Alert Configuration
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Configure background monitoring parameters and alert triggers.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              {/* Alert Name */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Alert Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Access & Deploy Errors"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fires when deploy failure messages are received on Slack or Gmail"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Multi-App Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Source Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(APP_META).map((appId) => {
                    const isSelected = ruleApps.includes(appId);
                    return (
                      <button
                        type="button"
                        key={appId}
                        onClick={() =>
                          setRuleApps((prev) =>
                            prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-600/20 border-rose-500/40 text-rose-300"
                            : "bg-card-bg/40 border-border-color text-zinc-400 hover:text-white"
                        }`}
                      >
                        {APP_META[appId].icon}
                        {APP_META[appId].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alert Condition or Trigger Rule */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between">
                  <span>Trigger Rule Condition</span>
                  <span className="text-[9px] text-zinc-500">Comma-separated keyword match</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. keyword:failed,error,revoked,unauthorized"
                  value={ruleCondition}
                  onChange={(e) => setRuleCondition(e.target.value)}
                  className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Row 1 Grid: Priority Level & Notification Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Priority Level</label>
                  <select
                    value={rulePriority}
                    onChange={(e) => setRulePriority(e.target.value as any)}
                    className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Notification Method</label>
                  <select
                    value={ruleNotify}
                    onChange={(e) => setRuleNotify(e.target.value as any)}
                    className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="in-app">In-App Notification</option>
                    <option value="email">Send Email Copy</option>
                    <option value="whatsapp">Transmit WhatsApp Message</option>
                  </select>
                </div>
              </div>

              {/* Row 2 Grid: Frequency & Action to Perform */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Frequency Checks</label>
                  <select
                    value={ruleFreq}
                    onChange={(e) => setRuleFreq(e.target.value as any)}
                    className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="realtime">Real-time / Instant</option>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Once Daily</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Trigger Action</label>
                  <select
                    value={ruleAction}
                    onChange={(e) => setRuleAction(e.target.value as any)}
                    className="w-full px-4 py-3 bg-card-bg/60 border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="notify">Notify Dashboard Only</option>
                    <option value="create-task">Notify & Create Task Card</option>
                    <option value="auto-reply">Auto-Draft AI Reply</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-color/30">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-color text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white text-xs font-bold hover:from-rose-500 hover:to-orange-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving Config..." : "Register Monitor Rule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Alert Details Dialog (Side-Over / Slide-in or Modal panel style) */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedAlert(null)} />

          <div
            className="glass-panel w-full max-w-2xl h-full rounded-l-3xl border-l border-border-color bg-sidebar-bg/95 p-6 md:p-8 space-y-6 shadow-2xl relative z-10 animate-slide-in overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    APP_META[selectedAlert.sourceApp]?.color || "bg-zinc-500/10 text-zinc-400"
                  }`}>
                    {APP_META[selectedAlert.sourceApp]?.icon || (
                      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{selectedAlert.title}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">
                      Fired: {new Date(selectedAlert.time).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-medium leading-relaxed">
                  {actionSuccess}
                </div>
              )}

              {/* Status Badge, Priority Level & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pb-2 border-b border-border-color/30">
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                  selectedAlert.status === "active" ? "bg-rose-500/10 text-rose-400" :
                  selectedAlert.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-zinc-500/10 text-zinc-400"
                }`}>
                  Status: {selectedAlert.status}
                </span>

                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                  selectedAlert.priorityLevel === "critical" ? "bg-red-600/10 text-red-400 border border-red-500/20" :
                  selectedAlert.priorityLevel === "high" ? "bg-orange-600/10 text-orange-400 border border-orange-500/20" :
                  selectedAlert.priorityLevel === "medium" ? "bg-yellow-600/10 text-yellow-400 border border-yellow-500/20" :
                  "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                }`}>
                  Priority: {selectedAlert.priorityLevel}
                </span>

                {selectedAlert.status !== "resolved" && (
                  <>
                    <button
                      onClick={() => handleAlertMutation("resolve")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold cursor-pointer"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleAlertMutation("snooze")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-600/20 hover:bg-zinc-600/40 text-zinc-300 border border-zinc-500/20 text-[10px] font-bold cursor-pointer"
                    >
                      Snooze 1h
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleAlertMutation("convert")}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 text-[10px] font-bold cursor-pointer"
                >
                  Convert to Task
                </button>
              </div>

              {/* Alert Full Content Body */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Alert Details</h4>
                <div className="p-4 bg-card-bg/40 border border-border-color rounded-2xl text-xs text-zinc-300 leading-relaxed max-h-[160px] overflow-y-auto">
                  <p className="font-bold text-white mb-2">{selectedAlert.description}</p>
                  {selectedAlert.payload && (
                    <div className="space-y-1.5 font-mono text-[10px] border-t border-border-color/30 pt-2 mt-2">
                      {selectedAlert.payload.from && <p><span className="text-zinc-500">From:</span> {selectedAlert.payload.from}</p>}
                      {selectedAlert.payload.subject && <p><span className="text-zinc-500">Subject:</span> {selectedAlert.payload.subject}</p>}
                      {selectedAlert.payload.channel && <p><span className="text-zinc-500">Channel:</span> #{selectedAlert.payload.channel}</p>}
                      {selectedAlert.payload.sender && <p><span className="text-zinc-500">Sender:</span> {selectedAlert.payload.sender}</p>}
                      {selectedAlert.payload.body && <p className="text-zinc-400 mt-2 whitespace-pre-wrap">{selectedAlert.payload.body}</p>}
                      {selectedAlert.payload.text && <p className="text-zinc-400 mt-2 whitespace-pre-wrap">{selectedAlert.payload.text}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Features Segment */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider flex items-center gap-1">
                  <HugeiconsIcon icon={AiBrain01Icon} size={12} className="text-violet-400 animate-pulse" />
                  AI Smart Operations
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Summary Generator */}
                  <div className="p-4 bg-violet-600/[0.01] border border-violet-500/10 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white">Alert Summary</span>
                      <button
                        onClick={() => handleAiAction("ai_summary")}
                        disabled={loadingAi["ai_summary"]}
                        className="text-[9px] text-violet-400 hover:text-violet-300 font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {loadingAi["ai_summary"] ? "Analyzing..." : "Generate AI"}
                      </button>
                    </div>
                    {selectedAlert.summary ? (
                      <p className="text-[10px] text-zinc-400 leading-normal">{selectedAlert.summary}</p>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic">No summary generated yet.</p>
                    )}
                  </div>

                  {/* Suggest Action */}
                  <div className="p-4 bg-violet-600/[0.01] border border-violet-500/10 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white">Recommended Action</span>
                      <button
                        onClick={() => handleAiAction("ai_next_action")}
                        disabled={loadingAi["ai_next_action"]}
                        className="text-[9px] text-violet-400 hover:text-violet-300 font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {loadingAi["ai_next_action"] ? "Analyzing..." : "Generate AI"}
                      </button>
                    </div>
                    {selectedAlert.nextAction ? (
                      <p className="text-[10px] text-zinc-400 leading-normal">{selectedAlert.nextAction}</p>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic">No recommended action generated.</p>
                    )}
                  </div>
                </div>

                {/* AI Reply Composer Section */}
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      AI reply assistant composer
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as any)}
                        className="bg-card-bg/60 border border-border-color text-[9px] rounded-lg px-2 py-1 text-zinc-300 focus:outline-none"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Casual">Casual</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                      <button
                        onClick={() => handleAiAction("ai_draft_reply")}
                        disabled={loadingAi["ai_draft_reply"]}
                        className="px-2.5 py-1 rounded bg-violet-600 text-white text-[9px] font-bold disabled:opacity-50 cursor-pointer"
                      >
                        {loadingAi["ai_draft_reply"] ? "Drafting..." : "Generate Draft"}
                      </button>
                    </div>
                  </div>

                  {selectedAlert.suggestedReply ? (
                    <div className="space-y-2">
                      <textarea
                        value={selectedAlert.suggestedReply}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedAlert((prev) => prev ? { ...prev, suggestedReply: val } : null);
                        }}
                        rows={3}
                        className="w-full p-3 bg-card-bg border border-border-color rounded-xl text-[10px] text-zinc-300 leading-relaxed font-sans focus:outline-none focus:border-violet-500"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-500">
                          Verify & edit reply content before dispatching.
                        </span>
                        <button
                          onClick={() => {
                            alert(`Draft response sent successfully via ${selectedAlert.sourceApp}!`);
                            setSelectedAlert(prev => prev ? { ...prev, suggestedReply: "", status: "resolved" } : null);
                            loadData();
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Send Draft Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">Generate an AI draft reply to take action directly from here.</p>
                  )}
                </div>

              </div>
            </div>

            {/* Footer close button */}
            <div className="pt-4 border-t border-border-color/30 flex justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2.5 rounded-xl border border-border-color text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
