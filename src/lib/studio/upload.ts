"use client";

import type { MediaKind } from "@/lib/content/types";
import { api, ApiError, type MediaItem } from "./api";

export const ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,image/heic,image/heif",
  video: "video/mp4,video/quicktime,video/webm",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv",
};

export const MAX_BYTES: Record<MediaKind, number> = {
  image: 15 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

export function kindOf(file: File): MediaKind | null {
  if (ACCEPT.image.split(",").includes(file.type)) return "image";
  if (ACCEPT.video.split(",").includes(file.type)) return "video";
  if (ACCEPT.document.split(",").includes(file.type)) return "document";
  return null;
}

/** Validate on the client first so the user gets instant, friendly feedback. */
export function checkFile(file: File, accept: MediaKind[]): string | null {
  const kind = kindOf(file);
  if (!kind || !accept.includes(kind)) {
    const names = accept.map((a) => (a === "image" ? "images" : a === "video" ? "videos" : "documents")).join(" or ");
    return `“${file.name}” isn't a supported file. Please choose ${names}.`;
  }
  if (file.size > MAX_BYTES[kind]) {
    return `“${file.name}” is too large (max ${Math.round(MAX_BYTES[kind] / 1024 / 1024)} MB for ${kind}s).`;
  }
  return null;
}

function imageSize(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return Promise.resolve({});
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function xhr(url: string, form: FormData, onProgress?: (p: number) => void): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("POST", url);
    req.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    req.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(req.responseText);
      } catch {}
      if (req.status >= 200 && req.status < 300) resolve(body);
      else reject(new ApiError(String((body.error as { message?: string })?.message ?? body.error ?? "Upload failed"), req.status, body));
    };
    req.onerror = () => reject(new ApiError("Upload failed — check your connection and try again.", 0, {}));
    req.send(form);
  });
}

let providerCache: Promise<"local" | "cloudinary"> | null = null;
function provider() {
  providerCache ??= api<{ provider: "local" | "cloudinary" }>("/api/studio/media?kind=document")
    .then((r) => r.provider)
    .catch((e) => {
      providerCache = null;
      throw e;
    });
  return providerCache;
}

export async function uploadFile(file: File, folder: string, onProgress?: (p: number) => void): Promise<MediaItem> {
  const dims = await imageSize(file);
  if ((await provider()) === "cloudinary") {
    const sig = await api<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>(
      "/api/studio/media/sign",
      { method: "POST", body: JSON.stringify({ folder }) },
    );
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);
    const result = await xhr(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, form, onProgress);
    const { media } = await api<{ media: MediaItem }>("/api/studio/media", {
      method: "POST",
      body: JSON.stringify({ result, name: file.name, mime: file.type, folder }),
    });
    return media;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  if (dims.width) form.append("width", String(dims.width));
  if (dims.height) form.append("height", String(dims.height));
  const body = await xhr("/api/studio/media/upload", form, onProgress);
  return body.media as MediaItem;
}
