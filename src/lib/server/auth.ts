import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "@/lib/auth-token";
import { getDb, type UserDoc } from "./db";

export type Session = SessionPayload;

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function users() {
  return (await getDb()).collection<UserDoc>("users");
}

let dummyHash: string | undefined;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

/**
 * Verify credentials. If no Studio account exists yet, the ADMIN_EMAIL / ADMIN_PASSWORD
 * environment variables are used once to create the first account.
 */
export async function authenticate(email: string, password: string): Promise<Session | null> {
  const col = await users();
  const normalised = email.trim().toLowerCase();

  if ((await col.estimatedDocumentCount()) === 0) {
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envEmail && envPassword && normalised === envEmail && password === envPassword) {
      const doc = {
        _id: new ObjectId(),
        email: envEmail,
        name: process.env.ADMIN_NAME || "Studio Owner",
        passwordHash: await hashPassword(envPassword),
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return { sub: doc._id.toHexString(), email: doc.email, name: doc.name };
    }
    return null;
  }

  const user = await col.findOne({ email: normalised });
  // Always run a bcrypt comparison to keep timing consistent.
  dummyHash ??= await bcrypt.hash("timing-placeholder", 12);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !ok) return null;
  await col.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { sub: user._id.toHexString(), email: user.email, name: user.name };
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  const col = await users();
  const user = await col.findOne({ _id: new ObjectId(userId) });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return false;
  await col.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(next) } });
  return true;
}

export async function listUsers() {
  const col = await users();
  return (await col.find({}, { projection: { passwordHash: 0 } }).toArray()).map((u) => ({
    id: u._id.toHexString(),
    email: u.email,
    name: u.name,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  }));
}
