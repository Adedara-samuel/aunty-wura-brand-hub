"use client";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lightbulb,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Star,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/display";
import { ConfirmDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { CONTENT_TYPES } from "@/lib/content/definitions";
import { entryCompletion, entryTitle } from "@/lib/content/completion";
import { getModule } from "@/lib/content/modules";
import type { ContentTypeId, Entry, MediaRef, ModuleId } from "@/lib/content/types";
import { buildSiteContent } from "@/lib/site-build";
import { useEntries, useEntryAction, useOverview, useReorder } from "@/lib/studio/api";
import { confirmLeave } from "@/lib/studio/unsaved";
import { cn, formatRelative, str } from "@/lib/utils";
import { EntryEditor } from "./entry-editor";
import { ModuleIcon } from "./icons";
import { MediaThumb } from "./media-input";
import { PreviewPane } from "./preview-pane";
import { LIST_VIEW_FOR_TYPE } from "./preview-views";
import { PageHeader } from "./shell";
import { PublishBadge, StateBadge } from "./status";

export function ModuleGuidance({ moduleId }: { moduleId: ModuleId }) {
  const m = getModule(moduleId)!;
  const [open, setOpen] = React.useState(true);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left" aria-expanded={open}>
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground"><Lightbulb className="size-4" /></span>
          <span>
            <span className="block text-sm font-semibold">Why we need this, and tips for writing it</span>
            <span className="block text-xs text-muted-foreground">Read this first — it takes 30 seconds.</span>
          </span>
        </span>
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-6 border-t px-5 py-5 md:grid-cols-2">
          <div>
            <p className="eyebrow">Why this matters</p>
            <p className="mt-2 text-sm leading-relaxed">{m.why}</p>
          </div>
          <div>
            <p className="eyebrow">Tips</p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed">
              {m.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

function thumbOf(type: ContentTypeId, e: Entry): MediaRef | null {
  const key = CONTENT_TYPES[type].imageField;
  if (!key) return null;
  const v = e.data[key];
  if (Array.isArray(v)) return (v[0] as MediaRef) ?? null;
  return (v as MediaRef) ?? null;
}

function CollectionList({ moduleId, type, entries }: { moduleId: ModuleId; type: ContentTypeId; entries: Entry[] }) {
  const def = CONTENT_TYPES[type];
  const router = useRouter();
  const action = useEntryAction();
  const reorder = useReorder();
  const [toDelete, setToDelete] = React.useState<Entry | null>(null);
  const list = entries.filter((e) => e.type === type).sort((a, b) => a.order - b.order);
  const newHref = `/content-studio/${moduleId}/new${moduleId === "fragrance" ? `?type=${type}` : ""}`;
  const editHref = (e: Entry) => `/content-studio/${moduleId}/${e.id}${moduleId === "fragrance" ? `?type=${type}` : ""}`;

  const move = (i: number, d: number) => {
    const ids = list.map((e) => e.id);
    const [x] = ids.splice(i, 1);
    ids.splice(i + d, 0, x);
    reorder.mutate({ type, ids });
  };

  const run = async (e: Entry, a: "publish" | "unpublish" | "duplicate" | "delete") => {
    try {
      await action.mutateAsync({ id: e.id, action: a });
      toast.success({ publish: "Published", unpublish: "Unpublished", duplicate: "Duplicated", delete: "Deleted" }[a]);
    } catch (err) {
      const missing = (err as { body?: { missing?: { label: string }[] } }).body?.missing;
      toast.error((err as Error).message, missing ? { description: `Missing: ${missing.map((m) => m.label).join(", ")}` } : undefined);
    }
  };

  if (list.length === 0) {
    return (
      <Card className="flex flex-col items-center border-dashed px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground"><Plus className="size-6" /></span>
        <p className="mt-5 font-display text-2xl">No {def.plural.toLowerCase()} yet</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Add your first {def.singular.toLowerCase()}. You can save it as a draft and come back to finish it whenever you like.
        </p>
        <NextLink href={newHref} onClick={confirmLeave} className={cn(buttonVariants(), "mt-6")}>
          <Plus /> Add {def.singular.toLowerCase()}
        </NextLink>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? def.singular.toLowerCase() : def.plural.toLowerCase()} · {list.filter((e) => e.published).length} live
        </p>
        <NextLink href={newHref} onClick={confirmLeave} className={buttonVariants({ size: "sm" })}>
          <Plus /> Add {def.singular.toLowerCase()}
        </NextLink>
      </div>
      <ul className="space-y-3">
        {list.map((e, i) => {
          const c = entryCompletion(def, e.data);
          const thumb = thumbOf(type, e);
          const subtitle = def.subtitleField ? str(e.data[def.subtitleField]) : "";
          return (
            <li key={e.id}>
              <Card className="flex items-center gap-4 p-3 transition hover:shadow-md md:p-4">
                <NextLink href={editHref(e)} onClick={confirmLeave} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted md:size-20">
                    {thumb?.url ? <MediaThumb media={thumb} /> : <div className="flex size-full items-center justify-center text-muted-foreground/50"><ModuleIcon name={getModule(moduleId)!.icon} className="size-6" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-semibold">
                      {e.data.featured === true && <Star className="size-3.5 shrink-0 fill-warning text-warning" />}
                      <span className="truncate">{entryTitle(def, e.data, i)}</span>
                    </p>
                    {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StateBadge state={c.state} />
                      <PublishBadge published={!!e.published} changed={e.hasUnpublishedChanges} />
                      {c.missing.length > 0 && <Badge variant="neutral">{c.missing.length} missing</Badge>}
                      <span className="text-xs text-muted-foreground">· edited {formatRelative(e.updatedAt)}</span>
                    </div>
                  </div>
                </NextLink>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="hidden flex-col sm:flex">
                    <button disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)} className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                    <button disabled={i === list.length - 1 || reorder.isPending} onClick={() => move(i, 1)} className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Actions"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => router.push(editHref(e))}><Pencil /> Edit</DropdownMenuItem>
                      {(!e.published || e.hasUnpublishedChanges) && (
                        <DropdownMenuItem onSelect={() => void run(e, "publish")}><Rocket /> {e.published ? "Publish changes" : "Publish"}</DropdownMenuItem>
                      )}
                      {e.published && <DropdownMenuItem onSelect={() => void run(e, "unpublish")}><EyeOff /> Unpublish</DropdownMenuItem>}
                      <DropdownMenuItem onSelect={() => void run(e, "duplicate")}><Copy /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="sm:hidden" disabled={i === 0} onSelect={() => move(i, -1)}><ArrowUp /> Move up</DropdownMenuItem>
                      <DropdownMenuItem className="sm:hidden" disabled={i === list.length - 1} onSelect={() => move(i, 1)}><ArrowDown /> Move down</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onSelect={() => setToDelete(e)}><Trash2 /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete “${toDelete ? entryTitle(def, toDelete.data) : ""}”?`}
        description="It will be removed from the Studio and from the website. Uploaded files stay in your media library."
        confirmLabel="Delete"
        destructive
        onConfirm={() => (toDelete ? run(toDelete, "delete") : undefined)}
      />
    </div>
  );
}

function CollectionSection({ moduleId, type, entries }: { moduleId: ModuleId; type: ContentTypeId; entries: Entry[] }) {
  const listView = LIST_VIEW_FOR_TYPE[type];
  const site = React.useMemo(() => buildSiteContent(entries, true), [entries]);
  if (!listView) return <CollectionList moduleId={moduleId} type={type} entries={entries} />;
  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list"><List /> Your entries</TabsTrigger>
        <TabsTrigger value="preview"><Eye /> Preview on website</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-5">
        <CollectionList moduleId={moduleId} type={type} entries={entries} />
      </TabsContent>
      <TabsContent value="preview" className="mt-5">
        <PreviewPane site={site} options={[listView]} height="calc(100dvh - 16rem)" />
      </TabsContent>
    </Tabs>
  );
}

export function ModuleWorkspace({ moduleId, initialTab }: { moduleId: ModuleId; initialTab?: string }) {
  const m = getModule(moduleId)!;
  const { data: entries, isLoading, isError, error, refetch } = useEntries();
  const { data: overview } = useOverview();
  const report = overview?.progress.modules.find((x) => x.id === moduleId);
  const types = m.types;
  const [tab, setTab] = React.useState(initialTab && (types as string[]).includes(initialTab) ? initialTab : types[0]);

  const header = (
    <PageHeader
      eyebrow={<span className="flex items-center gap-2"><ModuleIcon name={m.icon} className="size-3.5" /> Section {m.number} of 10</span>}
      title={m.title}
      description={m.summary}
      actions={
        <>
          {report && <StateBadge state={report.state} className="self-center" />}
          <a href={`/api/studio/preview?path=${encodeURIComponent(m.publicHref)}`} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink /> View on website
          </a>
        </>
      }
    >
      {report && (
        <div className="mt-6 flex items-center gap-3">
          <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${report.percent}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums">{report.percent}% of required details</span>
        </div>
      )}
    </PageHeader>
  );

  const body = (type: ContentTypeId) => {
    const def = CONTENT_TYPES[type];
    if (!entries) return null;
    if (def.kind === "singleton") {
      const entry = entries.find((e) => e.type === type) ?? null;
      return <EntryEditor key={type} type={type} entry={entry} allEntries={entries} />;
    }
    return <CollectionSection moduleId={moduleId} type={type} entries={entries} />;
  };

  return (
    <div>
      {header}
      <div className="mx-auto max-w-[110rem] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl">
          <ModuleGuidance moduleId={moduleId} />
        </div>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : isError ? (
          <Card className="p-8 text-center">
            <p className="font-semibold">We couldn&apos;t load this section.</p>
            <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button>
          </Card>
        ) : types.length > 1 ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-11">
              {types.map((t, i) => (
                <TabsTrigger key={t} value={t} className="h-9 px-4">
                  {i + 1}. {CONTENT_TYPES[t].kind === "singleton" ? "Brand details" : CONTENT_TYPES[t].plural}
                </TabsTrigger>
              ))}
            </TabsList>
            {types.map((t) => (
              <TabsContent key={t} value={t} className="mt-6">
                {body(t)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          body(types[0])
        )}
      </div>
    </div>
  );
}
