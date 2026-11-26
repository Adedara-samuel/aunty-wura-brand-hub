"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Check, Cloud, Copy, Download, HardDrive, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card, Skeleton } from "@/components/ui/display";
import { ConfirmDialog, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/overlay";
import { Input, Label } from "@/components/ui/primitives";
import { CONTENT_TYPES, isContentTypeId } from "@/lib/content/definitions";
import type { MediaKind } from "@/lib/content/types";
import { api, ApiError, qk, useMedia, type MediaItem } from "@/lib/studio/api";
import { ACCEPT, checkFile, uploadFile } from "@/lib/studio/upload";
import { cn, formatBytes, formatRelative } from "@/lib/utils";
import { MediaThumb } from "./media-input";
import { PageHeader } from "./shell";

const FILTERS: { value: MediaKind | ""; label: string }[] = [
  { value: "", label: "All files" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
];

function folderLabel(f: string) {
  return isContentTypeId(f) ? CONTENT_TYPES[f].plural : f === "library" ? "Media library" : f || "General";
}

function MediaDetail({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [alt, setAlt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [usage, setUsage] = React.useState<{ id: string; type: string }[] | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!item) return;
    setAlt(item.alt ?? "");
    setUsage(null);
    api<{ usage: { id: string; type: string }[] }>(`/api/studio/media/${item.id}`).then((r) => setUsage(r.usage)).catch(() => setUsage([]));
  }, [item]);

  if (!item) return null;
  const absolute = typeof window !== "undefined" && item.url.startsWith("/") ? `${window.location.origin}${item.url}` : item.url;

  const saveAlt = async () => {
    setBusy(true);
    try {
      await api(`/api/studio/media/${item.id}`, { method: "PATCH", body: JSON.stringify({ alt }) });
      toast.success("Description saved");
      void qc.invalidateQueries({ queryKey: qk.media });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/api/studio/media/${item.id}?force=1`, { method: "DELETE" });
      toast.success("File deleted");
      void qc.invalidateQueries({ queryKey: qk.media });
      onClose();
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate text-xl">{item.name}</DialogTitle>
          <DialogDescription>
            {[item.kind, formatBytes(item.size), item.width && item.height ? `${item.width}×${item.height}px` : "", `uploaded ${formatRelative(item.createdAt)}`].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl border bg-muted">
          {item.kind === "video" ? (
            <video src={item.url} controls className="max-h-[50dvh] w-full" />
          ) : item.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.alt ?? ""} className="max-h-[50dvh] w-full object-contain" />
          ) : (
            <div className="aspect-[3/1]"><MediaThumb media={item} /></div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={item.isPublic ? "success" : "outline"}>{item.isPublic ? "Used on the live website" : "Private — not yet published"}</Badge>
          <Badge variant="neutral">{folderLabel(item.folder)}</Badge>
          {usage && <Badge variant="neutral">{usage.length ? `Used in ${usage.length} ${usage.length === 1 ? "place" : "places"}` : "Not used anywhere"}</Badge>}
        </div>
        {item.kind !== "document" && (
          <div>
            <Label htmlFor="alt">Short description</Label>
            <div className="mt-2 flex gap-2">
              <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="What is in this image?" maxLength={300} />
              <Button variant="outline" onClick={saveAlt} disabled={busy}>Save</Button>
            </div>
          </div>
        )}
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirm(true)}><Trash2 /> Delete</Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(absolute);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check /> : <Copy />} Copy link
            </Button>
            <a href={item.provider === "local" ? `${item.url}?download=1` : item.url} download={item.name} target="_blank" rel="noopener" className={buttonVariants()}>
              <Download /> Download
            </a>
          </div>
        </DialogFooter>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Delete this file permanently?"
          description={usage?.length ? `This file is still used in ${usage.length} ${usage.length === 1 ? "place" : "places"} (${[...new Set(usage.map((u) => folderLabel(u.type)))].join(", ")}). It will disappear from those sections.` : "This can't be undone."}
          confirmLabel="Delete file"
          destructive
          onConfirm={remove}
        />
      </DialogContent>
    </Dialog>
  );
}

export function MediaLibrary() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useMedia();
  const [filter, setFilter] = React.useState<MediaKind | "">("");
  const [selected, setSelected] = React.useState<MediaItem | null>(null);
  const [uploading, setUploading] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const items = (data?.media ?? []).filter((m) => !filter || m.kind === filter);
  const total = data?.media.reduce((a, m) => a + (m.size ?? 0), 0) ?? 0;

  const upload = async (files: File[]) => {
    const ok = files.filter((f) => {
      const err = checkFile(f, ["image", "video", "document"]);
      if (err) toast.error(err);
      return !err;
    });
    if (!ok.length) return;
    setUploading((n) => n + ok.length);
    let done = 0;
    await Promise.all(
      ok.map(async (f) => {
        try {
          await uploadFile(f, "library");
          done++;
        } catch (e) {
          toast.error(`Couldn't upload “${f.name}”`, { description: (e as Error).message });
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (done) toast.success(`${done} file${done === 1 ? "" : "s"} uploaded`);
    void qc.invalidateQueries({ queryKey: qk.media });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Section 9 · Gallery & Media"
        title="Media library"
        description="Every photo, video and document you've uploaded anywhere in the Studio. Download them individually or all at once."
        actions={
          <>
            <a href="/api/studio/media/zip" className={cn(buttonVariants({ variant: "outline" }), !data?.media.length && "pointer-events-none opacity-50")}>
              <Archive /> Download all (ZIP)
            </a>
            <Button onClick={() => inputRef.current?.click()}><UploadCloud /> Upload files</Button>
          </>
        }
      />
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={[ACCEPT.image, ACCEPT.video, ACCEPT.document].join(",")}
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <div
        className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8"
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition", filter === f.value ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40")}
              >
                {f.label}
                {data && <span className="ml-1.5 opacity-60 tabular-nums">{f.value ? data.media.filter((m) => m.kind === f.value).length : data.media.length}</span>}
              </button>
            ))}
          </div>
          {data && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              {data.provider === "cloudinary" ? <Cloud className="size-3.5" /> : <HardDrive className="size-3.5" />}
              {data.provider === "cloudinary" ? "Stored on Cloudinary" : "Stored on the website server"} · {formatBytes(total)}
            </p>
          )}
        </div>

        {(over || uploading > 0) && (
          <div className={cn("flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-sm", over ? "border-primary bg-accent" : "border-input")}>
            {uploading > 0 ? <><Loader2 className="size-4 animate-spin" /> Uploading {uploading} file{uploading === 1 ? "" : "s"}…</> : <><UploadCloud className="size-4" /> Drop files to upload</>}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
        ) : isError ? (
          <Card className="p-8 text-center"><p>Couldn&apos;t load your files.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button></Card>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center border-dashed px-6 py-16 text-center">
            <UploadCloud className="size-10 text-muted-foreground" />
            <p className="mt-4 font-display text-2xl">No files here yet</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Drag photos, videos, rate cards or documents onto this page, or use the upload button. Files you add in any section will also appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((m) => (
              <button key={m.id} onClick={() => setSelected(m)} className="group cursor-pointer text-left">
                <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted transition group-hover:shadow-lg">
                  <MediaThumb media={m} className="transition duration-500 group-hover:scale-105" />
                  {m.isPublic && <span className="absolute top-2 left-2 size-2.5 rounded-full bg-success ring-2 ring-white" title="Used on the live website" />}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">{folderLabel(m.folder)} · {formatBytes(m.size)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <MediaDetail item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
