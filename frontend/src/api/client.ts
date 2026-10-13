import type { TokenPair } from "./types";

export const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000/api/v1";

const ACCESS = "capqa.access";
const REFRESH = "capqa.refresh";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const tokens = {
  get access() { return sessionStorage.getItem(ACCESS); },
  get refresh() { return sessionStorage.getItem(REFRESH); },
  set(pair: TokenPair) { sessionStorage.setItem(ACCESS, pair.access_token); sessionStorage.setItem(REFRESH, pair.refresh_token); },
  clear() { sessionStorage.removeItem(ACCESS); sessionStorage.removeItem(REFRESH); },
};

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void): void { onUnauthorized = fn; }

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      tokens.set((await res.json()) as TokenPair);
      return true;
    } catch { return false; } finally { refreshing = null; }
  })();
  return refreshing;
}

async function toError(res: Response): Promise<ApiError> {
  let code = "ERROR"; let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error) { code = body.error.code; message = body.error.message; }
    else if (Array.isArray(body?.detail)) {
      code = "VALIDATION_ERROR";
      message = body.detail.map((d: { loc?: unknown[]; msg: string }) => `${(d.loc ?? []).slice(1).join(".")}: ${d.msg}`).join("; ");
    } else if (typeof body?.detail === "string") message = body.detail;
  } catch { /* non-JSON body */ }
  return new ApiError(res.status, code, message);
}

export interface RequestOptions {
  method?: string; query?: Record<string, string | number | boolean | undefined | null>;
  json?: unknown; form?: URLSearchParams | FormData; auth?: boolean; raw?: boolean;
}

export async function request<T>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (opts.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(opts.json); }
  else if (opts.form) body = opts.form;
  if (opts.auth !== false && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res: Response;
  try { res = await fetch(url, { method: opts.method ?? "GET", headers, body }); }
  catch { throw new ApiError(0, "NETWORK", "Cannot reach the server. Check your connection and that the API is running."); }

  if (res.status === 401 && opts.auth !== false && !retried && (await refreshTokens())) return request<T>(path, opts, true);
  if (res.status === 401 && opts.auth !== false) { tokens.clear(); onUnauthorized(); }
  if (!res.ok) throw await toError(res);
  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const get = <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { query });
export const post = <T>(path: string, json?: unknown, query?: RequestOptions["query"]) => request<T>(path, { method: "POST", json, query });
export const patch = <T>(path: string, json: unknown) => request<T>(path, { method: "PATCH", json });
export const put = <T>(path: string, json: unknown) => request<T>(path, { method: "PUT", json });

/** Download a protected file (reports) using the bearer token. */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const res = await request<Response>(path, { raw: true });
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}
