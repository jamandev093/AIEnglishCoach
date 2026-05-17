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
  | "aiUsage"
  | "systemHealth"
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
  usersLeftPlatform: number;
  totalActiveUsers: number;
  totalPaidUsers: number;
  totalUnpaidUsers: number;
  totalNonSeriousUsers: number;
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  expiredUsers: number;
  revokedUsers: number;
  aiUsageToday: number;
};

type NavItem = {
  id: AdminPage;
  label: string;
  code: string;
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
  { id: "aiUsage", label: "AI Usage", code: "AI" },
  { id: "systemHealth", label: "System Health", code: "SH" },
  { id: "backup", label: "Backup", code: "BK" },
  { id: "settings", label: "Settings", code: "ST" },
];

const moduleDetails: Record<Exclude<AdminPage, "dashboard" | "users" | "aiUsage" | "systemHealth">, ModuleDetail> = {
  content: {
    title: "Content",
    code: "CT",
    purpose:
      "Manage stories, confidence videos, reading-listening content, and conversation topics.",
    currentStatus: "Admin content APIs are ready.",
    nextConnection:
      "Connect content list/detail foundation after Users page foundation.",
    apiHint: "GET /admin/content, GET /admin/content/{content_id}",
  },
  premium: {
    title: "Premium",
    code: "PR",
    purpose:
      "Manage free, premium, trial, scholarship, and adminManual access.",
    currentStatus: "Backend access foundation is ready.",
    nextConnection: "Connect premium actions after Users page is stable.",
    apiHint:
      "PUT /admin/users/{user_id}/access, revoke, expire, restore-free",
  },
  backup: {
    title: "Backup",
    code: "BK",
    purpose: "Export content and prepare safety backup routines.",
    currentStatus: "Content export API already exists.",
    nextConnection: "Connect export action after Content page is stable.",
    apiHint: "GET /admin/content/export",
  },
  settings: {
    title: "Settings",
    code: "ST",
    purpose:
      "Manage dashboard configuration, environment notes, and future team settings.",
    currentStatus: "Temporary admin-key foundation is active.",
    nextConnection: "Add settings after core pages are useful.",
    apiHint: "Future: roles, admin profile, environment settings",
  },
};

