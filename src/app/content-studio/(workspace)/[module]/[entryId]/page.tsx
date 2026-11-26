import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionEntryPage } from "@/components/studio/collection-entry-page";
import { CONTENT_TYPES, isContentTypeId } from "@/lib/content/definitions";
import { getModule } from "@/lib/content/modules";

type Props = { params: Promise<{ module: string; entryId: string }>; searchParams: Promise<{ type?: string }> };

export const metadata: Metadata = { title: "Edit" };

export default async function EntryPage({ params, searchParams }: Props) {
  const { module, entryId } = await params;
  const { type } = await searchParams;
  const def = getModule(module);
  if (!def) notFound();
  const collectionTypes = def.types.filter((t) => CONTENT_TYPES[t].kind === "collection");
  const chosen = type && isContentTypeId(type) && collectionTypes.includes(type) ? type : collectionTypes[0];
  if (!chosen) notFound();
  return <CollectionEntryPage moduleId={def.id} type={chosen} entryId={entryId} />;
}
