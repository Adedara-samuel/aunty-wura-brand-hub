import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ObjectId } from "mongodb";
import type { MediaKind, MediaRef } from "@/lib/content/types";
import { getDb, type EntryDoc, type MediaDoc } from "./db";
import { HttpError } from "./http";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

export const MEDIA_RULES: Record<MediaKind, { mimes: string[]; maxBytes: number; label: string }> = {
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml", "image/heic", "image/heif"],
    maxBytes: 15 * 1024 * 1024,
    label: "Images (JPG, PNG, WEBP, GIF, SVG, HEIC) up to 15 MB",
  },
  video: {
    mimes: ["video/mp4", "video/quicktime", "video/webm"],
    maxBytes: 100 * 1024 * 1024,
    label: "Videos (MP4, MOV, WEBM) up to 100 MB",
  },
  document: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
    maxBytes: 25 * 1024 * 1024,
    label: "Documents (PDF, Word, PowerPoint, Excel, TXT) up to 25 MB",
  },
};

export function kindForMime(mime: string): MediaKind | null {
  for (const [kind, rule] of Object.entries(MEDIA_RULES) as [MediaKind, (typeof MEDIA_RULES)[MediaKind]][]) {
    if (rule.mimes.includes(mime)) return kind;
  }
  return null;
}

export function validateUpload(mime: string, size: number): MediaKind {
  const kind = kindForMime(mime);
  if (!kind) throw new HttpError(415, "This file type isn't supported. Please upload an image, video or document.");
  if (size > MEDIA_RULES[kind].maxBytes) {
    throw new HttpError(413, `This file is too large. ${MEDIA_RULES[kind].label}.`);
  }
  if (size === 0) throw new HttpError(400, "This file is empty.");
  return kind;
}

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret, folder: process.env.CLOUDINARY_FOLDER || "brand-hub" };
}

export function storageProvider(): "local" | "cloudinary" {
  return cloudinaryConfig() ? "cloudinary" : "local";
}

function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || ".data/uploads");
}

async function mediaCol() {
  return (await getDb()).collection<MediaDoc>("media");
}

export function toMediaRef(doc: MediaDoc): MediaRef {
  return {
    id: doc._id.toHexString(),
    url: doc.url,
    kind: doc.kind,
    name: doc.name,
    mime: doc.mime,
    size: doc.size,
    width: doc.width,
    height: doc.height,
    alt: doc.alt ?? "",
  };
}

export function serializeMedia(doc: MediaDoc) {
  return {
    ...toMediaRef(doc),
    provider: doc.provider,
    folder: doc.folder ?? "",
    isPublic: doc.isPublic,
    createdAt: doc.createdAt.toISOString(),
  };
}
export type MediaItem = ReturnType<typeof serializeMedia>;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/csv": "csv",
};

export function extensionFor(mime: string) {
  return EXT[mime] ?? "bin";
}

function safeName(name: string) {
  return name.replace(/[^\w.\- ()]+/g, "_").slice(0, 160) || "file";
}

/* -------------------------------------------------------------------------- */
/*  Local storage                                                             */
/* -------------------------------------------------------------------------- */

export async function saveLocalUpload(
  file: File,
  meta: { folder?: string; width?: number; height?: number },
): Promise<MediaItem> {
  if (process.env.VERCEL) {
    // Serverless hosts have a read-only, non-persistent filesystem.
    throw new HttpError(
      503,
      "Uploads need Cloudinary on this hosting. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the Vercel project settings, then redeploy.",
    );
  }
  const mime = file.type || "application/octet-stream";
  const kind = validateUpload(mime, file.size);
  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${extensionFor(mime)}`;
  const abs = path.join(/*turbopackIgnore: true*/ uploadDir(), key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));

  const doc: MediaDoc = {
    _id: new ObjectId(),
    provider: "local",
    key,
    url: `/api/media/${key}`,
    kind,
    mime,
    size: file.size,
    width: meta.width,
    height: meta.height,
    name: safeName(file.name),
    folder: meta.folder,
    isPublic: false,
    createdAt: now,
  };
  await (await mediaCol()).insertOne(doc);
  return serializeMedia(doc);
}

export async function readLocalMedia(key: string): Promise<{ doc: MediaDoc; data: Buffer }> {
  if (!/^[\w/.-]+$/.test(key) || key.includes("..")) throw new HttpError(404, "Not found");
  const doc = await (await mediaCol()).findOne({ key, provider: "local" });
  if (!doc) throw new HttpError(404, "Not found");
  const abs = path.join(/*turbopackIgnore: true*/ uploadDir(), key);
  if (!abs.startsWith(uploadDir())) throw new HttpError(404, "Not found");
  try {
    return { doc, data: await fs.readFile(abs) };
  } catch {
    throw new HttpError(404, "File missing from storage");
  }
}

/* -------------------------------------------------------------------------- */
/*  Cloudinary (direct, signed browser uploads)                               */
/* -------------------------------------------------------------------------- */

function cloudinarySign(params: Record<string, string | number>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

export function signCloudinaryUpload(subfolder?: string) {
  const cfg = cloudinaryConfig();
  if (!cfg) throw new HttpError(400, "Cloudinary is not configured");
  const timestamp = Math.round(Date.now() / 1000);
  const folder = [cfg.folder, subfolder].filter(Boolean).join("/");
  const params = { folder, timestamp };
  return {
    cloudName: cfg.cloudName,
    apiKey: cfg.apiKey,
    timestamp,
    folder,
    signature: cloudinarySign(params, cfg.apiSecret),
  };
}

export interface CloudinaryResult {
  public_id: string;
  version: number | string;
  signature: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename?: string;
}

export async function registerCloudinaryUpload(
  result: CloudinaryResult,
  meta: { name: string; mime: string; folder?: string },
): Promise<MediaItem> {
  const cfg = cloudinaryConfig();
  if (!cfg) throw new HttpError(400, "Cloudinary is not configured");
  const expected = cloudinarySign({ public_id: result.public_id, version: result.version }, cfg.apiSecret);
  if (expected !== result.signature) throw new HttpError(400, "Upload could not be verified");
  if (!result.secure_url.startsWith(`https://res.cloudinary.com/${cfg.cloudName}/`)) {
    throw new HttpError(400, "Upload could not be verified");
  }
  const kind = validateUpload(meta.mime, result.bytes);
  const doc: MediaDoc = {
    _id: new ObjectId(),
    provider: "cloudinary",
    key: `cloudinary:${result.public_id}`,
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    kind,
    mime: meta.mime,
    size: result.bytes,
    width: result.width,
    height: result.height,
    name: safeName(meta.name),
    folder: meta.folder,
    isPublic: false,
    createdAt: new Date(),
  };
  await (await mediaCol()).insertOne(doc);
  return serializeMedia(doc);
}