const emptyMetrics: DashboardMetrics = {
  totalUsers: 0,
  usersLeftPlatform: 0,
  totalActiveUsers: 0,
  totalPaidUsers: 0,
  totalUnpaidUsers: 0,
  totalNonSeriousUsers: 0,
  totalContent: 0,
  publishedContent: 0,
  unpublishedContent: 0,
  expiredUsers: 0,
  revokedUsers: 0,
  aiUsageToday: 0,
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
  const [phoneSearchInput, setPhoneSearchInput] = useState("");
  const [phoneSearchMessage, setPhoneSearchMessage] = useState("");

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
        usersLeftPlatform: 0,
        totalActiveUsers: readNumber(userMetricsResponse.activeUsers),
        totalPaidUsers: readNumber(userMetricsResponse.premiumUsers),
        totalUnpaidUsers: readNumber(userMetricsResponse.freeUsers),
        totalNonSeriousUsers: 0,
        totalContent: contentItems.length,
        publishedContent,
        unpublishedContent: contentItems.length - publishedContent,
        expiredUsers: readNumber(userMetricsResponse.expiredUsers),
        revokedUsers: readNumber(userMetricsResponse.revokedUsers),
        aiUsageToday: 0,
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
    if (isLoggedIn && (activePage === "dashboard" || activePage === "users")) {
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
    setPhoneSearchInput("");
    setPhoneSearchMessage("");
    setActivePage("dashboard");
    setIsLoggedIn(false);
  }

  function handlePhoneSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phone = phoneSearchInput.trim();

    if (!phone) {
      setPhoneSearchMessage("Enter a registered phone number first.");
      return;
    }

    setPhoneSearchMessage(
      `Phone search for ${phone} will connect to GET /admin/users/search in Phase 15G.`
    );
  }

  function getPageTitle() {
    if (activePage === "dashboard") {
      return "Dashboard";
    }

    if (activePage === "users") {
      return "Users";
    }

    if (activePage === "aiUsage") {
      return "AI Usage";
    }

    if (activePage === "systemHealth") {
      return "System Health";
    }

    return moduleDetails[activePage].title;
  }

  function getPageSubtitle() {
    if (activePage === "dashboard") {
      return "Short founder overview for users, paid users, content, AI usage, and system health.";
    }

    if (activePage === "users") {
      return "User numerical data, category access, and registered phone number search.";
    }

    if (activePage === "aiUsage") {
      return "Monitor AI providers, usage frequency, paid/open-source tools, and service usage.";
    }

    if (activePage === "systemHealth") {
      return "Monitor backend, admin dashboard, AI tools, STT/TTS/STS/Translate health, and stability.";
    }

    return moduleDetails[activePage].purpose;
  }

  function renderDataCard(
    label: string,
    value: number | string,
    helper: string,
    onClick?: () => void
  ) {
    const Tag = onClick ? "button" : "div";

    return (
      <Tag
        className={`top-data-card ${onClick ? "clickable-card" : ""}`}
        type={onClick ? "button" : undefined}
        onClick={onClick}
      >
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </Tag>
    );
  }

  function renderLoadingOrError() {
    if (isDashboardLoading) {
      return (
        <section className="compact-card">
          <div className="message-row">
            <span className="module-code">DB</span>
            <div>
              <h2>Loading dashboard data...</h2>
              <p>Render may take a little time to wake up.</p>
            </div>
          </div>
        </section>
      );
    }

    if (dashboardError) {
      return (
        <section className="compact-card alert-card">
          <div className="message-row">
            <span className="module-code warning">!</span>
            <div>
              <h2>Unable to load dashboard data.</h2>
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
      );
    }

    return null;
  }

  function renderDashboardSummary() {
    const statusBlock = renderLoadingOrError();

    if (statusBlock) {
      return statusBlock;
    }

    return (
      <>
        <section className="dashboard-summary-row">
          {renderDataCard(
            "Total Users",
            dashboardMetrics.totalUsers,
            "Registered users",
            () => setActivePage("users")
          )}
          {renderDataCard(
            "Paid Users",
            dashboardMetrics.totalPaidUsers,
            "Premium users",
            () => setActivePage("users")
          )}
          {renderDataCard(
            "Unpaid Users",
            dashboardMetrics.totalUnpaidUsers,
            "Free users",
            () => setActivePage("users")
          )}
          {renderDataCard(
            "Content Items",
            dashboardMetrics.totalContent,
            "All content",
            () => setActivePage("content")
          )}
          {renderDataCard(
            "AI Usage Today",
            dashboardMetrics.aiUsageToday,
            "Coming later",
            () => setActivePage("aiUsage")
          )}
          {renderDataCard(
            "System Health",
            "Manual",
            "Coming later",
            () => setActivePage("systemHealth")
          )}
        </section>

        <section className="compact-card">
          <div className="compact-section-title">
            <div>
              <h2>Dashboard Summary</h2>
              <p>
                This dashboard is only for quick overview. Detailed user control
                is inside Users, content access is inside Content, and AI/tool
                monitoring is inside AI Usage and System Health.
              </p>
            </div>

            <button
              className="small-button"
              type="button"
              onClick={loadDashboardMetrics}
            >
              Refresh Data
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderUsersTopDataRow() {
    const statusBlock = renderLoadingOrError();

    if (statusBlock) {
      return statusBlock;
    }

    return (
      <section className="top-data-row">
        {renderDataCard(
          "Total Users",
          dashboardMetrics.totalUsers,
          "Click later for all users"
        )}
        {renderDataCard(
          "Users Left Platform",
          dashboardMetrics.usersLeftPlatform,
          "Future churn metric"
        )}
        {renderDataCard(
          "Total Active Users",
          dashboardMetrics.totalActiveUsers,
          "Active users"
        )}
        {renderDataCard(
          "Total Paid Users",
          dashboardMetrics.totalPaidUsers,
          "Premium users"
        )}
        {renderDataCard(
          "Total Unpaid Users",
          dashboardMetrics.totalUnpaidUsers,
          "Free users"
        )}
        {renderDataCard(
          "Total Non-serious Users",
          dashboardMetrics.totalNonSeriousUsers,
          "Future activity metric"
        )}
      </section>
    );
  }

  function renderPhoneSearchSection() {
    return (
      <section className="compact-card">
        <div className="compact-section-title">
          <div>
            <h2>Search User</h2>
            <p>Search only by registered phone number.</p>
          </div>
        </div>

        <form className="phone-search-form" onSubmit={handlePhoneSearch}>
          <input
            value={phoneSearchInput}
            onChange={(event) => setPhoneSearchInput(event.target.value)}
            placeholder="Enter registered phone number"
            type="search"
          />

          <button className="small-button primary-small" type="submit">
            Search User
          </button>
        </form>

        {phoneSearchMessage ? (
          <p className="inline-info-message">{phoneSearchMessage}</p>
        ) : null}
      </section>
    );
  }

  function renderUsersPage() {
    return (
      <>
        {renderUsersTopDataRow()}
        {renderPhoneSearchSection()}

        <section className="compact-card">
          <div className="compact-section-title">
            <div>
              <h2>User Data Access</h2>
              <p>
                These numerical cards are prepared to become clickable user
                groups later: all users, left users, active users, paid users,
                unpaid users, and non-serious users.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderAiUsagePage() {
    return (
      <>
        <section className="compact-card">
          <div className="module-page-heading">
            <span className="module-code large">AI</span>
            <div>
              <h2>AI Usage Monitor</h2>
              <p>
                Monitor AI usage per minute, per hour, per day, provider usage,
                paid/open-source tools, and service usage.
              </p>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="compact-card">
            <h2>AI Usage Overview</h2>
            <ul className="clean-list">
              <li>Usage per minute</li>
              <li>Usage per hour</li>
              <li>Usage per day</li>
              <li>Total AI requests</li>
              <li>Failed AI requests</li>
              <li>Average response time</li>
              <li>Estimated cost later</li>
            </ul>
          </div>

          <div className="compact-card">
            <h2>AI Providers</h2>
            <ul className="clean-list">
              <li>OpenAI</li>
              <li>Gemini</li>
              <li>Future provider</li>
              <li>Active/inactive status later</li>
              <li>Usage count by provider later</li>
            </ul>
          </div>

          <div className="compact-card">
            <h2>Tools / Services</h2>
            <ul className="clean-list">
              <li>STT</li>
              <li>TTS</li>
              <li>STS</li>
              <li>Translate</li>
              <li>Grammar correction</li>
              <li>Speaking feedback</li>
              <li>Pronunciation feedback</li>
              <li>Conversation response</li>
            </ul>
          </div>

          <div className="compact-card">
            <h2>Tool Type</h2>
            <ul className="clean-list">
              <li>Paid tools</li>
              <li>Open-source tools</li>
              <li>Internal rule-based tools</li>
              <li>Cost control later</li>
            </ul>
          </div>
        </section>
      </>
    );
  }

  function renderSystemHealthPage() {
    return (
      <>
        <section className="compact-card">
          <div className="module-page-heading">
            <span className="module-code large">SH</span>
            <div>
              <h2>System Health</h2>
              <p>
                Monitor backend, admin dashboard, mobile API connection, AI
                providers, language tools, and stability.
              </p>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="compact-card">
            <h2>System Health</h2>
            <ul className="clean-list">
              <li>Backend API status</li>
              <li>Render status</li>
              <li>Admin dashboard status</li>
              <li>Mobile app API connection status</li>
            </ul>
          </div>

          <div className="compact-card">
            <h2>Tool Health</h2>
            <ul className="clean-list">
              <li>OpenAI health</li>
              <li>Gemini health</li>
              <li>STT health</li>
              <li>TTS health</li>
              <li>STS health</li>
              <li>Translate health</li>
            </ul>
          </div>

          <div className="compact-card">
            <h2>Stability</h2>
            <ul className="clean-list">
              <li>Failed requests</li>
              <li>Slow responses</li>
              <li>Error count</li>
              <li>Last checked time</li>
            </ul>
          </div>
        </section>
      </>
    );
  }

  function renderModulePlaceholder(
    page: Exclude<AdminPage, "dashboard" | "users" | "aiUsage" | "systemHealth">
  ) {
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
      return renderDashboardSummary();
    }

    if (activePage === "users") {
      return renderUsersPage();
    }

    if (activePage === "aiUsage") {
      return renderAiUsagePage();
    }

    if (activePage === "systemHealth") {
      return renderSystemHealthPage();
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
            Enter your admin key to access the admin dashboard.
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
        <div className="admin-account-card compact-admin-account">
          <div className="admin-account-top">
            <div>
              <p className="eyebrow">Admin Account</p>
              <h1>Admin</h1>
            </div>
            <span className="admin-key-pill">Key Saved</span>
          </div>

          <div className="admin-account-mini-row">
            <span>Render</span>
            <span>Development</span>
          </div>
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
            <p className="eyebrow">Admin Dashboard</p>
            <h1>{getPageTitle()}</h1>
            <p>{getPageSubtitle()}</p>
          </div>

          <button
            className="small-button"
            type="button"
            onClick={loadDashboardMetrics}
          >
            Refresh Data
          </button>
        </header>

        {renderPageContent()}
      </section>
    </main>
  );
}

export default App;

