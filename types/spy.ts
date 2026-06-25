export interface SpyOptions {
  seoAudit: boolean;
  socialPresence: boolean;
  aiFootprint: boolean;
}

export interface SpyRequestPayload {
  urlA: string;
  urlB: string;
  options: SpyOptions;
}

export interface DomainMetadata {
  title?: string;
  description?: string;
  favicon?: string;
}

export interface SEOMetrics {
  visibilityScore: number;
  organicKeywords: number;
  backlinksCount: number;
  organicTraffic: number;
}

export interface SocialMetrics {
  facebookShares: number;
  redditShares: number;
  pinterestPins: number;
  twitterEngagement?: number;
  handles: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface AIFootprintMetrics {
  aiDirectoryRank: number;
  referralsFromAI: number; // estimated visits from AI agents/chatbots
  similarwebGlobalRank?: number;
  bounceRate?: string;
}

export interface SocialTelemetry {
  platform: string;
  handle: string;
  isLinkValid: boolean;
  linkStatusText: string;
  contentType: string;
  viralityScore: number;
  uniquenessFactors: string[];
  improvementPoints: string[];
}

export interface CompetitorData {
  url: string;
  metadata: DomainMetadata;
  seo?: SEOMetrics;
  social?: SocialMetrics;
  ai?: AIFootprintMetrics;
  socialTelemetry?: SocialTelemetry[]; // [NEW] Handles detailed multi-platform social analyses
}

export interface SpyResultResponse {
  success: boolean;
  data?: {
    companyA: CompetitorData;
    companyB: CompetitorData;
    aiReport?: string;
  };
  error?: string;
}
