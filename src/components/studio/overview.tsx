"use client";

import * as React from "react";
import NextLink from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, CircleDashed, CircleDot, ClipboardCheck, ExternalLink, FolderOpen, Inbox, LayoutList, Send, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/display";
import { Progress } from "@/components/ui/primitives";
import { CONTENT_TYPES } from "@/lib/content/definitions";
import { missingRequired } from "@/lib/content/completion";
import { STUDIO_MODULES } from "@/lib/content/modules";
import { useEntries, useOverview } from "@/lib/studio/api";
import { cn, formatRelative } from "@/lib/utils";
import { ModuleIcon } from "./icons";
import { ProgressRing, StateBadge } from "./status";
import { SubmitDialog } from "./review";

function Stat({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-surface p-4">
      <Icon className={cn("size-4", tone ?? "text-muted-foreground")} />
      <p className="mt-3 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function HowItWorks() {
  const [hidden, setHidden] = React.useState(true);
  React.useEffect(() => {
    try {
      setHidden(localStorage.getItem("studio.howto.hidden") === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden) return null;
  const steps = [
    { t: "Fill in each section", d: "Work through the 10 sections in any order. Every field explains what's needed and shows an example." },
    { t: "Save as you go", d: "Drafts save automatically. Nothing appears on the website until you publish it." },
    { t: "Preview everything", d: "See exactly how each section will look on desktop, tablet and mobile while you type." },
    { t: "Submit for review", d: "When you're ready, export your content or submit it for review in one click." },
  ];
  return (
    <Card className="relative p-5 md:p-6">
      <button
        className="absolute top-3 right-3 cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem("studio.howto.hidden", "1");
          } catch {}
        }}
        aria-label="Hide"
      >
        <X className="size-4" />
      </button>
      <p className="eyebrow">How this works</p>
      <ol className="mt-4 grid gap-5 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t}>
            <span className="font-display text-2xl text-primary">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-1 font-semibold">{s.t}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function Overview({ name }: { name: string }) {
  const { data, isLoading, isError, refetch } = useOverview();
  const { data: entries } = useEntries();
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const firstName = name.split(" ")[0];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-56" />
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-3xl">We couldn&apos;t load your workspace</p>
        <p className="mt-2 text-muted-foreground">Check your connection and try again.</p>
        <Button className="mt-6" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const p = data.progress;
  const next = p.modules.find((m) => m.state === "in_progress") ?? p.modules.find((m) => m.state === "not_started");
  const missingList = STUDIO_MODULES.flatMap((m) =>
    m.types.flatMap((t) => {
      const def = CONTENT_TYPES[t];
      const list = (entries ?? []).filter((e) => e.type === t);
      if (def.kind === "singleton") {
        return missingRequired(def, list[0]?.data).map((x) => ({ module: m, label: x.label, href: `/content-studio/${m.id}${m.types.length > 1 ? `?tab=${t}` : ""}` }));
      }
      if (list.length === 0) return [{ module: m, label: `Add at least one ${def.singular.toLowerCase()}`, href: `/content-studio/${m.id}${m.types.length > 1 ? `?tab=${t}` : ""}` }];
      return list.flatMap((e) =>
        missingRequired(def, e.data).length
          ? [{ module: m, label: `${String(e.data[def.titleField] || `Untitled ${def.singular.toLowerCase()}`)} — ${missingRequired(def, e.data).length} missing`, href: `/content-studio/${m.id}/${e.id}${m.id === "fragrance" ? `?type=${t}` : ""}` }]
          : [],
      );
    }),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Content Studio</p>
          <h1 className="display mt-2 text-4xl md:text-5xl">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            This is where you prepare everything for your website. Work through the sections at your own pace — your progress is saved automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/studio/preview?path=/" target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
            <ExternalLink /> Preview website
          </a>
          <Button onClick={() => setSubmitOpen(true)}>
            <Send /> Submit for review
          </Button>
        </div>
      </div>

      <HowItWorks />

      <Card className="grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-center md:gap-10 md:p-8">
        <div className="flex items-center gap-6">
          <ProgressRing value={p.percent} size={136} label="ready" />
          <div className="md:hidden">
            <p className="font-display text-2xl">Overall progress</p>
            <p className="text-sm text-muted-foreground">{p.completed} of {p.totalSections} sections complete</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="hidden md:block">
            <p className="font-display text-2xl">Overall content preparation</p>
            <p className="text-sm text-muted-foreground">Based on the required details in every section.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat icon={LayoutList} label="Total sections" value={p.totalSections} />
            <Stat icon={CheckCircle2} label="Completed" value={p.completed} tone="text-success" />
            <Stat icon={CircleDot} label="In progress" value={p.inProgress} tone="text-warning" />
            <Stat icon={CircleDashed} label="Not started" value={p.notStarted} />
            <Stat icon={AlertCircle} label="Missing required" value={p.missingRequired} tone="text-destructive" />
          </div>
          {next && (
            <NextLink href={`/content-studio/${next.id}`} className={buttonVariants({ variant: "ink" })}>
              {next.state === "in_progress" ? "Continue" : "Start"} with {next.number}. {next.title} <ArrowRight />
            </NextLink>
          )}
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="font-display text-2xl">Your website sections</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {STUDIO_MODULES.map((m) => {
              const r = p.modules.find((x) => x.id === m.id)!;
              return (
                <NextLink key={m.id} href={`/content-studio/${m.id}`} className="group">
                  <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <ModuleIcon name={m.icon} className="size-5" />
                      </span>
                      <StateBadge state={r.state} />
                    </div>
                    <p className="mt-4 text-xs font-semibold text-muted-foreground tabular-nums">Section {m.number}</p>
                    <p className="font-display text-xl">{m.title}</p>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{m.summary}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={r.percent} className="h-1.5" indicatorClassName={r.state === "complete" ? "bg-success" : undefined} />
                      <span className="w-9 text-right text-xs font-semibold tabular-nums">{r.percent}%</span>
                    </div>
                    {r.missingCount > 0 && <p className="mt-2 text-xs text-muted-foreground">{r.missingCount} required {r.missingCount === 1 ? "detail" : "details"} missing</p>}
                  </Card>
                </NextLink>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="flex items-center gap-2 font-semibold"><AlertCircle className="size-4 text-destructive" /> Still needed</p>
            {missingList.length === 0 ? (
              <p className="mt-3 text-sm text-success">Everything required has been provided. 🎉</p>
            ) : (
              <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
                {missingList.slice(0, 40).map((x, i) => (
                  <li key={i}>
                    <NextLink href={x.href} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                      <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{x.module.number}.</span>
                      <span className="min-w-0">{x.label}</span>
                    </NextLink>
                  </li>
                ))}
                {missingList.length > 40 && <li className="px-2 text-xs text-muted-foreground">…and {missingList.length - 40} more</li>}
              </ul>
            )}
          </Card>
          <Card className="divide-y">
            <NextLink href="/content-studio/enquiries" className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <Inbox className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Enquiries</span>
              <span className="text-sm tabular-nums">{data.newEnquiries} new</span>
            </NextLink>
            <NextLink href="/content-studio/media" className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <FolderOpen className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Media library</span>
              <span className="text-sm tabular-nums">{data.mediaCount} files</span>
            </NextLink>
            <NextLink href="/content-studio/review" className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <ClipboardCheck className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">Review & export</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </NextLink>
          </Card>
          <Card className="p-5 text-sm">
            <p className="font-semibold">Last submitted for review</p>
            <p className="mt-1 text-muted-foreground">
              {data.lastSubmission ? `${formatRelative(data.lastSubmission.createdAt)} · ${data.lastSubmission.percent}% complete` : "Not submitted yet"}
            </p>
          </Card>
        </aside>
      </div>
      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  );
}
