import { getSimulatedFeed } from "../simulatedFeeds";
import tokenManager from "../tokenManager";

export function createStubAdapter(platformId: string, extraTools: string[] = []) {
  return {
    platform: platformId,
    // Support both positional signature (userId, limit, userState) and object signature ({ userId, limit })
    async getRecentItems(userIdOrOpts: any, limitParam?: number, _userState?: any) {
      let userId: string | undefined;
      let limit = limitParam ?? 20;
      if (userIdOrOpts && typeof userIdOrOpts === 'object' && (userIdOrOpts.userId || userIdOrOpts.limit !== undefined)) {
        userId = userIdOrOpts.userId;
        limit = userIdOrOpts.limit ?? limit;
      } else {
        userId = userIdOrOpts;
      }

      // Attempt to refresh tokens for this user/platform before returning items
      try {
        if (userId) await tokenManager.refreshAndSaveIntegration(userId, platformId);
      } catch (err) {
        // non-fatal
        console.error("stubAdapterFactory: refresh failed", platformId, err);
      }
      const all = getSimulatedFeed(platformId);
      return all.slice(0, limit);
    },
    // Execute tool supports either object-style `({ tool, params, userId })`
    // or positional `(userId, toolName, args, userState)` signatures.
    async executeTool(userIdOrOpts: any, toolName?: string, args?: any, _userState?: any) {
      let userId: string | undefined;
      let tool: string;
      let params: any;

      if (userIdOrOpts && typeof userIdOrOpts === 'object' && (userIdOrOpts.tool || userIdOrOpts.params || userIdOrOpts.userId)) {
        tool = userIdOrOpts.tool;
        params = userIdOrOpts.params;
        userId = userIdOrOpts.userId;
      } else {
        userId = userIdOrOpts;
        tool = toolName as string;
        params = args;
      }

      // Attempt token refresh for authenticated calls
      try {
        if (userId) await tokenManager.refreshAndSaveIntegration(userId, platformId);
      } catch (err) {
        console.error("stubAdapterFactory: refresh failed before execute", platformId, err);
      }

      // Basic simulated responses per common action names
      if (tool === "list" || (tool && tool.endsWith && tool.endsWith("_list")) || (tool && tool.includes && tool.includes("channels")) || (tool && tool.includes && tool.includes("repos"))) {
        return { ok: true, items: getSimulatedFeed(platformId).slice(0, 10) };
      }
      if (tool === "post" || (tool && tool.includes && tool.includes("message")) || (tool && tool.includes && tool.includes("create")) || (tool && tool.includes && tool.includes("comment"))) {
        return { ok: true, id: `${platformId}_sim_${Date.now()}`, status: "posted", params };
      }
      if (tool === "get" || (tool && tool.includes && tool.includes("get_page")) || (tool && tool.includes && tool.includes("fetch"))) {
        const items = getSimulatedFeed(platformId);
        return { ok: true, item: items[0] || null };
      }
      // Default stub
      return { ok: true, tool, params, note: "simulated" };
    },
    async getToolSchemas(userId: string) {
      const schemas: any[] = [];
      switch (platformId) {
        case "github":
          schemas.push(
            {
              name: "github_list_repos",
              description: "List the authenticated user's GitHub repositories.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "github_create_issue",
              description: "Create a bug report/ticket issue in a specific GitHub repository.",
              parameters: {
                type: "OBJECT",
                properties: {
                  repo: { type: "STRING", description: "The full repository path name (e.g. 'owner/repo')." },
                  title: { type: "STRING", description: "The issue title." }
                },
                required: ["repo", "title"]
              }
            },
            {
              name: "github_get_pull_requests",
              description: "Get pull requests for a specific GitHub repository.",
              parameters: {
                type: "OBJECT",
                properties: {
                  repo: { type: "STRING", description: "The full repository path name (e.g. 'owner/repo')." }
                },
                required: ["repo"]
              }
            }
          );
          break;

        case "discord":
          schemas.push({
            name: "discord_post_message",
            description: "Post a notification message to a Discord channel.",
            parameters: {
              type: "OBJECT",
              properties: {
                channelId: { type: "STRING", description: "Discord channel ID." },
                content: { type: "STRING", description: "Content message body." }
              },
              required: ["channelId", "content"]
            }
          });
          break;

        case "outlook":
          schemas.push(
            {
              name: "outlook_list_messages",
              description: "Fetch a list of recent emails in the user's Outlook inbox.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "outlook_send_message",
              description: "Send an email message to a recipient via Outlook.",
              parameters: {
                type: "OBJECT",
                properties: {
                  to: { type: "STRING", description: "Recipient email address." },
                  subject: { type: "STRING", description: "Subject of the email." },
                  body: { type: "STRING", description: "Body content of the email." }
                },
                required: ["to", "body"]
              }
            }
          );
          break;

        case "linkedin":
          schemas.push({
            name: "linkedin_post_update",
            description: "Publish an update to the user's LinkedIn feed.",
            parameters: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING", description: "Update text content." }
              },
              required: ["text"]
            }
          });
          break;

        case "jira":
          schemas.push(
            {
              name: "jira_get_issue",
              description: "Retrieve details of a specific Jira issue.",
              parameters: {
                type: "OBJECT",
                properties: {
                  issueKey: { type: "STRING", description: "Jira issue key (e.g., 'PROJ-123')." }
                },
                required: ["issueKey"]
              }
            },
            {
              name: "jira_create_issue",
              description: "Create a new Jira ticket/issue.",
              parameters: {
                type: "OBJECT",
                properties: {
                  projectKey: { type: "STRING", description: "Project identifier key." },
                  summary: { type: "STRING", description: "Jira ticket summary title." },
                  description: { type: "STRING", description: "Detailed description of the issue." }
                },
                required: ["projectKey", "summary"]
              }
            }
          );
          break;

        case "trello":
          schemas.push(
            {
              name: "trello_get_boards",
              description: "Retrieve the authenticated user's Trello boards.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "trello_create_card",
              description: "Create a card on a Trello board.",
              parameters: {
                type: "OBJECT",
                properties: {
                  boardId: { type: "STRING", description: "Target Trello board ID." },
                  name: { type: "STRING", description: "Card name title." },
                  desc: { type: "STRING", description: "Card description text." }
                },
                required: ["name"]
              }
            }
          );
          break;

        case "asana":
          schemas.push(
            {
              name: "asana_get_tasks",
              description: "Retrieve tasks list from Asana.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "asana_create_task",
              description: "Create a new task in Asana.",
              parameters: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "Task name." }
                },
                required: ["name"]
              }
            }
          );
          break;

        case "zoom":
          schemas.push({
            name: "zoom_create_meeting",
            description: "Create a Zoom meeting link.",
            parameters: {
              type: "OBJECT",
              properties: {
                topic: { type: "STRING", description: "Zoom meeting topic." },
                duration: { type: "INTEGER", description: "Meeting duration in minutes." }
              },
              required: ["topic"]
            }
          });
          break;

        case "google_calendar":
          schemas.push(
            {
              name: "gcal_list_events",
              description: "List scheduled Google Calendar events.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "gcal_create_event",
              description: "Create a new Google Calendar meeting/event.",
              parameters: {
                type: "OBJECT",
                properties: {
                  summary: { type: "STRING", description: "Event title." },
                  calendarId: { type: "STRING", description: "Calendar identifier (default 'primary')." }
                },
                required: ["summary"]
              }
            }
          );
          break;

        case "google_drive":
          schemas.push(
            {
              name: "gdrive_search_files",
              description: "Search for files inside Google Drive.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "gdrive_download_file",
              description: "Download a file by ID from Google Drive.",
              parameters: {
                type: "OBJECT",
                properties: {
                  fileId: { type: "STRING", description: "The Google Drive file ID." }
                },
                required: ["fileId"]
              }
            }
          );
          break;

        case "teams":
          schemas.push(
            {
              name: "teams_list_channels",
              description: "List all channels in Microsoft Teams workspace.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "teams_send_message",
              description: "Send a message to a specific Microsoft Teams channel.",
              parameters: {
                type: "OBJECT",
                properties: {
                  channelId: { type: "STRING", description: "Teams channel ID." },
                  text: { type: "STRING", description: "Message text." }
                },
                required: ["channelId", "text"]
              }
            }
          );
          break;

        case "lark":
          schemas.push(
            {
              name: "lark_get_chat_history",
              description: "Get recent chat history from Lark.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "lark_send_message",
              description: "Send a message to a Lark channel/chat.",
              parameters: {
                type: "OBJECT",
                properties: {
                  chatId: { type: "STRING", description: "Lark chat ID." },
                  text: { type: "STRING", description: "Message text." }
                },
                required: ["chatId", "text"]
              }
            }
          );
          break;

        case "instagram":
          schemas.push(
            {
              name: "instagram_get_feed",
              description: "Get user's recent Instagram media feed.",
              parameters: { type: "OBJECT", properties: {} }
            },
            {
              name: "instagram_get_messages",
              description: "Get direct messages from Instagram.",
              parameters: { type: "OBJECT", properties: {} }
            }
          );
          break;

        case "zapier":
          schemas.push({
            name: "zapier_trigger_zap",
            description: "Trigger a Zap workflow by Zap ID.",
            parameters: {
              type: "OBJECT",
              properties: {
                zapId: { type: "STRING", description: "The target Zap trigger ID." },
                payload: { type: "OBJECT", description: "Optional trigger data/metadata configuration payload." }
              },
              required: ["zapId"]
            }
          });
          break;

        case "tango":
          schemas.push({
            name: "tango_get_workflows",
            description: "Get list of documentation workflows from Tango.",
            parameters: { type: "OBJECT", properties: {} }
          });
          break;

        case "toggl":
          schemas.push(
            {
              name: "toggl_start_timer",
              description: "Start a toggl time tracking timer.",
              parameters: {
                type: "OBJECT",
                properties: {
                  description: { type: "STRING", description: "Description for the tracked task." }
                },
                required: ["description"]
              }
            },
            {
              name: "toggl_stop_timer",
              description: "Stop the active toggl timer session.",
              parameters: {
                type: "OBJECT",
                properties: {
                  id: { type: "INTEGER", description: "Active time tracking timer ID." }
                },
                required: ["id"]
              }
            }
          );
          break;

        case "calendly":
          schemas.push({
            name: "calendly_get_events",
            description: "Retrieve list of Calendly meeting events.",
            parameters: { type: "OBJECT", properties: {} }
          });
          break;
      }
      return schemas;
    }
  };
}

export default createStubAdapter;
