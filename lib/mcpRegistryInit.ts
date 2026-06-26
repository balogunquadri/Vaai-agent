import { registerAdapter } from "./mcpRegistry";
import slackAdapter from "./adapters/slackAdapter";
import notionAdapter from "./adapters/notionAdapter";
import discordAdapter from "./adapters/discordAdapter";
import teamsAdapter from "./adapters/teamsAdapter";
import jiraAdapter from "./adapters/jiraAdapter";
import trelloAdapter from "./adapters/trelloAdapter";
import asanaAdapter from "./adapters/asanaAdapter";
import calendlyAdapter from "./adapters/calendlyAdapter";
import gcalAdapter from "./adapters/googleCalendarAdapter";
import zoomAdapter from "./adapters/zoomAdapter";
import githubAdapter from "./adapters/githubAdapter";
import gdriveAdapter from "./adapters/googleDriveAdapter";
import telegramAdapter from "./adapters/telegram";
import outlookAdapter from "./adapters/outlookAdapter";
import gmailAdapter from "./adapters/gmailAdapter";
import whatsappAdapter from "./adapters/whatsappAdapter";

// Register built-in adapters here. Additional adapters can be registered elsewhere.
registerAdapter("slack", slackAdapter as any);
registerAdapter("notion", notionAdapter as any);
registerAdapter("discord", discordAdapter as any);
registerAdapter("teams", teamsAdapter as any);
registerAdapter("jira", jiraAdapter as any);
registerAdapter("trello", trelloAdapter as any);
registerAdapter("asana", asanaAdapter as any);
registerAdapter("calendly", calendlyAdapter as any);
registerAdapter("google_calendar", gcalAdapter as any);
registerAdapter("zoom", zoomAdapter as any);
registerAdapter("github", githubAdapter as any);
registerAdapter("google_drive", gdriveAdapter as any);
registerAdapter("telegram", telegramAdapter as any);
registerAdapter("outlook", outlookAdapter as any);
registerAdapter("gmail", gmailAdapter as any);
registerAdapter("whatsapp", whatsappAdapter as any);

export default null;
