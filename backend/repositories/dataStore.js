import { config } from "../config/env.js";
import { JsonStore } from "./jsonStore.js";
import { MongoStore } from "./mongoStore.js";

function createStore() {
  if (config.dataStore === "mongodb") {
    return new MongoStore({
      uri: config.mongodbUri,
      databaseName: config.mongodbDatabase
    });
  }

  return new JsonStore(config.jsonDbPath);
}

export const store = createStore();

