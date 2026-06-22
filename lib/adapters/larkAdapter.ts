import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("lark", ["lark_get_chat_history", "lark_send_message"]);

export default adapter;
