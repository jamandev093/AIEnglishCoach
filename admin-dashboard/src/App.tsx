import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminGet,
  clearAdminKey,
  getAdminKey,
  hasAdminKey,
  saveAdminKey,
} from "./api/adminApi";

type AdminPage =
  | "adminAccount"
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

type AdminUser = {
  id?: string;
  userId?: string;
  phone?: string;
  phoneNumber?: string;
  displayName?: string;
  name?: string;
  accessLevel?: string;
  accessStatus?: string;
  accessSource?: string;
  isPremiumActive?: boolean;
  courseName?: string | null;
  accessExpiresAt?: string | null;
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
  id: Exclude<AdminPage, "adminAccount">;
  label: string;
  code: string;
};

type UserMetricKey =
  | "all"
  | "left"
  | "active"
  | "paid"
  | "unpaid"
  | "nonSerious";

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

function normalizeUserList(response: unknown): AdminUser[] {
  if (Array.isArray(response)) {
    return response as AdminUser[];
  }

  if (
    response &&
    typeof response === "object" &&
    "users" in response &&
    Array.isArray((response as { users?: unknown }).users)
  ) {
    return (response as { users: AdminUser[] }).users;
  }

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray((response as { items?: unknown }).items)
  ) {
    return (response as { items: AdminUser[] }).items;
  }

  return [];
}

function normalizeSearchUser(response: unknown): AdminUser | null {
  const list = normalizeUserList(response);

  if (list.length > 0) {
    return list[0];
  }

  if (response && typeof response === "object") {
    return response as AdminUser;
  }

  return null;
}

function getUserId(user: AdminUser): string {
  return user.userId ?? user.id ?? "—";
}

function getUserPhone(user: AdminUser): string {
  return user.phoneNumber ?? user.phone ?? "—";
}

