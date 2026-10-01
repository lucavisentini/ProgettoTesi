const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const TOKEN_KEY = "gesture_control_token";

let authToken = localStorage.getItem(TOKEN_KEY);

export function getAuthToken() {
  return authToken;
}

export function setAuthToken(token) {
  authToken = token;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Richiesta non riuscita.");
  }

  return payload;
}

export const api = {
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  register: (credentials) => request("/auth/register", { method: "POST", body: credentials }),
  me: () => request("/auth/me"),
  listGestures: () => request("/gestures"),
  createGesture: (gesture) => request("/gestures", { method: "POST", body: gesture }),
  updateGesture: (id, gesture) => request(`/gestures/${id}`, { method: "PUT", body: gesture }),
  addGestureSample: (id, sample) =>
    request(`/gestures/${id}/samples`, { method: "POST", body: sample }),
  deleteGesture: (id) => request(`/gestures/${id}`, { method: "DELETE" }),
  listActions: () => request("/actions"),
  createAction: (action) => request("/actions", { method: "POST", body: action }),
  updateAction: (id, action) => request(`/actions/${id}`, { method: "PUT", body: action }),
  deleteAction: (id) => request(`/actions/${id}`, { method: "DELETE" }),
  triggerAction: (id) => request(`/actions/${id}/trigger`, { method: "POST" }),
  emitGestureEvent: (event) => request("/events/gesture", { method: "POST", body: event }),
  listEvents: () => request("/events?limit=120"),
  clearEvents: () => request("/events", { method: "DELETE" }),
  getSettings: () => request("/settings"),
  updateSettings: (settings) => request("/settings", { method: "PUT", body: settings }),
  listIntegrationTemplates: () => request("/integrations/templates")
};

