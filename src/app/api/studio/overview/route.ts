import { buildProgress } from "@/lib/content/completion";
import { getDb, type EnquiryDoc, type SubmissionDoc } from "@/lib/server/db";
import { listEntries } from "@/lib/server/entries";
import { json, studio } from "@/lib/server/http";
import { storageProvider } from "@/lib/server/media";

export const GET = studio(async () => {
  const db = await getDb();
  const [entries, newEnquiries, lastSubmission, mediaCount] = await Promise.all([
    listEntries(),
    db.collection<EnquiryDoc>("enquiries").countDocuments({ status: "new" }),
    db.collection<SubmissionDoc>("submissions").find({}, { projection: { snapshot: 0 } }).sort({ createdAt: -1 }).limit(1).next(),
    db.collection("media").countDocuments(),
  ]);
  const progress = buildProgress(entries);
  const unpublishedChanges = entries.filter((e) => e.hasUnpublishedChanges || (!e.published && e.type !== "settings")).length;
  return json({
    progress,
    newEnquiries,
    mediaCount,
    storage: storageProvider(),
    unpublishedChanges,
    lastSubmission: lastSubmission
      ? { id: lastSubmission._id.toHexString(), createdAt: lastSubmission.createdAt.toISOString(), percent: lastSubmission.percent }
      : null,
  });
});
