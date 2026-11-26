"use client";

import { ArrowRight, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { brandName } from "@/lib/site-nav";
import { cn, str, strList } from "@/lib/utils";
import { asMedia, GhostCards, Link, MediaFrame, Ph, Txt } from "../placeholder";
import { useSite } from "../site-context";
import { Reveal, SectionHeading } from "./common";
import { PortfolioCard } from "./portfolio";
import { ClassCard } from "./classes";
import { ProductCard } from "./products";
import { FragranceCard } from "./fragrance";

export function HomeHero() {
  const { site, ph } = useSite();
  const p = site.profile;
  const name = brandName(site);
  const photo = asMedia(p?.photo);

  return (
    <section className="grain relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 size-[38rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--brand) 22%, transparent), transparent)" }}
      />
      <div className="container-page relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
        <div className="lg:col-span-7">
          <p className="eyebrow animate-fade-up">
            <Txt value={p?.professionalTitle} ph="Professional title" />
          </p>
          <h1 className="display mt-5 animate-fade-up text-[2.9rem] text-balance [animation-delay:80ms] sm:text-6xl lg:text-[5.2rem]">
            {str(p?.tagline) || (ph ? <Ph>Your homepage headline — the one sentence every visitor should remember.</Ph> : name)}
          </h1>
          <div className="mt-7 max-w-xl animate-fade-up text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">
            {str(site.about?.shortBio) ? (
              <p className="line-clamp-4">{str(site.about?.shortBio)}</p>
            ) : ph ? (
              <Ph>A short introduction about who you are, what you do and who you do it for.</Ph>
            ) : null}
          </div>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Work with me <ArrowRight />
            </Link>
            <Link href="/portfolio" className={buttonVariants({ variant: "outline", size: "lg" })}>
              View portfolio
            </Link>
          </div>
          {(str(p?.availability) || str(p?.location)) && (
            <div className="mt-10 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground [animation-delay:300ms]">
              {str(p?.availability) && (
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  {str(p?.availability)}
                </span>
              )}
              {str(p?.location) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {str(p?.location)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:120ms] lg:col-span-5 lg:max-w-none">
          <div className="relative rounded-t-[999px] rounded-b-[2rem] bg-surface-2 p-2.5 shadow-[0_30px_80px_-30px_rgba(31,26,23,0.35)]">
            <MediaFrame
              media={photo}
              label="Professional photo"
              ratio="4/5"
              priority
              className="rounded-t-[999px] rounded-b-[1.6rem]"
            />
          </div>
          <div className="absolute -bottom-5 -left-3 rounded-2xl border bg-surface/95 px-5 py-4 shadow-xl backdrop-blur sm:-left-8">
            <p className="eyebrow text-[0.6rem]!">Hello, I&apos;m</p>
            <p className="mt-1 font-display text-xl">{name || (ph ? <Ph>Your name</Ph> : null)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExpertiseMarquee() {
  const { site, ph } = useSite();
  const tags = strList(site.about?.expertise);
  const list = tags.length ? tags : ph ? ["Area of expertise", "Speciality", "Skill", "Focus area", "Expertise"] : [];
  if (list.length === 0) return null;
  const row = [...list, ...list, ...list];
  return (
    <div className="overflow-hidden border-y bg-foreground py-5 text-background">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...row, ...row].map((t, i) => (
          <span key={i} className={cn("flex items-center gap-10 font-display text-2xl italic", !tags.length && "opacity-40")}>
            {t}
            <Sparkles className="size-4 text-primary not-italic" />
          </span>
        ))}
      </div>
    </div>
  );
}

const OFFERINGS = [
  { href: "/services", key: "services", title: "Services", text: "Explore ways to work together and view the rate card." },
  { href: "/classes", key: "classes", title: "Classes", text: "Learn through classes and training programmes." },
  { href: "/templates", key: "products", title: "Templates", text: "Ready-to-use templates and digital resources." },
  { href: "/fragrance", key: "fragrances", title: "Fragrance", text: "Discover the fragrance collection." },
] as const;

export function Offerings() {
  const { site, ph } = useSite();
  const items = OFFERINGS.filter((o) => ph || site[o.key].length > 0 || (o.key === "fragrances" && site.fragranceBrand));
  if (items.length === 0) return null;
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading eyebrow="Explore" title="Everything in one place" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((o, i) => {
          const count = site[o.key].length;
          return (
            <Reveal key={o.href} delay={i * 80}>
              <Link
                href={o.href}
                className={cn(
                  "group flex h-full min-h-56 flex-col justify-between rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl",
                  o.key === "fragrances" ? "border-noir bg-noir text-pearl" : "bg-surface",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn("text-xs tabular-nums", o.key === "fragrances" ? "text-gold" : "text-muted-foreground")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <p className="font-display text-3xl">
                    {o.key === "fragrances" && str(site.fragranceBrand?.brandName) ? str(site.fragranceBrand?.brandName) : o.title}
                  </p>
                  <p className={cn("mt-2 text-sm leading-relaxed", o.key === "fragrances" ? "text-pearl/60" : "text-muted-foreground")}>{o.text}</p>
                  {count > 0 && (
                    <p className={cn("mt-4 text-xs font-semibold", o.key === "fragrances" ? "text-gold" : "text-primary")}>
                      {count} {count === 1 ? "item" : "items"}
                    </p>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function AboutTeaser() {
  const { site, ph } = useSite();
  const a = site.about;
  if (!a && !ph) return null;
  return (
    <section className="bg-surface-2/60">
      <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">About</p>
          <div className="mt-6 overflow-hidden rounded-[2rem]">
            <MediaFrame media={asMedia(site.profile?.heroImage) ?? asMedia(site.profile?.photo)} label="Lifestyle photo" ratio="5/4" />
          </div>
        </div>
        <div className="flex flex-col justify-center lg:col-span-7 lg:pl-8">
          <Reveal>
            <blockquote className="display text-3xl text-balance md:text-[2.75rem] md:leading-[1.12]">
              <span className="text-primary">“</span>
              <Txt value={a?.brandStatement} ph="Your personal brand statement — what you stand for." />
              <span className="text-primary">”</span>
            </blockquote>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
              <Txt value={a?.shortBio} ph="Your short biography will appear here." />
            </p>
          </Reveal>
          <Reveal delay={160}>
            <Link href="/about" className={cn(buttonVariants({ variant: "outline" }), "mt-8 w-fit")}>
              Read my story <ArrowRight />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FeaturedWork() {
  const { site, ph } = useSite();
  const items = [...site.portfolio].sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured)).slice(0, 3);
  if (items.length === 0 && !ph) return null;
  return (
    <section className="container-page py-20 md:py-28">
      <SectionHeading
        eyebrow="Selected work"
        title="Portfolio"
        action={
          <Link href="/portfolio" className={buttonVariants({ variant: "outline" })}>
            View all work <ArrowRight />
          </Link>
        }
      />
      <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {items.length ? items.map((item, i) => (
          <Reveal key={item.id} delay={i * 90}>
            <PortfolioCard item={item} />
          </Reveal>
        )) : <GhostCards label="Portfolio project" />}
      </div>
    </section>
  );
}

export function FeaturedLearning() {
  const { site, ph } = useSite();
  const classes = [...site.classes].sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured)).slice(0, 2);
  const products = [...site.products].sort((a, b) => Number(!!b.data.featured) - Number(!!a.data.featured)).slice(0, 4);
  if (!classes.length && !products.length && !ph) return null;
  return (
    <section className="border-t bg-surface/60">
      <div className="container-page py-20 md:py-28">
        <SectionHeading eyebrow="Learn & shop" title="Classes and templates" intro="Courses and digital resources, available on their existing sales pages." />
        {(classes.length > 0 || ph) && (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {classes.length ? classes.map((c) => <ClassCard key={c.id} item={c} />) : <GhostCards count={2} label="Class" ratio="16/9" />}
          </div>
        )}
        {(products.length > 0 || ph) && (
          <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {products.length ? products.map((p) => <ProductCard key={p.id} item={p} />) : <GhostCards count={4} label="Template" ratio="4/5" />}
          </div>
        )}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/classes" className={buttonVariants({ variant: "outline" })}>All classes</Link>
          <Link href="/templates" className={buttonVariants({ variant: "outline" })}>All templates</Link>
        </div>
      </div>
    </section>
  );
}

export function FragranceTeaser() {
  const { site, ph } = useSite();
  const b = site.fragranceBrand;
  const items = site.fragrances.slice(0, 3);
  if (!b && !items.length && !ph) return null;
  return (
    <section className="relative overflow-hidden bg-noir text-pearl">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "radial-gradient(60% 50% at 80% 0%, rgba(200,164,106,.22), transparent 70%)" }} />
      <div className="container-page relative py-20 md:py-28">
        <SectionHeading
          dark
          eyebrow="The fragrance house"
          title={<Txt value={b?.brandName} ph="Fragrance brand name" />}
          intro={str(b?.tagline) || (ph ? <Ph>Fragrance tagline</Ph> : undefined)}
          action={
            <Link href="/fragrance" className={buttonVariants({ variant: "gold" })}>
              Shop the collection <ArrowRight />
            </Link>
          }
        />
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.length ? items.map((f) => <FragranceCard key={f.id} item={f} />) : <GhostCards label="Fragrance" dark ratio="4/5" />}
        </div>
      </div>
    </section>
  );
}

export function GalleryStrip() {
  const { site } = useSite();
  const items = site.gallery.filter((g) => g.data.showOnHome !== false).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section className="py-20 md:py-24">
      <div className="container-page">
        <SectionHeading eyebrow="Moments" title="Gallery" action={<Link href="/about#gallery" className={buttonVariants({ variant: "outline" })}>See more</Link>} />
      </div>
      <div className="scrollbar-none mt-10 flex snap-x gap-4 overflow-x-auto px-5 md:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {items.map((g) => (
          <figure key={g.id} className="w-64 shrink-0 snap-start md:w-80">
            <MediaFrame media={asMedia(g.data.media)} ratio="4/5" className="rounded-2xl" />
            {str(g.data.title) && <figcaption className="mt-3 text-sm text-muted-foreground">{str(g.data.title)}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactCta() {
  const { site, ph } = useSite();
  return (
    <section className="container-page pb-20 md:pb-28">
      <div className="grain relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-primary-foreground md:px-16 md:py-24">
        <div aria-hidden className="absolute -right-24 -bottom-24 size-96 rounded-full border border-white/15" />
        <div aria-hidden className="absolute -right-10 -bottom-10 size-64 rounded-full border border-white/15" />
        <p className="eyebrow text-white/70!">Let&apos;s talk</p>
        <h2 className="display mt-4 max-w-3xl text-4xl text-balance md:text-6xl">Have a project, collaboration or question in mind?</h2>
        <p className="mt-5 max-w-xl text-white/80">
          {str(site.contact?.contactIntro) || (ph ? <Ph>Your contact introduction will appear here.</Ph> : "Send a message and I'll be in touch.")}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/contact" className={buttonVariants({ variant: "ink", size: "lg" })}>
            Send an enquiry <ArrowRight />
          </Link>
          <Link href="/rate-card" className={cn(buttonVariants({ variant: "outline-light", size: "lg" }))}>
            View rate card
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeView() {
  return (
    <>
      <HomeHero />
      <ExpertiseMarquee />
      <Offerings />
      <AboutTeaser />
      <FeaturedWork />
      <FeaturedLearning />
      <FragranceTeaser />
      <GalleryStrip />
      <ContactCta />
    </>
  );
}
