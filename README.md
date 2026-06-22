# Connecting Integrations in VA-AI (Multi-User Workspace)

This guide explains how to configure, connect, and test the 26 workspace applications integrated into the VA-AI dashboard. 

VA-AI supports **multi-user operation** for all integrations. Developer API secrets are kept secure in the server environment variables, while user-specific parameters (like Slack channels, GitHub repository paths, Notion document IDs, etc.) are configured directly in the user interface.

---

## 🛠️ Architecture Overview

To maintain security and enable multiple users to connect their own workspace channels simultaneously:

1. **Developer API Keys & Tokens (`.env` or `.env.local`)**:
   Global bot tokens, OAuth Client IDs, Client Secrets, and developer personal access tokens are stored securely on the server.
2. **User Configuration Settings (InsForge Database)**:
   Specific user preferences (e.g., specific Slack channel IDs, Notion Database IDs, Jira project keys) are entered via the **MCP Settings Modal** on the dashboard and stored in the database's `integrations` table.
3. **High-Fidelity Simulation Fallback**:
   If developer tokens are missing from the server `.env`, the integrations engine gracefully falls back to interactive simulated streams. This allows complete UI testing out-of-the-box before deploying production API credentials.

---

## 🔑 Environment Variables Configuration

To enable real API connectivity for the main integration platforms, add the following variables to your server `.env` or `.env.local` file:

```env
# Gmail API (Google OAuth)
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret

# WhatsApp Business / WebSockets
# (Session data is handled dynamically per-user)

# Slack API
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# GitHub API
GITHUB_PAT=ghp_your-personal-access-token

# Notion API
NOTION_API_KEY=secret_your-notion-integration-token

# Telegram API
TELEGRAM_BOT_TOKEN=123456789:your-telegram-bot-token

# Discord API
DISCORD_BOT_TOKEN=your-discord-bot-token

# Jira Software API
JIRA_API_TOKEN=your-jira-api-token
```

---

## 🚀 Step-by-Step Connection Guide

### 1. Enable the Platform
1. Navigate to the **Connected Apps** (or Integrations) page: `/dashboard/integrations`.
2. Toggle the connection switch to **Online** for your desired platform (e.g. Slack or GitHub).
3. The platform card will glow, indicating it is active.

### 2. Configure User Parameters
1. Click the **Settings (⚙️)** gear icon on the active integration card.
2. Input the user-specific parameters requested by the configuration fields:
   * **Slack**: Enter `channelId` (e.g. `C0712A34B`) or default `userName`.
   * **Notion**: Enter `pageId` (e.g. page UUID or database ID).
   * **GitHub**: Enter `repo` path (e.g. `owner/repository`).
   * **Jira**: Enter `domain`, `userEmail`, and `projectKey`.
3. Click **Save Configuration** to save these values in the database.

### 3. Verify with the Interactive MCP Terminal
VA-AI includes a live **Model Context Protocol (MCP) Terminal Console** inside every integration settings modal to test tool execution:
1. Open the integration Settings modal.
2. Under the **Interactive MCP Terminal Console**, select a tool from the dropdown list (e.g. `slack_post_message` or `github_create_issue`).
3. The arguments text box will prefill with a JSON template. Edit the arguments to match your configuration.
4. Click **Run Tool Call**.
5. The terminal will display the raw JSON request sent to the server and the response payload returned by the API (or simulated fallback engine).

---

## 📊 Integrations Throughout the Dashboard

Once connected, VA-AI aggregates data across all active platforms:

* **Today's AI Briefing**: The briefing compilations fetch logs, updates, and communications from Slack, GitHub, Notion, etc., to summarize daily developments.
* **Scheduled Digests**: When scheduling a digest briefing, tick the checkbox next to any connected platform to incorporate its updates.
* **Alert Trigger Rules**: Key alerts track keywords in Slack channel logs, GitHub issue trackers, and Notion edits. If a match is found, an instant system alert is triggered.
* **Live Connected Streams**: The bottom section of the main Dashboard page features tabs for all active streams. Click Slack, GitHub, or Jira to monitor recent events in real-time.
