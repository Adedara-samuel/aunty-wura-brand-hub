import { getSession } from "@/lib/server/auth";
import { errorResponse, HttpError } from "@/lib/server/http";
import { readLocalMedia } from "@/lib/server/media";

/**
 * Serves locally stored uploads. Files are private (Studio users only) until they are
 * used by published content.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params;
    const { doc, data } = await readLocalMedia(key.join("/"));
    if (!doc.isPublic && !(await getSession())) throw new HttpError(404, "Not found");

    const url = new URL(req.url);
    const headers: Record<string, string> = {
      "Content-Type": doc.mime,
      "Content-Length": String(data.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": doc.isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
    };
    if (doc.mime === "image/svg+xml") {
      // SVGs can carry scripts — never let them execute when opened directly.
      headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
    }
    if (url.searchParams.has("download") || doc.kind === "document") {
      headers["Content-Disposition"] = `${url.searchParams.has("download") ? "attachment" : "inline"}; filename="${encodeURIComponent(doc.name)}"`;
    }
    return new Response(new Uint8Array(data), { headers });
  } catch (err) {
    return errorResponse(err);
  }
}
