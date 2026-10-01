import { useState } from "react";
import { Camera, Hand, Plus, Trash2 } from "lucide-react";

export function GestureManager({ currentSample, gestures, onAddSample, onCreate, onDelete, loading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    await onCreate({ name, description, sample: currentSample });
    setName("");
    setDescription("");
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Configurazione</p>
          <h2>Gesture registrate</h2>
        </div>
        <span className="counter">{gestures.length}</span>
      </div>

      <form className="inline-form" onSubmit={submit}>
        <label>
          Nome
          <input
            onChange={(event) => setName(event.target.value)}
            placeholder="Mano aperta"
            required
            value={name}
          />
        </label>
        <label>
          Descrizione
          <input
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Apertura palmo frontale"
            value={description}
          />
        </label>
        <button className="primary-button" disabled={!currentSample || loading} type="submit">
          <Plus size={18} />
          Salva
        </button>
      </form>

      <div className="list">
        {gestures.length === 0 ? (
          <div className="empty-list">
            <Hand size={22} />
            <span>Nessuna gesture</span>
          </div>
        ) : (
          gestures.map((gesture) => (
            <article className="list-item" key={gesture.id}>
              <div className="item-main">
                <Hand size={18} />
                <div>
                  <strong>{gesture.name}</strong>
                  <span>
                    {gesture.samples?.length || 1} campioni - {gesture.description || "nessuna descrizione"}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button
                  aria-label={`Aggiungi campione a ${gesture.name}`}
                  className="icon-button"
                  disabled={!currentSample || loading}
                  onClick={() => onAddSample(gesture.id, { sample: currentSample })}
                  type="button"
                >
                  <Camera size={17} />
                </button>
                <button
                  aria-label={`Elimina ${gesture.name}`}
                  className="icon-button danger"
                  onClick={() => onDelete(gesture.id)}
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

