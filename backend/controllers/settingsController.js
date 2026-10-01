import { store } from "../repositories/dataStore.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

function normalizeSettings(payload, currentSettings = {}) {
  return {
    ...currentSettings,
    recognitionThreshold: clamp(
      payload.recognitionThreshold ?? currentSettings.recognitionThreshold ?? 0.82,
      0.5,
      0.98
    ),
    duplicateWindowMs: Math.round(
      clamp(payload.duplicateWindowMs ?? currentSettings.duplicateWindowMs ?? 900, 250, 10000)
    ),
    minBackendScore: clamp(payload.minBackendScore ?? currentSettings.minBackendScore ?? 0.55, 0, 1),
    dispatchEnabled: payload.dispatchEnabled !== false,
    maxEvents: Math.round(clamp(payload.maxEvents ?? currentSettings.maxEvents ?? 500, 50, 2000))
  };
}

export async function getSettings(req, res, next) {
  try {
    const db = await store.read();
    const user = db.users.find((item) => item.id === req.user.id);
    return res.json({ settings: user.settings });
  } catch (error) {
    return next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await store.update((db) => {
      const user = db.users.find((item) => item.id === req.user.id);
      user.settings = normalizeSettings(req.body, user.settings);
      return user.settings;
    });

    return res.json({ settings });
  } catch (error) {
    return next(error);
  }
}

