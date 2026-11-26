import { draftMode } from "next/headers";
import { clearSessionCookie } from "@/lib/server/auth";
import { handle, json } from "@/lib/server/http";

export const POST = handle(async () => {
  await clearSessionCookie();
  (await draftMode()).disable();
  return json({ ok: true });
});
