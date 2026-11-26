import { z } from "zod";
import { HttpError, json, readJson, studio } from "@/lib/server/http";
import { listMedia, MEDIA_RULES, registerCloudinaryUpload, storageProvider, type CloudinaryResult } from "@/lib/server/media";
import type { MediaKind } from "@/lib/content/types";

export const GET = studio(async (req) => {
  const kind = new URL(req.url).searchParams.get("kind");
  const valid = kind && ["image", "video", "document"].includes(kind) ? (kind as MediaKind) : undefined;
  return json({
    media: await listMedia(valid),
    provider: storageProvider(),
    rules: Object.fromEntries(Object.entries(MEDIA_RULES).map(([k, v]) => [k, { mimes: v.mimes, maxBytes: v.maxBytes, label: v.label }])),
  });
});

const registerSchema = z.object({
  result: z.object({
    public_id: z.string(),
    version: z.union([z.number(), z.string()]),
    signature: z.string(),
    secure_url: z.string().url(),
    resource_type: z.string(),
    bytes: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),
  }),
  name: z.string().max(300),
  mime: z.string().max(120),
  folder: z.string().max(60).optional(),
});

/** Register a file the browser uploaded directly to Cloudinary (after signature verification). */
export const POST = studio(async (req) => {
  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, "Invalid upload details");
  const { result, name, mime, folder } = parsed.data;
  const media = await registerCloudinaryUpload(result as CloudinaryResult, { name, mime, folder });
  return json({ media }, { status: 201 });
});
