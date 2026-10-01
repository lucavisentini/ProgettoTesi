import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_DB, normalizeData } from "./migrations.js";

export const defaultJsonPath = path.join(process.cwd(), "data", "db.json");

export class JsonStore {
  constructor(filePath = defaultJsonPath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await access(this.filePath);
    } catch {
      await writeFile(this.filePath, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
    }
  }

  async read() {
    await this.init();
    await this.writeQueue;
    const raw = await readFile(this.filePath, "utf8");
    return normalizeData(JSON.parse(raw));
  }

  async write(data) {
    await this.init();
    const normalized = normalizeData(data);

    this.writeQueue = this.writeQueue.then(() =>
      writeFile(this.filePath, JSON.stringify(normalized, null, 2), "utf8")
    );
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
      provider: "json",
      connected: true,
      path: this.filePath
    };
  }

  async close() {}
}

