import { json, readJson, studio } from "@/lib/server/http";
import { signCloudinaryUpload } from "@/lib/server/media";

export const POST = studio(async (req) => {
  const body = await readJson<{ folder?: string }>(req).catch(() => ({}) as { folder?: string });
  const folder = String(body.folder ?? "").replace(/[^\w-]/g, "").slice(0, 60);
  return json(signCloudinaryUpload(folder || undefined));
});
