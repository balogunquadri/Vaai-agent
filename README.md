# Connecting Integrations in VA-AI (Multi-User Workspace)

This guide explains how to configure, connect, and test the 26 workspace applications integrated into the VA-AI dashboard. 

VA-AI supports **multi-user operation** for all integrations. Developer API secrets are kept secure in the server environment variables, while user-specific parameters (like Slack channels, GitHub repository paths, Notion document IDs, etc.) are configured directly in the user interface.

---

## 🔌 Hybrid SSE MCP Architecture

VA-AI uses a **Hybrid Model Context Protocol (MCP) Architecture** to orchestrate workspace tool actions. This supports both **local in-process adapters** (for serverless environments and low-latency) and **remote HTTP/SSE-based MCP servers** (for isolated execution sandboxes).

```
                      ┌───────────────────────────┐
                      │     V-AI Chat Agent       │
                      │   (app/api/ai-agent)      │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   Dynamic MCP Registry    │
                      │    (lib/mcpRegistry)      │
                      └──────┬─────────────┬──────┘
                             │             │
            ┌────────────────┘             └────────────────┐
            ▼                                               ▼
┌───────────────────────────┐                  ┌───────────────────────────┐
│    Local MCP Adapters     │                  │    Remote SSE Clients     │
│  (in-process / direct)    │                  │  (isolated JSON-RPC/HTTP) │
│───┬───────────────────────│                  │───┬───────────────────────│
    │ - WhatsApp/Gmail      │                      │ - Python Sandboxes    │
    │ - Notion/Slack/Jira   │                      │ - Node/SSE MCP Servers│
    │ - In-memory / fast    │                      │ - Isolated containers │
```

To maintain security and enable multiple users to connect their own workspace channels simultaneously:

1. **Symmetric Key Encryption (AES-256-GCM)**:
   All user-specific integration credentials (like Slack tokens, WhatsApp sessions, or GitHub PATs) written to the `integrations` state database column are encrypted in-flight using standard Node.js `crypto` with the `INSFORGE_KEY_SECRET` environment variable. A fallback mechanism is active to decrypt legacy plain tokens automatically.
2. **Dynamic Tool Schema Discovery**:
   Hardcoded function declarations are removed. The agent fetches active integrations for the logged-in user at runtime, queries their tool schemas via `getToolSchemas()`, and dynamically builds the tools declaration list for the Google GenAI SDK.
3. **Transparent Execution Dispatching**:
   If the integration's database state contains a `serverUrl` parameter, the dynamic registry routes tool execution queries over HTTP/SSE via the remote JSON-RPC client (`McpSseClient`). Otherwise, the registry runs the tool locally in-process through the platform's local adapter.

---


## 🔑 Environment Variables Configuration

To enable the core application features, database connections, and cryptography services, configure the following global variables in your server `.env` or `.env.local` file. 

*Note: User-specific third-party integration credentials (like Slack tokens, WhatsApp sessions, or GitHub access tokens) are **not** stored in this file. They are entered dynamically via the dashboard UI and saved securely in the database.*

```env
# InsForge SaaS Database Endpoint & Credentials
NEXT_PUBLIC_INSFORGE_URL=https://api.insforge.com
INSFORGE_API_KEY=if_key_your_admin_api_token

# Cryptography Secret Key (AES-256-GCM cipher secret)
# Used to encrypt user tokens before writing to the integrations state
INSFORGE_KEY_SECRET=your-32-byte-hex-or-passphrase

# Gemini AI API Key
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# Resend API Key (Used to dispatch account verification and onboarding emails)
RESEND_API_KEY=re_your_resend_api_key

# Global Google OAuth App Credentials (for user Gmail OAuth authentication)
GMAIL_CLIENT_ID=your-google-oauth-client-id
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret

# Global Microsoft OAuth App Credentials (for user Outlook OAuth authentication)
MICROSOFT_CLIENT_ID=your-microsoft-oauth-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-oauth-client-secret

# Telegram API Client Credentials (required to generate client sessions)
TELEGRAM_API_ID=your-telegram-api-id-number
TELEGRAM_API_HASH=your-telegram-api-hash-string
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

---

## 🕵️ Competitor Intelligence (Spy Hub)

The **Spy Hub** (`/dashboard/spy`) provides dynamic, automated competitor intelligence profiling and growth strategy generation using Gemini:

1. **Flexible Target Benchmarking**: Input domains (`site.com`), naked handles (`@brand`), platform-prefixed handles (`youtube/@brand`), or video links. 
2. **Sanitization & Canonization**: Comma domain typos (like `site,com`) are cleaned automatically. Handles are normalized into proper platform URL formats (Instagram, YouTube, TikTok, Twitter/X, Facebook, and LinkedIn) for precise verification checks.
3. **Multi-Platform Telemetry comparison**: Verifies handle availability via GET headers (handling 404s vs login walls) and loads customized Content Strategy, Virality indicators, and Growth recommendations in a side-by-side comparison tab grid.
4. **Self-Healing AI SWOT & Strategy**: Compiles comparison parameters and queries Gemini. Resolves API quota/temporary demand failures using a self-healing fallback chain: `gemini-2.5-flash` ➡️ `gemini-2.5-pro` ➡️ `gemini-1.5-flash` ➡️ `gemini-1.5-pro`.

---

## 📨 Sign-Up & Email Verification

VA-AI secures advanced features behind email verification to prevent spam and ensure account ownership:

1. **Sign-up Redirect**: Creating an account triggers an email verification code and logs out the session, redirecting the user to `/sign-in`.
2. **Activation URL**: Clicking the verification link in your inbox routes to the backend Route Handler `/api/auth/confirm?token=...`, confirming the email and updating the database.
3. **Restricted Dashboard Access**: Unverified users can still log in to view basic frames, but see a warning banner at the top of `/dashboard` with a **Resend Link** trigger. Navigating to sub-pages (Spy, Triggers, Integrations, Settings) blocks access and displays a lock screen.
4. **Collision-Free Syncing**: The auth provider profile synchronizer automatically falls back to merging placeholder email records when users log in for the first time, preventing unique constraint violations.
