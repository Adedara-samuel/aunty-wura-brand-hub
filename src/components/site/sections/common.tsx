"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MediaRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { MediaFrame } from "../placeholder";

export function Reveal({ children, className, delay = 0, as: As = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: React.ElementType }) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <As
      ref={ref}
      className={cn("transition-all duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]", shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </As>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  className,
  align = "left",
  dark,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("eyebrow", dark && "text-gold!")}>{eyebrow}</p>}
        <h2 className={cn("display mt-3 text-4xl text-balance md:text-5xl", dark && "text-pearl")}>{title}</h2>
        {intro && <p className={cn("mt-4 text-[0.98rem] leading-relaxed text-pretty", dark ? "text-pearl/65" : "text-muted-foreground")}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageIntro({ eyebrow, title, intro, children, className }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grain border-b bg-surface/50", className)}>
      <div className="container-page py-16 md:py-24">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="display mt-4 max-w-4xl animate-fade-up text-5xl text-balance [animation-delay:80ms] md:text-7xl">{title}</h1>
        {intro && (
          <div className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted-foreground [animation-delay:160ms]">{intro}</div>
        )}
        {children && <div className="mt-8 animate-fade-up [animation-delay:220ms]">{children}</div>}
      </div>
    </section>
  );
}

export function CategoryFilter({
  categories,
  value,
  onChange,
  dark,
  allLabel = "All",
}: {
  categories: string[];
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
  allLabel?: string;
}) {
  if (categories.length < 2) return null;
  const items = ["", ...categories];
  return (
    <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Filter by category">
      {items.map((c) => {
        const active = value === c;
        return (
          <button
            key={c || "__all"}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c)}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition",
              dark
                ? active
                  ? "border-gold bg-gold text-noir"
                  : "border-white/15 text-pearl/70 hover:border-white/40"
                : active
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/12 text-foreground/70 hover:border-foreground/40",
            )}
          >
            {c || allLabel}
          </button>
        );
      })}
    </div>
  );
}

export function uniqueCategories(items: { data: Record<string, unknown> }[], key = "category"): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const v = i.data[key];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return [...set];
}

/** Grid of media with a keyboard-accessible lightbox. */
export function MediaGallery({ items, className, dark, columns = "sm:grid-cols-2 lg:grid-cols-3" }: { items: MediaRef[]; className?: string; dark?: boolean; columns?: string }) {
  const [index, setIndex] = React.useState<number | null>(null);
  const close = () => setIndex(null);
  const step = React.useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  React.useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, step]);

  if (items.length === 0) return null;
  const current = index !== null ? items[index] : null;

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3 md:gap-4", columns, className)}>
        {items.map((m, i) => (
          <button
            key={m.id + i}
            onClick={() => setIndex(i)}
            className={cn("group relative cursor-zoom-in overflow-hidden rounded-xl", i === 0 && items.length > 2 && "col-span-2 row-span-2")}
            aria-label={`Open ${m.alt || m.name || "image"}`}
          >
            <MediaFrame media={m} ratio="1/1" className="size-full transition duration-700 group-hover:scale-[1.03]" dark={dark} />
          </button>
        ))}
      </div>
      {current && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur" role="dialog" aria-modal="true" onClick={close}>
          <button className="absolute top-4 right-4 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" onClick={close} aria-label="Close">
            <X className="size-5" />
          </button>
          {items.length > 1 && (
            <>
              <button className="absolute left-3 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 md:left-6" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous">
                <ChevronLeft className="size-5" />
              </button>
              <button className="absolute right-3 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 md:right-6" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next">
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {current.kind === "video" ? (
              <video src={current.url} controls autoPlay playsInline className="max-h-[85dvh] max-w-full rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.alt || ""} className="max-h-[85dvh] max-w-full rounded-lg object-contain" />
            )}
            {(current.alt || items.length > 1) && (
              <p className="mt-3 text-center text-sm text-white/60">
                {current.alt} {items.length > 1 && <span className="ml-2 tabular-nums">{(index ?? 0) + 1} / {items.length}</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function CheckList({ items, className, dark }: { items: string[]; className?: string; dark?: boolean }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
          <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", dark ? "bg-gold" : "bg-primary")} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Prose({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={cn("prose-brand space-y-4 text-[1.02rem] leading-[1.8] text-pretty", className)}>
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
