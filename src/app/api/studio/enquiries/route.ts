import { getDb, type EnquiryDoc } from "@/lib/server/db";
import { json, studio } from "@/lib/server/http";

export const GET = studio(async (req) => {
  const status = new URL(req.url).searchParams.get("status");
  const filter = status && ["new", "read", "archived"].includes(status) ? { status: status as EnquiryDoc["status"] } : {};
  const docs = await (await getDb()).collection<EnquiryDoc>("enquiries").find(filter).sort({ createdAt: -1 }).limit(500).toArray();
  return json({
    enquiries: docs.map(({ _id, createdAt, ...rest }) => {
      delete rest.meta; // IP / user agent stay server-side
      return { id: _id.toHexString(), createdAt: createdAt.toISOString(), ...rest };
    }),
  });
});
