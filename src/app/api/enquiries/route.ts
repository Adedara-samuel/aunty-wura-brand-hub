import { ObjectId } from "mongodb";
import { getDb, type EnquiryDoc } from "@/lib/server/db";
import { clientIp, handle, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";
import { enquirySchema } from "@/lib/enquiry-schema";

/** Public endpoint for the contact page enquiry forms. */
export const POST = handle(async (req) => {
  const ip = clientIp(req);
  rateLimit(`enquiry:${ip}`, 5, 10 * 60 * 1000);
  const parsed = enquirySchema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0]?.message ?? "Please check the form");
  const { website, ...data } = parsed.data;
  if (website) return json({ ok: true }); // honeypot tripped — silently accept

  const doc: EnquiryDoc = {
    _id: new ObjectId(),
    ...data,
    status: "new",
    createdAt: new Date(),
    meta: { ip, userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? undefined },
  };
  await (await getDb()).collection<EnquiryDoc>("enquiries").insertOne(doc);

  const kindLabel = { business: "Business enquiry", collaboration: "Collaboration enquiry", general: "General enquiry" }[data.kind];
  await notify(
    `New ${kindLabel.toLowerCase()} from ${data.name}`,
    {
      Type: kindLabel,
      Name: data.name,
      Email: data.email,
      Phone: data.phone,
      Organisation: data.organisation,
      Service: data.service,
      Budget: data.budget,
      Timeline: data.timeline,
      Subject: data.subject,
      Message: data.message,
    },
    data.email,
  );
  return json({ ok: true }, { status: 201 });
});
