"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";

interface ActionItem {
  id: string;
  type: string;
  params: Record<string, any>;
}

export default function TriggersPage() {
  const { user } = useAuth();
  const [triggers, setTriggers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("zoom_transcript");
  const [actions, setActions] = useState<ActionItem[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTriggers();
  }, [user]);

  const fetchTriggers = async () => {
    if (!user) return;
    const res = await fetch(`/api/triggers?userId=${user.id}`);
    const data = await res.json();
    if (data.ok) setTriggers(data.triggers || []);
  };

  const addAction = (type = "extract_action_items") => {
    setActions(prev => [...prev, { id: `${Date.now()}_${Math.random()}`, type, params: {} }]);
  };

  const updateAction = (id: string, patch: Partial<ActionItem>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const removeAction = (id: string) => setActions(prev => prev.filter(a => a.id !== id));

  const moveAction = (id: string, dir: 'up' | 'down') => {
    setActions(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return prev;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  };

  const saveTrigger = async () => {
    if (!user) return alert('Sign in to save triggers');
    if (!name) return alert('Please provide a trigger name');
    const spec = { event: { type: eventType }, actions };
    const res = await fetch('/api/triggers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, name, spec }) });
    const data = await res.json();
    if (data.ok) {
      setName(''); setActions([]); setEventType('zoom_transcript');
      fetchTriggers();
    } else {
      alert(data.error || 'Failed to save');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Visual Trigger Editor</h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Create Trigger</h3>
        <input placeholder="Trigger name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 mb-2 border rounded" />

        <label className="block text-sm font-medium mb-1">When (Event)</label>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="p-2 border rounded w-full mb-3">
          <option value="zoom_transcript">Zoom meeting transcript generated</option>
          <option value="github_pr">New GitHub Pull Request</option>
          <option value="notion_page">New Notion Page</option>
        </select>

        <label className="block text-sm font-medium mb-1">Actions (chain)</label>
        <div className="space-y-2 mb-3">
          {actions.map((a, i) => (
            <div key={a.id} className="p-3 border rounded flex items-start gap-3">
              <div className="flex-1">
                <select value={a.type} onChange={(e) => updateAction(a.id, { type: e.target.value })} className="mb-2 p-1 border rounded w-full">
                  <option value="extract_action_items">Extract action items (AI)</option>
                  <option value="save_to_google_docs">Save to Google Docs</option>
                  <option value="notify_slack">Notify Slack</option>
                </select>

                {a.type === 'save_to_google_docs' && (
                  <input placeholder="Doc title" value={a.params.title || ''} onChange={(e) => updateAction(a.id, { params: { ...(a.params || {}), title: e.target.value } })} className="p-2 border rounded w-full" />
                )}

                {a.type === 'notify_slack' && (
                  <input placeholder="Slack channel (#channel)" value={a.params.channel || ''} onChange={(e) => updateAction(a.id, { params: { ...(a.params || {}), channel: e.target.value } })} className="p-2 border rounded w-full" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => moveAction(a.id, 'up')} className="px-2 py-1 border rounded">↑</button>
                <button onClick={() => moveAction(a.id, 'down')} className="px-2 py-1 border rounded">↓</button>
                <button onClick={() => removeAction(a.id)} className="px-2 py-1 border rounded text-red-400">✕</button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={() => addAction('extract_action_items')} className="px-3 py-1 border rounded">Add Extract</button>
            <button onClick={() => addAction('save_to_google_docs')} className="px-3 py-1 border rounded">Add Save to Docs</button>
            <button onClick={() => addAction('notify_slack')} className="px-3 py-1 border rounded">Add Notify Slack</button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={saveTrigger} className="px-3 py-2 bg-violet-600 text-white rounded">Save Trigger</button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Saved Triggers</h3>
        <div className="space-y-2">
          {triggers.map(t => (
            <div key={t.id} className="p-3 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-zinc-400">Event: {t.spec?.event?.type || JSON.stringify(t.spec?.event)}</div>
                </div>
                <div className="text-xs text-zinc-500">{new Date(t.created_at).toLocaleString()}</div>
              </div>
              <pre className="mt-2 text-xs bg-[#080816] p-2 rounded overflow-auto">{JSON.stringify(t.spec, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
