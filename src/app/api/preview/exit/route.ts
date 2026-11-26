import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  (await draftMode()).disable();
  const to = new URL(req.url).searchParams.get("to");
  redirect(to && to.startsWith("/") && !to.startsWith("//") ? to : "/");
}
