import { getSession } from "@/lib/server/auth";
import { listEntries } from "@/lib/server/entries";
import { errorResponse } from "@/lib/server/http";
import { renderRateCardPdf } from "@/lib/server/pdf";
import { buildSiteContent } from "@/lib/server/site";
import { brandName } from "@/lib/site-nav";
import { slugify } from "@/lib/utils";

export const maxDuration = 30;

/** Downloadable rate card PDF. `?draft=1` renders unpublished drafts for signed-in Studio users. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const draft = url.searchParams.get("draft") === "1" && !!(await getSession());
    const site = buildSiteContent(await listEntries(), draft);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
    const pdf = await renderRateCardPdf(site, siteUrl);
    const name = slugify(`${brandName(site) || "rate"}-rate-card${draft ? "-draft" : ""}`);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${url.searchParams.has("download") ? "attachment" : "inline"}; filename="${name}.pdf"`,
        "Cache-Control": draft ? "private, no-store" : "public, max-age=60",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
