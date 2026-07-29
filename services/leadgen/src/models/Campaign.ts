import insforge from "../insforge";

export interface CampaignStep {
  name: string;
  subject: string;
  bodyTemplate: string;
  delayMinutes: number;
  personalizationEnabled: boolean;
  channel: "email";
}

export interface CampaignDocument {
  id?: string;
  userId: string;
  name: string;
  active: boolean;
  sequenceSteps: CampaignStep[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export const Campaign = {
  create: async (obj: Partial<CampaignDocument>) => {
    const { data, error } = await insforge.from("campaigns").insert(obj).select();
    if (error) throw error;
    return data?.[0] ?? null;
  },
  find: async (filter: any = {}) => {
    let q: any = insforge.from("campaigns").select("*");
    if (filter.userId) q = q.eq("userId", filter.userId);
    if (filter._sort && filter._sort.updatedAt === -1) q = q.order("updatedAt", { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },
  findById: async (id: string) => {
    const { data, error } = await insforge.from("campaigns").select("*").eq("id", id).limit(1);
    if (error) throw error;
    return data?.[0] ?? null;
  },
};
