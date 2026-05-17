const API_BASE_URL = "https://aienglishcoach-backend.onrender.com";

const ADMIN_KEY_STORAGE_KEY = "aiEnglishCoachAdminKey";

type HttpMethod = "GET" | "POST" | "PUT";

type BackendErrorResponse = {
  detail?: string;
  message?: string;
};

export function saveAdminKey(key: string): void {
  const cleanKey = key.trim();

  if (!cleanKey) {
    throw new Error("Admin key is missing.");
  }

  localStorage.setItem(ADMIN_KEY_STORAGE_KEY, cleanKey);
}

export function getAdminKey(): string {
  return localStorage.getItem(ADMIN_KEY_STORAGE_KEY) ?? "";
}

export function clearAdminKey(): void {
  localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
}

export function hasAdminKey(): boolean {
  return getAdminKey().trim().length > 0;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as BackendErrorResponse;

    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Use fallback below.
  }

  if (response.status === 401 || response.status === 403) {
    return "Invalid admin key.";
  }

  if (response.status === 404) {
    return "Not found.";
  }

  return "Request failed.";
}

async function adminRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const adminKey = getAdminKey().trim();

  if (!adminKey) {
    throw new Error("Admin key is missing.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function adminGet<T>(path: string): Promise<T> {
  return adminRequest<T>("GET", path);
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return adminRequest<T>("POST", path, body);
}

export function adminPut<T>(path: string, body?: unknown): Promise<T> {
  return adminRequest<T>("PUT", path, body);
}

export { API_BASE_URL };
