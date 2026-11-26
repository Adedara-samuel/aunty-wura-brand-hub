"use client";

import * as React from "react";
import { FormProvider, useForm, useWatch, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Columns2,
  Copy,
  EyeOff,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  Eye,
  RotateCcw,
  Rocket,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/display";
import { ConfirmDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlay";
import { CONTENT_TYPES, defaultDataFor } from "@/lib/content/definitions";
import { missingRequired } from "@/lib/content/completion";
import { draftSchemaFor } from "@/lib/content/schema";
import type { ContentTypeId, Entry, EntryData } from "@/lib/content/types";
import { buildSiteContent } from "@/lib/site-build";
import { ApiError, useEntryAction, useSaveEntry } from "@/lib/studio/api";
import { setUnsaved } from "@/lib/studio/unsaved";
import { cn, formatRelative } from "@/lib/utils";
import { FieldRenderer, FormMetaContext } from "./fields";
import { PreviewPane } from "./preview-pane";
import { PREVIEWS_FOR_TYPE } from "./preview-views";
import { PublishBadge } from "./status";

type Mode = "edit" | "split" | "preview";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function useIsWide() {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

function initialValues(type: ContentTypeId, entry: Entry | null): EntryData {
  return { ...defaultDataFor(CONTENT_TYPES[type]), ...(entry?.data ?? {}) };
}

export function EntryEditor({
  type,
  entry,
  allEntries,
  onCreated,
  onDeleted,
  autosave = true,
  publishable = CONTENT_TYPES[type].excludeFromProgress !== true,
}: {
  type: ContentTypeId;
  entry: Entry | null;
  allEntries: Entry[];
  onCreated?: (entry: Entry) => void;
  onDeleted?: () => void;
  autosave?: boolean;
  /** Settings-style content applies on save and has no publish step. */
  publishable?: boolean;
}) {
  const def = CONTENT_TYPES[type];
  const isWide = useIsWide();
  const [mode, setMode] = React.useState<Mode>("split");
  const effectiveMode: Mode = !isWide && mode === "split" ? "edit" : mode;
  const [entryId, setEntryId] = React.useState(entry?.id);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = React.useState<string | null>(entry?.updatedAt ?? null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const save = useSaveEntry();
  const action = useEntryAction();
  const current = allEntries.find((e) => e.id === entryId) ?? entry;

  const form = useForm<FieldValues>({
    defaultValues: initialValues(type, entry),
    resolver: zodResolver(draftSchemaFor(def)) as unknown as Resolver<FieldValues>,
    mode: "onBlur",
  });
  const values = useWatch({ control: form.control }) as EntryData;
  const { isDirty } = form.formState;

  React.useEffect(() => {
    setUnsaved(isDirty);
  }, [isDirty]);
  React.useEffect(() => () => setUnsaved(false), []);
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form.formState]);

  const missing = missingRequired(def, values);

  /* ------------------------------------------------------------------ save */
  const doSave = React.useCallback(
    async (opts: { silent?: boolean } = {}): Promise<Entry | null> => {
      let result: Entry | null = null;
      await form.handleSubmit(
        async (data) => {
          const snapshot = JSON.stringify(form.getValues());
          setSaveState("saving");
          try {
            const res = await save.mutateAsync({ id: entryId, type, data: data as EntryData });
            result = res.entry;
            if (!entryId) {
              setEntryId(res.entry.id);
              onCreated?.(res.entry);
            }
            if (JSON.stringify(form.getValues()) === snapshot) form.reset(form.getValues());
            setSaveState("saved");
            setLastSaved(res.entry.updatedAt);
            if (!opts.silent) toast.success("Draft saved", { description: "Your changes are saved. They are not live until you publish." });
          } catch (e) {
            setSaveState("error");
            const err = e as ApiError;
            const issues = err.body?.issues as { path: string; message: string }[] | undefined;
            issues?.forEach((i) => form.setError(i.path, { message: i.message }));
            toast.error("Couldn't save", { description: err.message });
          }
        },
        () => {
          setSaveState("error");
          if (!opts.silent) toast.error("Please fix the highlighted fields", { description: "Some details aren't in the right format yet." });
        },
      )();
      return result;
    },
    [entryId, form, onCreated, save, type],
  );

  // Autosave (existing entries only), 3 seconds after the last change.
  React.useEffect(() => {
    if (!autosave || !entryId || !isDirty || save.isPending) return;
    const t = setTimeout(() => void doSave({ silent: true }), 3000);
    return () => clearTimeout(t);
  }, [autosave, entryId, isDirty, values, doSave, save.isPending]);

  // Ctrl/Cmd + S
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void doSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSave]);

  /* --------------------------------------------------------------- publish */
  const focusField = (key: string) => {
    const el = document.getElementById(`field-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input,textarea,select,button")?.focus({ preventScroll: true });
  };

  const publish = async () => {
    if (missing.length) {
      missing.forEach((m) => form.setError(m.key, { message: "Required before publishing" }));
      toast.error(`${missing.length} required ${missing.length === 1 ? "detail is" : "details are"} missing`, {
        description: missing.map((m) => m.label).join(", "),
      });
      if (effectiveMode === "preview") setMode("edit");
      setTimeout(() => focusField(missing[0].key), 50);
      return;
    }
    let id = entryId;
    if (!id || isDirty) {
      const saved = await doSave({ silent: true });
      if (!saved) return;
      id = saved.id;
    }
    try {
      await action.mutateAsync({ id: id!, action: "publish" });
      toast.success("Published", { description: "This content is now live on your website." });
    } catch (e) {
      toast.error("Couldn't publish", { description: (e as Error).message });
    }
  };

  const run = async (a: "unpublish" | "duplicate" | "revert" | "delete") => {
    if (!entryId) return;
    try {
      const res = await action.mutateAsync({ id: entryId, action: a });
      if (a === "unpublish") toast.success("Unpublished", { description: "Hidden from the website. Your draft is kept." });
      if (a === "duplicate") toast.success("Duplicated", { description: "A copy was created as a draft." });
      if (a === "revert" && res.entry) {
        form.reset(initialValues(type, res.entry));
        toast.success("Changes discarded", { description: "Back to the published version." });
      }
      if (a === "delete") {
        setUnsaved(false);
        toast.success(`${def.singular} deleted`);
        onDeleted?.();
      }
    } catch (e) {
      toast.error("Something went wrong", { description: (e as Error).message });
    }
  };

  /* --------------------------------------------------------------- preview */
  const previewSite = React.useMemo(() => {
    const id = entryId ?? "__new__";
    const now = new Date().toISOString();
    const others = allEntries.filter((e) => e.id !== id);
    const self: Entry = {
      ...(current ?? { id, type, published: null, slug: id, publishedSlug: null, order: 9999, hasUnpublishedChanges: false, createdAt: now, updatedAt: now, publishedAt: null }),
      id,
      type,
      data: values,
    };
    return buildSiteContent([...others, self], true);
  }, [allEntries, current, entryId, type, values]);

  const busy = save.isPending || action.isPending;
  const published = !!current?.published;
  const changed = published && (current?.hasUnpublishedChanges || isDirty);
  const meta = React.useMemo(() => {
    const suggestions: Record<string, string[]> = {};
    for (const g of def.groups)
      for (const f of g.fields)
        if (f.suggestFromExisting || f.type === "tags") {
          const set = new Set<string>();
          allEntries
            .filter((e) => e.type === type)
            .forEach((e) => {
              const v = e.data[f.key];
              if (typeof v === "string" && v.trim()) set.add(v.trim());
              if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && x.trim() && set.add(x.trim()));
            });
          suggestions[f.key] = [...set];
        }
    return { folder: type, suggestions };
  }, [allEntries, def.groups, type]);

  const displayState: SaveState = save.isPending ? "saving" : isDirty && saveState !== "error" ? "dirty" : saveState;
  const statusText =
    displayState === "saving"
      ? "Saving…"
      : displayState === "dirty"
        ? autosave && entryId ? "Unsaved changes · autosaving…" : "Unsaved changes"
        : displayState === "error"
          ? "Not saved — check the form"
          : lastSaved && entryId
            ? `Saved ${formatRelative(lastSaved)}`
            : "Not saved yet";

  return (
    <FormProvider {...form}>
      <FormMetaContext.Provider value={meta}>
        <div>
          {/* Toolbar */}
          <div className="sticky top-14 z-20 -mx-4 mb-6 border-y bg-surface/95 px-4 py-2.5 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {publishable && <PublishBadge published={published} changed={!!changed} />}
                <span className={cn("flex items-center gap-1.5 text-xs", displayState === "error" ? "text-destructive" : "text-muted-foreground")}>
                  {displayState === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : displayState === "saved" || (displayState === "idle" && entryId) ? <CheckCircle2 className="size-3.5 text-success" /> : displayState === "error" ? <AlertCircle className="size-3.5" /> : null}
                  {statusText}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden rounded-full bg-muted p-0.5 sm:flex" role="tablist" aria-label="View mode">
                  {(
                    [
                      { m: "edit", label: "Edit", icon: PanelLeft },
                      ...(isWide ? [{ m: "split", label: "Side by side", icon: Columns2 }] : []),
                      { m: "preview", label: "Preview", icon: Eye },
                    ] as { m: Mode; label: string; icon: typeof Eye }[]
                  ).map((o) => (
                    <button
                      key={o.m}
                      role="tab"
                      aria-selected={effectiveMode === o.m}
                      onClick={() => setMode(o.m)}
                      className={cn("flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition", effectiveMode === o.m ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      <o.icon className="size-3.5" /> {o.label}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="sm:hidden" onClick={() => setMode(effectiveMode === "preview" ? "edit" : "preview")}>
                  {effectiveMode === "preview" ? <PanelLeft /> : <Eye />} {effectiveMode === "preview" ? "Edit" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void doSave()} disabled={busy || (!isDirty && !!entryId)}>
                  {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} {publishable ? "Save draft" : "Save"}
                </Button>
                {publishable && (
                  <Button size="sm" onClick={() => void publish()} disabled={busy || (published && !changed)}>
                    {action.isPending ? <Loader2 className="animate-spin" /> : <Rocket />} {published ? (changed ? "Update live site" : "Published") : "Publish"}
                  </Button>
                )}
                {entryId && publishable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {published && <DropdownMenuItem onSelect={() => void run("unpublish")}><EyeOff /> Unpublish (hide from website)</DropdownMenuItem>}
                      {published && current?.hasUnpublishedChanges && <DropdownMenuItem onSelect={() => void run("revert")}><RotateCcw /> Discard unpublished changes</DropdownMenuItem>}
                      {def.kind === "collection" && <DropdownMenuItem onSelect={() => void run("duplicate")}><Copy /> Duplicate</DropdownMenuItem>}
                      {def.kind === "collection" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}><Trash2 /> Delete {def.singular.toLowerCase()}</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          <div className={cn("grid gap-8", effectiveMode === "split" && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]")}>
            {effectiveMode !== "preview" && (
              <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} noValidate className="min-w-0 space-y-6">
                {/* Checklist */}
                <Card className={cn("p-4 md:p-5", !publishable && "hidden", missing.length ? "border-warning/30 bg-warning/[0.04]" : "border-success/30 bg-success/[0.05]")}>
                  {missing.length ? (
                    <>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="size-4 text-warning" /> {missing.length} required {missing.length === 1 ? "detail" : "details"} still needed before this can be published
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {missing.map((m) => (
                          <button key={m.key} type="button" onClick={() => focusField(m.key)} className="cursor-pointer rounded-full border border-warning/30 bg-surface px-2.5 py-1 text-xs font-medium hover:border-warning">
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">You can save a draft at any time — nothing is published until you choose to.</p>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-sm font-semibold text-success">
                      <CheckCircle2 className="size-4" /> All required details are filled in — ready to publish whenever you are.
                    </p>
                  )}
                </Card>

                {def.groups.map((g) => (
                  <Card key={g.title} className="p-5 md:p-7">
                    <h3 className="font-display text-2xl">{g.title}</h3>
                    {g.description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{g.description}</p>}
                    <div className="mt-6 grid gap-x-5 gap-y-8 md:grid-cols-2">
                      {g.fields.map((f) => (
                        <FieldRenderer key={f.key} field={f} name={f.key} />
                      ))}
                    </div>
                  </Card>
                ))}

                <div className="flex flex-wrap justify-end gap-2 pb-6">
                  <Button type="submit" variant="outline" disabled={busy || (!isDirty && !!entryId)}>
                    <Save /> {publishable ? "Save draft" : "Save"}
                  </Button>
                  {publishable && (
                    <Button type="button" onClick={() => void publish()} disabled={busy || (published && !changed)}>
                      <Rocket /> {published ? (changed ? "Update live site" : "Published") : "Publish"}
                    </Button>
                  )}
                </div>
              </form>
            )}
            {effectiveMode !== "edit" && (
              <div className={cn("min-w-0", effectiveMode === "split" && "xl:sticky xl:top-20 xl:self-start")}>
                <PreviewPane
                  site={previewSite}
                  options={PREVIEWS_FOR_TYPE[type]}
                  itemId={entryId ?? "__new__"}
                  itemSlug={current?.slug}
                  height={effectiveMode === "split" ? "calc(100dvh - 7rem)" : "calc(100dvh - 12rem)"}
                />
              </div>
            )}
          </div>
        </div>
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete this ${def.singular.toLowerCase()}?`}
          description="It will be removed from the Studio and from the website. Uploaded files stay in your media library."
          confirmLabel="Delete"
          destructive
          onConfirm={() => run("delete")}
        />
      </FormMetaContext.Provider>
    </FormProvider>
  );
}
