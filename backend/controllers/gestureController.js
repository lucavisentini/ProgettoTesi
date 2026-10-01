import { nanoid } from "nanoid";
import { store } from "../repositories/dataStore.js";
import { appendEvent } from "../services/eventLog.js";

const isValidSample = (sample) =>
  Array.isArray(sample) && sample.length >= 21 * 3 && sample.every((value) => Number.isFinite(value));

function normalizeSample(sample, label = "") {
  if (!isValidSample(sample)) {
    throw new Error("Campione landmark non valido.");
  }

  return {
    id: nanoid(),
    label: String(label || "Campione").trim(),
    data: sample,
    capturedAt: new Date().toISOString()
  };
}

export async function listGestures(req, res, next) {
  try {
    const db = await store.read();
    const gestures = db.gestures
      .filter((gesture) => gesture.userId === req.user.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ gestures });
  } catch (error) {
    return next(error);
  }
}

export async function createGesture(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const samples = Array.isArray(req.body.samples)
      ? req.body.samples.map((sample, index) => normalizeSample(sample, `Campione ${index + 1}`))
      : [normalizeSample(req.body.sample, "Campione iniziale")];

    if (!name) {
      return res.status(400).json({ message: "Nome gesture obbligatorio." });
    }

    if (samples.length === 0) {
      return res.status(400).json({ message: "Almeno un campione landmark e obbligatorio." });
    }

    const gesture = {
      id: nanoid(),
      userId: req.user.id,
      name,
      description,
      modelType: "static_landmarks",
      sample: samples[0].data,
      samples,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await store.update((db) => {
      db.gestures.push(gesture);
      appendEvent(db, req.user.id, {
        type: "gesture.created",
        source: "gesture-manager",
        message: `Gesture "${gesture.name}" registrata.`,
        metadata: { gestureId: gesture.id, samples: gesture.samples.length }
      });
      return gesture;
    });

    return res.status(201).json({ gesture });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function updateGesture(req, res, next) {
  try {
    const { id } = req.params;
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Nome gesture obbligatorio." });
    }

    const result = await store.update((db) => {
      const gesture = db.gestures.find((item) => item.id === id && item.userId === req.user.id);

      if (!gesture) {
        return { missing: true };
      }

      gesture.name = name;
      gesture.description = description;
      gesture.updatedAt = new Date().toISOString();

      appendEvent(db, req.user.id, {
        type: "gesture.updated",
        source: "gesture-manager",
        message: `Gesture "${gesture.name}" aggiornata.`,
        metadata: { gestureId: gesture.id }
      });

      return { gesture };
    });

    if (result.missing) {
      return res.status(404).json({ message: "Gesture non trovata." });
    }

    return res.json({ gesture: result.gesture });
  } catch (error) {
    return next(error);
  }
}

export async function addGestureSample(req, res, next) {
  try {
    const { id } = req.params;
    const sample = normalizeSample(req.body.sample, req.body.label);

    const result = await store.update((db) => {
      const gesture = db.gestures.find((item) => item.id === id && item.userId === req.user.id);

      if (!gesture) {
        return { missing: true };
      }

      gesture.samples = [...(gesture.samples || []), sample].slice(-12);
      gesture.sample = gesture.samples[0]?.data || sample.data;
      gesture.updatedAt = new Date().toISOString();

      appendEvent(db, req.user.id, {
        type: "gesture.sample_added",
        source: "gesture-manager",
        message: `Nuovo campione aggiunto a "${gesture.name}".`,
        metadata: { gestureId: gesture.id, sampleId: sample.id, samples: gesture.samples.length }
      });

      return { gesture };
    });

    if (result.missing) {
      return res.status(404).json({ message: "Gesture non trovata." });
    }

    return res.status(201).json({ gesture: result.gesture, sample });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function deleteGesture(req, res, next) {
  try {
    const { id } = req.params;

    await store.update((db) => {
      const gesture = db.gestures.find((item) => item.userId === req.user.id && item.id === id);
      db.gestures = db.gestures.filter(
        (gesture) => !(gesture.userId === req.user.id && gesture.id === id)
      );
      db.actions = db.actions.filter(
        (action) => !(action.userId === req.user.id && action.gestureId === id)
      );
      appendEvent(db, req.user.id, {
        type: "gesture.deleted",
        severity: "warning",
        source: "gesture-manager",
        message: `Gesture "${gesture?.name || id}" eliminata.`,
        metadata: { gestureId: id }
      });
      return null;
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

