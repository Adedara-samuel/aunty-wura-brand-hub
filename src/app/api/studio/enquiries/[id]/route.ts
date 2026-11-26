import { ObjectId } from "mongodb";
import { getDb, type EnquiryDoc } from "@/lib/server/db";
import { HttpError, json, readJson, studio } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

async function oid(params: Ctx["params"]) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Not found");
  return new ObjectId(id);
}

export const PATCH = studio<Ctx>(async (req, { params }) => {
  const _id = await oid(params);
  const { status } = await readJson<{ status?: string }>(req);
  if (!status || !["new", "read", "archived"].includes(status)) throw new HttpError(400, "Invalid status");
  const res = await (await getDb()).collection<EnquiryDoc>("enquiries").updateOne({ _id }, { $set: { status: status as EnquiryDoc["status"] } });
  if (res.matchedCount === 0) throw new HttpError(404, "Not found");
  return json({ ok: true });
});

export const DELETE = studio<Ctx>(async (_req, { params }) => {
  const _id = await oid(params);
  await (await getDb()).collection<EnquiryDoc>("enquiries").deleteOne({ _id });
  return json({ ok: true });
});
