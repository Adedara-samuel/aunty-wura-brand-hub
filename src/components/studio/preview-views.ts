import type { ContentTypeId } from "@/lib/content/types";

export type PreviewView =
  | "home"
  | "about"
  | "portfolio"
  | "portfolio-detail"
  | "services"
  | "rate-card"
  | "classes"
  | "class-detail"
  | "products"
  | "product-detail"
  | "fragrance"
  | "fragrance-detail"
  | "gallery"
  | "contact";

export interface PreviewOption {
  view: PreviewView;
  label: string;
  /** Needs a specific item (detail pages). */
  item?: boolean;
  path: (slug?: string) => string;
}

/** Which public views best preview each content type (first = default). */
export const PREVIEWS_FOR_TYPE: Record<ContentTypeId, PreviewOption[]> = {
  profile: [
    { view: "home", label: "Homepage", path: () => "/" },
    { view: "about", label: "About page", path: () => "/about" },
  ],
  about: [
    { view: "about", label: "About page", path: () => "/about" },
    { view: "home", label: "Homepage", path: () => "/" },
  ],
  portfolio: [
    { view: "portfolio-detail", label: "Project page", item: true, path: (s) => `/portfolio/${s ?? ""}` },
    { view: "portfolio", label: "Portfolio grid", path: () => "/portfolio" },
  ],
  service: [
    { view: "services", label: "Services page", path: () => "/services" },
    { view: "rate-card", label: "Rate card", path: () => "/rate-card" },
  ],
  rateCard: [{ view: "rate-card", label: "Rate card", path: () => "/rate-card" }],
  class: [
    { view: "class-detail", label: "Class page", item: true, path: (s) => `/classes/${s ?? ""}` },
    { view: "classes", label: "Course catalogue", path: () => "/classes" },
  ],
  product: [
    { view: "product-detail", label: "Product page", item: true, path: (s) => `/templates/${s ?? ""}` },
    { view: "products", label: "Templates grid", path: () => "/templates" },
  ],
  fragranceBrand: [{ view: "fragrance", label: "Fragrance page", path: () => "/fragrance" }],
  fragrance: [
    { view: "fragrance-detail", label: "Product page", item: true, path: (s) => `/fragrance/${s ?? ""}` },
    { view: "fragrance", label: "Catalogue", path: () => "/fragrance" },
  ],
  gallery: [
    { view: "gallery", label: "Gallery", path: () => "/about#gallery" },
    { view: "home", label: "Homepage", path: () => "/" },
  ],
  contact: [{ view: "contact", label: "Contact page", path: () => "/contact" }],
  settings: [{ view: "home", label: "Homepage", path: () => "/" }],
};

/** Listing view used for a collection's "Preview" tab. */
export const LIST_VIEW_FOR_TYPE: Partial<Record<ContentTypeId, PreviewOption>> = {
  portfolio: PREVIEWS_FOR_TYPE.portfolio[1],
  service: PREVIEWS_FOR_TYPE.service[0],
  class: PREVIEWS_FOR_TYPE.class[1],
  product: PREVIEWS_FOR_TYPE.product[1],
  fragrance: PREVIEWS_FOR_TYPE.fragrance[1],
  gallery: PREVIEWS_FOR_TYPE.gallery[0],
};
