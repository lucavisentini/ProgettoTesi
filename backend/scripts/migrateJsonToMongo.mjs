import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "../repositories/jsonStore.js";
import { MongoStore } from "../repositories/mongoStore.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

const mongodbUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || "gesture_control";
const sourcePath = process.env.JSON_DB_PATH
  ? path.resolve(process.env.JSON_DB_PATH)
  : path.join(backendRoot, "data", "db.json");

if (!mongodbUri) {
  console.error("MONGODB_URI mancante. Inseriscila in backend/.env prima della migrazione.");
  process.exit(1);
}

const source = new JsonStore(sourcePath);
const target = new MongoStore({ uri: mongodbUri, databaseName });

const data = await source.read();
await target.write(data);

console.log("Migrazione JSON -> MongoDB completata.");
console.log(
  JSON.stringify(
    {
      database: databaseName,
      users: data.users.length,
      gestures: data.gestures.length,
      actions: data.actions.length,
      events: data.events.length
    },
    null,
    2
  )
);

await target.close();

