import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioDetail } from "@/components/site/sections/portfolio";
import { getSiteContent } from "@/lib/server/site";
import { str } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getSiteContent()).portfolio.find((p) => p.slug === slug);
  return item ? { title: str(item.data.title), description: str(item.data.summary) } : { title: "Not found" };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const items = (await getSiteContent()).portfolio;
  const index = items.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  return <PortfolioDetail item={items[index]} prev={items[index - 1]} next={items[index + 1]} />;
}
