import { z } from "zod";
import { authenticate, setSessionCookie } from "@/lib/server/auth";
import { clientIp, handle, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const POST = handle(async (req) => {
  rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid details");
  const session = await authenticate(parsed.data.email, parsed.data.password);
  if (!session) throw new HttpError(401, "That email and password combination isn't right.");
  await setSessionCookie(session);
  return json({ ok: true, user: { name: session.name, email: session.email } });
});
