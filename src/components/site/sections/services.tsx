"use client";

import { ArrowRight, Clock, Download, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { Price } from "@/lib/content/types";
import type { SiteItem } from "@/lib/site-types";
import { formatPrice } from "@/lib/format";
import { brandName } from "@/lib/site-nav";
import { cn, str, strList } from "@/lib/utils";
import { asMedia, EmptySection, ExtLink, Link, MediaFrame, Ph, Txt } from "../placeholder";
import { useSite } from "../site-context";
import { CheckList, PageIntro, Prose, Reveal } from "./common";

export function groupByCategory(items: SiteItem[], key = "category") {
  const groups = new Map<string, SiteItem[]>();
  for (const i of items) {
    const c = str(i.data[key]).trim() || "Other";
    groups.set(c, [...(groups.get(c) ?? []), i]);
  }
  return [...groups.entries()];
}

function PriceTag({ price, className }: { price: unknown; className?: string }) {
  const { ph } = useSite();
  const text = formatPrice(price as Price);
  if (!text) return ph ? <Ph className={className}>Price</Ph> : null;
  return <span className={className}>{text}</span>;
}

export function ServiceCard({ item }: { item: SiteItem }) {
  const d = item.data;
  const includes = strList(d.includes);
  const reqs = strList(d.requirements);
  const addOns = (Array.isArray(d.addOns) ? d.addOns : []) as { name?: string; price?: string }[];
  const image = asMedia(d.image);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-surface transition hover:shadow-lg">
      {image && <MediaFrame media={image} ratio="16/9" rounded={false} />}
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-snug">{str(d.name)}</h3>
          <PriceTag price={d.price} className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground" />
        </div>
        {str(d.summary) && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
        {str(d.deliveryTimeline) && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4 text-primary" /> {str(d.deliveryTimeline)}
          </p>
        )}
        {includes.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow">What&apos;s included</p>
            <CheckList items={includes} className="mt-3" />
          </div>
        )}
        {reqs.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow">What I&apos;ll need</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {reqs.map((r, i) => <li key={i}>— {r}</li>)}
            </ul>
          </div>
        )}
        {addOns.filter((a) => a.name).length > 0 && (
          <div className="mt-6 rounded-xl bg-surface-2/70 p-4">
            <p className="eyebrow">Add-ons</p>
            <ul className="mt-2 divide-y divide-foreground/5 text-sm">
              {addOns.filter((a) => a.name).map((a, i) => (
                <li key={i} className="flex justify-between gap-4 py-2">
                  <span>{a.name}</span>
                  <span className="font-medium">{a.price && /^\d+$/.test(a.price) ? formatPrice({ mode: "fixed", amount: Number(a.price), currency: (d.price as Price)?.currency || "NGN" }) : a.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto pt-7">
          <Link
            href={`/contact?type=business&service=${encodeURIComponent(str(d.name))}`}
            className={cn(buttonVariants({ variant: "ink" }), "w-full")}
          >
            Enquire about this service
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ServicesList({ items }: { items: SiteItem[] }) {
  const { ph } = useSite();
  if (items.length === 0) {
    return ph ? (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-dashed p-7">
            <Ph className="text-xs">Service category</Ph>
            <p className="mt-3 font-display text-2xl"><Ph>Service name</Ph></p>
            <p className="mt-3 text-sm"><Ph>What the client gets and why it is valuable.</Ph></p>
            <p className="mt-6 text-sm"><Ph>Price · Delivery timeline</Ph></p>
          </div>
        ))}
      </div>
    ) : (
      <EmptySection title="Services coming soon" text="Service details are being finalised. Please get in touch in the meantime." />
    );
  }
  const sorted = items.slice().sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured));
  return (
    <div className="space-y-16">
      {groupByCategory(sorted).map(([cat, list]) => (
        <section key={cat}>
          <div className="flex items-center gap-4">
            <h2 className="font-display text-3xl">{cat}</h2>
            <span className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{list.length}</span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 70}>
                <ServiceCard item={s} />
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ServicesView() {
  const { site } = useSite();
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title="Ways to work together"
        intro="Every engagement can be tailored. Browse the services below or view the full rate card."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/rate-card" className={buttonVariants()}>
            View rate card <ArrowRight />
          </Link>
          <Link href="/contact?type=business" className={buttonVariants({ variant: "outline" })}>
            Request a custom quote
          </Link>
        </div>
      </PageIntro>
      <section className="container-page py-16 md:py-20">
        <ServicesList items={site.services} />
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rate card                                                                  */
/* -------------------------------------------------------------------------- */

export function RateCardDocument({ pdfHref }: { pdfHref?: string }) {
  const { site, ph } = useSite();
  const rc = site.rateCard;
  const services = site.services.filter((s) => s.data.showOnRateCard !== false);
  const name = brandName(site);
  const policies = strList(rc?.policies);
  const existing = asMedia(rc?.existingRateCard);

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border bg-surface shadow-[0_40px_100px_-50px_rgba(31,26,23,0.45)]">
      <header className="relative overflow-hidden bg-noir px-6 py-12 text-pearl md:px-12 md:py-14">
        <div aria-hidden className="absolute -top-20 -right-20 size-72 rounded-full border border-gold/20" />
        <div aria-hidden className="absolute -top-8 -right-8 size-48 rounded-full border border-gold/20" />
        <p className="eyebrow text-gold!">{name || (ph ? <Ph>Your name</Ph> : null)}</p>
        <h2 className="display mt-3 text-5xl md:text-6xl">{str(rc?.title) || "Rate Card"}</h2>
        <p className="mt-3 text-sm text-pearl/60">
          {str(site.profile?.professionalTitle)}
          {str(rc?.validity) && <span> · Valid {str(rc?.validity)}</span>}
        </p>
      </header>

      <div className="space-y-12 px-6 py-10 md:px-12 md:py-12">
        <p className="max-w-2xl text-[1.02rem] leading-relaxed">
          <Txt value={rc?.intro} ph="A short welcome for brands and clients will appear here." />
        </p>

        {services.length === 0 ? (
          ph ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              <Ph>Services and prices are added in the Services section and appear here automatically.</Ph>
            </div>
          ) : null
        ) : (
          groupByCategory(services).map(([cat, list]) => (
            <section key={cat}>
              <h3 className="eyebrow text-primary!">{cat}</h3>
              <div className="mt-4 divide-y border-y">
                {list.map((s) => {
                  const includes = strList(s.data.includes);
                  return (
                    <div key={s.id} className="grid gap-3 py-5 md:grid-cols-12 md:gap-6">
                      <div className="md:col-span-8">
                        <p className="font-display text-xl">{str(s.data.name)}</p>
                        {includes.length > 0 && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{includes.join(" · ")}</p>}
                        {str(s.data.deliveryTimeline) && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3.5" /> {str(s.data.deliveryTimeline)}
                          </p>
                        )}
                      </div>
                      <div className="font-display text-xl md:col-span-4 md:text-right">
                        <PriceTag price={s.data.price} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="eyebrow">Booking process</h3>
            <div className="mt-3 text-sm leading-relaxed">
              {str(rc?.bookingProcess) ? <Prose text={str(rc?.bookingProcess)} className="text-sm leading-relaxed" /> : ph ? <Ph>How clients book you.</Ph> : null}
            </div>
          </div>
          <div>
            <h3 className="eyebrow">Payment terms</h3>
            <div className="mt-3 text-sm leading-relaxed">
              {str(rc?.paymentTerms) ? <Prose text={str(rc?.paymentTerms)} className="text-sm leading-relaxed" /> : ph ? <Ph>Deposits, payment methods and due dates.</Ph> : null}
            </div>
          </div>
        </div>

        {policies.length > 0 && (
          <div>
            <h3 className="eyebrow">Policies</h3>
            <CheckList items={policies} className="mt-3 text-sm" />
          </div>
        )}
        {str(rc?.notes) && <p className="rounded-xl bg-surface-2/70 p-5 text-sm leading-relaxed text-muted-foreground">{str(rc?.notes)}</p>}

        <div className="flex flex-col gap-3 border-t pt-8 sm:flex-row sm:flex-wrap">
          <Link href="/contact?type=business" className={buttonVariants()}>
            Book or request a quote <ArrowRight />
          </Link>
          {pdfHref && (
            <ExtLink href={pdfHref} className={buttonVariants({ variant: "outline" })}>
              <Download /> Download PDF
            </ExtLink>
          )}
          {existing && (
            <ExtLink href={existing.url} className={buttonVariants({ variant: "ghost" })}>
              <FileText /> Original rate card
            </ExtLink>
          )}
        </div>
      </div>
    </div>
  );
}

export function RateCardView({ pdfHref = "/api/rate-card" }: { pdfHref?: string }) {
  const { site, ph } = useSite();
  const hasServices = site.services.some((s) => s.data.showOnRateCard !== false);
  return (
    <>
      <PageIntro eyebrow="Rate card" title="Rates & packages" intro="Standard packages and terms. Custom proposals are always welcome." />
      <section className="container-page py-14 md:py-20">
        {!hasServices && !site.rateCard && !ph ? (
          <EmptySection title="Rate card coming soon" text="Please get in touch for current rates and availability." />
        ) : (
          <RateCardDocument pdfHref={pdfHref} />
        )}
      </section>
    </>
  );
}
