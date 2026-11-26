import { deleteEntry, getEntry, updateEntry } from "@/lib/server/entries";
import { json, readJson, studio } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = studio<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  return json({ entry: await getEntry(id) });
});

export const PATCH = studio<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await readJson<{ data?: unknown }>(req);
  return json({ entry: await updateEntry(id, body.data ?? {}) });
});

export const DELETE = studio<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  await deleteEntry(id);
  return json({ ok: true });
});
