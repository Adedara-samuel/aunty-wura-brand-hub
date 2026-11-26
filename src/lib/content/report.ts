import { allFields, CONTENT_TYPES } from "./definitions";
import { entryCompletion, entryTitle, isFieldVisible, isValueFilled, buildProgress, type ProgressReport } from "./completion";
import { STUDIO_MODULES } from "./modules";
import type { CompletionState, Entry, EntryData, FieldDef, MediaRef, Price } from "./types";
import { formatPrice } from "../format";

/*
 * A structured, presentation-neutral content report used by the Review page and every export
 * format (PDF, Markdown, JSON). Organised by website section, with missing details flagged.
 */

export type ReportValue =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "media"; items: { name: string; url: string; kind: string }[] }
  | { kind: "records"; items: { label: string; value: string }[][] };

export interface ReportField {
  key: string;
  label: string;
  required: boolean;
  filled: boolean;
  value: ReportValue | null;
}

export interface ReportEntry {
  id: string;
  title: string;
  state: CompletionState;
  status: "Published" | "Draft" | "Published · unpublished changes";
  missing: string[];
  fields: ReportField[];
}

export interface ReportSection {
  type: string;
  label: string;
  kind: "singleton" | "collection";
  entries: ReportEntry[];
}

export interface ReportModule {
  number: number;
  title: string;
  summary: string;
  state: CompletionState;
  percent: number;
  sections: ReportSection[];
}

export interface ContentReport {
  generatedAt: string;
  progress: ProgressReport;
  modules: ReportModule[];
}

function optionLabel(f: FieldDef, v: string) {
  return f.options?.find((o) => o.value === v)?.label ?? v;
}

export function toAbsolute(url: string, origin?: string) {
  if (!origin || /^https?:\/\//.test(url)) return url;
  return `${origin.replace(/\/$/, "")}${url}`;
}

export function displayValue(f: FieldDef, value: unknown, origin?: string): ReportValue | null {
  if (!isValueFilled(f, value) && f.type !== "toggle") return null;
  switch (f.type) {
    case "toggle":
      return { kind: "text", text: value ? "Yes" : "No" };
    case "select":
      return { kind: "text", text: optionLabel(f, String(value)) };
    case "number":
      return { kind: "text", text: String(value) };
    case "price": {
      const p = value as Price;
      return { kind: "text", text: [formatPrice(p), p.note].filter(Boolean).join(" — ") };
    }
    case "tags":
    case "list":
      return { kind: "list", items: (value as string[]).filter((s) => s.trim()) };
    case "image":
    case "file":
    case "media": {
      const m = value as MediaRef;
      return { kind: "media", items: [{ name: m.name, url: toAbsolute(m.url, origin), kind: m.kind }] };
    }
    case "images":
      return { kind: "media", items: (value as MediaRef[]).map((m) => ({ name: m.name, url: toAbsolute(m.url, origin), kind: m.kind })) };
    case "repeater": {
      const sub = f.itemFields ?? [];
      return {
        kind: "records",
        items: (value as EntryData[]).map((item) =>
          sub
            .map((sf) => {
              const dv = displayValue(sf, item[sf.key], origin);
              const text = !dv ? "" : dv.kind === "text" ? dv.text : dv.kind === "list" ? dv.items.join(", ") : dv.kind === "media" ? dv.items.map((i) => i.url).join(", ") : "";
              return { label: sf.label, value: text };
            })
            .filter((x) => x.value),
        ),
      };
    }
    default:
      return { kind: "text", text: String(value).trim() };
  }
}

export function buildReport(entries: Entry[], origin?: string): ContentReport {
  const progress = buildProgress(entries);
  const modules: ReportModule[] = STUDIO_MODULES.map((m) => {
    const pm = progress.modules.find((x) => x.id === m.id)!;
    const sections: ReportSection[] = m.types.map((type) => {
      const def = CONTENT_TYPES[type];
      const list = entries.filter((e) => e.type === type).sort((a, b) => a.order - b.order);
      const rows: (Entry | null)[] = def.kind === "singleton" ? [list[0] ?? null] : list;
      return {
        type,
        label: def.plural,
        kind: def.kind,
        entries: rows.map((e, i) => {
          const data = e?.data ?? {};
          const c = entryCompletion(def, data);
          return {
            id: e?.id ?? `${type}-empty`,
            title: entryTitle(def, data, i),
            state: c.state,
            status: !e?.published ? "Draft" : e.hasUnpublishedChanges ? "Published · unpublished changes" : "Published",
            missing: c.missing.map((x) => x.label),
            fields: allFields(def)
              .filter((f) => isFieldVisible(f, data))
              .map((f) => ({
                key: f.key,
                label: f.label,
                required: !!f.required,
                filled: isValueFilled(f, data[f.key]),
                value: displayValue(f, data[f.key], origin),
              })),
          } satisfies ReportEntry;
        }),
      };
    });
    return { number: m.number, title: m.title, summary: m.summary, state: pm.state, percent: pm.percent, sections };
  });
  return { generatedAt: new Date().toISOString(), progress, modules };
}

const STATE_LABEL: Record<CompletionState, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};
export const stateLabel = (s: CompletionState) => STATE_LABEL[s];

export function reportToMarkdown(r: ContentReport, title = "Website content"): string {
  const out: string[] = [];
  const p = r.progress;
  out.push(`# ${title}`);
  out.push("");
  out.push(`Generated ${new Date(r.generatedAt).toUTCString()}`);
  out.push("");
  out.push(`**Overall progress:** ${p.percent}% · ${p.completed}/${p.totalSections} sections complete · ${p.inProgress} in progress · ${p.notStarted} not started · ${p.missingRequired} required details missing`);
  out.push("");
  for (const m of r.modules) {
    out.push(`---`, "", `## ${m.number}. ${m.title} — ${stateLabel(m.state)} (${m.percent}%)`, "");
    for (const s of m.sections) {
      if (m.sections.length > 1) out.push(`### ${s.label}`, "");
      if (s.kind === "collection" && s.entries.length === 0) {
        out.push(`> ⚠️ **Missing:** no ${s.label.toLowerCase()} have been added yet.`, "");
        continue;
      }
      for (const e of s.entries) {
        if (s.kind === "collection") out.push(`#### ${e.title}`, "", `_Status: ${e.status} · ${stateLabel(e.state)}_`, "");
        if (e.missing.length) out.push(`> ⚠️ **Missing required:** ${e.missing.join(", ")}`, "");
        for (const f of e.fields) {
          if (!f.value) {
            if (f.required) out.push(`- **${f.label}:** _⚠️ missing_`);
            continue;
          }
          const v = f.value;
          if (v.kind === "text") {
            if (v.text.includes("\n")) out.push(`- **${f.label}:**`, "", v.text.split("\n").map((l) => `  ${l}`).join("\n"), "");
            else out.push(`- **${f.label}:** ${v.text}`);
          } else if (v.kind === "list") {
            out.push(`- **${f.label}:**`);
            v.items.forEach((i) => out.push(`  - ${i}`));
          } else if (v.kind === "media") {
            out.push(`- **${f.label}:**`);
            v.items.forEach((i) => out.push(`  - [${i.name || "file"}](${i.url})`));
          } else {
            out.push(`- **${f.label}:**`);
            v.items.forEach((rec, idx) => out.push(`  ${idx + 1}. ${rec.map((x) => `${x.label}: ${x.value}`).join(" · ")}`));
          }
        }
        out.push("");
      }
    }
  }
  return out.join("\n");
}
