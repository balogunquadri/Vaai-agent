import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("instagram", ["instagram_get_feed", "instagram_get_messages"]);

export default adapter;
