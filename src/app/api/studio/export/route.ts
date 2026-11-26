import { buildReport, reportToMarkdown } from "@/lib/content/report";
import { listEntries } from "@/lib/server/entries";
import { HttpError, studio } from "@/lib/server/http";
import { renderContentPackPdf } from "@/lib/server/pdf";
import { buildSiteContent } from "@/lib/server/site";
import { brandName } from "@/lib/site-nav";
import { slugify } from "@/lib/utils";

export const maxDuration = 60;

/** Export all prepared content (drafts included) as PDF, Markdown or JSON. */
export const GET = studio(async (req) => {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const entries = await listEntries();
  const report = buildReport(entries, origin);
  const title = brandName(buildSiteContent(entries, true)) || "Website content";
  const date = new Date().toISOString().slice(0, 10);
  const base = `${slugify(title)}-content-${date}`;

  const attachment = (body: BodyInit, type: string, ext: string) =>
    new Response(body, {
      headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${base}.${ext}"`, "Cache-Control": "no-store" },
    });

  switch (format) {
    case "md":
      return attachment(reportToMarkdown(report, title), "text/markdown; charset=utf-8", "md");
    case "json":
      return attachment(
        JSON.stringify({ report, entries: entries.map(({ id, type, data, published, order, updatedAt, publishedAt }) => ({ id, type, order, data, published, updatedAt, publishedAt })) }, null, 2),
        "application/json; charset=utf-8",
        "json",
      );
    case "pdf":
      return attachment(new Uint8Array(await renderContentPackPdf(report, title)), "application/pdf", "pdf");
    default:
      throw new HttpError(400, "Unknown export format");
  }
});
