import insforge from "../insforge";

export type LeadStatus = "pending" | "sent" | "opened" | "replied" | "bounced";

export interface LeadDocument {
  id?: string;
  userId: string;
  campaignId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: LeadStatus;
  customVariables?: Record<string, string>;
  lastSentAt?: string | Date;
  openedAt?: string | Date;
  repliedAt?: string | Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  save?: () => Promise<LeadDocument>;
}

function attachSaveMethod(rec: any) {
  if (!rec) return rec;
  rec.save = async function () {
    const patch = { ...this };
    delete patch.id;
    const { data, error } = await insforge.from("leads").update(patch).eq("id", this.id).select();
    if (error) throw error;
    Object.assign(this, data?.[0] ?? {});
    return this as LeadDocument;
  };
  return rec as LeadDocument;
}

export const Lead = {
  insertMany: async (docs: Partial<LeadDocument>[]) => {
    const { data, error } = await insforge.from("leads").insert(docs).select();
    if (error) throw error;
    return (data || []).map(attachSaveMethod);
  },
  find: async (filter: any = {}) => {
    let q: any = insforge.from("leads").select("*");
    if (filter.campaignId) q = q.eq("campaignId", filter.campaignId);
    if (filter.userId) q = q.eq("userId", filter.userId);
    if (filter.status && filter.status.$in) q = q.in("status", filter.status.$in);
    // simple sort handling
    if (filter._sort && filter._sort.createdAt === -1) q = q.order("createdAt", { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(attachSaveMethod);
  },
  findById: async (id: string) => {
    const { data, error } = await insforge.from("leads").select("*").eq("id", id).limit(1);
    if (error) throw error;
    return attachSaveMethod(data?.[0] ?? null);
  },
  findByIdAndUpdate: async (id: string, patch: any) => {
    const { data, error } = await insforge.from("leads").update(patch).eq("id", id).select();
    if (error) throw error;
    return attachSaveMethod(data?.[0] ?? null);
  },
};
