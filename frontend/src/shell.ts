import type { RoleCode } from "./api/types";
import { notifications as notificationsApi } from "./api/services";
import { getUser, hasRole, signOut } from "./session";
import { $, $$, fmtDateTime, html, label, raw } from "./ui/html";

interface NavItem { href: string; text: string; icon: string; roles?: RoleCode[] }
const ALL_READ: RoleCode[] = ["ADMIN", "DIRECTOR", "ACADEMIC-OFFICER", "QUALITY-INSPECTOR", "VIEWER"];
export const NAV: NavItem[] = [
  { href: "#/", text: "Dashboard", icon: "▦" },
  { href: "#/dispatch", text: "E-Dispatch", icon: "✉", roles: ALL_READ },
  { href: "#/halls", text: "Classrooms & Halls", icon: "⌂", roles: ALL_READ },
  { href: "#/audits", text: "Exam Hall Audit", icon: "✔", roles: ["ADMIN", "QUALITY-INSPECTOR"] },
  { href: "#/evaluations", text: "Staff Evaluation", icon: "★", roles: ["ADMIN", "DIRECTOR", "ACADEMIC-OFFICER"] },
  { href: "#/departments", text: "Departments", icon: "▤", roles: ["ADMIN", "DIRECTOR", "ACADEMIC-OFFICER", "QUALITY-INSPECTOR"] },
  { href: "#/reports", text: "Reports", icon: "▥", roles: ["ADMIN", "DIRECTOR", "ACADEMIC-OFFICER"] },
  { href: "#/payments", text: "Payments", icon: "₦" },
  { href: "#/notifications", text: "Notifications", icon: "🔔" },
  { href: "#/admin/users", text: "Users", icon: "☺", roles: ["ADMIN"] },
  { href: "#/admin/audit-log", text: "Audit Log", icon: "⌕", roles: ["ADMIN"] },
];

export function canAccess(roles?: RoleCode[]): boolean { return !roles || hasRole(...roles); }

