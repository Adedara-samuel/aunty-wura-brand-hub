import type { SiteContent } from "./site-types";
import { str } from "./utils";

export interface NavItem {
  href: string;
  label: string;
  /** Whether the section has anything to show. */
  has: (s: SiteContent) => boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Home", has: () => true },
  { href: "/about", label: "About", has: (s) => !!s.about || !!s.profile },
  { href: "/portfolio", label: "Portfolio", has: (s) => s.portfolio.length > 0 },
  { href: "/services", label: "Services", has: (s) => s.services.length > 0 },
  { href: "/rate-card", label: "Rate Card", has: (s) => s.services.some((x) => x.data.showOnRateCard !== false) },
  { href: "/classes", label: "Classes", has: (s) => s.classes.length > 0 },
  { href: "/templates", label: "Templates", has: (s) => s.products.length > 0 },
  { href: "/fragrance", label: "Fragrance", has: (s) => !!s.fragranceBrand || s.fragrances.length > 0 },
  { href: "/contact", label: "Contact", has: () => true },
];

/** Navigation items to show. Empty sections are hidden once placeholders are switched off. */
export function visibleNav(site: SiteContent): NavItem[] {
  if (site.showPlaceholders || site.preview) return NAV;
  return NAV.filter((n) => n.has(site));
}

export function brandName(site: SiteContent): string {
  return str(site.profile?.displayName) || str(site.profile?.fullName);
}

export function siteTitle(site: SiteContent): string {
  return str(site.settings.siteTitle) || brandName(site) || "Personal Brand";
}
