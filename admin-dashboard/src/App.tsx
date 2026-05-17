import { FormEvent, useMemo, useState } from "react";
import {
  clearAdminKey,
  getAdminKey,
  hasAdminKey,
  saveAdminKey,
} from "./api/adminApi";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasAdminKey());
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const maskedAdminKey = useMemo(() => {
    const savedKey = getAdminKey();

    if (!savedKey) {
      return "";
    }

    if (savedKey.length <= 6) {
      return "******";
    }

    return `${savedKey.slice(0, 3)}******${savedKey.slice(-3)}`;
  }, [isLoggedIn]);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      saveAdminKey(adminKeyInput);
      setAdminKeyInput("");
      setIsLoggedIn(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save admin key.";

      setErrorMessage(message);
    }
  }

  function handleLogout() {
    clearAdminKey();
    setAdminKeyInput("");
    setErrorMessage("");
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <section className="auth-card">
          <p className="eyebrow">AI English Coach</p>
          <h1>Admin Login</h1>
          <p className="lead">
            Enter your admin key to access the separate web dashboard foundation.
          </p>

          <form className="login-form" onSubmit={handleLogin}>
            <label htmlFor="admin-key">Admin Key</label>
            <input
              id="admin-key"
              type="password"
              value={adminKeyInput}
              onChange={(event) => setAdminKeyInput(event.target.value)}
              placeholder="Enter admin key"
              autoComplete="current-password"
            />

            {errorMessage ? (
              <p className="error-message">{errorMessage}</p>
            ) : null}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>

          <p className="note">
            This is a temporary V1 admin-key foundation. Production admin auth,
            roles, and team accounts will come later.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="hero-card">
        <div className="top-row">
          <div>
            <p className="eyebrow">AI English Coach</p>
            <h1>Admin Dashboard Foundation</h1>
          </div>

          <button className="secondary-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <p className="lead">Phase 15D is ready.</p>

        <div className="status-grid">
          <div className="status-card">
            <span>Admin Access</span>
            <strong>Key Saved Locally</strong>
          </div>

          <div className="status-card">
            <span>Backend Target</span>
            <strong>Render API</strong>
          </div>

          <div className="status-card">
            <span>Mobile App</span>
            <strong>Remains Clean</strong>
          </div>
        </div>

        <div className="connection-panel">
          <span>Saved Admin Key</span>
          <strong>{maskedAdminKey}</strong>
          <p>
            Future dashboard pages will use this key in the X-Admin-Key header
            through the admin API client.
          </p>
        </div>

        <p className="note">
          Dashboard metrics, users, content management, and navigation will be
          added in later phases.
        </p>
      </section>
    </main>
  );
}

export default App;

