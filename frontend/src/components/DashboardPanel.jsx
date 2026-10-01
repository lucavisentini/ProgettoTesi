import { Activity, CheckCircle2, Hand, Link2, XCircle } from "lucide-react";

function statusLabel(event) {
  if (!event) {
    return "Nessun evento";
  }

  if (event.severity === "success") {
    return "OK";
  }

  if (event.severity === "error") {
    return "Errore";
  }

  return event.type;
}

export function DashboardPanel({ actions, events, gestures }) {
  const activeActions = actions.filter((action) => action.enabled !== false);
  const lastEvent = events[0];
  const successEvents = events.filter((event) => event.severity === "success").length;
  const errorEvents = events.filter((event) => event.severity === "error").length;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Sistema</p>
          <h2>Panoramica</h2>
        </div>
        <Activity size={20} />
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <Hand size={18} />
          <span>Gesture</span>
          <strong>{gestures.length}</strong>
        </div>
        <div className="stat-tile">
          <Link2 size={18} />
          <span>Azioni attive</span>
          <strong>{activeActions.length}</strong>
        </div>
        <div className="stat-tile">
          <CheckCircle2 size={18} />
          <span>Successi</span>
          <strong>{successEvents}</strong>
        </div>
        <div className="stat-tile">
          <XCircle size={18} />
          <span>Errori</span>
          <strong>{errorEvents}</strong>
        </div>
      </div>

      <article className="last-event">
        <span>Ultimo evento</span>
        <strong>{statusLabel(lastEvent)}</strong>
        <p>{lastEvent?.message || "In attesa di attivita"}</p>
      </article>
    </section>
  );
}

