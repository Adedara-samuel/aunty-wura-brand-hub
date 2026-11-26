#!/usr/bin/env node
/**
 * Create or reset a Content Studio account.
 *
 *   npm run user:create -- you@example.com "a long password" "Display Name"
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local (via `node --env-file`).
 * Running it again with an existing email resets that account's password.
 */
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const [email, password, ...nameParts] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: npm run user:create -- <email> <password> ["Display Name"]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local).");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || "brand_hub").collection("users");
  await users.createIndex({ email: 1 }, { unique: true });
  const normalised = email.trim().toLowerCase();
  const res = await users.updateOne(
    { email: normalised },
    {
      $set: { passwordHash: await bcrypt.hash(password, 12), name: nameParts.join(" ") || normalised.split("@")[0] },
      $setOnInsert: { email: normalised, createdAt: new Date() },
    },
    { upsert: true },
  );
  console.log(res.upsertedCount ? `Created Studio account for ${normalised}` : `Updated password for ${normalised}`);
} finally {
  await client.close();
}
