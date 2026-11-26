import { z } from "zod";
import { allFields } from "./definitions";
import type { ContentTypeDef, FieldDef } from "./types";

/*
 * Zod schemas are generated from the central field definitions.
 * Drafts are validated leniently: every field may be empty, but anything that IS filled in
 * must be well-formed (valid links, emails, numbers…). Required-field checks happen at publish
 * time and in the progress tracker, so the client can always save partial work.
 */

const optionalText = (max = 20000) => z.string().max(max, `Keep this under ${max} characters`).optional().default("");

const looseUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), {
    message: "Enter a full link starting with https://",
  });

const looseEmail = z
  .string()
  .trim()
  .max(320)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: "Enter a valid email address" });

const loosePhone = z
  .string()
  .trim()
  .max(40)
  .refine((v) => v === "" || /^\+?[0-9\s().-]{6,}$/.test(v), {
    message: "Use digits only, with the country code (e.g. +234…)",
  });

export const mediaRefSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1).max(2000),
  kind: z.enum(["image", "video", "document"]),
  name: z.string().max(300).default(""),
  mime: z.string().max(120).optional(),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().max(300).optional(),
});

const numberish = z.preprocess(
  (v) => (v === "" || v === undefined ? null : typeof v === "string" ? Number(v.replace(/,/g, "")) : v),
  z.number({ message: "Enter a number" }).min(0, "Must be zero or more").nullable(),
);

export const priceSchema = z.object({
  mode: z.enum(["fixed", "from", "quote", "free"]).default("fixed"),
  amount: numberish.optional().default(null),
  currency: z.string().min(3).max(3).default("NGN"),
  note: z.string().max(200).optional().default(""),
});

function fieldSchema(f: FieldDef): z.ZodType {
  switch (f.type) {
    case "text":
    case "textarea":
    case "date":
      return optionalText(f.maxLength ?? (f.type === "textarea" ? 20000 : 500));
    case "select":
      return z.string().max(100).optional().default("");
    case "color":
      return z
        .string()
        .refine((v) => v === "" || /^#[0-9a-f]{6}$/i.test(v), "Use a hex colour like #9a5b3f")
        .optional()
        .default("");
    case "url":
      return looseUrl.optional().default("");
    case "email":
      return looseEmail.optional().default("");
    case "tel":
      return loosePhone.optional().default("");
    case "number":
      return numberish.optional().default(null);
    case "toggle":
      return z.boolean().optional().default(Boolean(f.defaultValue));
    case "tags":
    case "list":
      return z.array(z.string().max(1000)).max(100).optional().default([]);
    case "image":
    case "file":
    case "media":
      return mediaRefSchema.nullable().optional().default(null);
    case "images":
      return z.array(mediaRefSchema).max(60).optional().default([]);
    case "price":
      return priceSchema.optional().default({ mode: "fixed", amount: null, currency: "NGN", note: "" });
    case "repeater": {
      const shape: Record<string, z.ZodType> = {};
      for (const sub of f.itemFields ?? []) shape[sub.key] = fieldSchema(sub);
      return z.array(z.object(shape)).max(100).optional().default([]);
    }
  }
}

export function buildDraftSchema(def: ContentTypeDef) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of allFields(def)) shape[f.key] = fieldSchema(f);
  return z.object(shape);
}

const schemaCache = new Map<string, ReturnType<typeof buildDraftSchema>>();
export function draftSchemaFor(def: ContentTypeDef) {
  let s = schemaCache.get(def.id);
  if (!s) {
    s = buildDraftSchema(def);
    schemaCache.set(def.id, s);
  }
  return s;
}
