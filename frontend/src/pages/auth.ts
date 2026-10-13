import { auth } from "../api/services";
import type { Route } from "../router";
import { signIn } from "../session";
import { bindForm, field, formError } from "../ui/components";
import { $, html, mount, Safe } from "../ui/html";
import { ApiError } from "../api/client";

function layout(title: string, subtitle: string, body: Safe): Safe {
  return html`<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="mb-6 text-center"><div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white" aria-hidden="true">RF</div>
        <p class="text-xs font-semibold uppercase tracking-wider text-brand-700">CAPQA · ALABATT-HUB</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">${title}</h1><p class="mt-1 text-sm text-slate-500">${subtitle}</p></div>${body}</div></div>`;
}

const PASSWORD_RULES: [string, (p: string) => boolean][] = [
  // The backend only enforces 6 to 128 characters; the rest are advisory so passwords stay strong.
  ["6 to 128 characters (required)", (p) => p.length >= 6 && p.length <= 128], ["12 or more characters (recommended)", (p) => p.length >= 12],
  ["Upper and lower case letters (recommended)", (p) => /[A-Z]/.test(p) && /[a-z]/.test(p)], ["A number (recommended)", (p) => /\d/.test(p)], ["A symbol (recommended)", (p) => /[^A-Za-z0-9]/.test(p)],
];
function passwordChecklist(form: HTMLFormElement, inputName: string, box: HTMLElement): void {
  const input = form.elements.namedItem(inputName) as HTMLInputElement;
  const draw = () => { box.innerHTML = PASSWORD_RULES.map(([t, ok]) => `<li class="${ok(input.value) ? "text-green-700" : "text-slate-500"}">${ok(input.value) ? "✔" : "○"} ${t}</li>`).join(""); };
  input.addEventListener("input", draw); draw();
}
const passwordBox = html`<ul id="pw-rules" class="space-y-0.5 text-xs" aria-live="polite"></ul>`;

