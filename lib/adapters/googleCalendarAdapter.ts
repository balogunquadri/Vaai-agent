import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("google_calendar", ["gcal_list_events", "gcal_create_event"]);

export default adapter;
