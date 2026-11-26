"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/overlay";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowUpRight, Eye, Mail, Menu, MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { brandName, visibleNav } from "@/lib/site-nav";
import { cn, str } from "@/lib/utils";
import { telLink, whatsappLink } from "@/lib/format";
import { asMedia, ExtLink, Link, Ph } from "./placeholder";
import { useSite } from "./site-context";
import { SocialIcon } from "./social-icon";

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  const { site, ph } = useSite();
  const logo = asMedia(site.profile?.logo);
  const name = brandName(site);
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo.url} alt={name || "Logo"} className={cn("h-9 w-auto object-contain", className)} />;
  }
  return (
    <span className={cn("font-display text-[1.45rem] leading-none tracking-tight", light && "text-pearl", className)}>
      {name || (ph ? <Ph>Your name</Ph> : "Home")}
    </span>
  );
}

export function SiteHeader() {
  const { site } = useSite();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const nav = visibleNav(site);
  const isFragrance = pathname?.startsWith("/fragrance");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        isFragrance
          ? scrolled
            ? "bg-noir/85 text-pearl backdrop-blur-xl"
            : "bg-noir text-pearl"
          : scrolled
            ? "bg-background/80 shadow-[0_1px_0_var(--border)] backdrop-blur-xl"
            : "bg-background",
      )}
    >
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Home">
          <Wordmark light={isFragrance} />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {nav.slice(1).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "relative rounded-full px-3 py-2 text-[0.84rem] font-medium transition-colors",
                isFragrance ? "text-pearl/70 hover:text-pearl" : "text-foreground/70 hover:text-foreground",
                active(n.href) && (isFragrance ? "text-gold" : "text-foreground"),
              )}
            >
              {n.label}
              {active(n.href) && (
                <span className={cn("absolute inset-x-3 -bottom-0.5 h-px", isFragrance ? "bg-gold" : "bg-primary")} />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ variant: isFragrance ? "gold" : "ink", size: "sm" }),
              "hidden h-9 px-4 sm:inline-flex",
            )}
          >
            Work with me
          </Link>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              className={cn(
                "inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition xl:hidden",
                isFragrance ? "hover:bg-white/10" : "hover:bg-foreground/5",
              )}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </DialogTrigger>
            <SheetContent side="right" className="bg-background">
              <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
              <div className="flex h-[4.5rem] items-center px-6">
                <Wordmark />
              </div>
              <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-6" aria-label="Mobile">
                {nav.map((n, i) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-baseline gap-3 rounded-xl px-3 py-2.5 font-display text-2xl transition hover:bg-muted",
                      active(n.href) && "text-primary",
                    )}
                    style={{ animation: `fade-up .5s ${i * 30}ms both` }}
                  >
                    <span className="w-6 font-sans text-[0.65rem] tracking-widest text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {n.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t p-6">
                <Link href="/contact" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "ink" }), "w-full")}>
                  Work with me
                </Link>
              </div>
            </SheetContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}

export function SocialLinks({ className, light }: { className?: string; light?: boolean }) {
  const { site } = useSite();
  const socials = (Array.isArray(site.contact?.socials) ? site.contact!.socials : []) as Record<string, string>[];
  const list = socials.filter((s) => s.url);
  if (list.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {list.map((s, i) => (
        <ExtLink
          key={i}
          href={s.url}
          aria-label={s.platform}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full border transition",
            light ? "border-white/15 text-pearl/80 hover:border-gold hover:text-gold" : "border-foreground/12 text-foreground/70 hover:border-primary hover:text-primary",
          )}
        >
          <SocialIcon platform={s.platform} />
        </ExtLink>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const { site, ph } = useSite();
  const c = site.contact;
  const name = brandName(site);
  const nav = visibleNav(site);
  const year = new Date().getFullYear();
  const email = str(c?.businessEmail);
  const wa = whatsappLink(str(c?.whatsapp));

  return (
    <footer className="mt-auto bg-noir text-pearl">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="eyebrow text-pearl/50!">Let&apos;s create something</p>
          <p className="display mt-4 text-4xl md:text-5xl">
            {name || (ph ? <Ph>Your name</Ph> : null)}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-pearl/60">
            {str(site.profile?.professionalTitle) || (ph ? <Ph>Professional title</Ph> : null)}
          </p>
          <SocialLinks light className="mt-8" />
        </div>
        <nav className="grid grid-cols-2 gap-8 text-sm md:col-span-4" aria-label="Footer">
          <div className="space-y-3">
            <p className="eyebrow text-pearl/40!">Explore</p>
            {nav.slice(0, 5).map((n) => (
              <Link key={n.href} href={n.href} className="block text-pearl/75 transition hover:text-gold">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="space-y-3">
            <p className="eyebrow text-pearl/40!">Shop & connect</p>
            {nav.slice(5).map((n) => (
              <Link key={n.href} href={n.href} className="block text-pearl/75 transition hover:text-gold">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="space-y-3 text-sm md:col-span-3">
          <p className="eyebrow text-pearl/40!">Contact</p>
          {email ? (
            <a href={`mailto:${email}`} className="flex items-center gap-2 text-pearl/75 hover:text-gold">
              <Mail className="size-4" /> {email}
            </a>
          ) : ph ? (
            <p className="text-pearl/75"><Ph>business@email.com</Ph></p>
          ) : null}
          {wa && (
            <ExtLink href={wa} className="flex items-center gap-2 text-pearl/75 hover:text-gold">
              <MessageCircle className="size-4" /> WhatsApp
            </ExtLink>
          )}
          {str(c?.phone) && (
            <a href={telLink(str(c?.phone))} className="flex items-center gap-2 text-pearl/75 hover:text-gold">
              <Phone className="size-4" /> {str(c?.phone)}
            </a>
          )}
          {str(c?.location) && <p className="text-pearl/50">{str(c?.location)}</p>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-pearl/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name || "All rights reserved"}
            {name ? ". All rights reserved." : ""}
          </p>
          {str(site.settings.footerNote) && <p>{str(site.settings.footerNote)}</p>}
        </div>
      </div>
    </footer>
  );
}

export function PreviewBar() {
  const { site } = useSite();
  if (site.preview) {
    return (
      <div className="no-print relative z-50 bg-foreground text-background">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
          <p className="flex items-center gap-2">
            <Eye className="size-3.5" />
            <strong>Draft preview</strong>
            <span className="hidden text-background/65 sm:inline">— you are seeing unpublished changes. Visitors only see published content.</span>
          </p>
          <div className="flex gap-3">
            <NextLink href="/content-studio" className="underline-offset-2 hover:underline">
              Back to Studio
            </NextLink>
            <a href="/api/preview/exit" className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
              Exit preview <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  if (site.showPlaceholders) {
    return (
      <div className="no-print bg-accent text-accent-foreground">
        <p className="container-page py-1.5 text-center text-[0.72rem]">
          Website in preparation — sections marked as <span className="rounded border border-dashed border-current/40 px-1">placeholder</span> are awaiting content.
        </p>
      </div>
    );
  }
  return null;
}
