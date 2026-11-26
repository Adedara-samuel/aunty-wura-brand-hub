import type { Metadata } from "next";
import { FragranceView } from "@/components/site/sections/fragrance";
import { getSiteContent } from "@/lib/server/site";
import { str } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return { title: str(site.fragranceBrand?.brandName) || "Fragrance", description: str(site.fragranceBrand?.tagline) || undefined };
}

export default function FragrancePage() {
  return <FragranceView />;
}
