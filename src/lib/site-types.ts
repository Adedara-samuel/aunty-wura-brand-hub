import type { EntryData } from "./content/types";

export interface SiteItem {
  id: string;
  slug: string;
  data: EntryData;
}

export interface SiteContent {
  /** True when a signed-in Studio user is previewing drafts on the public site. */
  preview: boolean;
  /** Show labelled placeholders for missing content (pre-launch review mode). */
  showPlaceholders: boolean;
  profile: EntryData | null;
  about: EntryData | null;
  rateCard: EntryData | null;
  fragranceBrand: EntryData | null;
  contact: EntryData | null;
  settings: EntryData;
  portfolio: SiteItem[];
  services: SiteItem[];
  classes: SiteItem[];
  products: SiteItem[];
  fragrances: SiteItem[];
  gallery: SiteItem[];
}

export const EMPTY_SITE: SiteContent = {
  preview: true,
  showPlaceholders: true,
  profile: null,
  about: null,
  rateCard: null,
  fragranceBrand: null,
  contact: null,
  settings: {},
  portfolio: [],
  services: [],
  classes: [],
  products: [],
  fragrances: [],
  gallery: [],
};
