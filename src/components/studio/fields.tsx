"use client";

import * as React from "react";
import { useController, useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Lightbulb, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { fieldBase, Input, NativeSelect, Switch, Textarea } from "@/components/ui/primitives";
import { CURRENCIES, defaultFieldValue } from "@/lib/content/definitions";
import type { EntryData, FieldDef, MediaRef, Price, PriceMode } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { MultiMediaInput, SingleMediaInput } from "./media-input";

/* -------------------------------------------------------------------------- */
/*  Form meta (suggestions, upload folder)                                     */
/* -------------------------------------------------------------------------- */

interface FormMeta {
  folder: string;
  suggestions: Record<string, string[]>;
}
export const FormMetaContext = React.createContext<FormMeta>({ folder: "general", suggestions: {} });

/* -------------------------------------------------------------------------- */
/*  Field chrome                                                              */
/* -------------------------------------------------------------------------- */

function ExampleToggle({ example }: { example: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        aria-expanded={open}
      >
        <Lightbulb className="size-3.5" /> {open ? "Hide example" : "See an example"}
        <ChevronDown className={cn("size-3 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-dashed border-primary/30 bg-accent/60 p-3 text-sm leading-relaxed text-accent-foreground">
          <span className="mb-1 block text-[0.62rem] font-bold tracking-widest uppercase opacity-70">Example only — write your own</span>
          {example}
        </div>
      )}
    </div>
  );
}

function FieldShell({
  field,
  id,
  error,
  compact,
  children,
  counter,
}: {
  field: FieldDef;
  id: string;
  error?: string;
  compact?: boolean;
  children: React.ReactNode;
  counter?: React.ReactNode;
}) {
  return (
    <div id={`field-${id}`} className={cn("scroll-mt-28", field.width === "half" ? "md:col-span-1" : "md:col-span-2")}>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className={cn("font-semibold text-foreground", compact ? "text-[0.8rem]" : "text-[0.95rem]")}>
          {compact ? field.label : field.heading ?? field.label}
        </label>
        {!compact && (
          <Badge variant={field.required ? "default" : "neutral"} className="mt-0.5 shrink-0">
            {field.required ? "Required" : "Optional"}
          </Badge>
        )}
        {compact && field.required && <span className="text-xs text-primary">*</span>}
      </div>
      {!compact && field.prompt && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{field.prompt}</p>}
      {!compact && field.example && <ExampleToggle example={field.example} />}
      <div className={compact ? "mt-1.5" : "mt-3"}>{children}</div>
      <div className="mt-1.5 flex items-start justify-between gap-4">
        {error ? <p className="text-xs font-medium text-destructive" role="alert">{error}</p> : <span />}
        {counter}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inputs                                                                    */
/* -------------------------------------------------------------------------- */

function TagsInput({ id, value, onChange, suggestions, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const [text, setText] = React.useState("");
  const add = (raw: string) => {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setText("");
  };
  const listId = `${id}-suggestions`;
  return (
    <div className={cn(fieldBase, "flex min-h-11 flex-wrap items-center gap-1.5 px-2 py-1.5")}>
      {value.map((t, i) => (
        <span key={t + i} className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-2.5 text-sm text-accent-foreground">
          {t}
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="cursor-pointer rounded-full p-0.5 hover:bg-black/10" aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        list={suggestions?.length ? listId : undefined}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(text)}
        onPaste={(e) => {
          const t = e.clipboardData.getData("text");
          if (/[,\n]/.test(t)) {
            e.preventDefault();
            add(t);
          }
        }}
        placeholder={value.length ? "Add another…" : placeholder ?? "Type and press Enter"}
        className="min-w-32 flex-1 bg-transparent px-1.5 py-1 text-[0.95rem] outline-none placeholder:text-muted-foreground/70"
      />
      {suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
        </datalist>
      ) : null}
    </div>
  );
}

function ListInput({ id, value, onChange, itemLabel = "item", placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; itemLabel?: string; placeholder?: string }) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (focusIndex !== null) {
      refs.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, value.length]);
  const rows = value.length ? value : [""];
  const set = (i: number, v: string) => {
    const next = rows.slice();
    next[i] = v;
    onChange(next);
  };
  const move = (i: number, d: number) => {
    const next = rows.slice();
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {rows.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{i + 1}.</span>
          <Input
            id={i === 0 ? id : undefined}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={v}
            placeholder={placeholder}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const next = rows.slice();
                next.splice(i + 1, 0, "");
                onChange(next);
                setFocusIndex(i + 1);
              }
            }}
          />
          <div className="flex shrink-0">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
            <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
            <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove"><Trash2 className="size-3.5" /></button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onChange([...rows, ""]);
          setFocusIndex(rows.length);
        }}
      >
        <Plus /> Add {itemLabel}
      </Button>
    </div>
  );
}

