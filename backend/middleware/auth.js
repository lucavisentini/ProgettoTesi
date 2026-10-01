import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { store } from "../repositories/dataStore.js";

export async function requireAuth(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token mancante." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const db = await store.read();
    const user = db.users.find((item) => item.id === payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Utente non trovato." });
    }

    req.user = { id: user.id, username: user.username };
    return next();
  } catch {
    return res.status(401).json({ message: "Token non valido o scaduto." });
  }
}

