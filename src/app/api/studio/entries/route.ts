import { isContentTypeId } from "@/lib/content/definitions";
import { createEntry, listEntries } from "@/lib/server/entries";
import { HttpError, json, readJson, studio } from "@/lib/server/http";

export const GET = studio(async (req) => {
  const type = new URL(req.url).searchParams.get("type");
  if (type && !isContentTypeId(type)) throw new HttpError(400, "Unknown content type");
  return json({ entries: await listEntries(type && isContentTypeId(type) ? type : undefined) });
});

export const POST = studio(async (req) => {
  const body = await readJson<{ type?: string; data?: unknown }>(req);
  if (!body.type || !isContentTypeId(body.type)) throw new HttpError(400, "Unknown content type");
  const entry = await createEntry(body.type, body.data ?? {});
  return json({ entry }, { status: 201 });
});
