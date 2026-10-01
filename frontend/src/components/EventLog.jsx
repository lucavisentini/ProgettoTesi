import { RotateCcw, Trash2 } from "lucide-react";

export function EventLog({ events, onClear, onRefresh }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Audit</p>
          <h2>Registro eventi</h2>
        </div>
        <div className="item-actions">
          <button className="icon-button" onClick={onRefresh} title="Aggiorna" type="button">
            <RotateCcw size={17} />
          </button>
          <button className="icon-button danger" onClick={onClear} title="Svuota" type="button">
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="list event-list">
        {events.length === 0 ? (
          <div className="empty-list">
            <span>Nessun evento registrato</span>
          </div>
        ) : (
          events.map((event) => (
            <article className={`event-item ${event.severity}`} key={event.id}>
              <div>
                <strong>{event.message}</strong>
                <span>
                  {event.type} - {event.source}
                </span>
              </div>
              <time>{new Date(event.createdAt).toLocaleString()}</time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

