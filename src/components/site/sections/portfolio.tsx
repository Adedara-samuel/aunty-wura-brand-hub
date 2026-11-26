"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { SiteItem } from "@/lib/site-types";
import { hostLabel, youtubeEmbed } from "@/lib/format";
import { cn, formatDate, str, strList } from "@/lib/utils";
import { asMedia, asMediaList, EmptySection, ExtLink, GhostCards, Link, MediaFrame, Ph } from "../placeholder";
import { useSite } from "../site-context";
import { CategoryFilter, CheckList, MediaGallery, PageIntro, Prose, Reveal, uniqueCategories } from "./common";

export function PortfolioCard({ item, className }: { item: SiteItem; className?: string }) {
  const d = item.data;
  return (
    <Link href={`/portfolio/${item.slug}`} className={cn("group block", className)}>
      <div className="overflow-hidden rounded-2xl">
        <MediaFrame media={asMedia(d.coverImage)} label="Cover image" ratio="4/3" className="transition duration-700 ease-out group-hover:scale-[1.04]" />
      </div>
      <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
        {str(d.category) && <span className="font-semibold tracking-wider text-primary uppercase">{str(d.category)}</span>}
        {str(d.date) && <span>{formatDate(str(d.date))}</span>}
      </div>
      <h3 className="mt-2 flex items-start justify-between gap-4 font-display text-2xl leading-snug">
        {str(d.title)}
        <ArrowUpRight className="mt-1 size-5 shrink-0 opacity-0 transition group-hover:opacity-100" />
      </h3>
      {str(d.client) && <p className="mt-1 text-sm text-muted-foreground">for {str(d.client)}</p>}
      {str(d.summary) && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
    </Link>
  );
}

export function PortfolioGrid({ items }: { items: SiteItem[] }) {
  const { ph } = useSite();
  const [cat, setCat] = React.useState("");
  const categories = uniqueCategories(items);
  const shown = (cat ? items.filter((i) => str(i.data.category) === cat) : items)
    .slice()
    .sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured));

  if (items.length === 0) {
    return ph ? (
      <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        <GhostCards count={6} label="Portfolio project" />
      </div>
    ) : (
      <EmptySection title="Portfolio coming soon" text="New work is being added. Please check back shortly." />
    );
  }

  return (
    <div>
      <CategoryFilter categories={categories} value={cat} onChange={setCat} allLabel="All work" />
      <div className="mt-10 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 80}>
            <PortfolioCard item={item} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function PortfolioView() {
  const { site } = useSite();
  return (
    <>
      <PageIntro eyebrow="Portfolio" title="Selected work & collaborations" intro="Projects, campaigns and professional activities." />
      <section className="container-page py-16 md:py-20">
        <PortfolioGrid items={site.portfolio} />
      </section>
    </>
  );
}

export function PortfolioDetail({ item, prev, next }: { item: SiteItem; prev?: SiteItem; next?: SiteItem }) {
  const { ph } = useSite();
  const d = item.data;
  const gallery = asMediaList(d.gallery);
  const videos = strList(d.videoLinks);
  const links = (Array.isArray(d.links) ? d.links : []) as { label?: string; url?: string }[];
  const results = strList(d.results);
  const meta = [
    { k: "Client", v: str(d.client) },
    { k: "Category", v: str(d.category) },
    { k: "Role", v: str(d.role) },
    { k: "Date", v: formatDate(str(d.date)) },
  ].filter((m) => m.v);

  return (
    <article>
      <header className="container-page pt-10 md:pt-14">
        <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All work
        </Link>
        <h1 className="display mt-6 max-w-4xl text-5xl text-balance md:text-7xl">{str(d.title)}</h1>
        {str(d.summary) && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{str(d.summary)}</p>}
        {meta.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t pt-6 md:grid-cols-4">
            {meta.map((m) => (
              <div key={m.k}>
                <dt className="eyebrow">{m.k}</dt>
                <dd className="mt-2 font-medium">{m.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <div className="container-page mt-12">
        <div className="overflow-hidden rounded-[2rem]">
          <MediaFrame media={asMedia(d.coverImage)} label="Cover image" ratio="16/9" priority />
        </div>
      </div>

      <div className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {str(d.description) ? (
            <Prose text={str(d.description)} />
          ) : ph ? (
            <Ph block>The full story of this project will appear here.</Ph>
          ) : null}
        </div>
        <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
          {results.length > 0 && (
            <div className="rounded-2xl bg-surface-2/70 p-6">
              <p className="eyebrow">Results</p>
              <CheckList items={results} className="mt-4" />
            </div>
          )}
          {links.filter((l) => l.url).length > 0 && (
            <div>
              <p className="eyebrow">Links</p>
              <ul className="mt-4 divide-y border-y">
                {links.filter((l) => l.url).map((l, i) => (
                  <li key={i}>
                    <ExtLink href={l.url} className="flex items-center justify-between gap-4 py-3.5 text-sm font-medium hover:text-primary">
                      <span>{l.label || hostLabel(l.url!)}</span>
                      <ArrowUpRight className="size-4" />
                    </ExtLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {videos.length > 0 && (
        <section className="container-page pb-16">
          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((v, i) => {
              const embed = youtubeEmbed(v);
              return embed ? (
                <div key={i} className="aspect-video overflow-hidden rounded-2xl bg-black">
                  <iframe src={embed} title={`Video ${i + 1}`} className="size-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              ) : (
                <ExtLink key={i} href={v} className="flex items-center justify-between rounded-2xl border bg-surface p-6 hover:border-primary">
                  <span>
                    <span className="eyebrow">Watch</span>
                    <span className="mt-1 block font-medium">{hostLabel(v)}</span>
                  </span>
                  <ArrowUpRight className="size-5" />
                </ExtLink>
              );
            })}
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="container-page pb-20">
          <MediaGallery items={gallery} />
        </section>
      )}

      {(prev || next) && (
        <nav className="border-t">
          <div className="container-page grid grid-cols-2 gap-6 py-10">
            <div>
              {prev && (
                <Link href={`/portfolio/${prev.slug}`} className="group block">
                  <span className="eyebrow inline-flex items-center gap-2"><ArrowLeft className="size-3" /> Previous</span>
                  <span className="mt-2 block font-display text-xl group-hover:text-primary md:text-2xl">{str(prev.data.title)}</span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next && (
                <Link href={`/portfolio/${next.slug}`} className="group block">
                  <span className="eyebrow inline-flex items-center gap-2">Next <ArrowRight className="size-3" /></span>
                  <span className="mt-2 block font-display text-xl group-hover:text-primary md:text-2xl">{str(next.data.title)}</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}

      <div className="container-page pb-20 text-center">
        <Link href="/contact?type=collaboration" className={buttonVariants({ size: "lg" })}>
          Start a project <ArrowRight />
        </Link>
      </div>
    </article>
  );
}
