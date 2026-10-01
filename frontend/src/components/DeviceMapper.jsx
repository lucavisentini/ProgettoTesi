import { useEffect, useMemo, useState } from "react";
import { Link2, Pencil, Play, Plus, Save, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  id: null,
  name: "",
  description: "",
  deviceLabel: "",
  integrationType: "generic_http",
  gestureId: "",
  method: "POST",
  url: "",
  headersText: "{\n  \"Content-Type\": \"application/json\"\n}",
  body: "{}",
  cooldownMs: 1500,
  minScore: 0,
  enabled: true
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function actionToForm(action) {
  return {
    id: action.id,
    name: action.name,
    description: action.description || "",
    deviceLabel: action.deviceLabel || "",
    integrationType: action.integrationType || "generic_http",
    gestureId: action.gestureId,
    method: action.method,
    url: action.url,
    headersText: JSON.stringify(action.headers || {}, null, 2),
    body: action.body || "",
    cooldownMs: action.cooldownMs ?? 1500,
    minScore: action.minScore ?? 0,
    enabled: action.enabled !== false
  };
}

export function DeviceMapper({ actions, gestures, loading, onDelete, onSave, onTrigger, templates = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const gesturesById = useMemo(
    () => Object.fromEntries(gestures.map((gesture) => [gesture.id, gesture])),
    [gestures]
  );

  useEffect(() => {
    if (!form.gestureId && gestures[0]) {
      setForm((current) => ({ ...current, gestureId: gestures[0].id }));
    }
  }, [form.gestureId, gestures]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setForm({ ...EMPTY_FORM, gestureId: gestures[0]?.id || "" });
    setFormError("");
  };

  const applyTemplate = (template) => {
    setForm((current) => ({
      ...current,
      integrationType: template.id,
      method: template.method,
      url: template.url,
      headersText: JSON.stringify(template.headers || {}, null, 2),
      body: template.body || ""
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    let headers;

    try {
      headers = form.headersText.trim() ? JSON.parse(form.headersText) : {};
    } catch {
      setFormError("Headers JSON non valido.");
      return;
    }

    await onSave(form.id, {
      name: form.name,
      description: form.description,
      deviceLabel: form.deviceLabel,
      integrationType: form.integrationType,
      gestureId: form.gestureId,
      method: form.method,
      url: form.url,
      headers,
      body: form.body,
      cooldownMs: Number(form.cooldownMs),
      minScore: Number(form.minScore),
      enabled: form.enabled
    });

    reset();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dispositivi</p>
          <h2>Mappa gesture-comando</h2>
        </div>
        <button className="secondary-button" onClick={reset} type="button">
          <Plus size={17} />
          Nuova
        </button>
      </div>

      <form className="mapper-form" onSubmit={submit}>
        <div className="template-row">
          {templates.map((template) => (
            <button
              className={form.integrationType === template.id ? "chip active" : "chip"}
              key={template.id}
              onClick={() => applyTemplate(template)}
              type="button"
            >
              {template.name}
            </button>
          ))}
        </div>

        <label>
          Nome azione
          <input
            onChange={(event) => update("name", event.target.value)}
            placeholder="Accendi luce studio"
            required
            value={form.name}
          />
        </label>

        <label>
          Dispositivo
          <input
            onChange={(event) => update("deviceLabel", event.target.value)}
            placeholder="Luce studio"
            value={form.deviceLabel}
          />
        </label>

        <label>
          Descrizione
          <input
            onChange={(event) => update("description", event.target.value)}
            placeholder="Attiva scenario luminoso"
            value={form.description}
          />
        </label>

        <label>
          Gesture
          <select
            disabled={gestures.length === 0}
            onChange={(event) => update("gestureId", event.target.value)}
            required
            value={form.gestureId}
          >
            {gestures.map((gesture) => (
              <option key={gesture.id} value={gesture.id}>
                {gesture.name}
              </option>
            ))}
          </select>
        </label>

        <div className="two-cols">
          <label>
            Metodo
            <select onChange={(event) => update("method", event.target.value)} value={form.method}>
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cooldown ms
            <input
              min="0"
              onChange={(event) => update("cooldownMs", event.target.value)}
              step="100"
              type="number"
              value={form.cooldownMs}
            />
          </label>
        </div>

        <label>
          Soglia minima azione {(Number(form.minScore) * 100).toFixed(0)}%
          <input
            max="1"
            min="0"
            onChange={(event) => update("minScore", event.target.value)}
            step="0.01"
            type="range"
            value={form.minScore}
          />
        </label>

        <label>
          URL HTTP
          <input
            onChange={(event) => update("url", event.target.value)}
            placeholder="http://192.168.1.20/api/scene"
            required
            type="url"
            value={form.url}
          />
        </label>

        <label>
          Headers JSON
          <textarea
            onChange={(event) => update("headersText", event.target.value)}
            rows={4}
            value={form.headersText}
          />
        </label>

        <label>
          Body
          <textarea onChange={(event) => update("body", event.target.value)} rows={5} value={form.body} />
        </label>

        <label className="toggle-label">
          <input
            checked={form.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
            type="checkbox"
          />
          Attiva
        </label>

        {formError ? <p className="error-text">{formError}</p> : null}

        <button className="primary-button" disabled={loading || gestures.length === 0} type="submit">
          <Save size={18} />
          Salva mapping
        </button>
      </form>

      <div className="list action-list">
        {actions.length === 0 ? (
          <div className="empty-list">
            <Link2 size={22} />
            <span>Nessun mapping</span>
          </div>
        ) : (
          actions.map((action) => (
            <article className="list-item action-item" key={action.id}>
              <div className="item-main">
                <Link2 size={18} />
                <div>
                  <strong>{action.name}</strong>
                  <span>
                    {action.method} - {action.deviceLabel || action.integrationType} -{" "}
                    {gesturesById[action.gestureId]?.name || action.gestureName}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button
                  aria-label={`Modifica ${action.name}`}
                  className="icon-button"
                  onClick={() => setForm(actionToForm(action))}
                  type="button"
                >
                  <Pencil size={17} />
                </button>
                <button
                  aria-label={`Test ${action.name}`}
                  className="icon-button"
                  onClick={() => onTrigger(action.id)}
                  type="button"
                >
                  <Play size={17} />
                </button>
                <button
                  aria-label={`Elimina ${action.name}`}
                  className="icon-button danger"
                  onClick={() => onDelete(action.id)}
                  type="button"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

