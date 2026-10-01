import { MongoClient, ServerApiVersion } from "mongodb";
import { normalizeData } from "./migrations.js";

const COLLECTIONS = {
  users: "users",
  gestures: "gestures",
  actions: "actions",
  events: "events"
};

function stripMongoId(document) {
  if (!document) {
    return document;
  }

  const { _id, ...rest } = document;
  return rest;
}

function cloneForMongo(value) {
  return JSON.parse(JSON.stringify(value));
}

function getConnectionLabel(uri) {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "mongodb";
  }
}

export class MongoStore {
  constructor({ uri, databaseName = "gesture_control" }) {
    this.uri = uri;
    this.databaseName = databaseName;
    this.client = null;
    this.db = null;
    this.collections = null;
    this.writeQueue = Promise.resolve();
    this.connected = false;
    this.initPromise = null;
  }

  async init() {
    if (!this.uri) {
      throw new Error("MONGODB_URI mancante. Configura una connection string MongoDB oppure usa DATA_STORE=json.");
    }

    if (this.connected) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.connect();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  async connect() {
    this.client = new MongoClient(this.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true
      }
    });

    await this.client.connect();
    await this.client.db("admin").command({ ping: 1 });

    this.db = this.client.db(this.databaseName);
    this.collections = Object.fromEntries(
      Object.entries(COLLECTIONS).map(([key, name]) => [key, this.db.collection(name)])
    );

    await this.ensureIndexes();
    this.connected = true;
  }

  async ensureIndexes() {
    await Promise.all([
      this.collections.users.createIndex({ id: 1 }, { unique: true }),
      this.collections.users.createIndex({ username: 1 }, { unique: true }),
      this.collections.gestures.createIndex({ id: 1 }, { unique: true }),
      this.collections.gestures.createIndex({ userId: 1, name: 1 }),
      this.collections.actions.createIndex({ id: 1 }, { unique: true }),
      this.collections.actions.createIndex({ userId: 1, gestureId: 1 }),
      this.collections.events.createIndex({ id: 1 }, { unique: true }),
      this.collections.events.createIndex({ userId: 1, createdAt: -1 })
    ]);
  }

  async readCollection(name, sort = {}) {
    await this.init();
    return this.collections[name].find({}).sort(sort).toArray().then((items) => items.map(stripMongoId));
  }

  async read() {
    await this.writeQueue;

    const [users, gestures, actions, events] = await Promise.all([
      this.readCollection("users"),
      this.readCollection("gestures"),
      this.readCollection("actions"),
      this.readCollection("events", { createdAt: -1 })
    ]);

    return normalizeData({ users, gestures, actions, events });
  }

  async replaceCollection(name, items) {
    const collection = this.collections[name];
    await collection.deleteMany({});

    if (items.length > 0) {
      await collection.insertMany(items.map(cloneForMongo), { ordered: true });
    }
  }

  async write(data) {
    await this.init();
    const normalized = normalizeData(data);

    this.writeQueue = this.writeQueue.then(async () => {
      await this.replaceCollection("users", normalized.users);
      await this.replaceCollection("gestures", normalized.gestures);
      await this.replaceCollection("actions", normalized.actions);
      await this.replaceCollection("events", normalized.events);
    });

    await this.writeQueue;
    return normalized;
  }

  async update(mutator) {
    const data = await this.read();
    const result = await mutator(data);
    await this.write(data);
    return result;
  }

  getStatus() {
    return {
      provider: "mongodb",
      connected: this.connected,
      database: this.databaseName,
      target: getConnectionLabel(this.uri)
    };
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }

    this.connected = false;
    this.initPromise = null;
  }
}

