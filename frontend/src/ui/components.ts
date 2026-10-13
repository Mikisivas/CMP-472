import { ApiError } from "../api/client";
import { $, html, raw, Safe, label, escapeHtml } from "./html";

const TONES: Record<string, string> = {
  green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800", grey: "bg-slate-100 text-slate-700",
};
const STATUS_TONE: Record<string, string> = {
  DRAFT: "grey", PENDING: "amber", FORWARDED: "blue", REVIEWED: "blue", APPROVED: "green", REJECTED: "red",
  HIGH: "red", MEDIUM: "amber", LOW: "grey",
  SUITABLE: "green", FULL: "amber", OVERCROWDED: "red", NEEDS_ATTENTION: "amber", NOT_SUITABLE: "red",
  INTERIM: "amber", DENIED: "red", UNPAID: "amber", PAID: "green", CANCELLED: "grey",
  SUCCESSFUL: "green", FAILED: "red", ACTIVE: "green", FINALISED: "blue", DISABLED: "red",
  CLASS: "blue", EXAM: "amber", EVENT: "grey", STUDENT: "blue", PEER: "grey", MANAGEMENT: "amber",
};
const ICON: Record<string, string> = { green: "●", amber: "▲", red: "■", blue: "◆", grey: "○" };

/** Status badge: never colour alone, always icon + text. */
export function badge(value: string, tone?: string): Safe {
  const resolved = tone ?? STATUS_TONE[value] ?? "grey";
  return html`<span class="badge ${TONES[resolved]}"><span aria-hidden="true">${ICON[resolved]}</span>${label(value)}</span>`;
}
/** Accreditation FULL is good (green), unlike hall FULL (amber). */
export const accreditationBadge = (v: string) => badge(v, v === "FULL" ? "green" : undefined);

export function spinner(text = "Loading..."): Safe {
  return html`<div class="flex items-center justify-center gap-3 p-10 text-slate-500" role="status"><span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700"></span>${text}</div>`;
}
export function emptyState(title: string, hint = ""): Safe {
  return html`<div class="p-10 text-center"><p class="font-medium text-slate-700">${title}</p><p class="mt-1 text-sm text-slate-500">${hint}</p></div>`;
}
export function errorState(err: unknown): Safe {
  const msg = err instanceof ApiError ? err.message : "Something went wrong.";
  const denied = err instanceof ApiError && err.status === 403;
  return html`<div class="card border-red-200 bg-red-50 text-red-800" role="alert">
    <p class="font-semibold">${denied ? "Access denied" : "Could not load this data"}</p><p class="mt-1 text-sm">${msg}</p></div>`;
}
export function pendingApi(title: string, detail: string): Safe {
  return html`<div class="card border-dashed text-center">
    <span class="badge ${TONES.amber}">Backend pending</span>
    <h3 class="mt-3 font-semibold text-slate-800">${title}</h3>
    <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">${detail}</p></div>`;
}

export function pageHeader(title: string, subtitle = "", actions: Safe | string = ""): Safe {
  return html`<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div><h1 class="text-2xl font-semibold text-slate-900">${title}</h1>${subtitle ? html`<p class="mt-1 text-sm text-slate-500">${subtitle}</p>` : ""}</div>
    <div class="flex flex-wrap gap-2">${typeof actions === "string" ? raw(actions) : actions}</div></div>`;
}

export function statCard(title: string, value: string | number, hint = ""): Safe {
  return html`<div class="card"><p class="text-sm text-slate-500">${title}</p><p class="mt-1 text-3xl font-semibold text-slate-900">${value}</p>${hint ? html`<p class="mt-1 text-xs text-slate-400">${hint}</p>` : ""}</div>`;
}

export interface Column<T> { header: string; cell: (row: T) => unknown; class?: string }
export function table<T>(cols: Column<T>[], rows: T[], empty = "No records found."): Safe {
  if (!rows.length) return emptyState(empty);
  return html`<div class="overflow-x-auto"><table class="min-w-full divide-y divide-slate-200">
    <thead class="bg-slate-50"><tr>${cols.map((c) => html`<th scope="col" class="th ${c.class ?? ""}">${c.header}</th>`)}</tr></thead>
    <tbody class="divide-y divide-slate-100 bg-white">${rows.map((r) => html`<tr class="hover:bg-slate-50">${cols.map((c) => html`<td class="td ${c.class ?? ""}">${c.cell(r) as Safe}</td>`)}</tr>`)}</tbody>
  </table></div>`;
}

