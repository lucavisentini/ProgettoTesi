import { Save } from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsPanel({ onSave, settings }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profilo</p>
          <h2>Impostazioni utente</h2>
        </div>
      </div>

      <form className="mapper-form" onSubmit={submit}>
        <label>
          Soglia riconoscimento {(Number(draft.recognitionThreshold) * 100).toFixed(0)}%
          <input
            max="0.98"
            min="0.5"
            onChange={(event) => update("recognitionThreshold", Number(event.target.value))}
            step="0.01"
            type="range"
            value={draft.recognitionThreshold}
          />
        </label>

        <label>
          Soglia backend {(Number(draft.minBackendScore) * 100).toFixed(0)}%
          <input
            max="1"
            min="0"
            onChange={(event) => update("minBackendScore", Number(event.target.value))}
            step="0.01"
            type="range"
            value={draft.minBackendScore}
          />
        </label>

        <div className="two-cols">
          <label>
            Finestra duplicati ms
            <input
              min="250"
              onChange={(event) => update("duplicateWindowMs", Number(event.target.value))}
              step="50"
              type="number"
              value={draft.duplicateWindowMs}
            />
          </label>

          <label>
            Eventi conservati
            <input
              min="50"
              onChange={(event) => update("maxEvents", Number(event.target.value))}
              step="50"
              type="number"
              value={draft.maxEvents}
            />
          </label>
        </div>

        <label className="toggle-label">
          <input
            checked={draft.dispatchEnabled !== false}
            onChange={(event) => update("dispatchEnabled", event.target.checked)}
            type="checkbox"
          />
          Dispatch automatico
        </label>

        <button className="primary-button" type="submit">
          <Save size={18} />
          Salva impostazioni
        </button>
      </form>
    </section>
  );
}

