import { store } from "../repositories/dataStore.js";
import { listUserEvents } from "../services/eventLog.js";

export async function listEvents(req, res, next) {
  try {
    const db = await store.read();
    return res.json({ events: listUserEvents(db, req.user.id, req.query.limit) });
  } catch (error) {
    return next(error);
  }
}

export async function clearEvents(req, res, next) {
  try {
    await store.update((db) => {
      db.events = db.events.filter((event) => event.userId !== req.user.id);
      return null;
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

