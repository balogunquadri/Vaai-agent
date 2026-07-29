"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../../components/AuthProvider";

type Lead = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: "pending" | "sent" | "opened" | "replied" | "bounced";
};

type Campaign = {
  _id: string;
  name: string;
  active: boolean;
  sequenceSteps: Array<{
    name: string;
    subject: string;
    bodyTemplate: string;
    delayMinutes: number;
    personalizationEnabled: boolean;
  }>;
};

const apiBase = process.env.NEXT_PUBLIC_LEADGEN_API_URL || "http://localhost:4000";

export default function LeadGenPage() {
  const { user, loading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [aiPersonalization, setAiPersonalization] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const leadCounts = useMemo(() => {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  useEffect(() => {
    if (!user) return;

    const client = io(apiBase, { query: { userId: user.id } });
    client.on("lead:update", (updated: Lead) => {
      setLeads((prev) => prev.map((lead) => (lead._id === updated._id ? updated : lead)));
    });
    client.on("campaignLaunch:update", () => {
      loadLeads();
    });

    setSocket(client);
    return () => {
      client.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    loadCampaigns();
  }, [user]);

  useEffect(() => {
    if (!campaign) return;

    loadLeads();
    const interval = setInterval(() => {
      loadLeads();
    }, 9000);

    return () => clearInterval(interval);
  }, [campaign]);

  async function loadCampaigns() {
    if (!user) return;
    try {
      const response = await fetch(`${apiBase}/api/campaigns/user/${user.id}`, { 
        signal: AbortSignal.timeout(5000) 
      });
      const data = await response.json();
      const campaignList = Array.isArray(data) ? data : [];
      setCampaigns(campaignList);
      if (!campaign && campaignList.length > 0) {
        setCampaign(campaignList[0]);
      }
    } catch (error) {
      console.error("Failed to load campaigns", error);
      setStatusMessage("Leadgen service unavailable. Ensure NEXT_PUBLIC_LEADGEN_API_URL is set or the service is running on port 4000.");
    }
  }

  async function loadLeads() {
    if (!campaign?._id) return;
    try {
      const response = await fetch(`${apiBase}/api/leads/campaign/${campaign._id}`);
      const data = await response.json();
      setLeads(data || []);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCreateCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      userId: user.id,
      name: formData.get("name"),
      active: formData.get("active") === "on",
      sequenceSteps: [
        {
          name: "Initial outreach",
          subject: String(formData.get("subject") ?? ""),
          bodyTemplate: String(formData.get("bodyTemplate") ?? ""),
          delayMinutes: Number(formData.get("delayMinutes") ?? 5),
          personalizationEnabled: aiPersonalization,
          channel: "email",
        },
      ],
    };

    const response = await fetch(`${apiBase}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatusMessage("Unable to create campaign.");
      return;
    }

    const created = await response.json();
    setCampaign(created);
    setCampaigns((prev) => [created, ...prev]);
    setStatusMessage("Campaign created successfully.");
    setLeads([]);
  }

  async function handleImportCsv() {
    if (!file || !campaign || !user) {
      setStatusMessage("Please create a campaign and select a CSV file first.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("userId", user.id);
    form.append("campaignId", campaign._id);

    const response = await fetch(`${apiBase}/api/leads/import`, {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    if (!response.ok) {
      setStatusMessage(result.error || "Upload failed.");
      return;
    }

    setStatusMessage(`Imported ${result.insertedCount} leads.`);
    loadLeads();
  }

  async function handleLaunchCampaign() {
    if (!campaign || !user) {
      setStatusMessage("Campaign or user missing.");
      return;
    }

    const response = await fetch(`${apiBase}/api/campaigns/${campaign._id}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!response.ok) {
      setStatusMessage("Unable to launch campaign.");
      return;
    }

    setStatusMessage("Campaign launched successfully.");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm text-slate-400">Loading lead generation workspace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Cold Email Campaigns</h1>
            <p className="mt-2 text-sm text-slate-500">Set up sequences, import leads, and track reply activity in real time.</p>
          </div>
          <button
            type="button"
            onClick={handleLaunchCampaign}
            className="rounded-full bg-slate-900 px-5 py-2 text-white transition hover:bg-slate-700"
          >
            Launch campaign
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {campaigns.length > 0 ? (
            campaigns.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => {
                  setCampaign(item);
                  setStatusMessage("");
                  loadLeads();
                }}
                className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                  campaign?._id === item._id
                    ? "border-slate-900 bg-slate-900/5"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                <div className="mt-2 text-xs text-slate-500">{item.active ? "Active" : "Draft"}</div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No campaigns yet. Create one to get started.
            </div>
          )}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCampaign}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign name</label>
            <input name="name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Delay between steps (minutes)</label>
            <input
              name="delayMinutes"
              type="number"
              defaultValue={5}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Email subject</label>
            <input name="subject" className="w-full rounded-2xl border border-slate-300 px-4 py-3" required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Email template</label>
            <textarea
              name="bodyTemplate"
              rows={6}
              className="w-full rounded-3xl border border-slate-300 px-4 py-3"
              defaultValue={
                "{{personalizedGreeting}}\n\nI noticed {{company}} is growing quickly and wanted to share a brief idea on how we can help.\n\n{{trackingPixel}}"
              }
            />
          </div>

          <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={aiPersonalization}
              onChange={() => setAiPersonalization((prev) => !prev)}
              className="h-5 w-5 rounded border-slate-300 accent-slate-900"
            />
            <span className="text-sm font-medium text-slate-900">AI personalization enabled</span>
          </label>

          <button className="rounded-3xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700">
            Save campaign
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {(["pending", "sent", "opened", "replied"] as const).map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{leadCounts[item] || 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lead import</h2>
            <p className="text-sm text-slate-500">Upload a CSV to bulk insert leads and watch statuses update live.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
            <button
              type="button"
              onClick={handleImportCsv}
              className="rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700"
            >
              Upload CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500">Lead</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Company</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Last action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{lead.email}</div>
                    <div className="text-slate-500">{lead.firstName} {lead.lastName}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{lead.company}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        lead.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : lead.status === "sent"
                          ? "bg-slate-100 text-slate-800"
                          : lead.status === "opened"
                          ? "bg-blue-100 text-blue-800"
                          : lead.status === "replied"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{lead.status === "opened" ? "Opened" : lead.status === "replied" ? "Replied" : "Waiting"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {statusMessage && <p className="mt-4 text-sm text-slate-600">{statusMessage}</p>}
      </section>
    </div>
  );
}
