import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("calendly", ["calendly_list_events", "calendly_create_event"]);

export default adapter;
