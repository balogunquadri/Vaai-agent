import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("asana", ["asana_list_tasks", "asana_create_task"]);

export default adapter;
