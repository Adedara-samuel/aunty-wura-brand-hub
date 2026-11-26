import "server-only";
import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "no-store", ...init?.headers } });
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return json({ error: err.message, ...err.details }, { status: err.status });
  }
  console.error(err);
  const message =
    err instanceof Error && /MONGODB_URI|ECONNREFUSED|querySrv|Server selection/i.test(err.message)
      ? "The database could not be reached. Please try again in a moment."
      : "Something went wrong on our side. Please try again.";
  return json({ error: message }, { status: 500 });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wrap a public route handler with consistent error handling. */
export function handle<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Wrap a Studio route handler: requires a valid session (defence in depth on top of proxy.ts). */
export function studio<C>(fn: (req: Request, ctx: C, session: Session) => Promise<Response>): Handler<C> {
  return handle(async (req, ctx) => {
    const session = await getSession();
    if (!session) throw new HttpError(401, "Please sign in to continue");
    return fn(req, ctx, session);
  });
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid request body");
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* Simple in-memory rate limiter (per server instance). */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    const mins = Math.ceil((b.reset - now) / 60000);
    throw new HttpError(429, `Too many attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`);
  }
}
