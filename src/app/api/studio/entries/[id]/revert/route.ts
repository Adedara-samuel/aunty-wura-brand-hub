import { revertEntry } from "@/lib/server/entries";
import { json, studio } from "@/lib/server/http";

export const POST = studio<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { id } = await params;
  return json({ entry: await revertEntry(id) });
});
