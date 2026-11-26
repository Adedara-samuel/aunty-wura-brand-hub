import "server-only";
import { ObjectId } from "mongodb";
import { CONTENT_TYPES, defaultDataFor } from "@/lib/content/definitions";
import { missingRequired } from "@/lib/content/completion";
import { draftSchemaFor } from "@/lib/content/schema";
import type { ContentTypeId, Entry, EntryData } from "@/lib/content/types";
import { slugify } from "@/lib/utils";
import { getDb, type EntryDoc } from "./db";
import { HttpError } from "./http";
import { syncMediaVisibility } from "./media";

export function serializeEntry(doc: EntryDoc): Entry {
  return {
    id: doc._id.toHexString(),
    type: doc.type as ContentTypeId,
    data: doc.data ?? {},
    published: doc.published ?? null,
    slug: doc.slug ?? "",
    publishedSlug: doc.publishedSlug ?? null,
    order: doc.order ?? 0,
    hasUnpublishedChanges: !!doc.hasUnpublishedChanges,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
  };
}

async function entries() {
  return (await getDb()).collection<EntryDoc>("entries");
}

export function parseObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Not found");
  return new ObjectId(id);
}

/** Validate & normalise draft data. Unknown keys are dropped. */
export function cleanData(type: ContentTypeId, data: unknown): EntryData {
  const def = CONTENT_TYPES[type];
  const result = draftSchemaFor(def).safeParse({ ...defaultDataFor(def), ...(data as object) });
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    throw new HttpError(422, "Some fields need attention", { issues });
  }
  return result.data as EntryData;
}

async function uniqueSlug(type: ContentTypeId, base: string, excludeId?: ObjectId, field: "slug" | "publishedSlug" = "slug") {
  const col = await entries();
  let slug = slugify(base);
  let n = 1;
  while (
    await col.findOne({ type, [field]: slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }, { projection: { _id: 1 } })
  ) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

function titleOf(type: ContentTypeId, data: EntryData) {
  const def = CONTENT_TYPES[type];
  const t = data[def.titleField];
  return typeof t === "string" && t.trim() ? t : def.singular;
}

export async function listEntries(type?: ContentTypeId): Promise<Entry[]> {
  const col = await entries();
  const docs = await col.find(type ? { type } : {}).sort({ type: 1, order: 1, createdAt: 1 }).toArray();
  return docs.map(serializeEntry);
}

export async function getEntry(id: string): Promise<Entry> {
  const col = await entries();
  const doc = await col.findOne({ _id: parseObjectId(id) });
  if (!doc) throw new HttpError(404, "This item no longer exists");
  return serializeEntry(doc);
}

export async function getSingleton(type: ContentTypeId): Promise<Entry | null> {
  const col = await entries();
  const doc = await col.findOne({ type });
  return doc ? serializeEntry(doc) : null;
}

export async function createEntry(type: ContentTypeId, rawData: unknown): Promise<Entry> {
  const def = CONTENT_TYPES[type];
  const data = cleanData(type, rawData ?? {});
  const col = await entries();
  const now = new Date();

  if (def.kind === "singleton") {
    // Singletons are upserted — there is only ever one document per type.
    const existing = await col.findOne({ type });
    if (existing) return updateEntry(existing._id.toHexString(), data);
  }

  const last = await col.find({ type }).sort({ order: -1 }).limit(1).next();
  const doc: Omit<EntryDoc, "_id"> = {
    type,
    data,
    published: null,
    slug: await uniqueSlug(type, titleOf(type, data)),
    publishedSlug: null,
    order: (last?.order ?? -1) + 1,
    hasUnpublishedChanges: false,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
  const res = await col.insertOne(doc as EntryDoc);
  return serializeEntry({ ...(doc as EntryDoc), _id: res.insertedId });
}

export async function updateEntry(id: string, rawData: unknown): Promise<Entry> {
  const col = await entries();
  const _id = parseObjectId(id);
  const existing = await col.findOne({ _id });
  if (!existing) throw new HttpError(404, "This item no longer exists");
  const type = existing.type as ContentTypeId;
  const data = cleanData(type, rawData);
  const slug = await uniqueSlug(type, titleOf(type, data), _id);
  const res = await col.findOneAndUpdate(
    { _id },
    { $set: { data, slug, updatedAt: new Date(), hasUnpublishedChanges: !!existing.published } },
    { returnDocument: "after" },
  );
  return serializeEntry(res!);
}

export async function duplicateEntry(id: string): Promise<Entry> {
  const original = await getEntry(id);
  const def = CONTENT_TYPES[original.type];
  if (def.kind === "singleton") throw new HttpError(400, "This section can't be duplicated");
  const data = { ...original.data };
  const t = data[def.titleField];
  if (typeof t === "string") data[def.titleField] = `${t} (copy)`;
  return createEntry(original.type, data);
}

export async function deleteEntry(id: string): Promise<void> {
  const col = await entries();
  const res = await col.deleteOne({ _id: parseObjectId(id) });
  if (res.deletedCount === 0) throw new HttpError(404, "This item no longer exists");
  await syncMediaVisibility();
}

export async function publishEntry(id: string): Promise<Entry> {
  const col = await entries();
  const _id = parseObjectId(id);
  const existing = await col.findOne({ _id });
  if (!existing) throw new HttpError(404, "This item no longer exists");
  const type = existing.type as ContentTypeId;
  const def = CONTENT_TYPES[type];
  const missing = missingRequired(def, existing.data);
  if (missing.length > 0) {
    throw new HttpError(422, "Fill in the required fields before publishing", { missing });
  }
  const publishedSlug = await uniqueSlug(type, titleOf(type, existing.data), _id, "publishedSlug");
  const res = await col.findOneAndUpdate(
    { _id },
    {
      $set: {
        published: existing.data,
        publishedSlug,
        publishedAt: new Date(),
        hasUnpublishedChanges: false,
      },
    },
    { returnDocument: "after" },
  );
  await syncMediaVisibility();
  return serializeEntry(res!);
}

export async function unpublishEntry(id: string): Promise<Entry> {
  const col = await entries();
  const res = await col.findOneAndUpdate(
    { _id: parseObjectId(id) },
    { $set: { published: null, publishedSlug: null, publishedAt: null, hasUnpublishedChanges: false } },
    { returnDocument: "after" },
  );
  if (!res) throw new HttpError(404, "This item no longer exists");
  await syncMediaVisibility();
  return serializeEntry(res);
}

/** Discard draft edits and go back to the published version. */
export async function revertEntry(id: string): Promise<Entry> {
  const col = await entries();
  const _id = parseObjectId(id);
  const existing = await col.findOne({ _id });
  if (!existing) throw new HttpError(404, "This item no longer exists");
  if (!existing.published) throw new HttpError(400, "There is no published version to go back to");
  const res = await col.findOneAndUpdate(
    { _id },
    { $set: { data: existing.published, hasUnpublishedChanges: false, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return serializeEntry(res!);
}

export async function reorderEntries(type: ContentTypeId, ids: string[]): Promise<void> {
  const col = await entries();
  await col.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: parseObjectId(id), type }, update: { $set: { order: index } } },
    })),
  );
}
