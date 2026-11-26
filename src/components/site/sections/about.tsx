"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { brandName } from "@/lib/site-nav";
import { str, strList } from "@/lib/utils";
import { asMedia, ExtLink, Link, MediaFrame, Ph, Txt } from "../placeholder";
import { useSite } from "../site-context";
import { CategoryFilter, MediaGallery, Prose, Reveal, uniqueCategories } from "./common";
import type { MediaRef } from "@/lib/content/types";

export function GallerySection() {
  const { site } = useSite();
  const [cat, setCat] = React.useState("");
  const items = site.gallery;
  if (items.length === 0) return null;
  const cats = uniqueCategories(items);
  const media = (cat ? items.filter((g) => str(g.data.category) === cat) : items)
    .map((g) => {
      const m = asMedia(g.data.media);
      return m ? ({ ...m, alt: str(g.data.caption) || str(g.data.title) || m.alt } as MediaRef) : null;
    })
    .filter((m): m is MediaRef => !!m);
  return (
    <section id="gallery" className="container-page scroll-mt-24 py-20">
      <p className="eyebrow">Gallery</p>
      <h2 className="display mt-3 text-4xl md:text-5xl">Moments & milestones</h2>
      <div className="mt-8">
        <CategoryFilter categories={cats} value={cat} onChange={setCat} />
      </div>
      <MediaGallery items={media} className="mt-8" columns="md:grid-cols-4" />
    </section>
  );
}

export function AboutView() {
  const { site, ph } = useSite();
  const a = site.about;
  const p = site.profile;
  const name = brandName(site);
  const expertise = strList(a?.expertise);
  const values = strList(a?.values);
  const experience = (Array.isArray(a?.experience) ? a!.experience : []) as Record<string, string>[];
  const achievements = (Array.isArray(a?.achievements) ? a!.achievements : []) as Record<string, string>[];
  const cv = asMedia(a?.cv);

  return (
    <>
      <section className="grain border-b">
        <div className="container-page grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="rounded-t-[999px] rounded-b-[2rem] bg-surface-2 p-2.5">
              <MediaFrame media={asMedia(p?.photo)} label="Professional photo" ratio="4/5" priority className="rounded-t-[999px] rounded-b-[1.6rem]" />
            </div>
          </div>
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="eyebrow animate-fade-up">About</p>
            <h1 className="display mt-4 animate-fade-up text-5xl [animation-delay:80ms] md:text-7xl">
              {name || (ph ? <Ph>Your name</Ph> : "About")}
            </h1>
            <p className="mt-4 animate-fade-up text-lg text-primary [animation-delay:120ms]">
              <Txt value={p?.professionalTitle} ph="Professional title" />
            </p>
            <div className="mt-8 animate-fade-up text-lg leading-relaxed text-muted-foreground [animation-delay:180ms]">
              <Txt value={a?.shortBio} ph="Your short biography." />
            </div>
            {expertise.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {expertise.map((e) => (
                  <li key={e} className="rounded-full border border-foreground/15 px-3.5 py-1.5 text-sm">{e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow lg:sticky lg:top-28">My story</p>
        </div>
        <div className="lg:col-span-8">
          {str(a?.fullBio) ? <Prose text={str(a?.fullBio)} className="text-[1.08rem]" /> : ph ? <Ph block>Your detailed biography will appear here.</Ph> : null}
        </div>
      </section>

      {(str(a?.brandStatement) || ph) && (
        <section className="bg-foreground text-background">
          <div className="container-page py-20 md:py-28">
            <Reveal>
              <blockquote className="display mx-auto max-w-4xl text-center text-4xl text-balance md:text-6xl md:leading-[1.08]">
                “<Txt value={a?.brandStatement} ph="Your personal brand statement." />”
              </blockquote>
            </Reveal>
            {name && <p className="mt-8 text-center text-sm tracking-[0.2em] text-background/50 uppercase">— {name}</p>}
          </div>
        </section>
      )}

      {(str(a?.background) || ph || values.length > 0) && (
        <section className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Background</p>
          </div>
          <div className="lg:col-span-8">
            {str(a?.background) ? <Prose text={str(a?.background)} /> : ph ? <Ph block>Your professional background.</Ph> : null}
            {values.length > 0 && (
              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {values.map((v, i) => (
                  <div key={i} className="rounded-2xl bg-surface-2/70 p-5">
                    <span className="font-display text-lg text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-2 font-display text-xl">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {experience.filter((e) => e.role).length > 0 && (
        <section className="border-t bg-surface/60">
          <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">Experience</p>
            </div>
            <ol className="relative space-y-10 border-l pl-8 lg:col-span-8">
              {experience.filter((e) => e.role).map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-2 -left-[2.3rem] size-3 rounded-full border-2 border-primary bg-background" />
                  {e.period && <p className="eyebrow">{e.period}</p>}
                  <p className="mt-1 font-display text-2xl">{e.role}</p>
                  {e.organisation && <p className="text-sm font-medium text-primary">{e.organisation}</p>}
                  {e.description && <p className="mt-2 leading-relaxed text-muted-foreground">{e.description}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {achievements.filter((x) => x.title).length > 0 && (
        <section className="container-page py-16 md:py-24">
          <p className="eyebrow">Achievements</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.filter((x) => x.title).map((x, i) => (
              <Reveal key={i} delay={(i % 3) * 70}>
                <div className="h-full rounded-2xl border bg-surface p-6">
                  {x.year && <p className="font-display text-3xl text-primary">{x.year}</p>}
                  <p className="mt-3 font-semibold">{x.title}</p>
                  {x.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.description}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <GallerySection />

      <section className="container-page flex flex-wrap items-center justify-center gap-3 pb-20">
        <Link href="/contact" className={buttonVariants({ size: "lg" })}>Get in touch</Link>
        {cv && a?.offerCvDownload === true && (
          <ExtLink href={cv.url} className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Download /> Download profile
          </ExtLink>
        )}
      </section>
    </>
  );
}
