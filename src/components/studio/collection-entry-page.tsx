"use client";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/display";
import { CONTENT_TYPES } from "@/lib/content/definitions";
import { entryTitle } from "@/lib/content/completion";
import { getModule } from "@/lib/content/modules";
import type { ContentTypeId, ModuleId } from "@/lib/content/types";
import { useEntries } from "@/lib/studio/api";
import { confirmLeave } from "@/lib/studio/unsaved";
import { EntryEditor } from "./entry-editor";
import { ModuleIcon } from "./icons";

export function CollectionEntryPage({ moduleId, type, entryId }: { moduleId: ModuleId; type: ContentTypeId; entryId: string }) {
  const m = getModule(moduleId)!;
  const def = CONTENT_TYPES[type];
  const router = useRouter();
  const { data: entries, isLoading, isError, refetch } = useEntries();
  const isNew = entryId === "new";
  const entry = isNew ? null : (entries?.find((e) => e.id === entryId) ?? null);
  const back = `/content-studio/${moduleId}${moduleId === "fragrance" ? `?tab=${type}` : ""}`;

  return (
    <div>
      <div className="border-b bg-surface/60">
        <div className="mx-auto max-w-[110rem] px-4 py-6 md:px-8">
          <NextLink href={back} onClick={confirmLeave} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {m.number}. {m.title}
          </NextLink>
          <h1 className="display mt-3 flex items-center gap-3 text-3xl md:text-4xl">
            <ModuleIcon name={m.icon} className="size-6 text-primary" />
            {isNew ? `New ${def.singular.toLowerCase()}` : entry ? entryTitle(def, entry.data) : def.singular}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-[110rem] px-4 md:px-8">
        {isLoading ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-12" />
            <Skeleton className="h-80" />
          </div>
        ) : isError ? (
          <Card className="my-8 p-8 text-center">
            <p className="font-semibold">We couldn&apos;t load this item.</p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button>
          </Card>
        ) : !isNew && !entry ? (
          <Card className="my-8 p-8 text-center">
            <p className="font-display text-2xl">This {def.singular.toLowerCase()} doesn&apos;t exist any more</p>
            <p className="mt-2 text-sm text-muted-foreground">It may have been deleted.</p>
            <Button className="mt-5" onClick={() => router.push(back)}>Back to {m.title}</Button>
          </Card>
        ) : (
          <EntryEditor
            key={entryId}
            type={type}
            entry={entry}
            allEntries={entries ?? []}
            onCreated={(e) => router.replace(`/content-studio/${moduleId}/${e.id}${moduleId === "fragrance" ? `?type=${type}` : ""}`)}
            onDeleted={() => router.push(back)}
          />
        )}
      </div>
    </div>
  );
}
