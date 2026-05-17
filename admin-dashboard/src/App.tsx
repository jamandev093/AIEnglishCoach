import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminGet,
  clearAdminKey,
  getAdminKey,
  hasAdminKey,
  saveAdminKey,
} from "./api/adminApi";

type AdminPage =
  | "dashboard"
  | "users"
  | "content"
  | "premium"
  | "aiTasks"
  | "speaking"
  | "mistakes"
  | "health"
  | "backup"
  | "settings";

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

type NavItem = {
  id: AdminPage;
  label: string;
  code: string;
};

type ModuleCard = {
  id: Exclude<AdminPage, "dashboard">;
  title: string;
  code: string;
  description: string;
  status: "Ready" | "Next" | "Planned";
};

type ModuleDetail = {
  title: string;
  code: string;
  purpose: string;
  currentStatus: string;
  nextConnection: string;
  apiHint: string;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", code: "DB" },
  { id: "users", label: "Users", code: "US" },
  { id: "content", label: "Content", code: "CT" },
  { id: "premium", label: "Premium", code: "PR" },
  { id: "aiTasks", label: "AI Tasks", code: "AI" },
  { id: "speaking", label: "Speaking", code: "SP" },
  { id: "mistakes", label: "Mistakes", code: "MS" },
  { id: "health", label: "Health", code: "HL" },
  { id: "backup", label: "Backup", code: "BK" },
  { id: "settings", label: "Settings", code: "ST" },
];

const moduleCards: ModuleCard[] = [
  {
    id: "users",
    title: "Users",
    code: "US",
    description: "User list, search, and access.",
    status: "Next",
  },
  {
    id: "content",
    title: "Content",
    code: "CT",
    description: "Stories, videos, topics.",
    status: "Ready",
  },
  {
    id: "premium",
    title: "Premium",
    code: "PR",
    description: "Plans, trials, access control.",
    status: "Ready",
  },
  {
    id: "aiTasks",
    title: "AI Tasks",
    code: "AI",
    description: "AI feedback and usage.",
    status: "Planned",
  },
  {
    id: "speaking",
    title: "Speaking",
    code: "SP",
    description: "Fluency, confidence, progress.",
    status: "Planned",
  },
  {
    id: "mistakes",
    title: "Mistakes",
    code: "MS",
    description: "Repeated grammar/pronunciation.",
    status: "Planned",
  },
  {
    id: "health",
    title: "Health",
    code: "HL",
    description: "Backend and API checks.",
    status: "Next",
  },
  {
    id: "backup",
    title: "Backup",
    code: "BK",
    description: "Export and safety backup.",
    status: "Ready",
  },
  {
    id: "settings",
    title: "Settings",
    code: "ST",
    description: "Admin configuration.",
    status: "Planned",
  },
];

