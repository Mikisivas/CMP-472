import type { RoleCode } from "./api/types";
import { errorState } from "./ui/components";
import { html } from "./ui/html";

export interface RouteContext { root: HTMLElement; params: Record<string, string>; query: URLSearchParams }
export interface Route {
  path: string; title: string; roles?: RoleCode[]; public?: boolean; bare?: boolean;
  render: (ctx: RouteContext) => Promise<void> | void;
}

const routes: Route[] = [];
export function register(...r: Route[]): void { routes.push(...r); }

export function match(hash: string): { route: Route; params: Record<string, string>; query: URLSearchParams } | null {
  const [pathPart, queryPart = ""] = hash.replace(/^#/, "").split("?");
  const path = (pathPart || "/").replace(/\/+$/, "") || "/";
  for (const route of routes) {
    const keys: string[] = [];
    const re = new RegExp("^" + route.path.replace(/:([a-z_]+)/gi, (_, k: string) => { keys.push(k); return "([^/]+)"; }) + "$");
    const m = re.exec(path);
    if (m) return { route, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1]!)])), query: new URLSearchParams(queryPart) };
  }
  return null;
}

export function safeRender(ctx: RouteContext, route: Route): Promise<void> {
  return Promise.resolve().then(() => route.render(ctx)).catch((err) => { ctx.root.innerHTML = errorState(err).value; console.error(err); });
}
export const notFound = () => html`<div class="mx-auto max-w-md p-16 text-center"><p class="text-6xl font-semibold text-brand-700">404</p><p class="mt-2 text-slate-600">That page does not exist.</p><a href="#/" class="btn-primary mt-6">Back to dashboard</a></div>`;
export const forbidden = () => html`<div class="mx-auto max-w-md p-16 text-center"><p class="text-6xl font-semibold text-red-600">403</p><p class="mt-2 text-slate-600">Your role does not have access to this page.</p><a href="#/" class="btn-primary mt-6">Back to dashboard</a></div>`;
