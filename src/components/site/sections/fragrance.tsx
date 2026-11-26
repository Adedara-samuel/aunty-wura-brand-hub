"use client";

import * as React from "react";
import { ArrowLeft, ArrowUpRight, MessageCircle, Package, Truck, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SiteItem } from "@/lib/site-types";
import { fragrancePriceRange, fragranceSizes, getFragranceOrderAction } from "@/lib/commerce";
import { availabilityLabel, formatMoney } from "@/lib/format";
import { cn, str, strList } from "@/lib/utils";
import { asMedia, asMediaList, EmptySection, ExtLink, GhostCards, Link, MediaFrame, Ph, Txt } from "../placeholder";
import { useSite } from "../site-context";
import { CategoryFilter, MediaGallery, Prose, Reveal, uniqueCategories } from "./common";

function AvailabilityBadge({ value }: { value: unknown }) {
  const label = availabilityLabel(str(value));
  if (!label) return null;
  const tone =
    value === "out_of_stock" ? "bg-white/10 text-pearl/50" : value === "low_stock" ? "bg-amber-400/15 text-amber-200" : "bg-gold/15 text-gold";
  return <span className={cn("rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase", tone)}>{label}</span>;
}

export function FragranceCard({ item }: { item: SiteItem }) {
  const d = item.data;
  const photo = asMediaList(d.photos)[0];
  const notes = [...strList(d.topNotes), ...strList(d.heartNotes), ...strList(d.baseNotes)].slice(0, 3);
  return (
    <Link href={`/fragrance/${item.slug}`} className="group block text-pearl">
      <div className="relative overflow-hidden rounded-2xl bg-noir-2">
        <MediaFrame media={photo} label="Product photo" ratio="4/5" dark className="transition duration-700 group-hover:scale-[1.04]" />
        <div className="absolute top-3 left-3">
          <AvailabilityBadge value={d.availability} />
        </div>
      </div>
      <p className="mt-4 text-[0.68rem] font-semibold tracking-[0.2em] text-gold uppercase">{str(d.category)}</p>
      <h3 className="mt-1.5 font-display text-2xl">{str(d.name)}</h3>
      {notes.length > 0 && <p className="mt-1 text-sm text-pearl/55 italic">{notes.join(" · ")}</p>}
      <p className="mt-2 text-sm font-semibold text-pearl/85">{fragrancePriceRange(d)}</p>
    </Link>
  );
}

