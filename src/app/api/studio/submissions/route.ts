import { ObjectId } from "mongodb";
import { z } from "zod";
import { buildReport } from "@/lib/content/report";
import { getDb, type SubmissionDoc } from "@/lib/server/db";
import { listEntries } from "@/lib/server/entries";
import { HttpError, json, readJson, studio } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

export const GET = studio(async () => {
  const docs = await (await getDb())
    .collection<SubmissionDoc>("submissions")
    .find({}, { projection: { snapshot: 0 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return json({
    submissions: docs.map((d) => ({
      id: d._id.toHexString(),
      note: d.note,
      submittedBy: d.submittedBy,
      percent: d.percent,
      completed: d.completed,
      totalSections: d.totalSections,
      missingRequired: d.missingRequired,
      createdAt: d.createdAt.toISOString(),
    })),
  });
});

const schema = z.object({ note: z.string().max(4000).optional().default("") });

/** Submit the prepared content for review — stores a full snapshot and notifies the developer. */
export const POST = studio(async (req, _ctx, session) => {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, "Invalid note");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const entries = await listEntries();
  const report = buildReport(entries, origin);
  const p = report.progress;
  const doc: SubmissionDoc = {
    _id: new ObjectId(),
    note: parsed.data.note,
    submittedBy: session.name || session.email,
    percent: p.percent,
    completed: p.completed,
    totalSections: p.totalSections,
    missingRequired: p.missingRequired,
    snapshot: { entries, report },
    createdAt: new Date(),
  };
  await (await getDb()).collection<SubmissionDoc>("submissions").insertOne(doc);
  const mail = await notify(`Website content submitted for review (${p.percent}% complete)`, {
    "Submitted by": doc.submittedBy,
    Progress: `${p.percent}% · ${p.completed}/${p.totalSections} sections complete · ${p.missingRequired} required details missing`,
    Note: doc.note,
    Review: `${origin}/content-studio/review`,
  });
  return json({ ok: true, id: doc._id.toHexString(), emailed: mail.sent }, { status: 201 });
});
