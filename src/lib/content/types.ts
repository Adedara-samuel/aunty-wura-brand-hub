export type ContentTypeId =
  | "profile"
  | "about"
  | "portfolio"
  | "service"
  | "rateCard"
  | "class"
  | "product"
  | "fragranceBrand"
  | "fragrance"
  | "gallery"
  | "contact"
  | "settings";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "select"
  | "tags"
  | "list"
  | "image"
  | "images"
  | "media"
  | "file"
  | "price"
  | "repeater"
  | "toggle"
  | "color";

export type MediaKind = "image" | "video" | "document";

export interface MediaRef {
  id: string;
  url: string;
  kind: MediaKind;
  name: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  alt?: string;
}

export type PriceMode = "fixed" | "from" | "quote" | "free";

export interface Price {
  mode: PriceMode;
  amount?: number | null;
  currency: string;
  note?: string;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  type: FieldType;
  /** Short label used in lists, exports and validation messages. */
  label: string;
  /** Friendly question shown above the input, e.g. "Tell us about yourself". */
  heading?: string;
  /** Writing guidance shown under the heading. */
  prompt?: string;
  /** Sample writing — only ever shown inside the private Content Studio. */
  example?: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  rows?: number;
  maxLength?: number;
  /** For repeaters: the fields of each item. */
  itemFields?: FieldDef[];
  /** For repeaters / lists: what one item is called ("module", "size"). */
  itemLabel?: string;
  /** For text fields: offer the categories already used in this content type. */
  suggestFromExisting?: boolean;
  /** Which media kinds a media field accepts. */
  accept?: MediaKind[];
  width?: "full" | "half";
  defaultValue?: unknown;
  /** Show this field only when another field has one of these values. */
  showWhen?: { key: string; equals: unknown[] };
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface ContentTypeDef {
  id: ContentTypeId;
  kind: "singleton" | "collection";
  singular: string;
  plural: string;
  /** Field used as the entry title in lists and slugs. */
  titleField: string;
  /** Field used as the entry subtitle in lists. */
  subtitleField?: string;
  /** Field used for public category filters. */
  categoryField?: string;
  /** Field holding the cover image used for list thumbnails. */
  imageField?: string;
  /** Public URL prefix for detail pages, if any. */
  detailPath?: string;
  groups: FieldGroup[];
  /** Excluded from content-preparation progress (e.g. site settings). */
  excludeFromProgress?: boolean;
}

export type ModuleId =
  | "personal"
  | "about"
  | "portfolio"
  | "services"
  | "rate-card"
  | "classes"
  | "products"
  | "fragrance"
  | "gallery"
  | "contact";

export interface StudioModuleDef {
  id: ModuleId;
  number: number;
  title: string;
  icon: string;
  summary: string;
  why: string;
  tips: string[];
  types: ContentTypeId[];
  publicHref: string;
}

export type EntryData = Record<string, unknown>;

export interface Entry {
  id: string;
  type: ContentTypeId;
  data: EntryData;
  published: EntryData | null;
  slug: string;
  publishedSlug: string | null;
  order: number;
  hasUnpublishedChanges: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type EntryStatus = "draft" | "published" | "changed";

export type CompletionState = "not_started" | "in_progress" | "complete";
