import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * Deployment health check. Reports which required settings are present (never their values)
 * and whether the database is reachable, with a plain-language hint when it isn't.
 */
export async function GET() {
  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB: !!process.env.MONGODB_DB,
    AUTH_SECRET: !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    CLOUDINARY: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  };

  let database: { ok: boolean; hint?: string } = { ok: false, hint: "MONGODB_URI is not set in this environment." };
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    try {
      await client.connect();
      await client.db(process.env.MONGODB_DB || "brand_hub").command({ ping: 1 });
      database = { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      database = {
        ok: false,
        hint: /auth|bad auth|authentication/i.test(msg)
          ? "Wrong database username or password in MONGODB_URI."
          : /querySrv|ENOTFOUND|EAI_AGAIN/i.test(msg)
            ? "The database host in MONGODB_URI could not be found — check the connection string."
            : /Server selection timed out|ETIMEDOUT|ECONNREFUSED|whitelist|IP/i.test(msg)
              ? "Can't reach MongoDB Atlas. In Atlas → Network Access, allow 0.0.0.0/0 (Vercel has no fixed IPs)."
              : "Database connection failed. Check MONGODB_URI and Atlas Network Access.",
      };
    } finally {
      await client.close().catch(() => {});
    }
  }

  const ok = database.ok && env.MONGODB_URI && env.AUTH_SECRET;
  return Response.json({ ok, env, database }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
