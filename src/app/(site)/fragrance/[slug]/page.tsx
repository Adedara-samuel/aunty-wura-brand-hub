import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FragranceDetail } from "@/components/site/sections/fragrance";
import { getSiteContent } from "@/lib/server/site";
import { str } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getSiteContent()).fragrances.find((p) => p.slug === slug);
  return item ? { title: str(item.data.name), description: str(item.data.description).slice(0, 160) } : { title: "Not found" };
}

export default async function FragranceDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = (await getSiteContent()).fragrances.find((p) => p.slug === slug);
  if (!item) notFound();
  return <FragranceDetail item={item} />;
}
