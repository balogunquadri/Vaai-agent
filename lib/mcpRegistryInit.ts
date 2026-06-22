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
import telegramAdapter from "./adapters/telegramAdapter";
import outlookAdapter from "./adapters/outlookAdapter";

// Register built-in adapters here. Additional adapters can be registered elsewhere.
registerAdapter("slack", slackAdapter);
registerAdapter("notion", notionAdapter);
registerAdapter("discord", discordAdapter);
registerAdapter("teams", teamsAdapter);
registerAdapter("jira", jiraAdapter);
registerAdapter("trello", trelloAdapter);
registerAdapter("asana", asanaAdapter);
registerAdapter("calendly", calendlyAdapter);
registerAdapter("google_calendar", gcalAdapter);
registerAdapter("zoom", zoomAdapter);
registerAdapter("github", githubAdapter);
registerAdapter("google_drive", gdriveAdapter);
registerAdapter("telegram", telegramAdapter);
registerAdapter("outlook", outlookAdapter);

export default null;
