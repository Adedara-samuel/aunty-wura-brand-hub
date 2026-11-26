"use client";

import * as React from "react";
import NextLink from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Archive, Download, FileJson, FileText, FileType2, Loader2, Pencil, Printer, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/display";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/overlay";
import { Label, Textarea } from "@/components/ui/primitives";
import type { ReportValue } from "@/lib/content/report";
import { STUDIO_MODULES } from "@/lib/content/modules";
import { api, qk, useReport, useSubmissions } from "@/lib/studio/api";
import { cn, formatRelative } from "@/lib/utils";
import { PageHeader } from "./shell";
import { StateBadge } from "./status";

export function SubmitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { data: report } = useReport();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const p = report?.progress;

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/studio/submissions", { method: "POST", body: JSON.stringify({ note }) });
      toast.success("Submitted for review", { description: "A snapshot of all your content has been sent for review. You can keep editing." });
      setNote("");
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: qk.submissions });
      void qc.invalidateQueries({ queryKey: qk.overview });
    } catch (e) {
      toast.error("Couldn't submit", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit content for review</DialogTitle>
          <DialogDescription>
            This sends a snapshot of everything you&apos;ve prepared so far. You don&apos;t need to finish every section first — you can submit again any time.
          </DialogDescription>
        </DialogHeader>
        {p && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl">{p.percent}%</p><p className="text-xs text-muted-foreground">overall</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl">{p.completed}/{p.totalSections}</p><p className="text-xs text-muted-foreground">sections done</p></div>
            <div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl">{p.missingRequired}</p><p className="text-xs text-muted-foreground">missing details</p></div>
          </div>
        )}
        <div>
          <Label htmlFor="submit-note">Message for the reviewer (optional)</Label>
          <Textarea id="submit-note" className="mt-2" rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="Anything you'd like to explain, questions, or things you're still working on…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Submit for review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ValueView({ v }: { v: ReportValue }) {
  if (v.kind === "text") return <p className="text-sm leading-relaxed whitespace-pre-line">{v.text}</p>;
  if (v.kind === "list")
    return (
      <ul className="list-disc space-y-0.5 pl-4 text-sm">
        {v.items.map((i, k) => <li key={k}>{i}</li>)}
      </ul>
    );
  if (v.kind === "media")
    return (
      <div className="flex flex-wrap gap-2">
        {v.items.map((i, k) =>
          i.kind === "image" ? (
            <a key={k} href={i.url} target="_blank" rel="noopener" className="block size-16 overflow-hidden rounded-lg border" title={i.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt="" className="size-full object-cover" />
            </a>
          ) : (
            <a key={k} href={i.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted">
              <FileText className="size-3.5" /> {i.name}
            </a>
          ),
        )}
      </div>
    );
  return (
    <ol className="space-y-1.5 text-sm">
      {v.items.map((rec, k) => (
        <li key={k} className="rounded-lg bg-muted/60 px-3 py-2">
          {rec.map((r) => (
            <span key={r.label} className="mr-3 inline-block"><span className="text-muted-foreground">{r.label}:</span> {r.value}</span>
          ))}
        </li>
      ))}
    </ol>
  );
}

export function ReviewExport() {
  const { data: report, isLoading } = useReport();
  const { data: submissions } = useSubmissions();
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [onlyMissing, setOnlyMissing] = React.useState(false);

  const exportLinks = [
    { href: "/api/studio/export?format=pdf", label: "Content pack (PDF)", icon: FileType2, primary: true },
    { href: "/api/studio/export?format=md", label: "Markdown document", icon: FileText },
    { href: "/api/studio/export?format=json", label: "Raw data (JSON)", icon: FileJson },
    { href: "/api/studio/media/zip", label: "All media (ZIP)", icon: Archive },
    { href: "/api/rate-card?draft=1&download=1", label: "Rate card (PDF)", icon: Download },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Review & export"
        title="Review everything in one place"
        description="Every website section, organised in order, with missing details clearly marked. Download it as a document, or submit it for review."
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} className="no-print"><Printer /> Print</Button>
            <Button onClick={() => setSubmitOpen(true)} className="no-print"><Send /> Submit for review</Button>
          </>
        }
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        <Card className="no-print p-5 md:p-6">
          <p className="font-semibold">Download</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {exportLinks.map((l) => (
              <a key={l.href} href={l.href} className={cn(buttonVariants({ variant: l.primary ? "default" : "outline" }), "h-auto justify-start rounded-xl px-4 py-3 whitespace-normal")}>
                <l.icon className="size-4" /> <span className="text-left">{l.label}</span>
              </a>
            ))}
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div className="min-w-0 space-y-6">
            <div className="no-print flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Content summary</h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="size-4 accent-[var(--primary)]" />
                Only show what&apos;s missing
              </label>
            </div>
            {isLoading || !report ? (
              <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
            ) : (
              report.modules.map((m) => {
                const mod = STUDIO_MODULES.find((x) => x.number === m.number)!;
                return (
                  <Card key={m.number} className="overflow-hidden break-inside-avoid">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface-2/50 px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">Section {m.number}</p>
                        <p className="font-display text-xl">{m.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StateBadge state={m.state} />
                        <span className="text-sm font-semibold tabular-nums">{m.percent}%</span>
                        <NextLink href={`/content-studio/${mod.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-print")}><Pencil /> Edit</NextLink>
                      </div>
                    </div>
                    <div className="space-y-5 p-5">
                      {m.sections.map((s) => (
                        <div key={s.type} className="space-y-4">
                          {m.sections.length > 1 && <p className="eyebrow">{s.label}</p>}
                          {s.kind === "collection" && s.entries.length === 0 && (
                            <p className="flex items-center gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                              <AlertTriangle className="size-4" /> No {s.label.toLowerCase()} added yet.
                            </p>
                          )}
                          {s.entries.map((e) => {
                            const fields = e.fields.filter((f) => (onlyMissing ? f.required && !f.filled : f.value || f.required));
                            if (onlyMissing && fields.length === 0) return null;
                            return (
                              <div key={e.id} className={cn(s.kind === "collection" && "rounded-xl border p-4")}>
                                {s.kind === "collection" && (
                                  <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{e.title}</p>
                                    <Badge variant={e.status === "Published" ? "success" : e.status === "Draft" ? "outline" : "warning"}>{e.status}</Badge>
                                  </div>
                                )}
                                <dl className="divide-y">
                                  {fields.map((f) => (
                                    <div key={f.key} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                                      <dt className="text-sm text-muted-foreground">{f.label}{f.required && <span className="text-primary"> *</span>}</dt>
                                      <dd className="min-w-0">
                                        {f.value ? <ValueView v={f.value} /> : <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive"><AlertTriangle className="size-3.5" /> Missing</span>}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
          <aside className="no-print space-y-4">
            <Card className="p-5">
              <p className="font-semibold">Submission history</p>
              {!submissions?.length ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing submitted yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {submissions.map((s) => (
                    <li key={s.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                      <p className="font-semibold">{formatRelative(s.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.percent}% · {s.completed}/{s.totalSections} sections · by {s.submittedBy}
                      </p>
                      {s.note && <p className="mt-1.5 line-clamp-3 text-xs">“{s.note}”</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </div>
      <SubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  );
}
