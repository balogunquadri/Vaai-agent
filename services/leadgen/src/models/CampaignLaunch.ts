import insforge from "../insforge";

export interface CampaignLaunchDocument {
  id?: string;
  campaignId: string;
  userId: string;
  launchedAt: string;
  stepIndex: number;
  status: "queued" | "running" | "completed" | "failed";
  sentCount: number;
  errors?: string[];
  triggeredBy: "manual" | "scheduled";
  createdAt?: string;
  updatedAt?: string;
}

export const CampaignLaunch = {
  create: async (obj: Partial<CampaignLaunchDocument>) => {
    const { data, error } = await insforge.from("campaign_launches").insert(obj).select();
    if (error) throw error;
    return data?.[0] ?? null;
  },
  find: async (filter: any = {}) => {
    let q: any = insforge.from("campaign_launches").select("*");
    if (filter.campaignId) q = q.eq("campaignId", filter.campaignId);
    const { data, error } = await q.order("createdAt", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  findById: async (id: string) => {
    const { data, error } = await insforge.from("campaign_launches").select("*").eq("id", id).limit(1);
    if (error) throw error;
    return data?.[0] ?? null;
  },
  findByIdAndUpdate: async (id: string, patch: any) => {
    const { data, error } = await insforge.from("campaign_launches").update(patch).eq("id", id).select();
    if (error) throw error;
    return data?.[0] ?? null;
  },
};