const PRICE_MODES: { value: PriceMode; label: string }[] = [
  { value: "fixed", label: "Fixed price" },
  { value: "from", label: "Starting from" },
  { value: "quote", label: "Custom quote" },
  { value: "free", label: "Free" },
];

function PriceInput({ id, value, onChange }: { id: string; value: Price; onChange: (v: Price) => void }) {
  const p: Price = { amount: null, note: "", ...value, mode: value?.mode ?? "fixed", currency: value?.currency ?? "NGN" };
  return (
    <div className="space-y-3 rounded-xl border bg-surface/60 p-3">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Pricing type">
        {PRICE_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={p.mode === m.value}
            onClick={() => onChange({ ...p, mode: m.value })}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition",
              p.mode === m.value ? "border-primary bg-accent text-accent-foreground" : "bg-surface hover:border-foreground/30",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {(p.mode === "fixed" || p.mode === "from") && (
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
          <Input
            id={id}
            inputMode="decimal"
            placeholder="Amount, e.g. 50000"
            value={p.amount ?? ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, "");
              onChange({ ...p, amount: raw === "" ? null : Number(raw) });
            }}
          />
          <NativeSelect value={p.currency} onChange={(e) => onChange({ ...p, currency: e.target.value })} aria-label="Currency">
            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </NativeSelect>
        </div>
      )}
      <Input
        value={p.note ?? ""}
        maxLength={200}
        onChange={(e) => onChange({ ...p, note: e.target.value })}
        placeholder={p.mode === "quote" ? "Optional note, e.g. 'Depends on scope — get in touch'" : "Optional note, e.g. 'per video' or 'excludes delivery'"}
        className="text-sm"
      />
    </div>
  );
}

function ColorInput({ id, value, onChange, fallback }: { id: string; value: string; onChange: (v: string) => void; fallback: string }) {
  const v = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={v} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border bg-surface p-1" aria-label="Pick colour" />
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={fallback} className="w-36 font-mono" maxLength={7} />
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange(fallback)}>Reset</Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field renderer                                                            */
/* -------------------------------------------------------------------------- */

