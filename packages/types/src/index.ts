// Auth
export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}

// Leads
export type LeadStatus = "pending" | "sent" | "opened" | "replied" | "bounced";

export interface Lead {
  id: string;
  userId: string;
  campaignId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: LeadStatus;
  customVariables?: Record<string, string>;
  lastSentAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Campaigns
export interface CampaignStep {
  name: string;
  subject: string;
  bodyTemplate: string;
  delayMinutes: number;
  personalizationEnabled: boolean;
  channel: "email";
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  active: boolean;
  sequenceSteps: CampaignStep[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignLaunch {
  id: string;
  campaignId: string;
  userId: string;
  launchedAt: Date;
  stepIndex: number;
  status: "queued" | "running" | "completed" | "failed";
  sentCount: number;
  errors?: string[];
  triggeredBy: "manual" | "scheduled";
  createdAt: Date;
  updatedAt: Date;
}

// Alerts
export interface Alert {
  id: string;
  userId: string;
  keyword: string;
  source?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Briefing
export interface Briefing {
  id: string;
  userId: string;
  name: string;
  templateId?: string;
  schedule?: string; // cron
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Integration
export interface Integration {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Service Config
export interface ServiceConfig {
  port: number;
  env: "development" | "production" | "test";
  insforgeUrl: string;
  insforgeApiKey: string;
  logLevel: "debug" | "info" | "warn" | "error";
}
