"use client";

import * as React from "react";
import { SiteProvider } from "@/components/site/site-context";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { HomeView, GalleryStrip } from "@/components/site/sections/home";
import { AboutView, GallerySection } from "@/components/site/sections/about";
import { PortfolioDetail, PortfolioView } from "@/components/site/sections/portfolio";
import { RateCardView, ServicesView } from "@/components/site/sections/services";
import { ClassDetail, ClassesView } from "@/components/site/sections/classes";
import { ProductDetail, ProductsView } from "@/components/site/sections/products";
import { FragranceDetail, FragranceView } from "@/components/site/sections/fragrance";
import { ContactView } from "@/components/site/sections/contact";
import { EmptySection } from "@/components/site/placeholder";
import type { SiteContent, SiteItem } from "@/lib/site-types";
import { brandStyle } from "@/lib/theme";
import type { PreviewView } from "./preview-views";

export interface PreviewMessage {
  type: "studio-preview";
  site: SiteContent;
  view: PreviewView;
  itemId?: string;
}

function findItem(site: SiteContent, view: PreviewView, id?: string): { item?: SiteItem; list: SiteItem[] } {
  const list =
    view === "portfolio-detail" ? site.portfolio : view === "class-detail" ? site.classes : view === "product-detail" ? site.products : view === "fragrance-detail" ? site.fragrances : [];
  return { item: list.find((i) => i.id === id) ?? list[0], list };
}

function View({ msg }: { msg: PreviewMessage }) {
  const { site, view, itemId } = msg;
  const { item, list } = findItem(site, view, itemId);
  const missing = <div className="container-page py-24"><EmptySection title="Nothing to preview yet" text="Start filling in the form and the preview will update instantly." /></div>;
  switch (view) {
    case "home":
      return <HomeView />;
    case "about":
      return <AboutView />;
    case "portfolio":
      return <PortfolioView />;
    case "portfolio-detail": {
      if (!item) return missing;
      const i = list.indexOf(item);
      return <PortfolioDetail item={item} prev={list[i - 1]} next={list[i + 1]} />;
    }
    case "services":
      return <ServicesView />;
    case "rate-card":
      return <RateCardView pdfHref="/api/rate-card?draft=1" />;
    case "classes":
      return <ClassesView />;
    case "class-detail":
      return item ? <ClassDetail item={item} /> : missing;
    case "products":
      return <ProductsView />;
    case "product-detail":
      return item ? <ProductDetail item={item} /> : missing;
    case "fragrance":
      return <FragranceView />;
    case "fragrance-detail":
      return item ? <FragranceDetail item={item} /> : missing;
    case "gallery":
      return site.gallery.length ? (
        <>
          <GalleryStrip />
          <GallerySection />
        </>
      ) : (
        missing
      );
    case "contact":
      return <ContactView />;
  }
}

export function PreviewFrame() {
  const [msg, setMsg] = React.useState<PreviewMessage | null>(null);

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as PreviewMessage;
      if (data?.type === "studio-preview") setMsg(data);
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "studio-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Prevent any accidental navigation inside the preview.
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a && !a.getAttribute("href")?.startsWith("#")) e.preventDefault();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!msg) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const dark = msg.view.startsWith("fragrance");
  return (
    <SiteProvider site={msg.site} inStudio>
      <div className={dark ? "flex min-h-dvh flex-col bg-noir" : "flex min-h-dvh flex-col"} style={brandStyle(msg.site.settings.accentColor)}>
        <SiteHeader />
        <main className="flex-1">
          <View msg={msg} />
        </main>
        <SiteFooter />
      </div>
    </SiteProvider>
  );
}
