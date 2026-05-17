import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminGet,
  clearAdminKey,
  getAdminKey,
  hasAdminKey,
  saveAdminKey,
} from "./api/adminApi";

type AdminPage = "dashboard" | "users" | "content";

type AdminUserMetrics = {
  totalUsers?: number;
  freeUsers?: number;
  premiumUsers?: number;
  expiredUsers?: number;
  revokedUsers?: number;
  activeUsers?: number;
};

type ContentItem = {
  id: string;
  isPublished?: boolean;
};

type DashboardMetrics = {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  expiredUsers: number;
  revokedUsers: number;
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
};

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

const emptyMetrics: DashboardMetrics = {
  totalUsers: 0,
  freeUsers: 0,
  premiumUsers: 0,
  expiredUsers: 0,
  revokedUsers: 0,
  totalContent: 0,
  publishedContent: 0,
  unpublishedContent: 0,
};

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeContentList(response: unknown): ContentItem[] {
  if (Array.isArray(response)) {
    return response as ContentItem[];
  }

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray((response as { items?: unknown }).items)
  ) {
    return (response as { items: ContentItem[] }).items;
  }

  return [];
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasAdminKey());
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");

  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetrics>(emptyMetrics);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

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

  async function loadDashboardMetrics() {
    if (!hasAdminKey()) {
      return;
    }

    setIsDashboardLoading(true);
    setDashboardError("");

    try {
      const [userMetricsResponse, contentResponse] = await Promise.all([
        adminGet<AdminUserMetrics>("/admin/users/metrics"),
        adminGet<unknown>("/admin/content"),
      ]);

      const contentItems = normalizeContentList(contentResponse);
      const publishedContent = contentItems.filter(
        (item) => item.isPublished === true
      ).length;

      setDashboardMetrics({
        totalUsers: readNumber(userMetricsResponse.totalUsers),
        freeUsers: readNumber(userMetricsResponse.freeUsers),
        premiumUsers: readNumber(userMetricsResponse.premiumUsers),
        expiredUsers: readNumber(userMetricsResponse.expiredUsers),
        revokedUsers: readNumber(userMetricsResponse.revokedUsers),
        totalContent: contentItems.length,
        publishedContent,
        unpublishedContent: contentItems.length - publishedContent,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load dashboard metrics.";

      setDashboardError(message);
    } finally {
      setIsDashboardLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn && activePage === "dashboard") {
      void loadDashboardMetrics();
    }
  }, [isLoggedIn, activePage]);

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
    setDashboardError("");
    setDashboardMetrics(emptyMetrics);
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

    return "Live dashboard cards now connect to Render backend admin APIs.";
  }

  function renderMetricCard(label: string, value: number, helper: string) {
    return (
      <div className="metric-card">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    );
  }

  function renderDashboardContent() {
    if (isDashboardLoading) {
      return (
        <section className="page-card">
          <div className="placeholder-icon">DB</div>
          <h2>Loading dashboard metrics...</h2>
          <p>
            Render may take a little time to wake up. The dashboard is requesting
            user metrics and content totals now.
          </p>
        </section>
      );
    }

    if (dashboardError) {
      return (
        <section className="page-card">
          <div className="placeholder-icon warning">!</div>
          <h2>Unable to load dashboard metrics.</h2>
          <p>{dashboardError}</p>

          <button
            className="primary-button inline-button"
            type="button"
            onClick={loadDashboardMetrics}
          >
            Retry
          </button>
        </section>
      );
    }

    return (
      <section className="page-card">
        <div className="placeholder-icon">DB</div>
        <h2>Dashboard Overview</h2>
        <p>
          Phase 15F connects the dashboard summary cards to existing backend
          admin APIs.
        </p>

        <div className="metrics-grid">
          {renderMetricCard(
            "Total Users",
            dashboardMetrics.totalUsers,
            "All registered users"
          )}
          {renderMetricCard(
            "Free Users",
            dashboardMetrics.freeUsers,
            "Users on free access"
          )}
          {renderMetricCard(
            "Premium Users",
            dashboardMetrics.premiumUsers,
            "Users with premium access"
          )}
          {renderMetricCard(
            "Expired Users",
            dashboardMetrics.expiredUsers,
            "Expired access records"
          )}
          {renderMetricCard(
            "Revoked Users",
            dashboardMetrics.revokedUsers,
            "Revoked access records"
          )}
          {renderMetricCard(
            "Total Content",
            dashboardMetrics.totalContent,
            "All admin content items"
          )}
          {renderMetricCard(
            "Published Content",
            dashboardMetrics.publishedContent,
            "Visible public content"
          )}
          {renderMetricCard(
            "Unpublished Content",
            dashboardMetrics.unpublishedContent,
            "Hidden or archived content"
          )}
        </div>

        <div className="connection-panel">
          <span>Saved Admin Key</span>
          <strong>{maskedAdminKey}</strong>
          <p>
            Dashboard requests use this key in the X-Admin-Key header through
            the admin API client.
          </p>
        </div>
      </section>
    );
  }

  function renderPageContent() {
    if (activePage === "users") {
      return (
        <section className="page-card">
          <div className="placeholder-icon">US</div>
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
          <div className="placeholder-icon">CT</div>
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

    return renderDashboardContent();
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
            <p className="eyebrow">Phase 15F</p>
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
