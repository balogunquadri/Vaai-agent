import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("telegram", ["telegram_list_updates", "telegram_send_message"]);

export default adapter;
