"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ChevronDown, Inbox, Mail, MailOpen, MessageCircle, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/overlay";
import { whatsappLink } from "@/lib/format";
import { api, qk, useEnquiries, type Enquiry } from "@/lib/studio/api";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { PageHeader } from "./shell";

const KIND: Record<Enquiry["kind"], { label: string; variant: "default" | "warning" | "neutral" }> = {
  business: { label: "Business", variant: "default" },
  collaboration: { label: "Collaboration", variant: "warning" },
  general: { label: "General", variant: "neutral" },
};

const TABS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

export function EnquiriesInbox() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEnquiries();
  const [tab, setTab] = React.useState<(typeof TABS)[number]["value"]>("new");
  const [open, setOpen] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<Enquiry | null>(null);
  const list = (data ?? []).filter((e) => tab === "all" || e.status === tab);

  const setStatus = async (e: Enquiry, status: Enquiry["status"]) => {
    qc.setQueryData<Enquiry[]>(qk.enquiries, (old) => old?.map((x) => (x.id === e.id ? { ...x, status } : x)));
    try {
      await api(`/api/studio/enquiries/${e.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    } catch (err) {
      toast.error((err as Error).message);
    }
    void qc.invalidateQueries({ queryKey: qk.enquiries });
    void qc.invalidateQueries({ queryKey: qk.overview });
  };

  const remove = async (e: Enquiry) => {
    try {
      await api(`/api/studio/enquiries/${e.id}`, { method: "DELETE" });
      toast.success("Enquiry deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
    void qc.invalidateQueries({ queryKey: qk.enquiries });
    void qc.invalidateQueries({ queryKey: qk.overview });
  };

  const toggle = (e: Enquiry) => {
    setOpen((o) => (o === e.id ? null : e.id));
    if (e.status === "new") void setStatus(e, "read");
  };

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Enquiries" description="Messages sent through the business, collaboration and general enquiry forms on your website." />
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 md:px-8">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition", tab === t.value ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40")}
            >
              {t.label}
              {data && <span className="ml-1.5 opacity-60 tabular-nums">{t.value === "all" ? data.length : data.filter((e) => e.status === t.value).length}</span>}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : isError ? (
          <Card className="p-8 text-center"><p>Couldn&apos;t load enquiries.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button></Card>
        ) : list.length === 0 ? (
          <Card className="flex flex-col items-center border-dashed px-6 py-16 text-center">
            <Inbox className="size-10 text-muted-foreground" />
            <p className="mt-4 font-display text-2xl">{tab === "new" ? "You're all caught up" : "Nothing here"}</p>
            <p className="mt-2 text-sm text-muted-foreground">When someone uses the contact forms on your website, their message appears here.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {list.map((e) => {
              const expanded = open === e.id;
              const wa = whatsappLink(e.phone, `Hello ${e.name.split(" ")[0]}, thank you for your enquiry.`);
              return (
                <li key={e.id}>
                  <Card className={cn("overflow-hidden transition", e.status === "new" && "border-primary/40")}>
                    <button onClick={() => toggle(e)} className="flex w-full cursor-pointer items-start gap-4 p-4 text-left md:p-5" aria-expanded={expanded}>
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.status === "new" ? "bg-primary" : "bg-transparent")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={cn("truncate", e.status === "new" ? "font-bold" : "font-semibold")}>{e.name}</p>
                          <Badge variant={KIND[e.kind].variant}>{KIND[e.kind].label}</Badge>
                          {e.organisation && <span className="truncate text-sm text-muted-foreground">· {e.organisation}</span>}
                        </div>
                        <p className={cn("mt-1 text-sm text-muted-foreground", !expanded && "line-clamp-1")}>{e.subject || e.service || e.message}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {formatRelative(e.createdAt)}
                        <ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} />
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t px-4 py-5 md:px-6">
                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          {[
                            ["Email", e.email],
                            ["Phone", e.phone],
                            ["Organisation", e.organisation],
                            ["Service", e.service],
                            ["Budget", e.budget],
                            ["Timeline", e.timeline],
                            ["Subject", e.subject],
                            ["Received", formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions)],
                          ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                                <dd className="min-w-0 break-words">{v}</dd>
                              </div>
                            ))}
                        </dl>
                        <p className="mt-5 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed whitespace-pre-line">{e.message}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.subject || "your enquiry"}`)}`} className={buttonVariants({ size: "sm" })}>
                            <Mail /> Reply by email
                          </a>
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener" className={buttonVariants({ size: "sm", variant: "outline" })}>
                              <MessageCircle /> WhatsApp
                            </a>
                          )}
                          {e.status !== "new" && <Button size="sm" variant="ghost" onClick={() => setStatus(e, "new")}><MailOpen /> Mark unread</Button>}
                          {e.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setStatus(e, "archived")}><Archive /> Archive</Button>}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(e)}><Trash2 /> Delete</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this enquiry?"
        description="This permanently removes the message."
        confirmLabel="Delete"
        destructive
        onConfirm={() => toDelete && remove(toDelete)}
      />
    </div>
  );
}
