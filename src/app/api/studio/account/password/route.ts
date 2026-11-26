import { z } from "zod";
import { changePassword } from "@/lib/server/auth";
import { HttpError, json, readJson, studio } from "@/lib/server/http";

const schema = z.object({
  current: z.string().min(1),
  next: z.string().min(10, "Use at least 10 characters").max(200),
});

export const POST = studio(async (req, _ctx, session) => {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid password");
  const ok = await changePassword(session.sub, parsed.data.current, parsed.data.next);
  if (!ok) throw new HttpError(400, "Your current password is not correct");
  return json({ ok: true });
});
