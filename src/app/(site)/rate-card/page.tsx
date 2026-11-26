import type { Metadata } from "next";
import { RateCardView } from "@/components/site/sections/services";
import { getSiteContent } from "@/lib/server/site";

export const metadata: Metadata = { title: "Rate Card" };

export default async function RateCardPage() {
  const site = await getSiteContent();
  return <RateCardView pdfHref={site.preview ? "/api/rate-card?draft=1" : "/api/rate-card"} />;
}
