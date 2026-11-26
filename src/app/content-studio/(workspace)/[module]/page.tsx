import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleWorkspace } from "@/components/studio/module-workspace";
import { getModule } from "@/lib/content/modules";

type Props = { params: Promise<{ module: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  return { title: getModule(module)?.title ?? "Not found" };
}

export default async function ModulePage({ params, searchParams }: Props) {
  const { module } = await params;
  const { tab } = await searchParams;
  const def = getModule(module);
  if (!def) notFound();
  return <ModuleWorkspace moduleId={def.id} initialTab={tab} />;
}
