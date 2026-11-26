import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";

/** Turn on draft preview for the signed-in Studio user and open the requested public page. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) redirect("/content-studio/login");
  (await draftMode()).enable();
  const path = new URL(req.url).searchParams.get("path") || "/";
  redirect(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
