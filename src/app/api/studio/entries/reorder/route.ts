import { z } from "zod";
import { isContentTypeId } from "@/lib/content/definitions";
import { reorderEntries } from "@/lib/server/entries";
import { HttpError, json, readJson, studio } from "@/lib/server/http";

const schema = z.object({ type: z.string(), ids: z.array(z.string()).max(500) });

export const POST = studio(async (req) => {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success || !isContentTypeId(parsed.data.type)) throw new HttpError(400, "Invalid request");
  await reorderEntries(parsed.data.type, parsed.data.ids);
  return json({ ok: true });
});
