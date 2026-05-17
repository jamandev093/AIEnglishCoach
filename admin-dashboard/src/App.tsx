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
  | "speakingAnalytics"
  | "mistakeMemory"
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
  description: string;
  code: string;
};

type ServiceCard = {
  title: string;
  code: string;
  description: string;
  status: "Connected" | "Foundation Ready" | "Coming Next" | "Planned";
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
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Control center overview",
    code: "DB",
  },
  {
    id: "users",
    label: "Users",
    description: "User list and access",
    code: "US",
  },
  {
    id: "content",
    label: "Content",
    description: "Learning content studio",
    code: "CT",
  },
  {
    id: "premium",
    label: "Premium Access",
    description: "Plans, trials, access control",
    code: "PR",
  },
  {
    id: "aiTasks",
    label: "AI Tasks",
    description: "AI feedback and usage",
    code: "AI",
  },
  {
    id: "speakingAnalytics",
    label: "Speaking Analytics",
    description: "Fluency and confidence trends",
    code: "SA",
  },
  {
    id: "mistakeMemory",
    label: "Mistake Memory",
    description: "Repeated mistake signals",
    code: "MM",
  },
  {
    id: "systemHealth",
    label: "System Health",
    description: "Backend and API checks",
    code: "SH",
  },
  {
    id: "backup",
    label: "Backup / Export",
    description: "Data and content export",
    code: "BE",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Admin configuration",
    code: "ST",
  },
];

const moduleDetails: Record<Exclude<AdminPage, "dashboard">, ModuleDetail> = {
  users: {
    title: "Users Management",
    code: "US",
    purpose:
      "View users, search by phone, inspect access status, and prepare safe user management workflows.",
    currentStatus:
      "Backend user/admin access endpoints are ready. Full table connection starts in Phase 15G.",
    nextConnection:
      "Connect GET /admin/users, GET /admin/users/search, and GET /admin/users/metrics.",
    apiHint:
      "GET /admin/users, GET /admin/users/search, GET /admin/users/{user_id}",
  },
  content: {
    title: "Content Studio",
    code: "CT",
    purpose:
      "Manage stories, confidence videos, reading-listening content, and conversation topics.",
    currentStatus:
      "Admin content list, detail, create, update, publish, unpublish, archive, and export APIs are ready.",
    nextConnection:
      "Connect content list first, then add safe create/edit/publish/archive actions one by one.",
    apiHint:
      "GET /admin/content, GET /admin/content/{content_id}, POST /admin/content",
  },
  premium: {
    title: "Premium Access Control",
    code: "PR",
    purpose:
      "Manage free, premium, trial, scholarship, and adminManual access without touching mobile static content.",
    currentStatus:
      "Backend access foundation is ready. Premium should focus on AI-involved value, not static uploaded content.",
    nextConnection:
      "Connect admin user access update, revoke, expire, and restore-free actions after Users page is stable.",
    apiHint:
      "PUT /admin/users/{user_id}/access, POST /admin/users/{user_id}/access/restore-free",
  },
  aiTasks: {
    title: "AI Task Monitor",
    code: "AI",
    purpose:
      "Track AI feedback, AI speaking analysis, correction, coaching, and premium AI usage signals.",
    currentStatus:
      "Premium access guard foundation exists. AI task logging and usage metrics are planned later.",
    nextConnection:
      "Add AI usage/task history after core admin users and content flows are stable.",
    apiHint: "Future: AI task logs, usage metrics, premium AI checks",
  },
  speakingAnalytics: {
    title: "Speaking Analytics",
    code: "SA",
    purpose:
      "Track fluency, confidence, speaking activity, progress trends, and real speaking improvement signals.",
    currentStatus:
      "Planned for the future analytics foundation. Current dashboard keeps a professional placeholder.",
    nextConnection:
      "Connect speaking progress data after mobile speaking activity tracking becomes stable.",
    apiHint: "Future: speaking activity, confidence, fluency, progress history",
  },
  mistakeMemory: {
    title: "Mistake Memory",
    code: "MM",
    purpose:
      "Track repeated mistakes, adaptive coaching signals, and personalization data for learners.",
    currentStatus:
      "Planned for the personalization brain. This will later support adaptive coaching and daily plans.",
    nextConnection:
      "Add mistake memory APIs after speaking analysis and progress storage are stable.",
    apiHint: "Future: repeated mistakes, corrections, adaptive coaching signals",
  },
  systemHealth: {
    title: "System Health",
    code: "SH",
    purpose:
      "Check Render backend availability, API connectivity, build status, and operational readiness.",
    currentStatus:
      "Manual checks for now. Admin dashboard already points to the Render backend, not localhost.",
    nextConnection:
      "Add lightweight health/status checks after main admin pages are connected.",
    apiHint: "GET /, future health/status endpoints",
  },
  backup: {
    title: "Backup & Export",
    code: "BE",
    purpose:
      "Export content and later prepare admin backup routines for JSON data, reports, and safety checkpoints.",
    currentStatus:
      "Content export API already exists. Full backup workflows come later.",
    nextConnection:
      "Connect content export download after Content Studio list/detail foundation is stable.",
    apiHint: "GET /admin/content/export",
  },
  settings: {
    title: "Admin Settings",
    code: "ST",
    purpose:
      "Manage dashboard configuration, admin environment notes, and future owner/team settings.",
    currentStatus:
      "Temporary admin-key foundation is active. Production roles and admin accounts come later.",
    nextConnection:
      "Add settings only after core users, content, and access pages are useful.",
    apiHint: "Future: admin profile, roles, environment settings",
  },
};

