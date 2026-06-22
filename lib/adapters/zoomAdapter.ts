import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("zoom", ["zoom_list_meetings", "zoom_create_meeting"]);

export default adapter;
