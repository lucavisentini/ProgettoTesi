import { nanoid } from "nanoid";
import { store } from "../repositories/dataStore.js";
import { appendEvent } from "../services/eventLog.js";
import { dispatchHttpAction } from "../services/httpDispatcher.js";

const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

function normalizeHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (typeof headers !== "object" || Array.isArray(headers)) {
    throw new Error("Headers non validi.");
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key), String(value)])
  );
}

function normalizeActionPayload(payload) {
  const method = String(payload.method || "POST").toUpperCase();
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const deviceLabel = String(payload.deviceLabel || "").trim();
  const integrationType = String(payload.integrationType || "generic_http").trim();
  const url = String(payload.url || "").trim();
  const gestureId = String(payload.gestureId || "").trim();

  if (!name) {
    throw new Error("Nome azione obbligatorio.");
  }

  if (!gestureId) {
    throw new Error("Gesture obbligatoria.");
  }

  if (!METHODS.has(method)) {
    throw new Error("Metodo HTTP non supportato.");
  }

  if (!url) {
    throw new Error("URL comando obbligatorio.");
  }

  return {
    name,
    description,
    deviceLabel,
    integrationType,
    gestureId,
    method,
    url,
    headers: normalizeHeaders(payload.headers),
    body: payload.body ?? "",
    cooldownMs: Math.max(0, Number(payload.cooldownMs || 1500)),
    minScore: Math.max(0, Math.min(1, Number(payload.minScore ?? 0))),
    enabled: payload.enabled !== false
  };
}

function visibleAction(action, gestures) {
  const gesture = gestures.find((item) => item.id === action.gestureId);

  return {
    ...action,
    gestureName: gesture?.name || "Gesture rimossa"
  };
}

async function runAction(action, context = {}) {
  try {
    const result = await dispatchHttpAction(action, context);
    return {
      actionId: action.id,
      actionName: action.name,
      integrationType: action.integrationType,
      dispatched: true,
      ...result
    };
  } catch (error) {
    return {
      actionId: action.id,
      actionName: action.name,
      integrationType: action.integrationType,
      dispatched: false,
      ok: false,
      error: error.message
    };
  }
}

export async function listActions(req, res, next) {
  try {
    const db = await store.read();
    const gestures = db.gestures.filter((gesture) => gesture.userId === req.user.id);
    const actions = db.actions
      .filter((action) => action.userId === req.user.id)
      .map((action) => visibleAction(action, gestures))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ actions });
  } catch (error) {
    return next(error);
  }
}

