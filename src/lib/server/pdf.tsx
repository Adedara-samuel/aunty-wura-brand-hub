import "server-only";
import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ContentReport, ReportValue } from "@/lib/content/report";
import { stateLabel } from "@/lib/content/report";
import type { Price } from "@/lib/content/types";
import { formatPrice } from "@/lib/format";
import type { SiteContent } from "@/lib/site-types";
import { brandName } from "@/lib/site-nav";
import { str, strList } from "@/lib/utils";

/* Built-in PDF fonts only support Windows-1252 characters — map the rest safely. */
const SYMBOLS: Record<string, string> = { "₦": "NGN ", "₵": "GHS ", "→": "->", "✓": "-", "⚠": "!", "️": "" };
function t(input: unknown): string {
  return String(input ?? "")
    .replace(/[₦₵→✓⚠️]/g, (c) => SYMBOLS[c] ?? "")
    .replace(/[^\u0009\u000A\u000D -ÿ–—‘’“”•…€ŒœŠšŸŽžƒˆ˜†‡‰‹›™]/g, "");
}

const C = { ink: "#1f1a17", muted: "#6e625a", line: "#e4dacf", noir: "#15110f", gold: "#c8a46a", pearl: "#f3ece2", bg: "#fffdfa", red: "#b3261e", redBg: "#fbeceb", green: "#2f6b4f" };

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: C.ink, backgroundColor: C.bg, paddingBottom: 56 },
  body: { paddingHorizontal: 44 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, textTransform: "uppercase", color: C.muted, fontFamily: "Helvetica-Bold" },
  display: { fontFamily: "Times-Roman", color: C.ink },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
  hr: { borderBottomWidth: 0.7, borderBottomColor: C.line },
});

/* -------------------------------------------------------------------------- */
/*  Rate card                                                                  */
/* -------------------------------------------------------------------------- */

