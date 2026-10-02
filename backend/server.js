import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config/env.js";
import { apiRoutes } from "./routes/apiRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { store } from "./repositories/dataStore.js";

let storeStartupError = null;

store.init().catch((error) => {
  storeStartupError = {
    name: error.name,
    message: error.message,
    code: error.code,
    reason: error.reason
  };

  console.error("Database startup failed:", error);
});

const app = express();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
    return true;
  }

  return config.corsOrigins.some((allowedOrigin) => {
    if (!allowedOrigin.includes("*")) {
      return false;
    }

    const pattern = new RegExp(
      `^${allowedOrigin
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^.]+")}$`
    );
    return pattern.test(origin);
  });
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origine non consentita da CORS: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "gesture-control-backend",
    storage: {
      ...store.getStatus(),
      startupError: storeStartupError
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint non trovato." });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Errore interno del server." });
});

const server = app.listen(config.port, () => {
  console.log(`Gesture Control backend in ascolto su http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`Ricevuto ${signal}. Arresto backend...`);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

