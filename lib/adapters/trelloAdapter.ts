import createStubAdapter from "./stubAdapterFactory";

const adapter = createStubAdapter("trello", ["trello_list_cards", "trello_create_card"]);

export default adapter;