export function pagination(total: number, offset: number, limit: number): Safe {
  if (total <= limit) return html`<p class="px-4 py-3 text-xs text-slate-500">${total} record${total === 1 ? "" : "s"}</p>`;
  const page = Math.floor(offset / limit) + 1; const pages = Math.ceil(total / limit);
  return html`<div class="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
    <span class="text-slate-500">Page ${page} of ${pages} (${total} records)</span>
    <span class="flex gap-2"><button data-page="${offset - limit}" class="btn-secondary btn-sm" ${offset === 0 ? "disabled" : ""}>Previous</button>
    <button data-page="${offset + limit}" class="btn-secondary btn-sm" ${offset + limit >= total ? "disabled" : ""}>Next</button></span></div>`;
}

export function field(name: string, labelText: string, opts: { type?: string; required?: boolean; placeholder?: string; value?: string | number; hint?: string; attrs?: string } = {}): Safe {
  return html`<div><label class="label" for="f-${name}">${labelText}${opts.required ? html` <span class="text-red-600" aria-hidden="true">*</span>` : ""}</label>
    <input id="f-${name}" name="${name}" type="${opts.type ?? "text"}" class="input" ${raw(opts.required ? "required" : "")} placeholder="${opts.placeholder ?? ""}" value="${opts.value ?? ""}" ${raw(opts.attrs ?? "")} />
    ${opts.hint ? html`<p class="mt-1 text-xs text-slate-500">${opts.hint}</p>` : ""}</div>`;
}
export function selectField(name: string, labelText: string, options: { value: string | number; text: string }[], opts: { required?: boolean; blank?: string; value?: string | number } = {}): Safe {
  return html`<div><label class="label" for="f-${name}">${labelText}${opts.required ? html` <span class="text-red-600" aria-hidden="true">*</span>` : ""}</label>
    <select id="f-${name}" name="${name}" class="input" ${raw(opts.required ? "required" : "")}>
    ${opts.blank !== undefined ? html`<option value="">${opts.blank}</option>` : ""}
    ${options.map((o) => html`<option value="${o.value}" ${raw(String(o.value) === String(opts.value ?? "") ? "selected" : "")}>${o.text}</option>`)}</select></div>`;
}
export function ratingField(name: string, labelText: string): Safe {
  return html`<fieldset><legend class="label">${labelText} <span class="text-red-600" aria-hidden="true">*</span></legend>
    <div class="flex gap-2">${[1, 2, 3, 4, 5].map((n) => html`<label class="cursor-pointer"><input type="radio" name="${name}" value="${n}" class="peer sr-only" ${raw(n === 1 ? "required" : "")} />
    <span class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-medium text-slate-600 peer-checked:border-brand-700 peer-checked:bg-brand-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500">${n}</span></label>`)}</div></fieldset>`;
}
export function formError(): Safe { return html`<div id="form-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert"></div>`; }

export function showFormError(form: HTMLElement, err: unknown): void {
  const el = $("#form-error", form); if (!el) { toast(err instanceof Error ? err.message : "Error", "error"); return; }
  el.textContent = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
  el.classList.remove("hidden");
}
export function clearFormError(form: HTMLElement): void { $("#form-error", form)?.classList.add("hidden"); }

/** Wire a form: runs `submit` with the values, disables the button while saving, shows API errors inline. */
export function bindForm(form: HTMLFormElement, submit: (values: Record<string, string>, data: FormData) => Promise<void>): void {
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); clearFormError(form);
    const btn = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const original = btn?.textContent ?? ""; if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
    try {
      const data = new FormData(form);
      const values: Record<string, string> = {};
      data.forEach((v, k) => { if (typeof v === "string") values[k] = v.trim(); });
      await submit(values, data);
    } catch (err) { showFormError(form, err); }
    finally { if (btn) { btn.disabled = false; btn.textContent = original; } }
  });
}

