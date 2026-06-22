import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("outlook", ["outlook_list_messages", "outlook_send_message"]);

export default adapter;
