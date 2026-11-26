"use client";

import * as React from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Price } from "@/lib/content/types";
import type { SiteItem } from "@/lib/site-types";
import { formatPrice, platformLabel } from "@/lib/format";
import { str, strList } from "@/lib/utils";
import { asMedia, asMediaList, EmptySection, GhostCards, Link, MediaFrame, Ph } from "../placeholder";
import { useSite } from "../site-context";
import { CategoryFilter, CheckList, MediaGallery, PageIntro, Prose, Reveal, uniqueCategories } from "./common";
import { PurchaseButton } from "./classes";

export function ProductCard({ item }: { item: SiteItem }) {
  const d = item.data;
  return (
    <Link href={`/templates/${item.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-surface-2">
        <MediaFrame media={asMedia(d.coverImage)} label="Product cover" ratio="4/5" className="transition duration-700 group-hover:scale-[1.04]" />
      </div>
      <p className="mt-4 text-[0.7rem] font-semibold tracking-wider text-primary uppercase">{str(d.category)}</p>
      <h3 className="mt-1 font-display text-xl leading-snug">{str(d.name)}</h3>
      <p className="mt-1.5 text-sm font-semibold">{formatPrice(d.price as Price)}</p>
    </Link>
  );
}

export function ProductGrid({ items }: { items: SiteItem[] }) {
  const { ph } = useSite();
  const [cat, setCat] = React.useState("");
  if (items.length === 0) {
    return ph ? (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        <GhostCards count={4} label="Template" ratio="4/5" />
      </div>
    ) : (
      <EmptySection title="Templates coming soon" text="New templates and digital resources are on the way." />
    );
  }
  const categories = uniqueCategories(items);
  const shown = (cat ? items.filter((i) => str(i.data.category) === cat) : items)
    .slice()
    .sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured));
  return (
    <div>
      <CategoryFilter categories={categories} value={cat} onChange={setCat} />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
        {shown.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 60}>
            <ProductCard item={p} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function ProductsView() {
  const { site } = useSite();
  return (
    <>
      <PageIntro eyebrow="Templates & digital products" title="Resources to help you create" intro="Ready-to-use templates and downloadable resources. Purchases are completed on each product's sales page." />
      <section className="container-page py-16 md:py-20">
        <ProductGrid items={site.products} />
      </section>
    </>
  );
}

export function ProductDetail({ item }: { item: SiteItem }) {
  const { ph } = useSite();
  const d = item.data;
  const includes = strList(d.includes);
  const previews = asMediaList(d.previewImages);
  return (
    <article className="container-page py-10 md:py-14">
      <Link href="/templates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All templates
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] bg-surface-2">
            <MediaFrame media={asMedia(d.coverImage)} label="Product cover" ratio="4/5" priority />
          </div>
          {previews.length > 0 && <MediaGallery items={previews} className="mt-4" columns="sm:grid-cols-3" />}
        </div>
        <div className="lg:py-6">
          <p className="eyebrow text-primary!">{str(d.category)}</p>
          <h1 className="display mt-3 text-5xl text-balance">{str(d.name)}</h1>
          <p className="mt-5 font-display text-3xl">{formatPrice(d.price as Price) || (ph ? <Ph>Price</Ph> : null)}</p>
          {str(d.summary) && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
          <PurchaseButton type="product" data={d} className="mt-8 w-full sm:w-auto" />
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" /> Secure checkout on {platformLabel(str(d.platform), str(d.platformName))}
          </p>

          {includes.length > 0 && (
            <section className="mt-10 rounded-2xl border bg-surface p-6">
              <h2 className="eyebrow">What you get</h2>
              <CheckList items={includes} className="mt-4" />
            </section>
          )}
          {(str(d.audience) || str(d.format)) && (
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {str(d.audience) && (
                <div>
                  <dt className="eyebrow">Who it&apos;s for</dt>
                  <dd className="mt-2 text-sm leading-relaxed">{str(d.audience)}</dd>
                </div>
              )}
              {str(d.format) && (
                <div>
                  <dt className="eyebrow">Format</dt>
                  <dd className="mt-2 text-sm leading-relaxed">{str(d.format)}</dd>
                </div>
              )}
            </dl>
          )}
          {str(d.description) && (
            <section className="mt-10 border-t pt-8">
              <Prose text={str(d.description)} className="text-[0.98rem]" />
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
