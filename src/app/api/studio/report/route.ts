import { buildReport } from "@/lib/content/report";
import { listEntries } from "@/lib/server/entries";
import { json, studio } from "@/lib/server/http";

export const GET = studio(async (req) => {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  return json({ report: buildReport(await listEntries(), origin) });
});
