import { tokenStore } from "./tokenStore";
import type { ApiEnvelope, AuthTokens } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

/** Error thrown for any non-success API response, carrying the backend code/message. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Internal flag to prevent infinite refresh loops. */
  _retry?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

const attemptRefresh = async (): Promise<boolean> => {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiEnvelope<AuthTokens>;
    if (!res.ok || !json.success) {
      tokenStore.clear();
      return false;
    }
    tokenStore.set(json.data);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, _retry = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Attempt a one-time token refresh on 401, then replay the request.
  if (res.status === 401 && auth && !_retry) {
    refreshPromise ??= attemptRefresh();
    const refreshed = await refreshPromise;
    refreshPromise = null;
    if (refreshed) {
      return request<T>(path, { ...options, _retry: true });
    }
  }

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(res.status, "NETWORK_ERROR", "Unexpected server response");
  }

  if (!json.success) {
    throw new ApiError(res.status, json.error.code, json.error.message, json.error.details);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
};

export { API_URL };