const moduleDetails: Record<Exclude<AdminPage, "dashboard">, ModuleDetail> = {
  users: {
    title: "Users",
    code: "US",
    purpose: "View users, search by phone, inspect access status, and prepare safe user management workflows.",
    currentStatus: "Backend admin user endpoints are ready.",
    nextConnection: "Connect user list/search foundation in Phase 15G.",
    apiHint: "GET /admin/users, GET /admin/users/search, GET /admin/users/{user_id}",
  },
  content: {
    title: "Content",
    code: "CT",
    purpose: "Manage stories, confidence videos, reading-listening content, and conversation topics.",
    currentStatus: "Admin content APIs are ready.",
    nextConnection: "Connect content list/detail foundation after users foundation.",
    apiHint: "GET /admin/content, GET /admin/content/{content_id}",
  },
  premium: {
    title: "Premium",
    code: "PR",
    purpose: "Manage free, premium, trial, scholarship, and adminManual access.",
    currentStatus: "Backend access foundation is ready.",
    nextConnection: "Connect premium actions after Users page is stable.",
    apiHint: "PUT /admin/users/{user_id}/access, revoke, expire, restore-free",
  },
  aiTasks: {
    title: "AI Tasks",
    code: "AI",
    purpose: "Monitor AI feedback, speaking analysis, correction, coaching, and premium AI usage.",
    currentStatus: "Premium access guard foundation exists.",
    nextConnection: "Add AI task logs and usage metrics later.",
    apiHint: "Future: AI task logs and premium AI usage",
  },
  speaking: {
    title: "Speaking",
    code: "SP",
    purpose: "Track speaking activity, confidence, fluency, and speaking progress trends.",
    currentStatus: "Important future product analytics module.",
    nextConnection: "Connect after mobile speaking activity tracking becomes stable.",
    apiHint: "Future: confidence, fluency, speaking activity, progress history",
  },
  mistakes: {
    title: "Mistakes",
    code: "MS",
    purpose: "Track repeated grammar mistakes, pronunciation mistakes, weak sentence patterns, and saved corrections.",
    currentStatus: "Important future personalization/mistake-memory module.",
    nextConnection: "Connect after AI speaking analysis and correction storage are stable.",
    apiHint: "Future: repeated mistakes, corrections, adaptive coaching signals",
  },
  health: {
    title: "Health",
    code: "HL",
    purpose: "Check Render backend availability, API connectivity, and operational readiness.",
    currentStatus: "Manual checks for now.",
    nextConnection: "Add lightweight health/status checks later.",
    apiHint: "GET /, future health endpoint",
  },
  backup: {
    title: "Backup",
    code: "BK",
    purpose: "Export content and prepare safety backup routines.",
    currentStatus: "Content export API already exists.",
    nextConnection: "Connect export action after content list is stable.",
    apiHint: "GET /admin/content/export",
  },
  settings: {
    title: "Settings",
    code: "ST",
    purpose: "Manage dashboard configuration, environment notes, and future team settings.",
    currentStatus: "Temporary admin-key foundation is active.",
    nextConnection: "Add settings after core pages are useful.",
    apiHint: "Future: roles, admin profile, environment settings",
  },
};

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
  const [searchText, setSearchText] = useState("");

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

  const filteredModuleCards = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return moduleCards;
    }

    return moduleCards.filter((card) => {
      return (
        card.title.toLowerCase().includes(query) ||
        card.code.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.status.toLowerCase().includes(query)
      );
    });
  }, [searchText]);

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
    setSearchText("");
    setIsLoggedIn(false);
  }

  function getPageTitle() {
    if (activePage === "dashboard") {
      return "Admin Control Center";
    }

    return moduleDetails[activePage].title;
  }

  function getPageSubtitle() {
    if (activePage === "dashboard") {
      return "Compact founder dashboard for users, content, premium access, AI tasks, speaking, mistakes, health, and backups.";
    }

    return moduleDetails[activePage].purpose;
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

  function renderStatusRow() {
    return (
      <div className="compact-status-row">
        <span><b>Backend:</b> Render</span>
        <span><b>Admin Key:</b> Saved</span>
        <span><b>Mode:</b> Development</span>
        <span><b>Mobile:</b> Separate</span>
      </div>
    );
  }

  function renderModuleCard(card: ModuleCard) {
    return (
      <button
        className="module-card"
        key={card.id}
        type="button"
        onClick={() => setActivePage(card.id)}
      >
        <div className="module-card-top">
          <span className="module-code">{card.code}</span>
          <span className={`status-pill status-${card.status.toLowerCase()}`}>
            {card.status}
          </span>
        </div>
        <strong>{card.title}</strong>
        <small>{card.description}</small>
      </button>
    );
  }

  function renderDashboardContent() {
    return (
      <>
        <section className="compact-card">
          <div className="dashboard-topline">
            <div>
              <h2>Dashboard</h2>
              <p>Fast access control panel. Search filters modules for now.</p>
            </div>
            <button
              className="small-button"
              type="button"
              onClick={loadDashboardMetrics}
            >
              Refresh
            </button>
          </div>

          <input
            className="command-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search modules, users, content..."
            type="search"
          />

          {renderStatusRow()}
        </section>

        {isDashboardLoading ? (
          <section className="compact-card">
            <div className="message-row">
              <span className="module-code">DB</span>
              <div>
                <h2>Loading dashboard metrics...</h2>
                <p>Render may take a little time to wake up.</p>
              </div>
            </div>
          </section>
        ) : dashboardError ? (
          <section className="compact-card alert-card">
            <div className="message-row">
              <span className="module-code warning">!</span>
              <div>
                <h2>Unable to load dashboard metrics.</h2>
                <p>{dashboardError}</p>
              </div>
            </div>
            <button
              className="small-button primary-small"
              type="button"
              onClick={loadDashboardMetrics}
            >
              Retry
            </button>
          </section>
        ) : (
          <section className="compact-card">
            <div className="compact-section-title">
              <h2>Metrics</h2>
              <span>Connected to Render admin APIs</span>
            </div>

            <div className="metrics-grid compact">
              {renderMetricCard("Users", dashboardMetrics.totalUsers, "Total")}
              {renderMetricCard("Premium", dashboardMetrics.premiumUsers, "Active premium")}
              {renderMetricCard("Free", dashboardMetrics.freeUsers, "Free access")}
              {renderMetricCard("Content", dashboardMetrics.totalContent, "All items")}
              {renderMetricCard("Published", dashboardMetrics.publishedContent, "Visible")}
              {renderMetricCard("Unpublished", dashboardMetrics.unpublishedContent, "Hidden")}
              {renderMetricCard("Expired", dashboardMetrics.expiredUsers, "Expired")}
              {renderMetricCard("Revoked", dashboardMetrics.revokedUsers, "Revoked")}
            </div>
          </section>
        )}

        <section className="compact-card">
          <div className="compact-section-title">
            <h2>Modules</h2>
            <span>{filteredModuleCards.length} visible</span>
          </div>

          <div className="module-grid">
            {filteredModuleCards.length > 0 ? (
              filteredModuleCards.map(renderModuleCard)
            ) : (
              <p className="empty-state">No modules match this search.</p>
            )}
          </div>
        </section>

        <section className="tiny-note-card">
          <span>Saved Admin Key</span>
          <strong>{maskedAdminKey}</strong>
          <p>Requests use X-Admin-Key through the admin API client.</p>
        </section>
      </>
    );
  }

  function renderModulePlaceholder(page: Exclude<AdminPage, "dashboard">) {
    const detail = moduleDetails[page];

    return (
      <>
        <section className="compact-card">
          <div className="module-page-heading">
            <span className="module-code large">{detail.code}</span>
            <div>
              <h2>{detail.title}</h2>
              <p>{detail.purpose}</p>
            </div>
          </div>
        </section>

        <section className="compact-card">
          <div className="detail-grid">
            <div>
              <span>Current Status</span>
              <strong>{detail.currentStatus}</strong>
            </div>
            <div>
              <span>Next Connection</span>
              <strong>{detail.nextConnection}</strong>
            </div>
            <div>
              <span>API / Future Service</span>
              <strong>{detail.apiHint}</strong>
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderPageContent() {
    if (activePage === "dashboard") {
      return renderDashboardContent();
    }

    return renderModulePlaceholder(activePage);
  }

  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <section className="auth-card">
          <p className="eyebrow">AI English Coach</p>
          <h1>Admin Login</h1>
          <p className="lead">
            Enter your admin key to access the compact admin control center.
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
          <span className="environment-badge">Control Center</span>
        </div>

        <nav className="sidebar-nav" aria-label="Admin dashboard navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-button ${activePage === item.id ? "active" : ""}`}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-code">{item.code}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="main-panel">
        <header className="page-header compact-header">
          <div>
            <p className="eyebrow">Phase 15F-3</p>
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