const serviceCards: ServiceCard[] = [
  {
    title: "Users Management",
    code: "US",
    description: "User list, search, and access status foundation.",
    status: "Coming Next",
  },
  {
    title: "Content Studio",
    code: "CT",
    description: "Stories, videos, reading-listening, and topics.",
    status: "Foundation Ready",
  },
  {
    title: "Premium Access Control",
    code: "PR",
    description: "Manual premium, trial, scholarship, revoke, expire.",
    status: "Foundation Ready",
  },
  {
    title: "AI Task Monitor",
    code: "AI",
    description: "Premium AI feedback and speaking analysis usage.",
    status: "Planned",
  },
  {
    title: "Speaking Analytics",
    code: "SA",
    description: "Fluency, confidence, speaking progress trends.",
    status: "Planned",
  },
  {
    title: "Mistake Memory",
    code: "MM",
    description: "Repeated mistakes and adaptive coaching signals.",
    status: "Planned",
  },
  {
    title: "System Health",
    code: "SH",
    description: "Render backend and API readiness checks.",
    status: "Coming Next",
  },
  {
    title: "Backup & Export",
    code: "BE",
    description: "Content export and future safety backups.",
    status: "Foundation Ready",
  },
  {
    title: "Admin Settings",
    code: "ST",
    description: "Environment, admin access, future team roles.",
    status: "Planned",
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
    if (activePage === "dashboard") {
      return "Admin Control Center";
    }

    return moduleDetails[activePage].title;
  }

  function getPageSubtitle() {
    if (activePage === "dashboard") {
      return "Professional founder dashboard for backend, content, premium access, AI tasks, analytics, and operations.";
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

  function renderStatusStrip() {
    return (
      <div className="status-strip">
        <div>
          <span>Backend</span>
          <strong>Render API</strong>
        </div>
        <div>
          <span>Admin Key</span>
          <strong>Saved Locally</strong>
        </div>
        <div>
          <span>Mobile App</span>
          <strong>Separate / Clean</strong>
        </div>
        <div>
          <span>Environment</span>
          <strong>Development Admin</strong>
        </div>
      </div>
    );
  }

  function renderServiceCard(card: ServiceCard) {
    return (
      <article className="service-card" key={card.title}>
        <div className="service-card-header">
          <div className="module-code">{card.code}</div>
          <span className={`status-pill status-${card.status.toLowerCase().replaceAll(" ", "-")}`}>
            {card.status}
          </span>
        </div>

        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </article>
    );
  }

  function renderDashboardContent() {
    if (isDashboardLoading) {
      return (
        <section className="page-card">
          <div className="module-code large">DB</div>
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
        <>
          <section className="page-card alert-card">
            <div className="module-code large warning">!</div>
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

          <section className="page-card">
            <h2>Control Center Modules</h2>
            <p>
              The dashboard shell is ready. Metrics need a valid Render admin key
              to load real backend data.
            </p>
            <div className="service-grid">{serviceCards.map(renderServiceCard)}</div>
          </section>
        </>
      );
    }

    return (
      <>
        <section className="page-card">
          <div className="section-heading">
            <div>
              <div className="module-code large">DB</div>
              <h2>Operations Overview</h2>
              <p>
                Dashboard summary cards connect to existing backend admin APIs.
              </p>
            </div>
          </div>

          {renderStatusStrip()}

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
        </section>

        <section className="page-card">
          <h2>Control Center Services</h2>
          <p>
            Professional admin modules are organized now. Each module will be
            connected safely one phase at a time.
          </p>
          <div className="service-grid">{serviceCards.map(renderServiceCard)}</div>
        </section>

        <section className="page-card action-panel">
          <div>
            <h2>Next Recommended Build Steps</h2>
            <p>
              Keep the dashboard professional while connecting real features in a
              safe order.
            </p>
          </div>

          <ol className="next-steps">
            <li>Connect Users Management list/search foundation.</li>
            <li>Connect Content Studio list/detail foundation.</li>
            <li>Add Premium Access controls after Users page is stable.</li>
            <li>Add System Health checks and Backup export actions.</li>
          </ol>
        </section>

        <section className="page-card compact-card">
          <span>Saved Admin Key</span>
          <strong>{maskedAdminKey}</strong>
          <p>
            Dashboard requests use this key in the X-Admin-Key header through
            the admin API client.
          </p>
        </section>
      </>
    );
  }

  function renderModulePlaceholder(page: Exclude<AdminPage, "dashboard">) {
    const detail = moduleDetails[page];

    return (
      <section className="page-card module-detail-card">
        <div className="module-code large">{detail.code}</div>
        <h2>{detail.title}</h2>
        <p>{detail.purpose}</p>

        <div className="detail-grid">
          <div>
            <span>Current Status</span>
            <strong>{detail.currentStatus}</strong>
          </div>
          <div>
            <span>Next Planned Connection</span>
            <strong>{detail.nextConnection}</strong>
          </div>
          <div>
            <span>Relevant API / Future Service</span>
            <strong>{detail.apiHint}</strong>
          </div>
        </div>
      </section>
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
            Enter your admin key to access the professional admin control center.
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
              <span className="nav-text">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
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
            <p className="eyebrow">Phase 15F-2</p>
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
