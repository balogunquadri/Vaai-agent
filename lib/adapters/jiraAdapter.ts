import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("jira", ["jira_list_issues", "jira_create_issue"]);

export default adapter;
