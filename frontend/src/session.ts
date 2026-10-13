import { API_BASE, setUnauthorizedHandler, tokens } from "./api/client";
import { auth } from "./api/services";
import type { RoleCode, User } from "./api/types";
import { modal, toast } from "./ui/components";
import { html } from "./ui/html";

type Listener = () => void;
let current: User | null = null;
const listeners = new Set<Listener>();
export const onSessionEvent = (fn: (event: string, payload: Record<string, unknown>) => void) => { eventHandlers.add(fn); };
const eventHandlers = new Set<(event: string, payload: Record<string, unknown>) => void>();

export const getUser = () => current;
export const isLoggedIn = () => current !== null;
export const hasRole = (...roles: RoleCode[]) => !!current && (roles.length === 0 || roles.includes(current.role));
export function subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); }

export async function restoreSession(): Promise<boolean> {
  if (!tokens.access && !tokens.refresh) return false;
  try { current = await auth.me(); startRealtime(); startIdleTimer(); return true; }
  catch { tokens.clear(); current = null; return false; }
}
export async function signIn(username: string, password: string): Promise<User> {
  await auth.login(username, password);
  current = await auth.me(); startRealtime(); startIdleTimer(); listeners.forEach((l) => l());
  return current;
}
export async function signOut(): Promise<void> {
  await auth.logout(); current = null; stopRealtime(); stopIdleTimer(); listeners.forEach((l) => l());
  location.hash = "#/login";
}
setUnauthorizedHandler(() => { current = null; stopRealtime(); stopIdleTimer(); if (!location.hash.startsWith("#/login")) { location.hash = "#/login"; toast("Your session has expired. Please sign in again.", "info"); } });

// ---- live updates (WebSocket) ----
let ws: WebSocket | null = null; let ping: number | undefined; let reconnect: number | undefined; let wantRealtime = false;
function startRealtime(): void {
  wantRealtime = true; if (ws || !tokens.access) return;
  const url = API_BASE.replace(/^http/, "ws") + "/ws";
  ws = new WebSocket(url);
  ws.onopen = () => { ws?.send(JSON.stringify({ type: "AUTH", token: tokens.access })); ping = window.setInterval(() => ws?.send(JSON.stringify({ type: "PING" })), 25000); };
  ws.onmessage = (m) => {
    try { const data = JSON.parse(m.data as string) as { event: string; payload?: Record<string, unknown> }; eventHandlers.forEach((h) => h(data.event, data.payload ?? {})); } catch { /* ignore */ }
  };
  ws.onclose = () => { clearInterval(ping); ws = null; if (wantRealtime && current) reconnect = window.setTimeout(startRealtime, 5000); };
}
function stopRealtime(): void { wantRealtime = false; clearTimeout(reconnect); clearInterval(ping); ws?.close(); ws = null; }

// ---- inactivity logout: backend default is 30 minutes ----
const IDLE_MS = 30 * 60 * 1000; const WARN_MS = 60 * 1000;
let idleTimer: number | undefined; let warnTimer: number | undefined; let warnOpen = false;
const reset = () => { if (warnOpen) return; clearTimeout(idleTimer); clearTimeout(warnTimer); idleTimer = window.setTimeout(warn, IDLE_MS - WARN_MS); };
function warn(): void {
  warnOpen = true; let left = WARN_MS / 1000;
  modal("Session timeout", html`<p class="text-sm text-slate-600">You will be signed out in <strong id="idle-left">${left}</strong> seconds because of inactivity.</p><div class="mt-6 flex justify-end gap-2"><button data-stay class="btn-primary">Stay signed in</button></div>`, (root, close) => {
    const tick = window.setInterval(() => { left -= 1; const el = root.querySelector("#idle-left"); if (el) el.textContent = String(left); if (left <= 0) { clearInterval(tick); close(); warnOpen = false; void signOut(); } }, 1000);
    root.querySelector("[data-stay]")!.addEventListener("click", () => { clearInterval(tick); close(); warnOpen = false; void auth.me().catch(() => {}); reset(); });
  });
}
function startIdleTimer(): void { ["click", "keydown", "mousemove", "touchstart"].forEach((e) => window.addEventListener(e, reset, { passive: true })); reset(); }
function stopIdleTimer(): void { clearTimeout(idleTimer); clearTimeout(warnTimer); ["click", "keydown", "mousemove", "touchstart"].forEach((e) => window.removeEventListener(e, reset)); }
