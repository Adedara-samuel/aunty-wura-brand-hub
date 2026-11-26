import { HttpError, json, readJson, studio } from "@/lib/server/http";
import { deleteMedia, mediaUsage, updateMediaAlt } from "@/lib/server/media";

type Ctx = { params: Promise<{ id: string }> };

/** Where is this file used? */
export const GET = studio<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  return json({ usage: await mediaUsage(id) });
});

export const PATCH = studio<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await readJson<{ alt?: string }>(req);
  if (typeof body.alt !== "string") throw new HttpError(400, "Nothing to update");
  return json({ media: await updateMediaAlt(id, body.alt) });
});

export const DELETE = studio<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const force = new URL(req.url).searchParams.get("force") === "1";
  const usage = await mediaUsage(id);
  if (usage.length > 0 && !force) {
    throw new HttpError(409, "This file is still used in your content. Remove it from those sections first, or delete anyway.", { usage });
  }
  await deleteMedia(id);
  return json({ ok: true });
});
