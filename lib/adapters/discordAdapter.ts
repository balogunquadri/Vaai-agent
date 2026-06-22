import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("discord", ["discord_list_channels", "discord_post_message"]);

export default adapter;