export const authRoutes: Route[] = [
  { path: "/login", title: "Sign in", public: true, bare: true, render({ root }) {
    mount(root, layout("Sign in", "Use your username or email and password.", html`
      <form id="f" class="space-y-4" novalidate>${formError()}
        ${field("username", "Username or email", { required: true, attrs: 'autocomplete="username"' })}
        <div><label class="label" for="f-password">Password <span class="text-red-600" aria-hidden="true">*</span></label>
          <div class="relative"><input id="f-password" name="password" type="password" class="input pr-16" required autocomplete="current-password" />
          <button type="button" id="toggle-pw" class="absolute inset-y-0 right-0 px-3 text-xs font-medium text-brand-700">Show</button></div></div>
        <button type="submit" class="btn-primary w-full">Sign in</button></form>
      <div class="mt-4 flex justify-between text-sm"><a class="text-brand-700 hover:underline" href="#/forgot-password">Forgot password?</a><a class="text-brand-700 hover:underline" href="#/register">Create an account</a></div>`));
    const form = $<HTMLFormElement>("#f", root)!;
    $("#toggle-pw", root)!.addEventListener("click", (e) => { const i = $<HTMLInputElement>("#f-password", root)!; const show = i.type === "password"; i.type = show ? "text" : "password"; (e.target as HTMLElement).textContent = show ? "Hide" : "Show"; });
    bindForm(form, async (v) => {
      try { await signIn(v.username!, (new FormData(form).get("password") as string) ?? ""); location.hash = "#/"; }
      catch (err) {
        if (err instanceof ApiError && err.status === 403) throw new ApiError(403, err.code, err.message || "Your account is not active yet. Please wait for administrator approval.");
        throw err;
      }
    });
  } },
  { path: "/register", title: "Register", public: true, bare: true, render({ root }) {
    mount(root, layout("Create an account", "New accounts need administrator approval before you can sign in.", html`
      <div id="done" class="hidden rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"><p class="font-semibold">Account created.</p><p class="mt-1">Waiting for admin approval. You will be able to sign in once an administrator activates your account.</p><a class="btn-primary mt-4" href="#/login">Back to sign in</a></div>
      <form id="f" class="space-y-4" novalidate>${formError()}
        ${field("full_name", "Full name", { required: true, attrs: 'minlength="2" maxlength="120"' })}
        ${field("username", "Username", { required: true, hint: "3 to 50 characters: letters, numbers, . _ -", attrs: 'minlength="3" maxlength="50" pattern="[A-Za-z0-9_.\\-]+"' })}
        ${field("email", "Email", { type: "email", required: true })}
        ${field("password", "Password", { type: "password", required: true, attrs: 'autocomplete="new-password"' })}${passwordBox}
        <button type="submit" class="btn-primary w-full">Register</button></form>
      <p class="mt-4 text-center text-sm text-slate-500">Already registered? <a class="text-brand-700 hover:underline" href="#/login">Sign in</a></p>`));
    const form = $<HTMLFormElement>("#f", root)!; passwordChecklist(form, "password", $("#pw-rules", root)!);
    bindForm(form, async (v) => {
      await auth.register({ full_name: v.full_name!, username: v.username!, email: v.email!, password: (new FormData(form).get("password") as string) });
      form.classList.add("hidden"); $("#done", root)!.classList.remove("hidden");
    });
  } },
  { path: "/forgot-password", title: "Forgot password", public: true, bare: true, render({ root }) {
    mount(root, layout("Forgot password", "Enter your email and we will send a reset link.", html`
      <div id="done" class="hidden rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"></div>
      <form id="f" class="space-y-4">${formError()}${field("email", "Email", { type: "email", required: true })}<button type="submit" class="btn-primary w-full">Send reset link</button></form>
      <p class="mt-4 text-center text-sm"><a class="text-brand-700 hover:underline" href="#/login">Back to sign in</a></p>`));
    const form = $<HTMLFormElement>("#f", root)!;
    bindForm(form, async (v) => {
      const res = await auth.requestReset(v.email!); const done = $("#done", root)!; done.classList.remove("hidden"); form.classList.add("hidden");
      done.innerHTML = "";
      const p = document.createElement("p"); p.textContent = res.message; done.appendChild(p);
      if (res.development_token) {
        const a = document.createElement("a"); a.href = `#/reset-password?token=${encodeURIComponent(res.development_token)}`; a.className = "mt-2 block font-medium underline"; a.textContent = "Development mode: open the reset form"; done.appendChild(a);
      }
    });
  } },
  { path: "/reset-password", title: "Reset password", public: true, bare: true, render({ root, query }) {
    mount(root, layout("Reset password", "Choose a new password for your account.", html`
      <div id="done" class="hidden rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"><p>Your password has been reset.</p><a class="btn-primary mt-3" href="#/login">Sign in</a></div>
      <form id="f" class="space-y-4" novalidate>${formError()}
        ${field("token", "Reset token", { required: true, value: query.get("token") ?? "", hint: "Pasted automatically from your email link." })}
        ${field("password", "New password", { type: "password", required: true, attrs: 'autocomplete="new-password"' })}${passwordBox}
        ${field("confirm", "Confirm new password", { type: "password", required: true, attrs: 'autocomplete="new-password"' })}
        <button type="submit" class="btn-primary w-full">Reset password</button></form>`));
    const form = $<HTMLFormElement>("#f", root)!; passwordChecklist(form, "password", $("#pw-rules", root)!);
    bindForm(form, async (v) => {
      const pw = new FormData(form).get("password") as string; const confirm = new FormData(form).get("confirm") as string;
      if (pw !== confirm) throw new ApiError(0, "MISMATCH", "The two passwords do not match.");
      try { await auth.confirmReset(v.token!, pw); }
      catch (err) { if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.code !== "VALIDATION_ERROR") throw new ApiError(err.status, err.code, `${err.message} The link may have expired or already been used; request a new one.`); throw err; }
      form.classList.add("hidden"); $("#done", root)!.classList.remove("hidden");
    });
  } },
  { path: "/profile", title: "My profile", async render({ root }) {
    const { getUser } = await import("../session"); const u = getUser()!;
    const { pageHeader } = await import("../ui/components"); const { label, fmtDateTime } = await import("../ui/html");
    const row = (k: string, v: unknown) => html`<div class="grid grid-cols-3 gap-4 border-b border-slate-100 py-3 text-sm last:border-0"><dt class="text-slate-500">${k}</dt><dd class="col-span-2 text-slate-900">${v as string}</dd></div>`;
    mount(root, html`${pageHeader("My profile", "Your account details")}
      <div class="card max-w-2xl"><dl>${row("Full name", u.full_name)}${row("Username", u.username)}${row("Email", u.email)}${row("Role", label(u.role))}${row("Department ID", u.department_id ?? "Not set")}${row("Account status", label(u.account_status))}${row("Last sign-in", fmtDateTime(u.last_login_at))}</dl>
      <p class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Editing your profile and changing your password while signed in is not available yet (backend endpoint pending). Use "Forgot password" to reset it.</p></div>`);
  } },
];
