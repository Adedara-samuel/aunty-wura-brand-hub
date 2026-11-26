"use client";

import * as React from "react";
import NextLink from "next/link";
import type { MediaRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { useSite } from "./site-context";

/** Inline, clearly-labelled placeholder for missing text. */
export function Ph({ children, className, block }: { children: React.ReactNode; className?: string; block?: boolean }) {
  return (
    <span
      data-placeholder
      title="Placeholder — this content has not been provided yet"
      className={cn(
        "rounded-md border border-dashed border-current/30 bg-current/[0.04] px-[0.35em] text-current/45 decoration-clone",
        block ? "block py-2" : "inline",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Render text when present, otherwise a placeholder (or nothing once placeholders are off). */
export function Txt({ value, ph, className }: { value?: unknown; ph: string; className?: string }) {
  const { ph: showPh } = useSite();
  if (typeof value === "string" && value.trim()) return <>{value}</>;
  if (!showPh) return null;
  return <Ph className={className}>{ph}</Ph>;
}

export function PlaceholderNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 rounded-full border border-dashed border-current/25 px-3 py-1 text-xs text-current/55", className)}>
      <span className="size-1.5 rounded-full bg-current/40" />
      {children}
    </p>
  );
}

/** Link that becomes inert inside the Studio preview pane. */
export function Link({ href, className, children, ...rest }: React.ComponentProps<typeof NextLink>) {
  const { inStudio } = useSite();
  if (inStudio) {
    return (
      <span className={cn(className, "cursor-default")} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
        {children}
      </span>
    );
  }
  return (
    <NextLink href={href} className={className} {...rest}>
      {children}
    </NextLink>
  );
}

/** External link (opens in a new tab). Inert in the Studio preview. */
export function ExtLink({ href, className, children, ...rest }: React.ComponentProps<"a">) {
  const { inStudio } = useSite();
  return (
    <a
      href={href}
      target={inStudio ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={className}
      onClick={inStudio ? (e) => e.preventDefault() : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}

export function asMedia(v: unknown): MediaRef | null {
  if (v && typeof v === "object" && typeof (v as MediaRef).url === "string") return v as MediaRef;
  return null;
}

export function asMediaList(v: unknown): MediaRef[] {
  return Array.isArray(v) ? v.map(asMedia).filter((m): m is MediaRef => !!m) : [];
}

/** Image / video frame with an elegant neutral placeholder when no media is set. */
export function MediaFrame({
  media,
  label = "Image",
  className,
  imgClassName,
  ratio,
  dark,
  priority,
  controls,
  rounded = true,
}: {
  media?: MediaRef | null;
  label?: string;
  className?: string;
  imgClassName?: string;
  ratio?: string;
  dark?: boolean;
  priority?: boolean;
  controls?: boolean;
  rounded?: boolean;
}) {
  const { ph } = useSite();
  const gid = React.useId().replace(/:/g, "");
  const style = ratio ? { aspectRatio: ratio } : undefined;
  const base = cn("relative overflow-hidden", rounded && "rounded-[inherit]", className);

  if (media?.kind === "video") {
    return (
      <div className={base} style={style}>
        <video
          src={media.url}
          className={cn("size-full object-cover", imgClassName)}
          muted={!controls}
          loop={!controls}
          autoPlay={!controls}
          playsInline
          controls={controls}
          preload="metadata"
          aria-label={media.alt || media.name}
        />
      </div>
    );
  }
  if (media?.url) {
    return (
      <div className={base} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.alt || ""}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("size-full object-cover", imgClassName)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(base, dark ? "bg-noir-2" : "bg-surface-2")}
      style={style}
      role="img"
      aria-label={ph ? `${label} placeholder` : ""}
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id={`g${gid}`} cx="30%" cy="25%" r="80%">
            <stop offset="0%" stopColor={dark ? "#3a2e26" : "#fffaf4"} />
            <stop offset="100%" stopColor={dark ? "#1b1512" : "#e9dfd3"} />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill={`url(#g${gid})`} />
        <g fill="none" stroke={dark ? "#c8a46a" : "#9a5b3f"} strokeOpacity={dark ? 0.22 : 0.16} strokeWidth="1.2">
          <path d="M120 400V230a80 80 0 0 1 160 0v170" />
          <path d="M150 400V238a50 50 0 0 1 100 0v162" />
          <circle cx="300" cy="110" r="38" />
          <path d="M0 330 Q100 290 200 330 T400 330" />
        </g>
      </svg>
      {ph && (
        <span
          className={cn(
            "absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.16em] uppercase backdrop-blur",
            dark ? "bg-black/30 text-pearl/70" : "bg-white/60 text-muted-foreground",
          )}
        >
          {label} · placeholder
        </span>
      )}
    </div>
  );
}

/** Ghost cards shown in empty collections while placeholders are enabled. */
export function GhostCards({ count = 3, label, dark, className, ratio = "4/3" }: { count?: number; label: string; dark?: boolean; className?: string; ratio?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("rounded-2xl", className)}>
          <MediaFrame label={label} ratio={ratio} dark={dark} className="rounded-2xl" />
          <div className={cn("mt-4 space-y-2", dark ? "text-pearl" : "text-foreground")}>
            <Ph className="text-xs">Category</Ph>
            <p className="font-display text-xl">
              <Ph>{label} title</Ph>
            </p>
            <p className="text-sm">
              <Ph>A short description will appear here.</Ph>
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

export function EmptySection({ title, text, dark }: { title: string; text: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-xl rounded-3xl border border-dashed px-6 py-14 text-center",
        dark ? "border-pearl/20 text-pearl" : "border-foreground/15",
      )}
    >
      <p className="font-display text-3xl">{title}</p>
      <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-pearl/60" : "text-muted-foreground")}>{text}</p>
    </div>
  );
}