export function renderShell(app: HTMLElement): HTMLElement {
  const user = getUser()!;
  const items = NAV.filter((n) => canAccess(n.roles));
  app.innerHTML = html`
  <div class="flex min-h-screen">
    <div id="scrim" class="fixed inset-0 z-20 hidden bg-slate-900/40 lg:hidden"></div>
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-30 flex w-64 -translate-x-full flex-col bg-brand-900 text-brand-50 transition-transform lg:translate-x-0" aria-label="Main navigation">
      <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-800" aria-hidden="true">RF</div>
        <div><p class="text-sm font-semibold leading-tight">CAPQA</p><p class="text-xs text-brand-200">ALABATT-HUB</p></div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-4"><ul class="space-y-1">${items.map((n) => html`
        <li><a href="${n.href}" data-nav="${n.href}" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-100 hover:bg-white/10"><span class="w-5 text-center" aria-hidden="true">${n.icon}</span>${n.text}</a></li>`)}</ul></nav>
      <div class="border-t border-white/10 p-4 text-xs text-brand-200">Rev. Fr. Moses Orshio Adasu University, Makurdi</div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col lg:pl-64">
      <header class="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button id="menu-btn" class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">☰</button>
        <p id="crumb" class="min-w-0 flex-1 truncate text-sm text-slate-500"></p>
        <div class="relative">
          <button id="bell-btn" class="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">🔔<span id="bell-count" class="absolute -right-0.5 -top-0.5 hidden min-w-[1.1rem] rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold text-white"></span></button>
          <div id="bell-panel" class="absolute right-0 mt-2 hidden w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg"></div>
        </div>
        <div class="relative">
          <button id="user-btn" class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100" aria-haspopup="true">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">${user.full_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}</span>
            <span class="hidden text-left sm:block"><span class="block text-sm font-medium leading-tight">${user.full_name}</span><span class="block text-xs text-slate-500">${label(user.role)}</span></span></button>
          <div id="user-menu" class="absolute right-0 mt-2 hidden w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <a href="#/profile" class="block px-4 py-2 text-sm hover:bg-slate-50">My profile</a>
            <button id="logout-btn" class="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-slate-50">Sign out</button></div>
        </div>
      </header>
      <main id="main" class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6" tabindex="-1"></main>
      <footer class="border-t border-slate-200 px-6 py-3 text-xs text-slate-400">CAPQA v0.1 · CMP 472 Group C</footer>
    </div>
  </div>`.value;

  const sidebar = $("#sidebar")!, scrim = $("#scrim")!;
  const toggle = (open: boolean) => { sidebar.classList.toggle("-translate-x-full", !open); scrim.classList.toggle("hidden", !open); };
  $("#menu-btn")!.addEventListener("click", () => toggle(true));
  scrim.addEventListener("click", () => toggle(false));
  $$("a[data-nav]", sidebar).forEach((a) => a.addEventListener("click", () => toggle(false)));
  $("#logout-btn")!.addEventListener("click", () => void signOut());
  const userMenu = $("#user-menu")!;
  $("#user-btn")!.addEventListener("click", (e) => { e.stopPropagation(); userMenu.classList.toggle("hidden"); $("#bell-panel")!.classList.add("hidden"); });
  const panel = $("#bell-panel")!;
  $("#bell-btn")!.addEventListener("click", async (e) => { e.stopPropagation(); userMenu.classList.add("hidden"); panel.classList.toggle("hidden"); if (!panel.classList.contains("hidden")) await loadBellPanel(); });
  document.addEventListener("click", () => { userMenu.classList.add("hidden"); panel.classList.add("hidden"); });
  panel.addEventListener("click", (e) => e.stopPropagation());
  void refreshBell();
  return $("#main")!;
}

export function setActiveNav(hash: string, title: string): void {
  const base = "#/" + (hash.replace(/^#\/?/, "").split(/[/?]/)[0] ?? "");
  const path = hash.replace(/^#/, "").split("?")[0]!;
  const key = path.startsWith("/admin/") ? "#" + path : base === "#/" ? "#/" : base;
  $$("a[data-nav]").forEach((a) => {
    const on = a.dataset.nav === key; a.classList.toggle("bg-white/15", on); a.classList.toggle("font-semibold", on); a.classList.toggle("text-white", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const crumb = $("#crumb"); if (crumb) crumb.textContent = `CAPQA / ${title}`;
  document.title = `${title} | CAPQA`;
}

export async function refreshBell(): Promise<void> {
  try {
    const page = await notificationsApi.list({ unread_only: true, limit: 1 });
    const el = $("#bell-count"); if (!el) return;
    el.textContent = page.total > 99 ? "99+" : String(page.total); el.classList.toggle("hidden", page.total === 0);
  } catch { /* bell is best effort */ }
}
async function loadBellPanel(): Promise<void> {
  const panel = $("#bell-panel")!; panel.innerHTML = `<p class="p-4 text-sm text-slate-500">Loading...</p>`;
  try {
    const page = await notificationsApi.list({ limit: 5 });
    panel.innerHTML = html`<div class="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Notifications</div>
      ${page.items.length ? html`<ul class="max-h-80 divide-y divide-slate-100 overflow-y-auto">${page.items.map((n) => html`<li><button data-note="${n.id}" data-link="${n.link ?? ""}" class="block w-full px-4 py-3 text-left hover:bg-slate-50 ${n.is_read ? "" : "bg-brand-50"}"><span class="block text-sm text-slate-800">${n.message}</span><span class="text-xs text-slate-500">${label(n.notification_type)} · ${fmtDateTime(n.created_at)}</span></button></li>`)}</ul>` : html`<p class="p-4 text-sm text-slate-500">You are all caught up.</p>`}
      <a href="#/notifications" class="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand-700 hover:bg-slate-50">View all</a>`.value;
    $$("button[data-note]", panel).forEach((b) => b.addEventListener("click", async () => {
      await notificationsApi.markRead(b.dataset.note!).catch(() => {}); void refreshBell(); panel.classList.add("hidden");
      const link = b.dataset.link; if (link && link.startsWith("#/")) location.hash = link;
    }));
  } catch { panel.innerHTML = raw(`<p class="p-4 text-sm text-red-700">Could not load notifications.</p>`).value; }
}
