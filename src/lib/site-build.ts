import type { ContentTypeId, Entry } from "./content/types";
import type { SiteContent, SiteItem } from "./site-types";

/** Build the site content model from stored entries (pure — shared by server and Studio preview). */
export function buildSiteContent(all: Entry[], preview: boolean): SiteContent {
  const pick = (e: Entry) => (preview ? e.data : e.published);
  const single = (type: ContentTypeId) => {
    const e = all.find((x) => x.type === type);
    return e ? (pick(e) ?? null) : null;
  };
  const many = (type: ContentTypeId): SiteItem[] =>
    all
      .filter((e) => e.type === type)
      .sort((a, b) => a.order - b.order)
      .flatMap((e) => {
        const data = pick(e);
        const slug = preview ? e.slug || e.id : e.publishedSlug;
        return data && slug ? [{ id: e.id, slug, data }] : [];
      });

  // Site settings apply immediately (they are configuration, not content).
  const settings = all.find((e) => e.type === "settings")?.data ?? {};

  return {
    preview,
    showPlaceholders: settings.showPlaceholders === undefined ? true : Boolean(settings.showPlaceholders),
    profile: single("profile"),
    about: single("about"),
    rateCard: single("rateCard"),
    fragranceBrand: single("fragranceBrand"),
    contact: single("contact"),
    settings,
    portfolio: many("portfolio"),
    services: many("service"),
    classes: many("class"),
    products: many("product"),
    fragrances: many("fragrance"),
    gallery: many("gallery"),
  };
}
