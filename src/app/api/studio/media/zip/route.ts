import JSZip from "jszip";
import { getDb, type MediaDoc } from "@/lib/server/db";
import { errorResponse, HttpError } from "@/lib/server/http";
import { getSession } from "@/lib/server/auth";
import { extensionFor, readMediaBytes } from "@/lib/server/media";

export const maxDuration = 60;

/** Download every uploaded file as one ZIP, organised by section. */
export async function GET() {
  try {
    if (!(await getSession())) throw new HttpError(401, "Please sign in to continue");
    const docs = await (await getDb()).collection<MediaDoc>("media").find({}).sort({ createdAt: 1 }).toArray();
    if (docs.length === 0) throw new HttpError(404, "There are no uploaded files yet");
    const zip = new JSZip();
    const used = new Set<string>();
    const missing: string[] = [];
    for (const doc of docs) {
      const bytes = await readMediaBytes(doc);
      const folder = doc.folder || "general";
      const base = doc.name.replace(/\.[^.]+$/, "") || doc._id.toHexString();
      let filename = `${folder}/${base}.${extensionFor(doc.mime)}`;
      let n = 2;
      while (used.has(filename)) filename = `${folder}/${base}-${n++}.${extensionFor(doc.mime)}`;
      used.add(filename);
      if (bytes) zip.file(filename, bytes);
      else missing.push(`${filename} — ${doc.url}`);
    }
    if (missing.length) zip.file("_files-that-could-not-be-included.txt", missing.join("\n"));
    const buffer = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
    const date = new Date().toISOString().slice(0, 10);
    return new Response(buffer as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="website-media-${date}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
