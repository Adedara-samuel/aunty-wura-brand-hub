"use client";

import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, MonitorPlay, ShieldCheck, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Price } from "@/lib/content/types";
import type { SiteItem } from "@/lib/site-types";
import { getPurchaseAction } from "@/lib/commerce";
import { classFormatLabel, formatPrice, platformLabel } from "@/lib/format";
import { cn, str, strList } from "@/lib/utils";
import { asMedia, EmptySection, ExtLink, GhostCards, Link, MediaFrame, Ph } from "../placeholder";
import { useSite } from "../site-context";
import { CheckList, PageIntro, Prose, Reveal } from "./common";

export function PurchaseButton({ type, data, className, size = "lg" }: { type: "class" | "product"; data: Record<string, unknown>; className?: string; size?: "lg" | "default" }) {
  const action = getPurchaseAction(type, data);
  if (action.kind !== "external") {
    return (
      <span className={cn(buttonVariants({ variant: "secondary", size }), "pointer-events-none opacity-70", className)}>
        {action.label}
      </span>
    );
  }
  return (
    <ExtLink href={action.href} className={cn(buttonVariants({ size }), className)}>
      {action.label} <ArrowUpRight />
    </ExtLink>
  );
}

export function ClassCard({ item }: { item: SiteItem }) {
  const d = item.data;
  const price = formatPrice(d.price as Price);
  return (
    <Link href={`/classes/${item.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="overflow-hidden">
        <MediaFrame media={asMedia(d.banner)} label="Course banner" ratio="16/9" rounded={false} className="transition duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          {classFormatLabel(str(d.format)) && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{classFormatLabel(str(d.format))}</span>}
          {str(d.duration) && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{str(d.duration)}</span>}
        </div>
        <h3 className="mt-4 font-display text-2xl leading-snug">{str(d.title)}</h3>
        {str(d.summary) && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="font-display text-xl">{price}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View class <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ClassCatalogue({ items }: { items: SiteItem[] }) {
  const { ph } = useSite();
  if (items.length === 0) {
    return ph ? (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GhostCards count={3} label="Class" ratio="16/9" />
      </div>
    ) : (
      <EmptySection title="Classes coming soon" text="New classes and training programmes will be announced here." />
    );
  }
  const sorted = items.slice().sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured));
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sorted.map((c, i) => (
        <Reveal key={c.id} delay={(i % 3) * 80}>
          <ClassCard item={c} />
        </Reveal>
      ))}
    </div>
  );
}

export function ClassesView() {
  const { site } = useSite();
  return (
    <>
      <PageIntro eyebrow="Classes & training" title="Learn with me" intro="Classes and training programmes. Enrolment is completed securely on each class's sales page." />
      <section className="container-page py-16 md:py-20">
        <ClassCatalogue items={site.classes} />
      </section>
    </>
  );
}

export function ClassDetail({ item }: { item: SiteItem }) {
  const { ph } = useSite();
  const d = item.data;
  const objectives = strList(d.objectives);
  const modules = (Array.isArray(d.modules) ? d.modules : []) as { title?: string; description?: string }[];
  const price = formatPrice(d.price as Price);
  const facts = [
    { icon: MonitorPlay, k: "Format", v: classFormatLabel(str(d.format)) },
    { icon: Clock, k: "Duration", v: str(d.duration) },
    { icon: CalendarDays, k: "Starts", v: str(d.startDate) },
  ].filter((f) => f.v);

  return (
    <article>
      <div className="container-page pt-10">
        <Link href="/classes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All classes
        </Link>
      </div>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <h1 className="display text-5xl text-balance md:text-6xl">{str(d.title)}</h1>
          {str(d.summary) && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
          <div className="mt-8 overflow-hidden rounded-[1.75rem]">
            <MediaFrame media={asMedia(d.banner)} label="Course banner" ratio="16/9" priority />
          </div>

          <div className="mt-12 space-y-12">
            <section>
              <h2 className="font-display text-3xl">About this class</h2>
              <div className="mt-4">{str(d.description) ? <Prose text={str(d.description)} /> : ph ? <Ph block>Full course description.</Ph> : null}</div>
            </section>
            {objectives.length > 0 && (
              <section>
                <h2 className="font-display text-3xl">What you&apos;ll learn</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {objectives.map((o, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border bg-surface p-4 text-sm leading-relaxed">
                      <span className="font-display text-lg text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      {o}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {modules.filter((m) => m.title).length > 0 && (
              <section>
                <h2 className="font-display text-3xl">Course outline</h2>
                <ol className="mt-5 divide-y rounded-2xl border bg-surface">
                  {modules.filter((m) => m.title).map((m, i) => (
                    <li key={i} className="flex gap-5 p-5">
                      <span className="eyebrow mt-1 w-16 shrink-0">Module {i + 1}</span>
                      <div>
                        <p className="font-semibold">{m.title}</p>
                        {m.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {str(d.audience) && (
              <section className="rounded-2xl bg-surface-2/70 p-6 md:p-8">
                <h2 className="flex items-center gap-2 font-display text-2xl">
                  <Users className="size-5 text-primary" /> Who it&apos;s for
                </h2>
                <p className="mt-3 leading-relaxed">{str(d.audience)}</p>
              </section>
            )}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 rounded-[1.75rem] border bg-surface p-6 shadow-xl md:p-8">
            <p className="eyebrow">Enrol</p>
            <p className="mt-3 font-display text-4xl">{price || (ph ? <Ph>Price</Ph> : null)}</p>
            {(d.price as Price)?.note && <p className="mt-1 text-sm text-muted-foreground">{(d.price as Price).note}</p>}
            {facts.length > 0 && (
              <dl className="mt-6 space-y-3 border-y py-5">
                {facts.map((f) => (
                  <div key={f.k} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="flex items-center gap-2 text-muted-foreground"><f.icon className="size-4" /> {f.k}</dt>
                    <dd className="text-right font-medium">{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <PurchaseButton type="class" data={d} className="mt-6 w-full" />
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              You&apos;ll complete enrolment securely on {platformLabel(str(d.platform), str(d.platformName))}.
            </p>
            <Link href="/contact?type=general" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">
              Have a question about this class?
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
