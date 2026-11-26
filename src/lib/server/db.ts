import "server-only";
import { MongoClient, type Db, type Document, type ObjectId } from "mongodb";

/*
 * MongoDB connection (re-used across hot reloads in development and across invocations
 * in serverless environments).
 */

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexes?: Promise<void>;
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  }
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, maxPoolSize: 10 });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || "brand_hub");
  if (!globalForMongo._mongoIndexes) {
    globalForMongo._mongoIndexes = ensureIndexes(db).catch((err) => {
      globalForMongo._mongoIndexes = undefined;
      console.error("Failed to create indexes", err);
    });
  }
  await globalForMongo._mongoIndexes;
  return db;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("entries").createIndexes([
      { key: { type: 1, order: 1 } },
      { key: { type: 1, slug: 1 } },
      { key: { type: 1, publishedSlug: 1 } },
    ]),
    db.collection("media").createIndexes([{ key: { createdAt: -1 } }, { key: { key: 1 }, unique: true, sparse: true }]),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("enquiries").createIndex({ createdAt: -1 }),
    db.collection("submissions").createIndex({ createdAt: -1 }),
  ]);
}

/* -------------------------------------------------------------------------- */
/*  Document shapes                                                           */
/* -------------------------------------------------------------------------- */

export interface EntryDoc extends Document {
  _id: ObjectId;
  type: string;
  data: Record<string, unknown>;
  published: Record<string, unknown> | null;
  slug: string;
  publishedSlug: string | null;
  order: number;
  hasUnpublishedChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface MediaDoc extends Document {
  _id: ObjectId;
  provider: "local" | "cloudinary";
  key: string;
  url: string;
  publicId?: string;
  resourceType?: string;
  kind: "image" | "video" | "document";
  mime: string;
  size: number;
  width?: number;
  height?: number;
  name: string;
  alt?: string;
  folder?: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface UserDoc extends Document {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface EnquiryDoc extends Document {
  _id: ObjectId;
  kind: "business" | "collaboration" | "general";
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  subject?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  message: string;
  status: "new" | "read" | "archived";
  createdAt: Date;
  meta?: { ip?: string; userAgent?: string };
}

export interface SubmissionDoc extends Document {
  _id: ObjectId;
  note: string;
  submittedBy: string;
  percent: number;
  completed: number;
  totalSections: number;
  missingRequired: number;
  snapshot: unknown;
  createdAt: Date;
}
