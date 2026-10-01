import { nanoid } from "nanoid";

const EVENT_LIMIT_FALLBACK = 500;

export function appendEvent(db, userId, event) {
  const user = db.users.find((item) => item.id === userId);
  const maxEvents = Math.max(50, Number(user?.settings?.maxEvents || EVENT_LIMIT_FALLBACK));

  db.events.unshift({
    id: nanoid(),
    userId,
    createdAt: new Date().toISOString(),
    type: event.type || "system",
    severity: event.severity || "info",
    source: event.source || "backend",
    message: event.message || "",
    metadata: event.metadata || {}
  });

  db.events = db.events.slice(0, maxEvents);
}

export function listUserEvents(db, userId, limit = 100) {
  return db.events
    .filter((event) => event.userId === userId)
    .slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
}

