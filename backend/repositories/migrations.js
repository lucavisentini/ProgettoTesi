export const DEFAULT_SETTINGS = {
  recognitionThreshold: 0.82,
  duplicateWindowMs: 900,
  dispatchEnabled: true,
  maxEvents: 500,
  minBackendScore: 0.55
};

export const DEFAULT_DB = {
  schemaVersion: 2,
  users: [],
  gestures: [],
  actions: [],
  events: []
};

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    recognitionThreshold: Number(settings.recognitionThreshold ?? DEFAULT_SETTINGS.recognitionThreshold),
    duplicateWindowMs: Number(settings.duplicateWindowMs ?? DEFAULT_SETTINGS.duplicateWindowMs),
    minBackendScore: Number(settings.minBackendScore ?? DEFAULT_SETTINGS.minBackendScore),
    dispatchEnabled: settings.dispatchEnabled !== false,
    maxEvents: Number(settings.maxEvents ?? DEFAULT_SETTINGS.maxEvents)
  };
}

export function normalizeData(data = {}) {
  const db = {
    ...DEFAULT_DB,
    ...data
  };

  db.schemaVersion = 2;
  db.users = Array.isArray(db.users) ? db.users : [];
  db.gestures = Array.isArray(db.gestures) ? db.gestures : [];
  db.actions = Array.isArray(db.actions) ? db.actions : [];
  db.events = Array.isArray(db.events) ? db.events : [];

  db.users = db.users.map((user) => ({
    ...user,
    settings: normalizeSettings(user.settings)
  }));

  db.gestures = db.gestures.map((gesture) => {
    const migratedSamples = Array.isArray(gesture.samples)
      ? gesture.samples
      : gesture.sample
        ? [
            {
              id: `${gesture.id}-sample-1`,
              label: "Campione iniziale",
              data: gesture.sample,
              capturedAt: gesture.createdAt || new Date().toISOString()
            }
          ]
        : [];

    return {
      description: "",
      modelType: "static_landmarks",
      ...gesture,
      samples: migratedSamples,
      updatedAt: gesture.updatedAt || gesture.createdAt || new Date().toISOString()
    };
  });

  db.actions = db.actions.map((action) => ({
    description: "",
    integrationType: "generic_http",
    deviceLabel: "",
    ...action,
    enabled: action.enabled !== false,
    cooldownMs: Number(action.cooldownMs ?? 1500)
  }));

  return db;
}

