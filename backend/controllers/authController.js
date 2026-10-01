import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "../config/env.js";
import { store } from "../repositories/dataStore.js";

const normalizeUsername = (username = "") => username.trim().toLowerCase();

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  createdAt: user.createdAt
});

const signToken = (user) =>
  jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.tokenExpiresIn
  });

export async function register(req, res, next) {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");

    if (username.length < 3) {
      return res.status(400).json({ message: "Username troppo corto." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "La password deve avere almeno 8 caratteri." });
    }

    const result = await store.update(async (db) => {
      if (db.users.some((user) => user.username === username)) {
        return { conflict: true };
      }

      const user = {
        id: nanoid(),
        username,
        passwordHash: await bcrypt.hash(password, 12),
        createdAt: new Date().toISOString()
      };

      db.users.push(user);
      return { user };
    });

    if (result.conflict) {
      return res.status(409).json({ message: "Username gia registrato." });
    }

    return res.status(201).json({
      user: publicUser(result.user),
      token: signToken(result.user)
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || "");
    const db = await store.read();
    const user = db.users.find((item) => item.username === username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Credenziali non valide." });
    }

    return res.json({
      user: publicUser(user),
      token: signToken(user)
    });
  } catch (error) {
    return next(error);
  }
}

export function me(req, res) {
  return res.json({ user: req.user });
}

