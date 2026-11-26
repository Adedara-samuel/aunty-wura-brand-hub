import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetail } from "@/components/site/sections/classes";
import { getSiteContent } from "@/lib/server/site";
import { str } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getSiteContent()).classes.find((p) => p.slug === slug);
  return item ? { title: str(item.data.title), description: str(item.data.summary) } : { title: "Not found" };
}

export default async function ClassDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = (await getSiteContent()).classes.find((p) => p.slug === slug);
  if (!item) notFound();
  return <ClassDetail item={item} />;
}
