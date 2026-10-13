import "./styles.css";
import { forbidden, match, notFound, register, safeRender } from "./router";
import { canAccess, refreshBell, renderShell, setActiveNav } from "./shell";
import { isLoggedIn, onSessionEvent, restoreSession } from "./session";
import { toast } from "./ui/components";
import { spinner } from "./ui/components";
import { authRoutes } from "./pages/auth";
import { dashboardRoutes } from "./pages/dashboard";
import { dispatchRoutes } from "./pages/dispatch";
import { hallRoutes } from "./pages/halls";
import { auditRoutes } from "./pages/audits";
import { evaluationRoutes } from "./pages/evaluations";
import { departmentRoutes } from "./pages/departments";
import { reportRoutes } from "./pages/reports";
import { paymentRoutes } from "./pages/payments";
import { notificationRoutes } from "./pages/notifications";
import { adminRoutes } from "./pages/admin";

register(...authRoutes, ...dashboardRoutes, ...dispatchRoutes, ...hallRoutes, ...auditRoutes, ...evaluationRoutes,
  ...departmentRoutes, ...reportRoutes, ...paymentRoutes, ...notificationRoutes, ...adminRoutes);

const app = document.getElementById("app")!;
let shellMounted = false;
let main: HTMLElement | null = null;

async function navigate(): Promise<void> {
  const found = match(location.hash || "#/");
  const bare = !!found?.route.bare;
  if (found && !found.route.public && !isLoggedIn()) { location.hash = "#/login"; return; }
  if (found?.route.public && isLoggedIn() && ["/login", "/register"].includes(found.route.path)) { location.hash = "#/"; return; }

  if (bare || !isLoggedIn()) { shellMounted = false; main = app; }
  else if (!shellMounted) { main = renderShell(app); shellMounted = true; }
  const root = main!;
  if (!found) { root.innerHTML = notFound().value; return; }
  if (!bare && !canAccess(found.route.roles)) { setActiveNav(location.hash, "Access denied"); root.innerHTML = forbidden().value; return; }
  if (!bare) setActiveNav(location.hash, found.route.title);
  root.innerHTML = spinner().value;
  await safeRender({ root, params: found.params, query: found.query }, found.route);
  if (!bare) root.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

onSessionEvent((event, payload) => {
  const messages: Record<string, string> = {
    NOTIFICATION_CREATED: "You have a new notification.", APPROVAL_UPDATED: "An approval status changed.",
    ASSIGNMENT_UPDATED: "A task was assigned to you.", PAYMENT_UPDATED: "A payment was updated.",
  };
  if (event === "NOTIFICATION_CREATED" || event === "APPROVAL_UPDATED" || event === "ASSIGNMENT_UPDATED" || event === "PAYMENT_UPDATED") {
    toast(String(payload.message ?? messages[event]), "info"); void refreshBell();
  }
  window.dispatchEvent(new CustomEvent("capqa:live", { detail: { event, payload } }));
});

window.addEventListener("hashchange", () => void navigate());
void restoreSession().then(() => { shellMounted = false; return navigate(); });
