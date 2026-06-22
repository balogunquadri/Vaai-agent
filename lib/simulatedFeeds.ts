const now = new Date();

const generateTime = (minutesAgo: number) => {
  const d = new Date(now.getTime() - minutesAgo * 60 * 1000);
  return d.toISOString();
};

export const feeds: Record<string, any[]> = {
  slack: [
    { id: "sl_1", title: "#product-ops", text: "@harry the client contract billing details are ready to review.", user: "Sarah Designer", time: generateTime(5) },
    { id: "sl_2", title: "#incident-management", text: "Production build deploy failed: exit code 1 in test runner", user: "DeployBot", time: generateTime(18) },
    { id: "sl_3", title: "#general", text: "Welcome our new growth marketer to the team!", user: "Alice HR", time: generateTime(120) }
  ],
  outlook: [
    { id: "out_1", title: "Meeting Invitation", text: "Sprint Planning Session starting tomorrow morning.", from: "product-manager@company.com", time: generateTime(35) },
    { id: "out_2", title: "Urgent Update: Banking Details", text: "Please confirm updated bank routing details before dispatching the wire transfer.", from: "finance@billing.com", time: generateTime(70) }
  ],
  discord: [
    { id: "disc_1", title: "#announcements", text: "AI Trip Planner deployment is complete! Version 1.2.0 is live.", user: "Release Manager Bot", time: generateTime(12) },
    { id: "disc_2", title: "#alerts", text: "Memory usage spike detected on instance node-2-api.", user: "Datadog Bot", time: generateTime(45) }
  ],
  linkedin: [
    { id: "li_1", title: "Publication Analytics", text: "Your post 'B2B SaaS Security Best Practices' received 2,450 impressions and 48 likes in the last 24 hours.", user: "LinkedIn Analytics", time: generateTime(180) },
    { id: "li_2", title: "Direct Message", text: "Hi, I saw your product briefing and would love to book a demo call.", user: "James Growth Lead", time: generateTime(300) }
  ],
  telegram: [
    { id: "tg_1", title: "System Security Bot", text: "Unauthorized attempt blocked. IP: 198.51.100.42 tried to access admin panel.", user: "ShieldBot", time: generateTime(2) },
    { id: "tg_2", title: "Harry's Assistant", text: "Notification copy successfully forwarded to your active WhatsApp line.", user: "Alerts Relay", time: generateTime(15) }
  ],
  jira: [
    { id: "jira_1", title: "SEC-402", text: "Fix unauthorized token exposure in OAuth callback handling logic.", priority: "critical", time: generateTime(8) },
    { id: "jira_2", title: "AN-109", text: "Integrate multi-user custom client dashboard panels.", priority: "high", time: generateTime(60) },
    { id: "jira_3", title: "QA-88", text: "Figma design specs review and test cases validation.", priority: "medium", time: generateTime(110) }
  ],
  trello: [
    { id: "tr_1", title: "QA Backlog", text: "Card 'OAuth refresh token token expiration verification' moved to Doing.", listName: "Active Sprint", time: generateTime(25) },
    { id: "tr_2", title: "Content Calendar", text: "Figma design draft checklists completed.", listName: "Design", time: generateTime(150) }
  ],
  asana: [
    { id: "as_1", title: "Growth Campaign", text: "Harry assigned task: Write copy for B2B email sequence.", dueDate: "Tomorrow", time: generateTime(40) },
    { id: "as_2", title: "Platform Security Audit", text: "Review active environment variable storage schemas.", dueDate: "June 25", time: generateTime(140) }
  ],
  meet: [
    { id: "meet_1", title: "Instant Call", text: "Meet room generated: meet.google.com/abc-defg-hij. Click to join Harry's review.", time: generateTime(4) }
  ],
  zoom: [
    { id: "zoom_1", title: "Growth Review meeting", text: "Zoom Room ID: 948 2018 4021. Password: ZoomSecure. Duration: 45m.", time: generateTime(10) }
  ],
  notion: [
    { id: "not_1", title: "Product Requirements Document (PRD)", text: "Harry updated block: 'OAuth security standards and dynamic client parameters mapping schema'.", pageId: "oauth-specs", time: generateTime(3) },
    { id: "not_2", title: "Team Wiki", text: "Sarah added design guidelines page for glassmorphic elements and HSL layout colors.", pageId: "styling-guide", time: generateTime(80) }
  ],
  manus: [
    { id: "man_1", title: "AI Search Agent Run", text: "Manus completed autonomous search query: 'Competitor B2B integrations pricing models and features comparisons'. Summary: 3 direct competitors analyzed.", time: generateTime(22) }
  ],
  zapier: [
    { id: "zap_1", title: "Gmail-to-Slack Zap", text: "Triggered successfully. Webhook forwarded payload for email: 'Security Alert: New device login'.", time: generateTime(14) }
  ],
  tango: [
    { id: "tan_1", title: "How-to Guide Drafted", text: "Tango generated workflow guide: 'How to connect Slack bot credentials and retrieve user API tokens'. 6 steps documented.", time: generateTime(95) }
  ],
  toggl: [
    { id: "tog_1", title: "Time Tracker Entry", text: "Harry started timer for task 'Workspace Dashboard Multi-user Integration'. Status: active", time: generateTime(1) }
  ],
  calendly: [
    { id: "cal_1", title: "Client Discovery Call", text: "New booking by harry.designer@figma.com at 3:00 PM tomorrow.", status: "scheduled", time: generateTime(50) }
  ],
  google_calendar: [
    { id: "gcal_1", title: "Google Meet Review", text: "Workspace integrations demo and security review checklist with Harry.", time: generateTime(40) }
  ],
  google_drive: [
    { id: "gdrv_1", title: "VA-AI UI Design", text: "Sarah shared Figma layouts export package VA_AI_v2.zip.", mimeType: "application/zip", time: generateTime(15) },
    { id: "gdrv_2", title: "Briefing Specifications", text: "Read-only access granted for structured briefing guidelines document.", mimeType: "application/pdf", time: generateTime(120) }
  ],
  github: [
    { id: "git_1", title: "PR #102: Merged", text: "Harry merged pull request: 'Multi-user auth credential mapping and dynamic database persistence layer'", repo: "vaai-core", time: generateTime(7) },
    { id: "git_2", title: "Issue #44: Open", text: "Security alert: env token validation fails during mock deployments", repo: "vaai-core", time: generateTime(120) }
  ],
  teams: [
    { id: "tms_1", title: "Operations Channel", text: "@Harry the Microsoft Teams integration bot is ready. Please review status.", user: "Teams Hub Bot", time: generateTime(11) }
  ],
  lark: [
    { id: "lrk_1", title: "Team Docs Share", text: "Lark doc shared: 'B2B SaaS Growth marketing pipeline Q3'. Read-write access enabled.", time: generateTime(150) }
  ],
  instagram: [
    { id: "inst_1", title: "Direct Message", text: "Loved your AI product demo reel! Let's discuss a licensing contract.", user: "growth_influencer", time: generateTime(240) }
  ],
  x_twitter: [
    { id: "tw_1", title: "Brand Mention", text: "@harry: The new VA-AI multi-user workspace integrations using Model Context Protocol (MCP) look amazing! Super clean UI.", user: "saas_developer", time: generateTime(6) }
  ],
  threads: [
    { id: "th_1", title: "Product Thread", text: "Harry posted: 'Securing multi-user tokens at scale inside server-side env files'. 12 replies.", time: generateTime(72) }
  ]
};

export function getSimulatedFeed(platformId: string) {
  return feeds[platformId] || [];
}

export default { getSimulatedFeed, feeds };
