import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("google_drive", ["gdrive_list_files", "gdrive_get_file"]);

export default adapter;