export async function createAction(req, res, next) {
  try {
    const normalized = normalizeActionPayload(req.body);

    const result = await store.update((db) => {
      const gesture = db.gestures.find(
        (item) => item.id === normalized.gestureId && item.userId === req.user.id
      );

      if (!gesture) {
        return { missingGesture: true };
      }

      const action = {
        id: nanoid(),
        userId: req.user.id,
        ...normalized,
        lastTriggeredAt: null,
        lastResult: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.actions.push(action);
      appendEvent(db, req.user.id, {
        type: "action.created",
        source: "device-mapper",
        message: `Azione "${action.name}" creata.`,
        metadata: { actionId: action.id, gestureId: action.gestureId }
      });
      return { action };
    });

    if (result.missingGesture) {
      return res.status(400).json({ message: "Gesture non trovata." });
    }

    return res.status(201).json({ action: result.action });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function updateAction(req, res, next) {
  try {
    const normalized = normalizeActionPayload(req.body);
    const { id } = req.params;

    const result = await store.update((db) => {
      const action = db.actions.find((item) => item.id === id && item.userId === req.user.id);
      const gesture = db.gestures.find(
        (item) => item.id === normalized.gestureId && item.userId === req.user.id
      );

      if (!action) {
        return { missingAction: true };
      }

      if (!gesture) {
        return { missingGesture: true };
      }

      Object.assign(action, normalized, { updatedAt: new Date().toISOString() });
      appendEvent(db, req.user.id, {
        type: "action.updated",
        source: "device-mapper",
        message: `Azione "${action.name}" aggiornata.`,
        metadata: { actionId: action.id, gestureId: action.gestureId }
      });
      return { action };
    });

    if (result.missingAction) {
      return res.status(404).json({ message: "Azione non trovata." });
    }

    if (result.missingGesture) {
      return res.status(400).json({ message: "Gesture non trovata." });
    }

    return res.json({ action: result.action });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function deleteAction(req, res, next) {
  try {
    const { id } = req.params;

    await store.update((db) => {
      const action = db.actions.find((item) => item.id === id && item.userId === req.user.id);
      db.actions = db.actions.filter((action) => !(action.id === id && action.userId === req.user.id));
      appendEvent(db, req.user.id, {
        type: "action.deleted",
        severity: "warning",
        source: "device-mapper",
        message: `Azione "${action?.name || id}" eliminata.`,
        metadata: { actionId: id }
      });
      return null;
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function triggerAction(req, res, next) {
  try {
    const db = await store.read();
    const action = db.actions.find(
      (item) => item.id === req.params.id && item.userId === req.user.id
    );

    if (!action) {
      return res.status(404).json({ message: "Azione non trovata." });
    }

    const gesture = db.gestures.find(
      (item) => item.id === action.gestureId && item.userId === req.user.id
    );
    const outcome = await runAction(action, {
      user: req.user,
      action,
      gesture,
      score: 1,
      source: "manual",
      timestamp: new Date().toISOString()
    });

    await store.update((latestDb) => {
      const latestAction = latestDb.actions.find((item) => item.id === action.id);
      if (latestAction) {
        latestAction.lastTriggeredAt = new Date().toISOString();
        latestAction.lastResult = outcome;
      }

      appendEvent(latestDb, req.user.id, {
        type: outcome.ok ? "action.dispatched" : "action.failed",
        severity: outcome.ok ? "success" : "error",
        source: "manual-trigger",
        message: outcome.ok
          ? `Azione "${action.name}" inviata manualmente.`
          : `Invio manuale di "${action.name}" non riuscito.`,
        metadata: { actionId: action.id, gestureId: action.gestureId, outcome }
      });
      return null;
    });

    return res.json({ outcomes: [outcome] });
  } catch (error) {
    return next(error);
  }
}

export async function handleGestureEvent(req, res, next) {
  try {
    const gestureId = String(req.body.gestureId || "").trim();
    const score = Number(req.body.score || 0);

    if (!gestureId) {
      return res.status(400).json({ message: "gestureId obbligatorio." });
    }

    const db = await store.read();
    const gesture = db.gestures.find(
      (item) => item.id === gestureId && item.userId === req.user.id
    );

    if (!gesture) {
      return res.status(404).json({ message: "Gesture non trovata." });
    }

    const user = db.users.find((item) => item.id === req.user.id);
    const settings = user?.settings || {};
    const minBackendScore = Number(settings.minBackendScore ?? 0);

    if (score < minBackendScore) {
      await store.update((latestDb) => {
        appendEvent(latestDb, req.user.id, {
          type: "gesture.rejected",
          severity: "warning",
          source: "recognizer",
          message: `Gesture "${gesture.name}" sotto soglia backend.`,
          metadata: { gestureId, score, minBackendScore }
        });
        return null;
      });

      return res.json({
        outcomes: [],
        message: "Gesture ricevuta ma scartata per punteggio insufficiente."
      });
    }

    const actions = db.actions.filter(
      (action) =>
        action.userId === req.user.id &&
        action.gestureId === gestureId &&
        action.enabled !== false &&
        score >= Number(action.minScore || 0)
    );

    if (actions.length === 0) {
      await store.update((latestDb) => {
        appendEvent(latestDb, req.user.id, {
          type: "gesture.detected",
          source: "recognizer",
          message: `Gesture "${gesture.name}" riconosciuta senza azioni attive.`,
          metadata: { gestureId, score }
        });
        return null;
      });
      return res.json({ outcomes: [], message: "Nessuna azione associata alla gesture." });
    }

    const now = Date.now();
    const dueActions = actions.filter((action) => {
      if (!action.lastTriggeredAt || !action.cooldownMs) {
        return true;
      }

      return now - new Date(action.lastTriggeredAt).getTime() >= action.cooldownMs;
    });

    const skipped = actions
      .filter((action) => !dueActions.includes(action))
      .map((action) => ({
        actionId: action.id,
        actionName: action.name,
        dispatched: false,
        skipped: true,
        reason: "cooldown"
      }));

    const dispatched = [];
    const timestamp = new Date().toISOString();

    for (const action of dueActions) {
      dispatched.push(
        await runAction(action, {
          user: req.user,
          action,
          gesture,
          score,
          source: "gesture",
          timestamp
        })
      );
    }

    await store.update((latestDb) => {
      for (const outcome of dispatched) {
        const action = latestDb.actions.find(
          (item) => item.id === outcome.actionId && item.userId === req.user.id
        );

        if (action) {
          action.lastTriggeredAt = new Date().toISOString();
          action.lastResult = { ...outcome, score };
        }

        appendEvent(latestDb, req.user.id, {
          type: outcome.ok ? "action.dispatched" : "action.failed",
          severity: outcome.ok ? "success" : "error",
          source: "gesture-dispatch",
          message: outcome.ok
            ? `Gesture "${gesture.name}" ha inviato "${outcome.actionName}".`
            : `Gesture "${gesture.name}" non ha completato "${outcome.actionName}".`,
          metadata: { gestureId, score, outcome }
        });
      }

      for (const outcome of skipped) {
        appendEvent(latestDb, req.user.id, {
          type: "action.skipped",
          severity: "warning",
          source: "gesture-dispatch",
          message: `Azione "${outcome.actionName}" saltata per cooldown.`,
          metadata: { gestureId, score, outcome }
        });
      }

      return null;
    });

    return res.json({ outcomes: [...dispatched, ...skipped] });
  } catch (error) {
    return next(error);
  }
}

