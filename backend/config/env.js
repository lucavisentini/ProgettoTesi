import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

const splitList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  tokenExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigins: splitList(process.env.CORS_ORIGIN || "http://localhost:5173"),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 6000),
  trustProxy: process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 600),
  allowedTargetHosts: splitList(process.env.ALLOWED_TARGET_HOSTS),
  dataStore: (process.env.DATA_STORE || (process.env.MONGODB_URI ? "mongodb" : "json")).toLowerCase(),
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDatabase: process.env.MONGODB_DATABASE || "gesture_control",
  jsonDbPath: process.env.JSON_DB_PATH || path.join(process.cwd(), "data", "db.json")
};

