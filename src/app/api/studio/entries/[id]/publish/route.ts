import { publishEntry, unpublishEntry } from "@/lib/server/entries";
import { json, studio } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** Publish the current draft (copies it to the live website). */
export const POST = studio<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  return json({ entry: await publishEntry(id) });
});

/** Unpublish — hide from the live website, keep the draft. */
export const DELETE = studio<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  return json({ entry: await unpublishEntry(id) });
});
