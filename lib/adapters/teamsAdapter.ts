import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("teams", ["teams_list_channels", "teams_post_message"]);

export default adapter;
