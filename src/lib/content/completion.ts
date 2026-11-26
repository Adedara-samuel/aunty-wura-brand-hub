import { allFields, CONTENT_TYPES } from "./definitions";
import { STUDIO_MODULES } from "./modules";
import type {
  CompletionState,
  ContentTypeDef,
  ContentTypeId,
  Entry,
  EntryData,
  FieldDef,
  ModuleId,
  Price,
} from "./types";

/** Whether a field is currently visible given the other values (see FieldDef.showWhen). */
export function isFieldVisible(field: FieldDef, data: EntryData): boolean {
  if (!field.showWhen) return true;
  return field.showWhen.equals.includes(data[field.showWhen.key]);
}

export function isValueFilled(field: FieldDef, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  switch (field.type) {
    case "toggle":
      return true;
    case "number":
      return typeof value === "number" && !Number.isNaN(value);
    case "price": {
      const p = value as Price;
      if (!p || !p.mode) return false;
      if (p.mode === "quote" || p.mode === "free") return true;
      return typeof p.amount === "number" && p.amount >= 0 && !!p.currency;
    }
    case "image":
    case "file":
    case "media":
      return typeof value === "object" && !!(value as { url?: string }).url;
    case "tags":
    case "list":
      return Array.isArray(value) && value.some((v) => typeof v === "string" && v.trim() !== "");
    case "images":
      return Array.isArray(value) && value.length > 0;
    case "repeater": {
      if (!Array.isArray(value) || value.length === 0) return false;
      const required = (field.itemFields ?? []).filter((f) => f.required);
      return value.every((item) =>
        required.every((rf) => isValueFilled(rf, (item as EntryData)?.[rf.key])),
      );
    }
    default:
      return typeof value === "string" ? value.trim() !== "" : true;
  }
}

export interface FieldIssue {
  key: string;
  label: string;
}

/** Required fields that are still missing for one entry's data. */
export function missingRequired(def: ContentTypeDef, data: EntryData | null | undefined): FieldIssue[] {
  const d = data ?? {};
  return allFields(def)
    .filter((f) => f.required && isFieldVisible(f, d) && !isValueFilled(f, d[f.key]))
    .map((f) => ({ key: f.key, label: f.label }));
}

/** Any user-entered content at all (ignores toggles and defaults). */
export function hasAnyContent(def: ContentTypeDef, data: EntryData | null | undefined): boolean {
  if (!data) return false;
  return allFields(def).some((f) => {
    if (f.type === "toggle" || f.type === "select" || f.type === "color") return false;
    if (f.type === "price") {
      const p = data[f.key] as Price | undefined;
      return typeof p?.amount === "number" || p?.mode === "quote" || p?.mode === "free";
    }
    if (f.defaultValue !== undefined && data[f.key] === f.defaultValue) return false;
    return isValueFilled(f, data[f.key]);
  });
}

export function entryCompletion(def: ContentTypeDef, data: EntryData | null | undefined) {
  const required = allFields(def).filter((f) => f.required && isFieldVisible(f, data ?? {}));
  const missing = missingRequired(def, data);
  const filled = required.length - missing.length;
  const ratio = required.length === 0 ? (hasAnyContent(def, data) ? 1 : 0) : filled / required.length;
  let state: CompletionState = "in_progress";
  if (!hasAnyContent(def, data)) state = "not_started";
  else if (missing.length === 0) state = "complete";
  return { state, ratio, missing, requiredCount: required.length, filledCount: filled };
}

export interface EntryReport {
  id: string;
  title: string;
  state: CompletionState;
  missing: FieldIssue[];
  published: boolean;
  hasUnpublishedChanges: boolean;
}

export interface TypeReport {
  type: ContentTypeId;
  label: string;
  kind: "singleton" | "collection";
  state: CompletionState;
  ratio: number;
  entries: EntryReport[];
  publishedCount: number;
}

export interface ModuleReport {
  id: ModuleId;
  number: number;
  title: string;
  state: CompletionState;
  percent: number;
  types: TypeReport[];
  missingCount: number;
}

export interface ProgressReport {
  totalSections: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  percent: number;
  missingRequired: number;
  modules: ModuleReport[];
}

export function entryTitle(def: ContentTypeDef, data: EntryData | null | undefined, fallbackIndex?: number): string {
  const raw = data?.[def.titleField];
  if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 90);
  if (def.kind === "singleton") return def.singular;
  return `Untitled ${def.singular.toLowerCase()}${fallbackIndex !== undefined ? ` #${fallbackIndex + 1}` : ""}`;
}

function typeReport(type: ContentTypeId, entries: Entry[]): TypeReport {
  const def = CONTENT_TYPES[type];
  const list = entries.filter((e) => e.type === type).sort((a, b) => a.order - b.order);
  const reports: EntryReport[] = list.map((e, i) => {
    const c = entryCompletion(def, e.data);
    return {
      id: e.id,
      title: entryTitle(def, e.data, i),
      state: c.state,
      missing: c.missing,
      published: !!e.published,
      hasUnpublishedChanges: e.hasUnpublishedChanges,
    };
  });

  let state: CompletionState;
  let ratio: number;
  if (def.kind === "singleton") {
    const c = entryCompletion(def, list[0]?.data);
    state = c.state;
    ratio = c.ratio;
  } else if (list.length === 0) {
    state = "not_started";
    ratio = 0;
  } else {
    const ratios = list.map((e) => entryCompletion(def, e.data).ratio);
    ratio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    state = reports.every((r) => r.state === "complete") ? "complete" : "in_progress";
  }

  return {
    type,
    label: def.plural,
    kind: def.kind,
    state,
    ratio,
    entries: reports,
    publishedCount: list.filter((e) => e.published).length,
  };
}

export function buildProgress(entries: Entry[]): ProgressReport {
  const modules: ModuleReport[] = STUDIO_MODULES.map((m) => {
    const types = m.types.map((t) => typeReport(t, entries));
    const states = types.map((t) => t.state);
    const state: CompletionState = states.every((s) => s === "complete")
      ? "complete"
      : states.every((s) => s === "not_started")
        ? "not_started"
        : "in_progress";
    const percent = Math.round((types.reduce((a, t) => a + t.ratio, 0) / types.length) * 100);
    const missingCount = types.reduce(
      (acc, t) =>
        acc +
        (t.kind === "singleton"
          ? missingRequired(CONTENT_TYPES[t.type], entries.find((e) => e.type === t.type)?.data).length
          : t.entries.length === 0
            ? 1
            : t.entries.reduce((a, e) => a + e.missing.length, 0)),
      0,
    );
    return { id: m.id, number: m.number, title: m.title, state, percent, types, missingCount };
  });

  return {
    totalSections: modules.length,
    completed: modules.filter((m) => m.state === "complete").length,
    inProgress: modules.filter((m) => m.state === "in_progress").length,
    notStarted: modules.filter((m) => m.state === "not_started").length,
    percent: Math.round(modules.reduce((a, m) => a + m.percent, 0) / modules.length),
    missingRequired: modules.reduce((a, m) => a + m.missingCount, 0),
    modules,
  };
}