function getUserName(user: AdminUser): string {
  return user.displayName ?? user.name ?? "No name";
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasAdminKey());
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");

  const [phoneSearchInput, setPhoneSearchInput] = useState("");
  const [phoneSearchMessage, setPhoneSearchMessage] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [searchedUser, setSearchedUser] = useState<AdminUser | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [selectedUserMetric, setSelectedUserMetric] =
    useState<UserMetricKey>("all");

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
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard metrics."
      );
    } finally {
      setIsDashboardLoading(false);
    }
  }

  async function loadUsers() {
    if (!hasAdminKey()) {
      return;
    }

    setIsUsersLoading(true);
    setUsersError("");

    try {
      const response = await adminGet<unknown>("/admin/users");
      setUsers(normalizeUserList(response));
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : "Unable to load users."
      );
    } finally {
      setIsUsersLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn && (activePage === "dashboard" || activePage === "users")) {
      void loadDashboardMetrics();
    }

    if (isLoggedIn && activePage === "users") {
      void loadUsers();
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
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save admin key."
      );
    }
  }

  function handleLogout() {
    clearAdminKey();
    setAdminKeyInput("");
    setErrorMessage("");
    setDashboardError("");
    setUsersError("");
    setDashboardMetrics(emptyMetrics);
    setPhoneSearchInput("");
    setPhoneSearchMessage("");
    setSearchedUser(null);
    setUsers([]);
    setActivePage("dashboard");
    setIsLoggedIn(false);
  }

  async function handlePhoneSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phone = phoneSearchInput.trim();

    if (!phone) {
      setPhoneSearchMessage("Enter a registered phone number first.");
      setSearchedUser(null);
      return;
    }

    setIsSearchingUser(true);
    setPhoneSearchMessage("");
    setSearchedUser(null);

    try {
      const response = await adminGet<unknown>(
        `/admin/users/search?phone=${encodeURIComponent(phone)}`
      );
      const user = normalizeSearchUser(response);

      if (!user) {
        setPhoneSearchMessage("No user found for this phone number.");
        return;
      }

      setSearchedUser(user);
      setPhoneSearchMessage("User found.");
    } catch (error) {
      setPhoneSearchMessage(
        error instanceof Error ? error.message : "Unable to search user."
      );
    } finally {
      setIsSearchingUser(false);
    }
  }

  function getPageTitle() {
    if (activePage === "adminAccount") return "Admin Account";
    if (activePage === "dashboard") return "Dashboard";
    if (activePage === "users") return "Users";
    if (activePage === "content") return "Content";
    if (activePage === "premium") return "Premium";
    if (activePage === "aiUsage") return "AI Usage";
    if (activePage === "systemHealth") return "System Health";
    if (activePage === "backup") return "Backup";
    return "Settings";
  }

  function getPageSubtitle() {
    if (activePage === "adminAccount") {
      return "Admin access, backend target, security notes, and workflow.";
    }

    if (activePage === "dashboard") {
      return "Short founder overview for users, paid users, content, AI usage, and system health.";
    }

    if (activePage === "users") {
      return "User numerical data, category access, registered phone search, and read-only user list.";
    }

    if (activePage === "content") {
      return "Manage stories, confidence videos, reading-listening content, and topics.";
    }

    if (activePage === "premium") {
      return "Manage premium rules, access status, trials, scholarship, and manual access later.";
    }

    if (activePage === "aiUsage") {
      return "Monitor AI providers, usage frequency, paid/open-source tools, and service usage.";
    }

    if (activePage === "systemHealth") {
      return "Monitor backend, dashboard, AI tools, language tools, and stability.";
    }

    if (activePage === "backup") {
      return "Export content and prepare future backup/recovery workflows.";
    }

    return "Admin configuration, environment rules, and future team settings.";
  }

  function renderDataCard(
    label: string,
    value: number | string,
    helper: string,
    onClick?: () => void
  ) {
    if (onClick) {
      return (
        <button
          className="top-data-card clickable-card"
          type="button"
          onClick={onClick}
        >
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{helper}</small>
        </button>
      );
    }

    return (
      <div className="top-data-card">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    );
  }

  function renderUserMetricCard(
    key: UserMetricKey,
    label: string,
    value: number,
    helper: string
  ) {
    return (
      <button
        className={`user-metric-card ${
          selectedUserMetric === key ? "active-user-metric" : ""
        }`}
        type="button"
        onClick={() => setSelectedUserMetric(key)}
      >
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </button>
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

  function renderDashboardPage() {
    const statusBlock = renderLoadingOrError();

    if (statusBlock) {
      return statusBlock;
    }

    return (
      <>
        <section className="dashboard-summary-row">
          {renderDataCard("Total Users", dashboardMetrics.totalUsers, "Registered users", () => setActivePage("users"))}
          {renderDataCard("Paid Users", dashboardMetrics.totalPaidUsers, "Premium users", () => setActivePage("users"))}
          {renderDataCard("Unpaid Users", dashboardMetrics.totalUnpaidUsers, "Free users", () => setActivePage("users"))}
          {renderDataCard("Content Items", dashboardMetrics.totalContent, "All content", () => setActivePage("content"))}
          {renderDataCard("AI Usage Today", dashboardMetrics.aiUsageToday, "Coming later", () => setActivePage("aiUsage"))}
          {renderDataCard("System Health", "Manual", "Coming later", () => setActivePage("systemHealth"))}
        </section>

        <section className="compact-card">
          <div className="compact-section-title">
            <div>
              <h2>Dashboard Summary</h2>
              <p>
                Dashboard is only for quick overview. Detailed control is inside each function page.
              </p>
            </div>

            <button className="small-button" type="button" onClick={loadDashboardMetrics}>
              Refresh Data
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderUsersPage() {
    const hasStatusMessage = isDashboardLoading || dashboardError;

    return (
      <>
        <section className="users-metric-strip" aria-label="User metrics">
          {renderUserMetricCard("all", "Total Users", dashboardMetrics.totalUsers, "All users")}
          {renderUserMetricCard("left", "Left Platform", dashboardMetrics.usersLeftPlatform, "Future churn")}
          {renderUserMetricCard("active", "Active Users", dashboardMetrics.totalActiveUsers, "Active now")}
          {renderUserMetricCard("paid", "Paid Users", dashboardMetrics.totalPaidUsers, "Premium")}
          {renderUserMetricCard("unpaid", "Unpaid Users", dashboardMetrics.totalUnpaidUsers, "Free")}
          {renderUserMetricCard("nonSerious", "Non-serious", dashboardMetrics.totalNonSeriousUsers, "Future metric")}
        </section>

        {hasStatusMessage ? (
          <section className="users-status-strip">
            <div>
              <strong>Status</strong>
              <span>
                {isDashboardLoading
                  ? "Loading user metrics..."
                  : dashboardError}
              </span>
            </div>

            <button
              className="small-button primary-small"
              type="button"
              onClick={loadDashboardMetrics}
            >
              Retry
            </button>
          </section>
        ) : null}

        <section className="professional-search-panel compact-user-search">
          <div className="search-copy">
            <h2>Find registered user</h2>
            <p>Search only by registered phone number.</p>
          </div>

          <form className="professional-search-form" onSubmit={handlePhoneSearch}>
            <input
              value={phoneSearchInput}
              onChange={(event) => setPhoneSearchInput(event.target.value)}
              placeholder="Enter registered phone number"
              type="search"
            />

            <button className="small-button primary-small" type="submit">
              {isSearchingUser ? "Searching..." : "Search User"}
            </button>
          </form>

          {phoneSearchMessage ? (
            <p className="inline-info-message compact-message">{phoneSearchMessage}</p>
          ) : null}
        </section>

        {searchedUser ? (
          <section className="user-result-panel">
            <div className="user-result-header">
              <div>
                <span>User found</span>
                <h2>{getUserName(searchedUser)}</h2>
              </div>
              <strong>{searchedUser.isPremiumActive ? "Premium Active" : "Not Premium"}</strong>
            </div>

            <div className="user-info-grid">
              <div><span>User ID</span><strong>{getUserId(searchedUser)}</strong></div>
              <div><span>Phone</span><strong>{getUserPhone(searchedUser)}</strong></div>
              <div><span>Access Level</span><strong>{searchedUser.accessLevel ?? "—"}</strong></div>
              <div><span>Access Status</span><strong>{searchedUser.accessStatus ?? "—"}</strong></div>
              <div><span>Access Source</span><strong>{searchedUser.accessSource ?? "—"}</strong></div>
              <div><span>Course</span><strong>{searchedUser.courseName ?? "—"}</strong></div>
            </div>
          </section>
        ) : null}

        <section className="compact-card compact-users-list-card">
          <div className="users-list-header">
            <div>
              <h2>Users List</h2>
              <p>
                Read-only foundation. Premium actions come later.
              </p>
            </div>

            <button className="small-button" type="button" onClick={loadUsers}>
              Refresh Users
            </button>
          </div>

          {isUsersLoading ? (
            <p className="inline-info-message compact-message">Loading users...</p>
          ) : usersError ? (
            <p className="inline-info-message compact-message">{usersError}</p>
          ) : (
            <div className="users-list-table">
              {users.length === 0 ? (
                <p className="empty-state">No users loaded yet.</p>
              ) : (
                users.slice(0, 12).map((user) => (
                  <div className="user-row" key={getUserId(user)}>
                    <div>
                      <span>Phone</span>
                      <strong>{getUserPhone(user)}</strong>
                    </div>
                    <div>
                      <span>Name</span>
                      <strong>{getUserName(user)}</strong>
                    </div>
                    <div>
                      <span>Access</span>
                      <strong>{user.accessLevel ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{user.accessStatus ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Premium</span>
                      <strong>{user.isPremiumActive ? "Yes" : "No"}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </>
    );
  }
function renderAdminAccountPage() {
    return (
      <>
        <section className="compact-card">
          <div className="module-page-heading">
            <span className="module-code large">AC</span>
            <div>
              <h2>Admin Access</h2>
              <p>
                Temporary admin-key access is active for the separate web admin dashboard.
              </p>
            </div>
          </div>

          <div className="account-status-grid">
            {renderDataCard("Admin Key", hasAdminKey() ? "Saved" : "Missing", "Local browser storage")}
            {renderDataCard("Backend", "Render", "Remote backend target")}
            {renderDataCard("Mode", "Development", "Current admin foundation")}
            {renderDataCard("Access Type", "Admin Key", "Temporary V1 access")}
          </div>
        </section>

        <section className="compact-card">
          <h2>Security Notes</h2>
          <div className="detail-grid">
            <div><span>Current Login</span><strong>Temporary admin-key login is active.</strong></div>
            <div><span>Production Auth</span><strong>JWT/session auth and real admin accounts come later.</strong></div>
            <div><span>Team Roles</span><strong>Owner, team, teacher, and developer permissions come later.</strong></div>
            <div><span>Mobile Safety</span><strong>Mobile users cannot see this admin dashboard.</strong></div>
          </div>
        </section>

        <section className="compact-card">
          <h2>Admin Workflow</h2>
          <div className="workflow-grid">
            <button type="button" onClick={() => setActivePage("dashboard")}>Dashboard <span>Summary</span></button>
            <button type="button" onClick={() => setActivePage("users")}>Users <span>User control</span></button>
            <button type="button" onClick={() => setActivePage("content")}>Content <span>Content management</span></button>
            <button type="button" onClick={() => setActivePage("premium")}>Premium <span>Access control</span></button>
            <button type="button" onClick={() => setActivePage("aiUsage")}>AI Usage <span>AI/cost monitor</span></button>
            <button type="button" onClick={() => setActivePage("systemHealth")}>System Health <span>Stability</span></button>
            <button type="button" onClick={() => setActivePage("backup")}>Backup <span>Export/recovery</span></button>
            <button type="button" onClick={() => setActivePage("settings")}>Settings <span>Configuration</span></button>
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
              <p>Monitor AI usage, providers, paid/open-source tools, and service usage.</p>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="compact-card"><h2>AI Usage Overview</h2><ul className="clean-list"><li>Usage per minute</li><li>Usage per hour</li><li>Usage per day</li><li>Total AI requests</li><li>Failed AI requests</li><li>Average response time</li><li>Estimated cost later</li></ul></div>
          <div className="compact-card"><h2>AI Providers</h2><ul className="clean-list"><li>OpenAI</li><li>Gemini</li><li>Future provider</li><li>Active/inactive status later</li><li>Usage count by provider later</li></ul></div>
          <div className="compact-card"><h2>Tools / Services</h2><ul className="clean-list"><li>STT</li><li>TTS</li><li>STS</li><li>Translate</li><li>Grammar correction</li><li>Speaking feedback</li><li>Pronunciation feedback</li><li>Conversation response</li></ul></div>
          <div className="compact-card"><h2>Tool Type</h2><ul className="clean-list"><li>Paid tools</li><li>Open-source tools</li><li>Internal rule-based tools</li><li>Cost control later</li></ul></div>
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
              <p>Monitor backend, dashboard, mobile API connection, AI providers, and language tools.</p>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="compact-card"><h2>System Health</h2><ul className="clean-list"><li>Backend API status</li><li>Render status</li><li>Admin dashboard status</li><li>Mobile app API connection status</li></ul></div>
          <div className="compact-card"><h2>Tool Health</h2><ul className="clean-list"><li>OpenAI health</li><li>Gemini health</li><li>STT health</li><li>TTS health</li><li>STS health</li><li>Translate health</li></ul></div>
          <div className="compact-card"><h2>Stability</h2><ul className="clean-list"><li>Failed requests</li><li>Slow responses</li><li>Error count</li><li>Last checked time</li></ul></div>
        </section>
      </>
    );
  }

  function renderSimplePage(code: string, title: string, purpose: string, status: string, next: string, api: string) {
    return (
      <>
        <section className="compact-card">
          <div className="module-page-heading">
            <span className="module-code large">{code}</span>
            <div><h2>{title}</h2><p>{purpose}</p></div>
          </div>
        </section>

        <section className="compact-card">
          <div className="detail-grid">
            <div><span>Current Status</span><strong>{status}</strong></div>
            <div><span>Next Connection</span><strong>{next}</strong></div>
            <div><span>API / Future Service</span><strong>{api}</strong></div>
          </div>
        </section>
      </>
    );
  }

  function renderPageContent() {
    if (activePage === "adminAccount") return renderAdminAccountPage();
    if (activePage === "dashboard") return renderDashboardPage();
    if (activePage === "users") return renderUsersPage();
    if (activePage === "aiUsage") return renderAiUsagePage();
    if (activePage === "systemHealth") return renderSystemHealthPage();

    if (activePage === "content") {
      return renderSimplePage("CT", "Content", "Manage stories, videos, reading-listening content, and topics.", "Admin content APIs are ready.", "Connect content list/detail foundation after Users page.", "GET /admin/content, GET /admin/content/{content_id}");
    }

    if (activePage === "premium") {
      return renderSimplePage("PR", "Premium", "Manage free, premium, trial, scholarship, and adminManual access.", "Backend access foundation is ready.", "Connect premium actions after Users page is stable.", "PUT /admin/users/{user_id}/access, revoke, expire, restore-free");
    }

    if (activePage === "backup") {
      return renderSimplePage("BK", "Backup", "Export content and prepare safety backup routines.", "Content export API already exists.", "Connect export action after Content page is stable.", "GET /admin/content/export");
    }

    return renderSimplePage("ST", "Settings", "Manage dashboard configuration, environment notes, and future team settings.", "Temporary admin-key foundation is active.", "Add settings after core pages are useful.", "Future: roles, admin profile, environment settings");
  }

  if (!isLoggedIn) {
    return (
      <main className="admin-shell">
        <section className="auth-card">
          <p className="eyebrow">AI English Coach</p>
          <h1>Admin Login</h1>
          <p className="lead">Enter your admin key to access the admin dashboard.</p>

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

            {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

            <button className="primary-button" type="submit">Login</button>
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
        <button
          className={`admin-account-card admin-account-button ${
            activePage === "adminAccount" ? "active-account" : ""
          }`}
          type="button"
          onClick={() => setActivePage("adminAccount")}
        >
          <div className="admin-account-top">
            <div>
              <p className="eyebrow">Admin Account</p>
              <h1>Admin</h1>
            </div>
            <span className="admin-key-pill">Key</span>
          </div>

          <div className="admin-account-mini-row">
            <span>Render</span>
            <span>Dev</span>
          </div>
        </button>

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

          <button className="small-button" type="button" onClick={loadDashboardMetrics}>
            Refresh Data
          </button>
        </header>

        {renderPageContent()}
      </section>
    </main>
  );
}

export default App;

