"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ClipboardCheck, ExternalLink, FolderOpen, Gauge, Inbox, LogOut, Menu, Settings2 } from "lucide-react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/overlay";
import { STUDIO_MODULES } from "@/lib/content/modules";
import { useOverview } from "@/lib/studio/api";
import { confirmLeave } from "@/lib/studio/unsaved";
import { cn, initials } from "@/lib/utils";
import { ModuleIcon } from "./icons";
import { StateDot } from "./status";

const NavigateContext = React.createContext<() => void>(() => {});

function NavLink({ href, active, children, className }: { href: string; active: boolean; children: React.ReactNode; className?: string }) {
  const onNavigate = React.useContext(NavigateContext);
  return (
    <NextLink
      href={href}
      onClick={(e) => {
        if (confirmLeave(e)) onNavigate();
      }}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[0.88rem] font-medium transition",
        active ? "bg-foreground text-background" : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
        className,
      )}
    >
      {children}
    </NextLink>
  );
}

function SidebarContent({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname() ?? "";
  const { data } = useOverview();
  const states = new Map(data?.progress.modules.map((m) => [m.id, m]) ?? []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/content-studio/login";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-4">
        <NextLink href="/content-studio" onClick={confirmLeave} className="block">
          <span className="eyebrow text-[0.62rem]!">Private workspace</span>
          <span className="mt-1 block font-display text-2xl">Content Studio</span>
        </NextLink>
        {data && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall progress</span>
              <span className="font-semibold text-foreground tabular-nums">{data.progress.percent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${data.progress.percent}%` }} />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label="Studio">
        <div className="space-y-0.5">
          <NavLink href="/content-studio" active={pathname === "/content-studio"}>
            <Gauge className="size-4" /> Overview
          </NavLink>
        </div>
        <div>
          <p className="px-3 pb-2 text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Website sections</p>
          <div className="space-y-0.5">
            {STUDIO_MODULES.map((m) => {
              const href = `/content-studio/${m.id}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const st = states.get(m.id);
              return (
                <NavLink key={m.id} href={href} active={active}>
                  <ModuleIcon name={m.icon} className="size-4 shrink-0" />
                  <span className="flex-1 truncate">
                    <span className={cn("mr-1.5 text-xs tabular-nums", active ? "text-background/60" : "text-muted-foreground")}>{m.number}.</span>
                    {m.title}
                  </span>
                  {st && <StateDot state={st.state} className={active && st.state === "not_started" ? "bg-background/40" : ""} />}
                </NavLink>
              );
            })}
          </div>
        </div>
        <div>
          <p className="px-3 pb-2 text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Tools</p>
          <div className="space-y-0.5">
            <NavLink href="/content-studio/media" active={pathname.startsWith("/content-studio/media")}>
              <FolderOpen className="size-4" /> Media library
            </NavLink>
            <NavLink href="/content-studio/enquiries" active={pathname.startsWith("/content-studio/enquiries")}>
              <Inbox className="size-4" /> <span className="flex-1">Enquiries</span>
              {!!data?.newEnquiries && (
                <span className="rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-primary-foreground tabular-nums">{data.newEnquiries}</span>
              )}
            </NavLink>
            <NavLink href="/content-studio/review" active={pathname.startsWith("/content-studio/review")}>
              <ClipboardCheck className="size-4" /> Review & export
            </NavLink>
            <NavLink href="/content-studio/settings" active={pathname.startsWith("/content-studio/settings")}>
              <Settings2 className="size-4" /> Site settings
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="border-t p-3">
        <a
          href="/api/studio/preview?path=/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[0.88rem] font-medium text-foreground/75 hover:bg-foreground/5"
        >
          <ExternalLink className="size-4" /> Preview website
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initials(user.name || user.email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <button onClick={logout} className="cursor-pointer rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudioShell({ user, children }: { user: { name: string; email: string }; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r bg-surface/70 backdrop-blur lg:block">
        <SidebarContent user={user} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-surface/90 px-4 backdrop-blur lg:hidden">
          <NextLink href="/content-studio" className="font-display text-xl">
            Content Studio
          </NextLink>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-muted" aria-label="Open navigation">
              <Menu className="size-5" />
            </DialogTrigger>
            <SheetContent side="left">
              <DialogPrimitive.Title className="sr-only">Studio navigation</DialogPrimitive.Title>
              <NavigateContext.Provider value={() => setOpen(false)}>
                <SidebarContent user={user} />
              </NavigateContext.Provider>
            </SheetContent>
          </Dialog>
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b bg-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1 className="display mt-2 text-4xl md:text-[2.75rem]">{title}</h1>
            {description && <div className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
