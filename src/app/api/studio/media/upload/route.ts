import { HttpError, json, studio } from "@/lib/server/http";
import { saveLocalUpload, storageProvider } from "@/lib/server/media";

export const maxDuration = 60;

/** Local-disk upload (used when Cloudinary is not configured). */
export const POST = studio(async (req) => {
  if (storageProvider() !== "local") {
    throw new HttpError(400, "Uploads go directly to Cloudinary on this site. Please refresh the page and try again.");
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "The upload could not be read. Please try again.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file was received");
  const num = (k: string) => {
    const v = Number(form.get(k));
    return Number.isFinite(v) && v > 0 ? Math.round(v) : undefined;
  };
  const folder = String(form.get("folder") ?? "").replace(/[^\w-]/g, "").slice(0, 60) || undefined;
  const media = await saveLocalUpload(file, { folder, width: num("width"), height: num("height") });
  return json({ media }, { status: 201 });
});
