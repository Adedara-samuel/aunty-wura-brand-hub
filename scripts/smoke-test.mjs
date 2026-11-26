#!/usr/bin/env node
/**
 * End-to-end smoke test against a running server.
 *
 *   BASE_URL=http://localhost:3100 ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/smoke-test.mjs
 *
 * ⚠️  It creates, publishes and deletes content. Point it at a server that uses a TEST database
 *     (e.g. start the app with MONGODB_DB=brand_hub_test).
 */
import { deflateSync } from "node:zlib";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  process.exit(1);
}

let cookies = {};
let passed = 0;
let failed = 0;

function cookieHeader(jar = cookies) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}
function storeCookies(res, jar = cookies) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    const k = pair.slice(0, i);
    const v = pair.slice(i + 1);
    if (/expires=Thu, 01 Jan 1970/i.test(c) || v === "") delete jar[k];
    else jar[k] = v;
  }
}
async function req(path, { method = "GET", body, auth = true, raw, jar } = {}) {
  const headers = {};
  const useJar = jar ?? cookies;
  if (auth) headers.cookie = cookieHeader(useJar);
  let payload = body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
  if (auth) storeCookies(res, useJar);
  if (raw) return res;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, headers: res.headers };
}
function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${extra}`);
  }
}

/** Minimal valid PNG (solid colour) so uploads can be tested without fixtures. */
function png(w = 1600, h = 1200) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 0xc8)]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function main() {
  console.log(`\nSmoke test → ${BASE}\n`);

  console.log("Public site");
  for (const p of ["/", "/about", "/portfolio", "/services", "/rate-card", "/classes", "/templates", "/fragrance", "/contact"]) {
    const r = await req(p, { auth: false });
    check(`GET ${p} → 200`, r.status === 200, `(got ${r.status})`);
  }
  check("unknown page → 404", (await req("/does-not-exist", { auth: false })).status === 404);

  console.log("\nProtection");
  const gate = await req("/content-studio", { auth: false });
  check("Studio redirects to login when signed out", gate.status === 307 && /\/content-studio\/login/.test(gate.headers.get("location") ?? ""));
  check("Studio API returns 401 when signed out", (await req("/api/studio/entries", { auth: false })).status === 401);
  check("Upload API returns 401 when signed out", (await req("/api/studio/media/upload", { method: "POST", auth: false, body: new FormData() })).status === 401);
  check("Wrong password rejected", (await req("/api/auth/login", { method: "POST", auth: false, body: { email: EMAIL, password: "wrong-password" } })).status === 401);

  console.log("\nSign in");
  const login = await req("/api/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } });
  check("Login succeeds", login.status === 200 && !!cookies.studio_session, JSON.stringify(login.json));
  check("Studio overview page loads", (await req("/content-studio")).status === 200);
  for (const p of ["/content-studio/personal", "/content-studio/fragrance", "/content-studio/portfolio/new", "/content-studio/media", "/content-studio/enquiries", "/content-studio/review", "/content-studio/settings", "/content-studio/frame"]) {
    check(`GET ${p} → 200`, (await req(p)).status === 200);
  }
  check("Unknown studio module → 404", (await req("/content-studio/not-a-module")).status === 404);

  console.log("\nProgress tracking (empty)");
  let ov = await req("/api/studio/overview");
  check("Overview returns 10 sections", ov.json?.progress?.totalSections === 10);
  const startPercent = ov.json?.progress?.percent;

  console.log("\nUploads");
  const fd = new FormData();
  fd.append("file", new Blob([png()], { type: "image/png" }), "portrait.png");
  fd.append("folder", "profile");
  fd.append("width", "1600");
  fd.append("height", "1200");
  const up = await req("/api/studio/media/upload", { method: "POST", body: fd });
  check("Image upload → 201", up.status === 201, JSON.stringify(up.json));
  const media = up.json?.media;
  const bad = new FormData();
  bad.append("file", new Blob(["#!/bin/sh"], { type: "application/x-sh" }), "evil.sh");
  check("Unsupported file type rejected (415)", (await req("/api/studio/media/upload", { method: "POST", body: bad })).status === 415);
  check("Private media hidden from the public", (await req(media.url, { auth: false })).status === 404);
  check("Private media visible to Studio user", (await req(media.url)).status === 200);

  console.log("\nSingleton: personal information");
  const draft = await req("/api/studio/entries", { method: "POST", body: { type: "profile", data: { fullName: "Test Person" } } });
  check("Draft saved with partial data", draft.status === 201);
  const profileId = draft.json.entry.id;
  const pub1 = await req(`/api/studio/entries/${profileId}/publish`, { method: "POST" });
  check("Publishing with missing required fields → 422", pub1.status === 422 && pub1.json?.missing?.length > 0);
  const badUrl = await req(`/api/studio/entries/${profileId}`, { method: "PATCH", body: { data: { fullName: "Test Person", photo: { id: "x", url: "y", kind: "image", name: "n" }, professionalTitle: "Title", tagline: "Headline" } } });
  check("Draft with valid data saves", badUrl.status === 200);
  const upd = await req(`/api/studio/entries/${profileId}`, { method: "PATCH", body: { data: { fullName: "Test Person", professionalTitle: "Smoke Tester", tagline: "SMOKE-HEADLINE-PUBLISHED", photo: media } } });
  check("Second save upserts the same singleton", upd.status === 200 && upd.json.entry.id === profileId);
  const again = await req("/api/studio/entries", { method: "POST", body: { type: "profile", data: { fullName: "Test Person", professionalTitle: "Smoke Tester", tagline: "SMOKE-HEADLINE-PUBLISHED", photo: media } } });
  check("Singleton POST does not create duplicates", again.json?.entry?.id === profileId);
  const pub2 = await req(`/api/studio/entries/${profileId}/publish`, { method: "POST" });
  check("Publish succeeds once complete", pub2.status === 200 && !!pub2.json.entry.published);
  check("Published headline appears on homepage", (await req("/", { auth: false })).text.includes("SMOKE-HEADLINE-PUBLISHED"));
  check("Media used by published content is now public", (await req(media.url, { auth: false })).status === 200);

  console.log("\nDrafts stay private");
  await req(`/api/studio/entries/${profileId}`, { method: "PATCH", body: { data: { fullName: "Test Person", professionalTitle: "Smoke Tester", tagline: "SMOKE-DRAFT-ONLY", photo: media } } });
  const home = await req("/", { auth: false });
  check("Unpublished draft NOT shown to visitors", !home.text.includes("SMOKE-DRAFT-ONLY") && home.text.includes("SMOKE-HEADLINE-PUBLISHED"));
  const prev = await req("/api/studio/preview?path=/", { raw: true });
  storeCookies(prev);
  check("Draft preview mode enabled for Studio user", prev.status === 307 && !!cookies.__prerender_bypass);
  check("Draft preview shows unpublished draft", (await req("/")).text.includes("SMOKE-DRAFT-ONLY"));
  const leaked = await req("/", { auth: true, jar: { __prerender_bypass: cookies.__prerender_bypass } });
  check("Preview cookie alone (no session) does NOT reveal drafts", !leaked.text.includes("SMOKE-DRAFT-ONLY"));
  await req("/api/preview/exit", { raw: true }).then(storeCookies);
  const rev = await req(`/api/studio/entries/${profileId}/revert`, { method: "POST" });
  check("Discard changes restores published version", rev.json?.entry?.data?.tagline === "SMOKE-HEADLINE-PUBLISHED");

  console.log("\nCollections: portfolio");
  const p1 = await req("/api/studio/entries", { method: "POST", body: { type: "portfolio", data: { title: "Smoke Project One", category: "Campaign", summary: "Summary one", coverImage: media } } });
  const p2 = await req("/api/studio/entries", { method: "POST", body: { type: "portfolio", data: { title: "Smoke Project Two" } } });
  check("Two portfolio entries created", p1.status === 201 && p2.status === 201);
  check("Invalid link rejected on save (422)", (await req(`/api/studio/entries/${p2.json.entry.id}`, { method: "PATCH", body: { data: { title: "x", videoLinks: [], links: [{ label: "x", url: "not a url" }] } } })).status === 422);
  const pp = await req(`/api/studio/entries/${p1.json.entry.id}/publish`, { method: "POST" });
  check("Complete project publishes", pp.status === 200);
  const slug = pp.json.entry.publishedSlug;
  const detail = await req(`/portfolio/${slug}`, { auth: false });
  check("Project detail page renders", detail.status === 200 && detail.text.includes("Smoke Project One"));
  check("Unpublished project is not public", !(await req("/portfolio", { auth: false })).text.includes("Smoke Project Two"));
  const dup = await req(`/api/studio/entries/${p1.json.entry.id}/duplicate`, { method: "POST" });
  check("Duplicate creates a draft copy", dup.status === 201 && dup.json.entry.data.title.includes("(copy)") && !dup.json.entry.published);
  const reorder = await req("/api/studio/entries/reorder", { method: "POST", body: { type: "portfolio", ids: [p2.json.entry.id, p1.json.entry.id, dup.json.entry.id] } });
  check("Reorder", reorder.status === 200);
  const list = await req("/api/studio/entries?type=portfolio");
  check("Order persisted", list.json.entries.sort((a, b) => a.order - b.order)[0].id === p2.json.entry.id);
  check("Delete entry", (await req(`/api/studio/entries/${dup.json.entry.id}`, { method: "DELETE" })).status === 200);
  check("Deleted entry is gone (404)", (await req(`/api/studio/entries/${dup.json.entry.id}`)).status === 404);
  const unpub = await req(`/api/studio/entries/${p1.json.entry.id}/publish`, { method: "DELETE" });
  check("Unpublish", unpub.status === 200 && unpub.json.entry.published === null);
  check("Unpublished detail page → 404", (await req(`/portfolio/${slug}`, { auth: false })).status === 404);

  console.log("\nServices, rate card & PDFs");
  const s = await req("/api/studio/entries", { method: "POST", body: { type: "service", data: { name: "Smoke Service", category: "Content", summary: "Summary", deliveryTimeline: "1 week", includes: ["One thing"], price: { mode: "from", amount: 50000, currency: "NGN" } } } });
  check("Service publishes", (await req(`/api/studio/entries/${s.json.entry.id}/publish`, { method: "POST" })).status === 200);
  check("Services page lists published service", (await req("/services", { auth: false })).text.includes("Smoke Service"));
  const pdf = await req("/api/rate-card", { auth: false, raw: true });
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  check("Rate card PDF downloads", pdf.status === 200 && pdf.headers.get("content-type") === "application/pdf" && pdfBytes.subarray(0, 4).toString() === "%PDF");

  console.log("\nClasses, products & fragrance");
  const cls = await req("/api/studio/entries", { method: "POST", body: { type: "class", data: { title: "Smoke Class", summary: "s", description: "d", audience: "a", objectives: ["o"], duration: "2 weeks", price: { mode: "fixed", amount: 10000, currency: "NGN" }, platform: "selar", purchaseUrl: "https://selar.co/example", banner: media } } });
  const pc = await req(`/api/studio/entries/${cls.json.entry.id}/publish`, { method: "POST" });
  check("Class publishes", pc.status === 200);
  const cpage = await req(`/classes/${pc.json.entry.publishedSlug}`, { auth: false });
  check("Class page links to existing Selar page", cpage.text.includes("https://selar.co/example") && cpage.text.includes("Enrol on Selar"));
  const fr = await req("/api/studio/entries", { method: "POST", body: { type: "fragrance", data: { name: "Smoke Scent", category: "Floral", description: "d", photos: [media], sizes: [{ label: "50ml", price: 25000 }], currency: "NGN", availability: "in_stock" } } });
  const fb = await req("/api/studio/entries", { method: "POST", body: { type: "fragranceBrand", data: { brandName: "Smoke Scents", introduction: "i", whatsappNumber: "+234 800 000 0000", orderingInstructions: "o", deliveryInfo: "d" } } });
  await req(`/api/studio/entries/${fb.json.entry.id}/publish`, { method: "POST" });
  const pf = await req(`/api/studio/entries/${fr.json.entry.id}/publish`, { method: "POST" });
  const fpage = await req(`/fragrance/${pf.json.entry.publishedSlug}`, { auth: false });
  check("Fragrance page has WhatsApp order link", fpage.status === 200 && fpage.text.includes("wa.me/2348000000000"));

  console.log("\nEnquiries");
  check("Invalid enquiry rejected", (await req("/api/enquiries", { method: "POST", auth: false, body: { kind: "general", name: "A", email: "nope", message: "x" } })).status === 422);
  const enq = await req("/api/enquiries", { method: "POST", auth: false, body: { kind: "collaboration", name: "Smoke Brand", email: "brand@example.com", message: "We would love to collaborate on a campaign." } });
  check("Enquiry accepted", enq.status === 201);
  const inbox = await req("/api/studio/enquiries");
  const mine = inbox.json.enquiries.find((e) => e.name === "Smoke Brand");
  check("Enquiry appears in Studio inbox (without IP metadata)", !!mine && mine.meta === undefined);
  check("Mark enquiry read", (await req(`/api/studio/enquiries/${mine.id}`, { method: "PATCH", body: { status: "read" } })).status === 200);
  check("Delete enquiry", (await req(`/api/studio/enquiries/${mine.id}`, { method: "DELETE" })).status === 200);

  console.log("\nProgress, export & submission");
  ov = await req("/api/studio/overview");
  check("Progress increased after adding content", ov.json.progress.percent > startPercent, `(${startPercent} → ${ov.json.progress.percent})`);
  check("Personal Information marked complete", ov.json.progress.modules.find((m) => m.id === "personal").state === "complete");
  check("Portfolio in progress (one incomplete entry)", ov.json.progress.modules.find((m) => m.id === "portfolio").state === "in_progress");
  const md = await req("/api/studio/export?format=md");
  check("Markdown export lists sections & missing details", md.status === 200 && md.text.includes("## 1. Personal Information") && md.text.includes("Missing"));
  const js = await req("/api/studio/export?format=json");
  check("JSON export", js.status === 200 && Array.isArray(js.json.entries));
  const cp = await req("/api/studio/export?format=pdf", { raw: true });
  check("Content pack PDF", cp.status === 200 && cp.headers.get("content-type") === "application/pdf");
  const zip = await req("/api/studio/media/zip", { raw: true });
  const zipBytes = Buffer.from(await zip.arrayBuffer());
  check("Media ZIP download", zip.status === 200 && zipBytes.subarray(0, 2).toString() === "PK");
  const sub = await req("/api/studio/submissions", { method: "POST", body: { note: "Smoke test submission" } });
  check("Submit for review", sub.status === 201);
  check("Submission history", (await req("/api/studio/submissions")).json.submissions.some((x) => x.note === "Smoke test submission"));

  console.log("\nMedia management");
  const inUse = await req(`/api/studio/media/${media.id}`, { method: "DELETE" });
  check("Deleting in-use media asks for confirmation (409)", inUse.status === 409);
  check("Alt text update", (await req(`/api/studio/media/${media.id}`, { method: "PATCH", body: { alt: "Portrait" } })).status === 200);

  console.log("\nSign out");
  await req("/api/auth/logout", { method: "POST" });
  check("Session cleared", (await req("/api/studio/entries")).status === 401);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
