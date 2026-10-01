import { store } from "../repositories/dataStore.js";

await store.init();
const db = await store.read();

console.log("Database connection OK");
console.log(JSON.stringify(store.getStatus(), null, 2));
console.log(
  JSON.stringify(
    {
      users: db.users.length,
      gestures: db.gestures.length,
      actions: db.actions.length,
      events: db.events.length
    },
    null,
    2
  )
);

await store.close();