function RateCardPdf({ site, siteUrl }: { site: SiteContent; siteUrl: string }) {
  const rc = site.rateCard ?? {};
  const name = brandName(site);
  const services = site.services.filter((x) => x.data.showOnRateCard !== false);
  const groups = new Map<string, typeof services>();
  services.forEach((x) => {
    const c = str(x.data.category) || "Services";
    groups.set(c, [...(groups.get(c) ?? []), x]);
  });
  const policies = strList(rc.policies);
  const email = str(site.contact?.businessEmail);
  const wa = str(site.contact?.whatsapp);

  return (
    <Document title={`${name || "Rate"} — ${str(rc.title) || "Rate Card"}`} author={name}>
      <Page size="A4" style={s.page}>
        <View style={{ backgroundColor: C.noir, paddingHorizontal: 44, paddingTop: 48, paddingBottom: 36 }}>
          <Text style={[s.eyebrow, { color: C.gold }]}>{t(name || "Rate card")}</Text>
          <Text style={[s.display, { color: C.pearl, fontSize: 38, marginTop: 8 }]}>{t(str(rc.title) || "Rate Card")}</Text>
          <Text style={{ color: "#b9ad9f", marginTop: 6, fontSize: 9.5 }}>
            {t([str(site.profile?.professionalTitle), str(rc.validity) && `Valid ${str(rc.validity)}`].filter(Boolean).join("  ·  "))}
          </Text>
        </View>
        <View style={[s.body, { paddingTop: 28 }]}>
          {str(rc.intro) ? <Text style={{ fontSize: 10.5, lineHeight: 1.6, marginBottom: 22 }}>{t(rc.intro)}</Text> : null}

          {services.length === 0 && (
            <Text style={{ color: C.muted, marginBottom: 20 }}>Services and prices will appear here once they have been added.</Text>
          )}
          {[...groups.entries()].map(([cat, list]) => (
            <View key={cat} style={{ marginBottom: 18 }} wrap>
              <Text style={[s.eyebrow, { color: "#9a5b3f", marginBottom: 6 }]}>{t(cat)}</Text>
              <View style={{ borderTopWidth: 0.7, borderTopColor: C.line }}>
                {list.map((x) => (
                  <View key={x.id} wrap={false} style={{ flexDirection: "row", paddingVertical: 9, borderBottomWidth: 0.7, borderBottomColor: C.line }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text style={[s.display, { fontSize: 13 }]}>{t(x.data.name)}</Text>
                      {strList(x.data.includes).length > 0 && (
                        <Text style={{ color: C.muted, fontSize: 8.5, marginTop: 3, lineHeight: 1.45 }}>{t(strList(x.data.includes).join("  ·  "))}</Text>
                      )}
                      {str(x.data.deliveryTimeline) && <Text style={{ color: C.muted, fontSize: 8, marginTop: 3 }}>Delivery: {t(x.data.deliveryTimeline)}</Text>}
                    </View>
                    <Text style={[s.display, { fontSize: 13, width: 140, textAlign: "right" }]}>{t(formatPrice(x.data.price as Price))}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={{ flexDirection: "row", gap: 24, marginTop: 8 }} wrap={false}>
            {str(rc.bookingProcess) ? (
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>Booking process</Text>
                <Text style={{ marginTop: 5, lineHeight: 1.55, fontSize: 9.5 }}>{t(rc.bookingProcess)}</Text>
              </View>
            ) : null}
            {str(rc.paymentTerms) ? (
              <View style={{ flex: 1 }}>
                <Text style={s.eyebrow}>Payment terms</Text>
                <Text style={{ marginTop: 5, lineHeight: 1.55, fontSize: 9.5 }}>{t(rc.paymentTerms)}</Text>
              </View>
            ) : null}
          </View>
          {policies.length > 0 && (
            <View style={{ marginTop: 18 }} wrap={false}>
              <Text style={s.eyebrow}>Policies</Text>
              {policies.map((p, i) => (
                <Text key={i} style={{ marginTop: 4, fontSize: 9.5, lineHeight: 1.5 }}>•  {t(p)}</Text>
              ))}
            </View>
          )}
          {str(rc.notes) ? <Text style={{ marginTop: 18, color: C.muted, fontSize: 9, lineHeight: 1.5 }}>{t(rc.notes)}</Text> : null}

          <View style={{ marginTop: 26, padding: 16, backgroundColor: "#f0e9e1", borderRadius: 8 }} wrap={false}>
            <Text style={[s.display, { fontSize: 14 }]}>Let&apos;s work together</Text>
            <Text style={{ marginTop: 5, fontSize: 9.5, color: C.muted }}>
              {t([email, wa && `WhatsApp ${wa}`].filter(Boolean).join("   ·   ") || "Get in touch through the website")}
            </Text>
            <Link src={`${siteUrl}/contact?type=business`} style={{ marginTop: 5, fontSize: 9.5, color: "#9a5b3f" }}>
              {t(`${siteUrl.replace(/^https?:\/\//, "")}/contact`)}
            </Link>
          </View>
        </View>
        <View style={s.footer} fixed>
          <Text>{t(name)}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function renderRateCardPdf(site: SiteContent, siteUrl: string) {
  return renderToBuffer(<RateCardPdf site={site} siteUrl={siteUrl} />);
}

/* -------------------------------------------------------------------------- */
/*  Content pack                                                              */
/* -------------------------------------------------------------------------- */

const stateColor = (st: string) => (st === "complete" ? C.green : st === "in_progress" ? "#a86b12" : C.muted);

function Value({ v }: { v: ReportValue }) {
  if (v.kind === "text") return <Text style={{ lineHeight: 1.5 }}>{t(v.text)}</Text>;
  if (v.kind === "list")
    return (
      <View>
        {v.items.map((i, k) => (
          <Text key={k} style={{ lineHeight: 1.5 }}>•  {t(i)}</Text>
        ))}
      </View>
    );
  if (v.kind === "media")
    return (
      <View>
        {v.items.map((i, k) => (
          <Link key={k} src={i.url} style={{ color: "#9a5b3f", lineHeight: 1.5 }}>
            {t(`${i.kind}: ${i.name || "file"}`)}
          </Link>
        ))}
      </View>
    );
  return (
    <View>
      {v.items.map((rec, k) => (
        <Text key={k} style={{ lineHeight: 1.5, marginBottom: 2 }}>
          {k + 1}. {t(rec.map((r) => `${r.label}: ${r.value}`).join("  ·  "))}
        </Text>
      ))}
    </View>
  );
}

function ContentPackPdf({ report, title }: { report: ContentReport; title: string }) {
  const p = report.progress;
  const date = new Date(report.generatedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  return (
    <Document title={`${title} — content pack`}>
      <Page size="A4" style={s.page}>
        <View style={{ backgroundColor: C.noir, paddingHorizontal: 44, paddingTop: 56, paddingBottom: 40 }}>
          <Text style={[s.eyebrow, { color: C.gold }]}>Website content pack</Text>
          <Text style={[s.display, { color: C.pearl, fontSize: 34, marginTop: 10 }]}>{t(title)}</Text>
          <Text style={{ color: "#b9ad9f", marginTop: 8, fontSize: 9 }}>Generated {t(date)}</Text>
        </View>
        <View style={[s.body, { paddingTop: 28 }]}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { k: "Overall progress", v: `${p.percent}%` },
              { k: "Complete", v: `${p.completed} / ${p.totalSections}` },
              { k: "In progress", v: String(p.inProgress) },
              { k: "Not started", v: String(p.notStarted) },
              { k: "Missing details", v: String(p.missingRequired) },
            ].map((x) => (
              <View key={x.k} style={{ flex: 1, borderWidth: 0.7, borderColor: C.line, borderRadius: 6, padding: 10 }}>
                <Text style={[s.display, { fontSize: 18 }]}>{x.v}</Text>
                <Text style={[s.eyebrow, { marginTop: 4, fontSize: 6.5 }]}>{x.k}</Text>
              </View>
            ))}
          </View>
          <Text style={[s.eyebrow, { marginTop: 26, marginBottom: 6 }]}>Sections</Text>
          {report.modules.map((m) => (
            <View key={m.number} style={{ flexDirection: "row", paddingVertical: 7, borderBottomWidth: 0.7, borderBottomColor: C.line }}>
              <Text style={{ width: 24, color: C.muted }}>{m.number}.</Text>
              <Text style={{ flex: 1 }}>{t(m.title)}</Text>
              <Text style={{ width: 90, color: stateColor(m.state), fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>{stateLabel(m.state)}</Text>
              <Text style={{ width: 36, textAlign: "right" }}>{m.percent}%</Text>
            </View>
          ))}
          <Text style={{ marginTop: 18, color: C.muted, fontSize: 8.5, lineHeight: 1.5 }}>
            Items marked “Missing” are required before that part of the website can be published. Links point to the uploaded files.
          </Text>
        </View>
        <View style={s.footer} fixed>
          <Text>{t(title)} · content pack</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {report.modules.map((m) => (
        <Page key={m.number} size="A4" style={[s.page, { paddingTop: 40 }]}>
          <View style={s.body}>
            <Text style={s.eyebrow}>Section {m.number}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
              <Text style={[s.display, { fontSize: 24 }]}>{t(m.title)}</Text>
              <Text style={{ color: stateColor(m.state), fontFamily: "Helvetica-Bold", fontSize: 9 }}>
                {stateLabel(m.state)} · {m.percent}%
              </Text>
            </View>
            <Text style={{ color: C.muted, marginTop: 4, marginBottom: 14, fontSize: 9 }}>{t(m.summary)}</Text>
            <View style={s.hr} />

            {m.sections.map((sec) => (
              <View key={sec.type} style={{ marginTop: 14 }}>
                {m.sections.length > 1 && <Text style={[s.display, { fontSize: 16, marginBottom: 6 }]}>{t(sec.label)}</Text>}
                {sec.kind === "collection" && sec.entries.length === 0 && (
                  <View style={{ backgroundColor: C.redBg, padding: 10, borderRadius: 6 }}>
                    <Text style={{ color: C.red, fontFamily: "Helvetica-Bold" }}>Missing: no {t(sec.label.toLowerCase())} have been added yet.</Text>
                  </View>
                )}
                {sec.entries.map((e) => (
                  <View key={e.id} style={{ marginBottom: 14 }}>
                    {sec.kind === "collection" && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f0e9e1", padding: 8, borderRadius: 5, marginBottom: 6 }} wrap={false}>
                        <Text style={{ fontFamily: "Helvetica-Bold", flex: 1 }}>{t(e.title)}</Text>
                        <Text style={{ fontSize: 8, color: C.muted }}>{t(e.status)} · {stateLabel(e.state)}</Text>
                      </View>
                    )}
                    {e.missing.length > 0 && (
                      <View style={{ backgroundColor: C.redBg, padding: 8, borderRadius: 5, marginBottom: 6 }} wrap={false}>
                        <Text style={{ color: C.red, fontSize: 9 }}>
                          <Text style={{ fontFamily: "Helvetica-Bold" }}>Missing required: </Text>
                          {t(e.missing.join(", "))}
                        </Text>
                      </View>
                    )}
                    {e.fields.map((f) =>
                      f.value || f.required ? (
                        <View key={f.key} style={{ flexDirection: "row", paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: C.line }} wrap={false}>
                          <Text style={{ width: 140, color: C.muted, fontSize: 8.5, paddingRight: 8 }}>
                            {t(f.label)}
                            {f.required ? " *" : ""}
                          </Text>
                          <View style={{ flex: 1, fontSize: 9 }}>
                            {f.value ? <Value v={f.value} /> : <Text style={{ color: C.red, fontFamily: "Helvetica-Bold" }}>Missing</Text>}
                          </View>
                        </View>
                      ) : null,
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={s.footer} fixed>
            <Text>{t(m.number + ". " + m.title)}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}

export function renderContentPackPdf(report: ContentReport, title: string) {
  return renderToBuffer(<ContentPackPdf report={report} title={title} />);
}
