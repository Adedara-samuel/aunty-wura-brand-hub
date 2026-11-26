"use client";

import * as React from "react";
import type { SiteContent } from "@/lib/site-types";
import { EMPTY_SITE } from "@/lib/site-types";

interface SiteCtx {
  site: SiteContent;
  /** Show labelled placeholders for missing content. */
  ph: boolean;
  /** Rendering inside the Studio preview pane (links are inert). */
  inStudio: boolean;
}

const Ctx = React.createContext<SiteCtx>({ site: EMPTY_SITE, ph: true, inStudio: false });

export function SiteProvider({
  site,
  inStudio = false,
  children,
}: {
  site: SiteContent;
  inStudio?: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ site, ph: inStudio ? true : site.showPlaceholders, inStudio }),
    [site, inStudio],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  return React.useContext(Ctx);
}