export function FragranceCatalogue({ items }: { items: SiteItem[] }) {
  const { ph } = useSite();
  const [cat, setCat] = React.useState("");
  if (items.length === 0) {
    return ph ? (
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <GhostCards count={3} label="Fragrance" dark ratio="4/5" />
      </div>
    ) : (
      <EmptySection dark title="The collection is coming soon" text="New fragrances are being prepared. Please check back shortly." />
    );
  }
  const categories = uniqueCategories(items);
  const shown = (cat ? items.filter((i) => str(i.data.category) === cat) : items)
    .slice()
    .sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured));
  return (
    <div>
      <CategoryFilter dark categories={categories} value={cat} onChange={setCat} allLabel="All scents" />
      <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((f, i) => (
          <Reveal key={f.id} delay={(i % 3) * 80}>
            <FragranceCard item={f} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function OrderingInfo() {
  const { site, ph } = useSite();
  const b = site.fragranceBrand;
  const blocks = [
    { icon: MessageCircle, title: "How to order", text: str(b?.orderingInstructions), ph: "Ordering instructions" },
    { icon: Truck, title: "Delivery", text: str(b?.deliveryInfo), ph: "Delivery information" },
    { icon: Wallet, title: "Payment", text: str(b?.paymentInfo), ph: "" },
    { icon: Package, title: "Returns & care", text: str(b?.policies), ph: "" },
  ].filter((x) => x.text || (ph && x.ph));
  if (blocks.length === 0) return null;
  return (
    <section id="ordering" className="border-t border-white/10">
      <div className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4 md:py-20">
        {blocks.map((x) => (
          <div key={x.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <x.icon className="size-5 text-gold" />
            <h3 className="mt-4 font-display text-xl">{x.title}</h3>
            <div className="mt-2 text-sm leading-relaxed text-pearl/65">
              {x.text ? <Prose text={x.text} className="text-sm leading-relaxed" /> : <Ph>{x.ph}</Ph>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FragranceView() {
  const { site, ph } = useSite();
  const b = site.fragranceBrand;
  const hero = asMedia(b?.heroImage);
  const logo = asMedia(b?.logo);
  return (
    <div className="bg-noir text-pearl">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 60% at 85% 10%, rgba(200,164,106,.18), transparent 70%)" }} />
        <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.url} alt={str(b?.brandName)} className="mb-8 h-14 w-auto object-contain" />
            ) : (
              <p className="eyebrow text-gold!">The fragrance house</p>
            )}
            <h1 className="display mt-4 animate-fade-up text-6xl text-balance md:text-8xl">
              <Txt value={b?.brandName} ph="Fragrance brand name" />
            </h1>
            {(str(b?.tagline) || ph) && (
              <p className="mt-5 animate-fade-up font-display text-2xl text-gold/90 italic [animation-delay:100ms]">
                <Txt value={b?.tagline} ph="Tagline" />
              </p>
            )}
            <div className="mt-6 max-w-xl animate-fade-up leading-relaxed text-pearl/70 [animation-delay:160ms]">
              {str(b?.introduction) ? <Prose text={str(b?.introduction)} className="text-[1rem]" /> : ph ? <Ph>Your fragrance brand introduction.</Ph> : null}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#collection" className={buttonVariants({ variant: "gold", size: "lg" })}>Shop the collection</a>
              <a href="#ordering" className={buttonVariants({ variant: "outline-light", size: "lg" })}>How to order</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-t-[999px] rounded-b-[2rem] border border-gold/20 p-2">
            <MediaFrame media={hero} label="Fragrance banner" ratio="4/5" dark priority className="rounded-t-[999px] rounded-b-[1.6rem]" />
          </div>
        </div>
      </section>
      <section id="collection" className="container-page scroll-mt-24 py-16 md:py-20">
        <h2 className="display text-4xl md:text-5xl">The collection</h2>
        <div className="mt-8">
          <FragranceCatalogue items={site.fragrances} />
        </div>
      </section>
      <OrderingInfo />
    </div>
  );
}

export function FragranceDetail({ item }: { item: SiteItem }) {
  const { site, ph } = useSite();
  const d = item.data;
  const photos = asMediaList(d.photos);
  const sizes = fragranceSizes(d);
  const currency = str(d.currency) || "NGN";
  const [size, setSize] = React.useState(sizes[0]?.label ?? "");
  const selected = sizes.find((s) => s.label === size) ?? sizes[0];
  const action = getFragranceOrderAction(d, site.fragranceBrand, site.contact, selected?.label);
  const pyramid = [
    { k: "Top", v: strList(d.topNotes) },
    { k: "Heart", v: strList(d.heartNotes) },
    { k: "Base", v: strList(d.baseNotes) },
  ].filter((p) => p.v.length);
  const variants = strList(d.variants);

  return (
    <div className="bg-noir text-pearl">
      <article className="container-page py-10 md:py-14">
        <Link href="/fragrance" className="inline-flex items-center gap-2 text-sm text-pearl/60 hover:text-pearl">
          <ArrowLeft className="size-4" /> The collection
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="overflow-hidden rounded-[1.75rem] bg-noir-2">
              <MediaFrame media={photos[0]} label="Product photo" ratio="4/5" dark priority />
            </div>
            {photos.length > 1 && <MediaGallery items={photos.slice(1)} dark className="mt-4" columns="sm:grid-cols-3" />}
          </div>
          <div className="lg:py-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">{str(d.category)}</p>
              <AvailabilityBadge value={d.availability} />
            </div>
            <h1 className="display mt-4 text-5xl md:text-6xl">{str(d.name)}</h1>
            <p className="mt-5 font-display text-3xl text-gold">
              {selected?.price != null ? formatMoney(selected.price, currency) : ph ? <Ph>Price</Ph> : null}
            </p>
            {str(d.description) && <Prose text={str(d.description)} className="mt-6 text-pearl/75" />}

            {sizes.length > 0 && (
              <fieldset className="mt-8">
                <legend className="eyebrow text-pearl/50!">Size</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSize(s.label)}
                      aria-pressed={selected?.label === s.label}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-2 text-sm transition",
                        selected?.label === s.label ? "border-gold bg-gold text-noir" : "border-white/20 hover:border-white/50",
                      )}
                    >
                      {s.label}
                      {s.price != null && <span className="ml-2 opacity-70">{formatMoney(s.price, currency)}</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {variants.length > 0 && (
              <p className="mt-5 text-sm text-pearl/60">
                Also available as: <span className="text-pearl/85">{variants.join(", ")}</span>
              </p>
            )}

            <div className="mt-8">
              {action.kind === "whatsapp" ? (
                <ExtLink href={action.href} className={cn(buttonVariants({ variant: "gold", size: "lg" }), "w-full sm:w-auto")}>
                  <MessageCircle /> {action.label}
                </ExtLink>
              ) : (
                <span className={cn(buttonVariants({ variant: "outline-light", size: "lg" }), "pointer-events-none opacity-60")}>{action.label}</span>
              )}
              <p className="mt-3 text-xs text-pearl/45">A WhatsApp chat opens with your selection already typed.</p>
            </div>

            {pyramid.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-8">
                {pyramid.map((p) => (
                  <div key={p.k}>
                    <p className="eyebrow text-gold!">{p.k} notes</p>
                    <p className="mt-2 text-sm leading-relaxed text-pearl/75">{p.v.join(", ")}</p>
                  </div>
                ))}
              </div>
            )}
            <a href="/fragrance#ordering" className="mt-10 inline-flex items-center gap-1 text-sm text-gold hover:underline">
              Ordering & delivery information <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
