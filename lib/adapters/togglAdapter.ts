import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("toggl", ["toggl_start_timer", "toggl_stop_timer"]);

export default adapter;