export function FieldRenderer({ field, name, compact }: { field: FieldDef; name: string; compact?: boolean }) {
  const { control } = useFormContext<FieldValues>();
  const meta = React.useContext(FormMetaContext);
  const { field: f, fieldState } = useController({ name, control });
  const id = name.replace(/\./g, "-");
  const error = fieldState.error?.message ?? (fieldState.error as unknown as Record<string, { message?: string }> | undefined)?.amount?.message;

  // Conditional fields
  const watchKey = field.showWhen?.key;
  const parentPath = name.includes(".") ? name.slice(0, name.lastIndexOf(".") + 1) : "";
  const watched = useWatch({ control, name: watchKey ? `${parentPath}${watchKey}` : "__none__", disabled: !watchKey });
  if (field.showWhen && !field.showWhen.equals.includes(watched)) return null;

  const shell = (children: React.ReactNode, counter?: React.ReactNode) => (
    <FieldShell field={field} id={id} error={error} compact={compact} counter={counter}>
      {children}
    </FieldShell>
  );
  const strValue = typeof f.value === "string" ? f.value : "";

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "date":
      return shell(
        <Input
          id={id}
          type={field.type === "text" ? "text" : field.type}
          value={strValue}
          onChange={f.onChange}
          onBlur={f.onBlur}
          ref={f.ref}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          list={field.suggestFromExisting && meta.suggestions[field.key]?.length ? `${id}-list` : undefined}
          aria-invalid={!!error}
          autoComplete="off"
        />,
        field.suggestFromExisting && meta.suggestions[field.key]?.length ? (
          <datalist id={`${id}-list`}>
            {meta.suggestions[field.key].map((s) => <option key={s} value={s} />)}
          </datalist>
        ) : undefined,
      );
    case "url":
      return shell(
        <div className="flex gap-2">
          <Input id={id} type="url" inputMode="url" value={strValue} onChange={f.onChange} onBlur={f.onBlur} ref={f.ref} placeholder={field.placeholder ?? "https://"} aria-invalid={!!error} />
          {/^https?:\/\/.+\..+/.test(strValue) && (
            <a href={strValue} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted" title="Open link to check it works">
              <ExternalLink className="size-4" /> <span className="hidden sm:inline">Test link</span>
            </a>
          )}
        </div>,
      );
    case "textarea": {
      const len = strValue.length;
      return shell(
        <Textarea id={id} value={strValue} onChange={f.onChange} onBlur={f.onBlur} ref={f.ref} rows={field.rows ?? 4} maxLength={field.maxLength} placeholder={field.placeholder} aria-invalid={!!error} />,
        field.maxLength ? (
          <span className={cn("text-xs tabular-nums", len > field.maxLength * 0.9 ? "text-warning" : "text-muted-foreground")}>
            {len}/{field.maxLength}
          </span>
        ) : len > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">{strValue.trim().split(/\s+/).filter(Boolean).length} words</span>
        ) : undefined,
      );
    }
    case "number":
      return shell(
        <Input
          id={id}
          inputMode="decimal"
          value={f.value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            f.onChange(raw === "" ? null : Number(raw));
          }}
          onBlur={f.onBlur}
          ref={f.ref}
          placeholder={field.placeholder}
          aria-invalid={!!error}
        />,
      );
    case "select":
      return shell(
        <NativeSelect id={id} value={strValue} onChange={f.onChange} onBlur={f.onBlur} ref={f.ref} aria-invalid={!!error}>
          <option value="">Choose…</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </NativeSelect>,
      );
    case "toggle":
      return (
        <div id={`field-${id}`} className={cn("md:col-span-2", compact && "md:col-span-1")}>
          <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border bg-surface/60 p-4">
            <span>
              <span className="block text-[0.95rem] font-semibold">{field.heading ?? field.label}</span>
              {field.prompt && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{field.prompt}</span>}
            </span>
            <Switch id={id} checked={!!f.value} onCheckedChange={f.onChange} />
          </label>
        </div>
      );
    case "color":
      return shell(<ColorInput id={id} value={strValue} onChange={f.onChange} fallback={String(field.defaultValue ?? "#9a5b3f")} />);
    case "tags":
      return shell(<TagsInput id={id} value={(f.value as string[]) ?? []} onChange={f.onChange} suggestions={meta.suggestions[field.key]} placeholder={field.placeholder} />);
    case "list":
      return shell(<ListInput id={id} value={(f.value as string[]) ?? []} onChange={f.onChange} itemLabel={field.itemLabel} placeholder={field.placeholder} />);
    case "price":
      return shell(<PriceInput id={id} value={(f.value as Price) ?? defaultFieldValue(field)} onChange={f.onChange} />);
    case "image":
    case "file":
    case "media":
      return shell(
        <SingleMediaInput
          value={(f.value as MediaRef | null) ?? null}
          onChange={f.onChange}
          accept={field.accept ?? (field.type === "file" ? ["document"] : ["image"])}
          folder={meta.folder}
        />,
      );
    case "images":
      return shell(<MultiMediaInput value={(f.value as MediaRef[]) ?? []} onChange={f.onChange} accept={field.accept ?? ["image"]} folder={meta.folder} />);
    case "repeater":
      return shell(<RepeaterInput field={field} name={name} value={(f.value as EntryData[]) ?? []} onChange={f.onChange} />);
  }
}

function RepeaterInput({ field, name, value, onChange }: { field: FieldDef; name: string; value: EntryData[]; onChange: (v: EntryData[]) => void }) {
  const sub = field.itemFields ?? [];
  const blank = () => Object.fromEntries(sub.map((s) => [s.key, defaultFieldValue(s)]));
  const move = (i: number, d: number) => {
    const next = value.slice();
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((_, i) => (
        <div key={i} className="rounded-xl border bg-surface/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {field.itemLabel ?? "Item"} {i + 1}
            </span>
            <div className="flex">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${field.itemLabel ?? "item"}`}><Trash2 className="size-3.5" /></button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sub.map((s) => (
              <FieldRenderer key={s.key} field={s} name={`${name}.${i}.${s.key}`} compact />
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, blank()])}>
        <Plus /> Add {value.length ? "another" : "a"} {field.itemLabel ?? "item"}
      </Button>
    </div>
  );
}
