import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("github", ["github_list_repos", "github_create_issue"]);

export default adapter;
