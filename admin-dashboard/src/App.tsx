import { FormEvent, useMemo, useState } from "react";
import {
  clearAdminKey,
  getAdminKey,
  hasAdminKey,
  saveAdminKey,
} from "./api/adminApi";

type AdminPage = "dashboard" | "users" | "content";

const navItems: Array<{ id: AdminPage; label: string; description: string }> = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and metrics foundation",
  },
  {
    id: "users",
    label: "Users",
    description: "User access management foundation",
  },
  {
    id: "content",
    label: "Content",
    description: "Learning content management foundation",
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasAdminKey());
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");

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
      setActivePage("dashboard");
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
    setActivePage("dashboard");
    setIsLoggedIn(false);
  }

  function getPageTitle() {
    if (activePage === "users") {
      return "Users Management";
    }

    if (activePage === "content") {
      return "Content Management";
    }

    return "Dashboard Overview";
  }

  function getPageSubtitle() {
    if (activePage === "users") {
      return "User list, search, premium access, revoke, expire, and restore-free controls will connect later.";
    }

    if (activePage === "content") {
      return "Stories, confidence videos, reading-listening, and practice topics will connect later.";
    }

    return "Metrics cards will connect to backend admin APIs in Phase 15F.";
  }

  function renderPageContent() {
    if (activePage === "users") {
      return (
        <section className="page-card">
          <div className="placeholder-icon">??</div>
          <h2>Users Management</h2>
          <p>
            This section will later connect to admin user APIs for user list,
            phone search, access status, premium updates, revoke, expire, and
            restore-free actions.
          </p>

          <div className="placeholder-grid">
            <div>
              <span>Next API</span>
              <strong>GET /admin/users</strong>
            </div>
            <div>
              <span>Future Action</span>
              <strong>Update Access</strong>
            </div>
          </div>
        </section>
      );
    }

    if (activePage === "content") {
      return (
        <section className="page-card">
          <div className="placeholder-icon">??</div>
          <h2>Content Management</h2>
          <p>
            This section will later connect to admin content APIs for stories,
            confidence videos, reading-listening content, and conversation topics.
          </p>

          <div className="placeholder-grid">
            <div>
              <span>Next API</span>
              <strong>GET /admin/content</strong>
            </div>
            <div>
              <span>Future Action</span>
              <strong>Publish / Archive</strong>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="page-card">
        <div className="placeholder-icon">??</div>
        <h2>Dashboard Overview</h2>
        <p>
          Phase 15E adds the layout and navigation foundation only. Dashboard
          metrics will connect in Phase 15F.
        </p>

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
      </section>
    );
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
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">AI English Coach</p>
          <h1>Admin</h1>
        </div>

        <nav className="sidebar-nav" aria-label="Admin dashboard navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-button ${activePage === item.id ? "active" : ""}`}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="main-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">Phase 15E</p>
            <h1>{getPageTitle()}</h1>
            <p>{getPageSubtitle()}</p>
          </div>
        </header>

        {renderPageContent()}
      </section>
    </main>
  );
}

export default App;

