import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";

export function LoginView({ onLogin, onRegister, error, loading }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const payload = { username, password };
    mode === "login" ? onLogin(payload) : onRegister(payload);
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark">
          <span className="brand-dot" />
          <div>
            <p className="eyebrow">Gesture Control</p>
            <h1>Accesso utente</h1>
          </div>
        </div>

        <div className="segmented" role="tablist" aria-label="Modalita accesso">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            <UserPlus size={16} />
            Registra
          </button>
        </div>

        <form className="stack" onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" disabled={loading} type="submit">
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? "Attendi..." : mode === "login" ? "Accedi" : "Crea account"}
          </button>
        </form>
      </section>
    </main>
  );
}

