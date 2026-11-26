import "server-only";

/**
 * Optional email notifications via Resend (https://resend.com).
 * When RESEND_API_KEY / NOTIFY_FROM_EMAIL / NOTIFY_TO_EMAIL are not configured this is a no-op;
 * everything is still stored in the database and visible in the Studio.
 */
export async function notify(subject: string, lines: Record<string, string | undefined>, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL;
  const to = process.env.NOTIFY_TO_EMAIL;
  if (!key || !from || !to) return { sent: false as const };

  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const rows = Object.entries(lines)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#6e625a;vertical-align:top">${escape(k)}</td><td style="padding:6px 12px;white-space:pre-wrap">${escape(v!)}</td></tr>`,
    )
    .join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject,
        reply_to: replyTo,
        html: `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#1f1a17"><h2 style="font-weight:600">${escape(subject)}</h2><table>${rows}</table></div>`,
      }),
    });
    if (!res.ok) console.warn("Notification email failed", res.status, await res.text());
    return { sent: res.ok };
  } catch (err) {
    console.warn("Notification email failed", err);
    return { sent: false as const };
  }
}
