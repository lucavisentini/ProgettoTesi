import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Gauge, Hand, LogOut, Router, Settings, ShieldCheck } from "lucide-react";
import { api, getAuthToken, setAuthToken } from "./api/client.js";
import { CameraFeed } from "./components/CameraFeed.jsx";
import { DashboardPanel } from "./components/DashboardPanel.jsx";
import { DeviceMapper } from "./components/DeviceMapper.jsx";
import { EventLog } from "./components/EventLog.jsx";
import { GestureManager } from "./components/GestureManager.jsx";
import { LoginView } from "./components/LoginView.jsx";
import { SettingsPanel } from "./components/SettingsPanel.jsx";

const DEFAULT_SETTINGS = {
  recognitionThreshold: 0.82,
  duplicateWindowMs: 900,
  dispatchEnabled: true,
  maxEvents: 500,
  minBackendScore: 0.55
};

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getAuthToken()));
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gestures, setGestures] = useState([]);
  const [actions, setActions] = useState([]);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState([]);
  const [currentSample, setCurrentSample] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [toast, setToast] = useState("");

  const refreshData = useCallback(async () => {
    const [gesturePayload, actionPayload, eventPayload, settingsPayload, templatePayload] =
      await Promise.all([
        api.listGestures(),
        api.listActions(),
        api.listEvents(),
        api.getSettings(),
        api.listIntegrationTemplates()
      ]);
    setGestures(gesturePayload.gestures);
    setActions(actionPayload.actions);
    setEvents(eventPayload.events);
    setSettings({ ...DEFAULT_SETTINGS, ...settingsPayload.settings });
    setTemplates(templatePayload.templates);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!getAuthToken()) {
        setBooting(false);
        return;
      }

      try {
        const payload = await api.me();
        setUser(payload.user);
        await refreshData();
      } catch {
        setAuthToken(null);
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, [refreshData]);

  const authenticate = async (mode, credentials) => {
    setLoading(true);
    setAuthError("");

    try {
      const payload = mode === "login" ? await api.login(credentials) : await api.register(credentials);
      setAuthToken(payload.token);
      setUser(payload.user);
      await refreshData();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setGestures([]);
    setActions([]);
    setEvents([]);
    setSettings(DEFAULT_SETTINGS);
    setTemplates([]);
    setCurrentSample(null);
  };

  const createGesture = async (gesture) => {
    setLoading(true);
    try {
      await api.createGesture(gesture);
      await refreshData();
      setToast("Gesture salvata.");
    } finally {
      setLoading(false);
    }
  };

  const deleteGesture = async (id) => {
    await api.deleteGesture(id);
    await refreshData();
  };

  const addGestureSample = async (id, sample) => {
    await api.addGestureSample(id, sample);
    await refreshData();
    setToast("Campione aggiunto.");
  };

  const saveAction = async (id, action) => {
    setLoading(true);
    try {
      id ? await api.updateAction(id, action) : await api.createAction(action);
      await refreshData();
      setToast("Mapping salvato.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (id) => {
    await api.deleteAction(id);
    await refreshData();
  };

  const triggerAction = async (id) => {
    const payload = await api.triggerAction(id);
    const first = payload.outcomes?.[0];
    setToast(first?.ok ? "Comando inviato." : first?.error || "Comando non riuscito.");
    await refreshData();
  };

  const saveSettings = async (nextSettings, options = { notify: true }) => {
    const payload = await api.updateSettings(nextSettings);
    setSettings({ ...DEFAULT_SETTINGS, ...payload.settings });
    if (options.notify) {
      setToast("Impostazioni salvate.");
    }
  };

  const clearEvents = async () => {
    await api.clearEvents();
    await refreshData();
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (booting) {
    return <main className="loading-page">Caricamento...</main>;
  }

  if (!user) {
    return (
      <LoginView
        error={authError}
        loading={loading}
        onLogin={(credentials) => authenticate("login", credentials)}
        onRegister={(credentials) => authenticate("register", credentials)}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          <div>
            <p className="eyebrow">Gesture Control</p>
            <h1>Console domotica</h1>
          </div>
        </div>

        <div className="user-box">
          <ShieldCheck size={17} />
          <span>{user.username}</span>
          <button className="icon-button" onClick={logout} title="Logout" type="button">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <CameraFeed
          actions={actions}
          gestures={gestures}
          onEvent={refreshData}
          onLandmarksChange={setCurrentSample}
          onSettingsChange={(nextSettings) => saveSettings(nextSettings, { notify: false })}
          settings={settings}
        />

        <div className="side-workspace">
          <div className="segmented wide five-tabs" role="tablist" aria-label="Pannello configurazione">
            <button
              className={activePanel === "overview" ? "active" : ""}
              onClick={() => setActivePanel("overview")}
              type="button"
            >
              <Gauge size={16} />
              Stato
            </button>
            <button
              className={activePanel === "gestures" ? "active" : ""}
              onClick={() => setActivePanel("gestures")}
              type="button"
            >
              <Hand size={16} />
              Gesture
            </button>
            <button
              className={activePanel === "actions" ? "active" : ""}
              onClick={() => setActivePanel("actions")}
              type="button"
            >
              <Router size={16} />
              Comandi
            </button>
            <button
              className={activePanel === "events" ? "active" : ""}
              onClick={() => setActivePanel("events")}
              type="button"
            >
              <ClipboardList size={16} />
              Log
            </button>
            <button
              className={activePanel === "settings" ? "active" : ""}
              onClick={() => setActivePanel("settings")}
              type="button"
            >
              <Settings size={16} />
              Config
            </button>
          </div>

          {activePanel === "overview" ? (
            <DashboardPanel actions={actions} events={events} gestures={gestures} />
          ) : null}

          {activePanel === "gestures" ? (
            <GestureManager
              currentSample={currentSample}
              gestures={gestures}
              loading={loading}
              onAddSample={addGestureSample}
              onCreate={createGesture}
              onDelete={deleteGesture}
            />
          ) : null}

          {activePanel === "actions" ? (
            <DeviceMapper
              actions={actions}
              gestures={gestures}
              loading={loading}
              onDelete={deleteAction}
              onSave={saveAction}
              onTrigger={triggerAction}
              templates={templates}
            />
          ) : null}

          {activePanel === "events" ? (
            <EventLog events={events} onClear={clearEvents} onRefresh={refreshData} />
          ) : null}

          {activePanel === "settings" ? (
            <SettingsPanel onSave={saveSettings} settings={settings} />
          ) : null}
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}

