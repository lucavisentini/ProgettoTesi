import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CircleStop, Play, Radio, Video } from "lucide-react";
import { api } from "../api/client.js";
import { useMediaPipe } from "../hooks/useMediaPipe.js";
import { findBestGesture } from "../utils/gestureMatcher.js";
import { normalizeLandmarks } from "../utils/mathUtils.js";

export function CameraFeed({ actions, gestures, onEvent, onLandmarksChange, onSettingsChange, settings }) {
  const [enabled, setEnabled] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [lastOutcome, setLastOutcome] = useState(null);
  const lastSentRef = useRef({ gestureId: null, at: 0 });
  const { videoRef, canvasRef, status, error, landmarks } = useMediaPipe(enabled);
  const threshold = settings.recognitionThreshold ?? 0.82;
  const duplicateWindowMs = settings.duplicateWindowMs ?? 900;
  const autoDispatch = settings.dispatchEnabled !== false;

  const sample = useMemo(() => normalizeLandmarks(landmarks), [landmarks]);
  const mappedGestureIds = useMemo(
    () => new Set(actions.filter((action) => action.enabled !== false).map((action) => action.gestureId)),
    [actions]
  );

  useEffect(() => {
    onLandmarksChange(sample);
  }, [sample, onLandmarksChange]);

  useEffect(() => {
    const match = findBestGesture(sample, gestures, threshold);
    setLastMatch(match);

    if (!match || !autoDispatch || !mappedGestureIds.has(match.gesture.id)) {
      return;
    }

    const now = Date.now();
    const lastSent = lastSentRef.current;

    if (lastSent.gestureId === match.gesture.id && now - lastSent.at < duplicateWindowMs) {
      return;
    }

    lastSentRef.current = { gestureId: match.gesture.id, at: now };

    api
      .emitGestureEvent({ gestureId: match.gesture.id, score: match.score })
      .then((payload) => {
        setLastOutcome(payload.outcomes?.[0] || null);
        onEvent();
      })
      .catch((eventError) => {
        setLastOutcome({ ok: false, error: eventError.message });
      });
  }, [autoDispatch, duplicateWindowMs, gestures, mappedGestureIds, onEvent, sample, threshold]);

  return (
    <section className="camera-shell">
      <div className="camera-toolbar">
        <div>
          <p className="eyebrow">Visione locale</p>
          <h2>Webcam e riconoscimento</h2>
        </div>
        <button
          className={enabled ? "danger-button" : "primary-button"}
          onClick={() => setEnabled((value) => !value)}
          type="button"
        >
          {enabled ? <CircleStop size={18} /> : <Video size={18} />}
          {enabled ? "Ferma" : "Avvia"}
        </button>
      </div>

      <div className="video-stage">
        <video playsInline ref={videoRef} />
        <canvas ref={canvasRef} />
        {!enabled ? (
          <div className="empty-state">
            <Play size={28} />
            <span>Camera ferma</span>
          </div>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="telemetry-grid">
        <div className="metric">
          <Activity size={18} />
          <div>
            <span>Stato</span>
            <strong>{status}</strong>
          </div>
        </div>
        <div className="metric">
          <Radio size={18} />
          <div>
            <span>Match</span>
            <strong>
              {lastMatch ? `${lastMatch.gesture.name} ${(lastMatch.score * 100).toFixed(0)}%` : "Nessuno"}
            </strong>
          </div>
        </div>
        <div className="metric">
          <Radio size={18} />
          <div>
            <span>Dispatch</span>
            <strong>
              {lastOutcome
                ? lastOutcome.skipped
                  ? "Cooldown"
                  : lastOutcome.ok
                    ? "OK"
                    : "Errore"
                : "In attesa"}
            </strong>
          </div>
        </div>
      </div>

      <div className="control-row">
        <label className="range-label">
          Soglia {(threshold * 100).toFixed(0)}%
          <input
            max="0.98"
            min="0.55"
            onChange={(event) =>
              onSettingsChange({ ...settings, recognitionThreshold: Number(event.target.value) })
            }
            step="0.01"
            type="range"
            value={threshold}
          />
        </label>

        <label className="toggle-label">
          <input
            checked={autoDispatch}
            onChange={(event) =>
              onSettingsChange({ ...settings, dispatchEnabled: event.target.checked })
            }
            type="checkbox"
          />
          Dispatch automatico
        </label>
      </div>
    </section>
  );
}