export function toast(message: string, kind: "success" | "error" | "info" = "info"): void {
  let host = $("#toasts");
  if (!host) { host = document.createElement("div"); host.id = "toasts"; host.className = "fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"; host.setAttribute("aria-live", "polite"); document.body.appendChild(host); }
  const tone = kind === "success" ? "border-green-300 bg-green-50 text-green-900" : kind === "error" ? "border-red-300 bg-red-50 text-red-900" : "border-slate-300 bg-white text-slate-800";
  const el = document.createElement("div"); el.className = `rounded-lg border px-4 py-3 text-sm shadow-lg ${tone}`; el.textContent = message;
  host.appendChild(el); setTimeout(() => el.remove(), 5000);
}

export function modal(title: string, body: Safe, onMount?: (root: HTMLElement, close: () => void) => void): void {
  const wrap = document.createElement("div");
  wrap.className = "fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center";
  wrap.innerHTML = html`<div role="dialog" aria-modal="true" aria-label="${title}" class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
    <div class="mb-4 flex items-start justify-between"><h2 class="text-lg font-semibold">${title}</h2><button data-close class="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">&times;</button></div>${body}</div>`.value;
  const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  wrap.addEventListener("click", (e) => { if (e.target === wrap || (e.target as HTMLElement).closest("[data-close]")) close(); });
  document.body.appendChild(wrap);
  (wrap.querySelector("input,select,textarea,button:not([data-close])") as HTMLElement | null)?.focus();
  onMount?.(wrap, close);
}

export function confirmDialog(title: string, message: string, confirmText = "Confirm", danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    modal(title, html`<p class="text-sm text-slate-600">${message}</p><div class="mt-6 flex justify-end gap-2"><button data-no class="btn-secondary">Cancel</button><button data-yes class="${danger ? "btn-danger" : "btn-primary"}">${confirmText}</button></div>`, (root, close) => {
      root.querySelector("[data-yes]")!.addEventListener("click", () => { close(); resolve(true); });
      root.querySelector("[data-no]")!.addEventListener("click", () => { close(); resolve(false); });
      root.querySelector("[data-close]")!.addEventListener("click", () => resolve(false));
    });
  });
}

/** Horizontal bar list used for simple charts (no chart library needed). */
export function barChart(items: { label: string; value: number }[], max?: number, unit = ""): Safe {
  if (!items.length) return emptyState("No data yet.");
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return html`<ul class="space-y-3">${items.map((i) => html`<li><div class="mb-1 flex justify-between text-sm"><span class="text-slate-700">${i.label}</span><span class="font-medium text-slate-900">${i.value}${unit}</span></div>
    <div class="h-2.5 rounded-full bg-slate-100" role="img" aria-label="${i.label}: ${i.value}${unit}"><div class="h-2.5 rounded-full bg-brand-700" style="width:${Math.min(100, (i.value / top) * 100)}%"></div></div></li>`)}</ul>`;
}
export function lineChart(points: { label: string; value: number }[], max = 5): Safe {
  if (points.length < 1) return emptyState("No data yet.");
  const w = 560, h = 180, pad = 28;
  const x = (i: number) => pad + (points.length === 1 ? (w - 2 * pad) / 2 : (i * (w - 2 * pad)) / (points.length - 1));
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  return html`<svg viewBox="0 0 ${w} ${h}" class="w-full" role="img" aria-label="Trend chart">
    ${[0, 1, 2, 3, 4, 5].map((g) => raw(`<line x1="${pad}" x2="${w - pad}" y1="${y((g / 5) * max)}" y2="${y((g / 5) * max)}" stroke="#e2e8f0" /><text x="4" y="${y((g / 5) * max) + 4}" font-size="10" fill="#64748b">${((g / 5) * max).toFixed(0)}</text>`))}
    <path d="${path}" fill="none" stroke="#166534" stroke-width="2.5" />
    ${points.map((p, i) => raw(`<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="#166534"><title>${escapeHtml(p.label)}: ${p.value}</title></circle><text x="${x(i)}" y="${h - 8}" font-size="10" text-anchor="middle" fill="#64748b">${escapeHtml(p.label)}</text>`))}</svg>`;
}