async function destroyCloudinary(doc: MediaDoc) {
  const cfg = cloudinaryConfig();
  if (!cfg || !doc.publicId) return;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinarySign({ public_id: doc.publicId, timestamp }, cfg.apiSecret);
  const body = new URLSearchParams({
    public_id: doc.publicId,
    timestamp: String(timestamp),
    api_key: cfg.apiKey,
    signature,
  });
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${doc.resourceType || "image"}/destroy`,
    { method: "POST", body },
  );
  if (!res.ok) console.warn("Cloudinary delete failed", await res.text());
}

/* -------------------------------------------------------------------------- */
/*  Library operations                                                        */
/* -------------------------------------------------------------------------- */

export async function listMedia(kind?: MediaKind): Promise<MediaItem[]> {
  const docs = await (await mediaCol())
    .find(kind ? { kind } : {})
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
  return docs.map(serializeMedia);
}

export async function getMediaDoc(id: string): Promise<MediaDoc> {
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Not found");
  const doc = await (await mediaCol()).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new HttpError(404, "Not found");
  return doc;
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaItem> {
  const doc = await getMediaDoc(id);
  await (await mediaCol()).updateOne({ _id: doc._id }, { $set: { alt: alt.slice(0, 300) } });
  return serializeMedia({ ...doc, alt });
}

/** Find which entries reference a media id (drafts or published). */
export async function mediaUsage(id: string) {
  const db = await getDb();
  const docs = await db.collection<EntryDoc>("entries").find({}).toArray();
  return docs
    .filter((d) => JSON.stringify(d.data).includes(id) || JSON.stringify(d.published ?? {}).includes(id))
    .map((d) => ({ id: d._id.toHexString(), type: d.type }));
}

export async function deleteMedia(id: string) {
  const doc = await getMediaDoc(id);
  if (doc.provider === "local") {
    await fs.rm(path.join(/*turbopackIgnore: true*/ uploadDir(), doc.key), { force: true });
  } else {
    await destroyCloudinary(doc);
  }
  await (await mediaCol()).deleteOne({ _id: doc._id });
}

/** Collect media ids referenced anywhere inside a value. */
export function collectMediaIds(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectMediaIds(v, into));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.url === "string" && typeof o.kind === "string") into.add(o.id);
    Object.values(o).forEach((v) => collectMediaIds(v, into));
  }
  return into;
}

/**
 * Locally stored files are private by default and only served to signed-in Studio users.
 * A file becomes publicly accessible once it is used by published content.
 */
export async function syncMediaVisibility() {
  const db = await getDb();
  const published = await db
    .collection<EntryDoc>("entries")
    .find({ published: { $ne: null } }, { projection: { published: 1 } })
    .toArray();
  const ids = new Set<string>();
  published.forEach((p) => collectMediaIds(p.published, ids));
  const objectIds = [...ids].filter((i) => ObjectId.isValid(i)).map((i) => new ObjectId(i));
  const col = db.collection<MediaDoc>("media");
  await col.updateMany({ _id: { $in: objectIds } }, { $set: { isPublic: true } });
  await col.updateMany({ _id: { $nin: objectIds } }, { $set: { isPublic: false } });
}

/** Read raw bytes for any media item (used for ZIP export). */
export async function readMediaBytes(doc: MediaDoc): Promise<Buffer | null> {
  try {
    if (doc.provider === "local") return await fs.readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), doc.key));
    const res = await fetch(doc.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
