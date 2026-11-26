"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, FileText, Film, FolderOpen, ImagePlus, Loader2, Pencil, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/overlay";
import { Input } from "@/components/ui/primitives";
import type { MediaKind, MediaRef } from "@/lib/content/types";
import { qk, useMedia, type MediaItem } from "@/lib/studio/api";
import { ACCEPT, checkFile, uploadFile } from "@/lib/studio/upload";
import { cn, formatBytes } from "@/lib/utils";

function toRef(m: MediaItem | MediaRef): MediaRef {
  return { id: m.id, url: m.url, kind: m.kind, name: m.name, mime: m.mime, size: m.size, width: m.width, height: m.height, alt: m.alt ?? "" };
}

export function MediaThumb({ media, className }: { media: MediaRef; className?: string }) {
  if (media.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.url} alt={media.alt || ""} className={cn("size-full object-cover", className)} loading="lazy" />;
  }
  if (media.kind === "video") {
    return (
      <div className={cn("relative size-full bg-black", className)}>
        <video src={media.url} className="size-full object-cover opacity-80" muted preload="metadata" />
        <Film className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-white" />
      </div>
    );
  }
  return (
    <div className={cn("flex size-full flex-col items-center justify-center gap-1 bg-muted p-2 text-center", className)}>
      <FileText className="size-6 text-muted-foreground" />
      <span className="line-clamp-2 text-[0.65rem] break-all text-muted-foreground">{media.name}</span>
    </div>
  );
}

interface Pending {
  key: string;
  name: string;
  progress: number;
}

function useUploader(folder: string, accept: MediaKind[], onDone: (refs: MediaRef[]) => void) {
  const qc = useQueryClient();
  const [pending, setPending] = React.useState<Pending[]>([]);

  const upload = async (files: File[]) => {
    const valid: File[] = [];
    for (const f of files) {
      const err = checkFile(f, accept);
      if (err) toast.error(err);
      else valid.push(f);
    }
    if (!valid.length) return;
    const items = valid.map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, name: f.name, progress: 0 }));
    setPending((p) => [...p, ...items]);
    const results = await Promise.all(
      valid.map(async (file, i) => {
        try {
          const media = await uploadFile(file, folder, (progress) =>
            setPending((p) => p.map((x) => (x.key === items[i].key ? { ...x, progress } : x))),
          );
          return toRef(media);
        } catch (e) {
          toast.error(`Couldn't upload “${file.name}”`, { description: (e as Error).message });
          return null;
        } finally {
          setPending((p) => p.filter((x) => x.key !== items[i].key));
        }
      }),
    );
    const ok = results.filter((r): r is MediaRef => !!r);
    if (ok.length) {
      onDone(ok);
      toast.success(ok.length === 1 ? "File uploaded" : `${ok.length} files uploaded`);
      void qc.invalidateQueries({ queryKey: qk.media });
    }
  };
  return { pending, upload };
}

function Dropzone({
  accept,
  multiple,
  onFiles,
  onLibrary,
  compact,
  disabled,
}: {
  accept: MediaKind[];
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  onLibrary: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const acceptAttr = accept.map((k) => ACCEPT[k]).join(",");
  const kinds = accept.map((a) => (a === "image" ? "images" : a === "video" ? "videos" : "documents (PDF, Word…)")).join(", ");
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files).slice(0, multiple ? 30 : 1));
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition",
        compact ? "min-h-32 p-4" : "p-6 md:p-8",
        over ? "border-primary bg-accent" : "border-input bg-surface hover:border-primary/50",
      )}
    >
      <UploadCloud className="size-7 text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">Drag & drop {multiple ? "files" : "a file"} here</p>
        {!compact && <p className="mt-1 text-xs text-muted-foreground">Accepted: {kinds}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
          <ImagePlus /> Upload
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onLibrary} disabled={disabled}>
          <FolderOpen /> From library
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptAttr}
        multiple={multiple}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function PendingTiles({ pending }: { pending: Pending[] }) {
  if (!pending.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {pending.map((p) => (
        <div key={p.key} className="flex items-center gap-3 rounded-lg border bg-surface px-3 py-2 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
          <span className="w-24 overflow-hidden rounded-full bg-muted">
            <span className="block h-1.5 rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
          </span>
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
        </div>
      ))}
    </div>
  );
}

export function LibraryDialog({
  open,
  onOpenChange,
  accept,
  multiple,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accept: MediaKind[];
  multiple?: boolean;
  onSelect: (refs: MediaRef[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose from your media library</DialogTitle>
          <DialogDescription>Files you have already uploaded anywhere in the Studio.</DialogDescription>
        </DialogHeader>
        {open && <LibraryGrid accept={accept} multiple={multiple} onSelect={onSelect} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function LibraryGrid({ accept, multiple, onSelect, onClose }: { accept: MediaKind[]; multiple?: boolean; onSelect: (refs: MediaRef[]) => void; onClose: () => void }) {
  const { data, isLoading } = useMedia();
  const [selected, setSelected] = React.useState<string[]>([]);
  const items = (data?.media ?? []).filter((m) => accept.includes(m.kind));
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : multiple ? [...s, id] : [id]));

  return (
    <>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No matching files yet — upload one instead.</p>
        ) : (
          <div className="grid max-h-[55dvh] grid-cols-3 gap-3 overflow-y-auto p-0.5 sm:grid-cols-4">
            {items.map((m) => {
              const on = selected.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={cn("relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition", on ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-foreground/20")}
                  title={m.name}
                >
                  <MediaThumb media={m} />
                  {on && (
                    <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!selected.length}
            onClick={() => {
              onSelect(items.filter((m) => selected.includes(m.id)).map(toRef));
              onClose();
            }}
          >
            Use {selected.length > 1 ? `${selected.length} files` : "file"}
          </Button>
        </div>
    </>
  );
}

function AltEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  if (!open) {
    return (
      <button type="button" onClick={() => { setDraft(value); setOpen(true); }} className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Pencil className="size-3" /> {value ? `Description: “${value.slice(0, 40)}${value.length > 40 ? "…" : ""}”` : "Add a short description (helps accessibility & Google)"}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Describe what's in the image" className="h-9 text-sm" autoFocus maxLength={300} />
      <Button type="button" size="sm" onClick={() => { onChange(draft); setOpen(false); }}>Save</Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function SingleMediaInput({
  value,
  onChange,
  accept,
  folder,
}: {
  value: MediaRef | null;
  onChange: (v: MediaRef | null) => void;
  accept: MediaKind[];
  folder: string;
}) {
  const [libOpen, setLibOpen] = React.useState(false);
  const { pending, upload } = useUploader(folder, accept, (refs) => onChange(refs[0]));
  const isDoc = value?.kind === "document";

  return (
    <div>
      {value ? (
        <div className="flex flex-col gap-4 rounded-xl border bg-surface p-3 sm:flex-row sm:items-center">
          <div className={cn("shrink-0 overflow-hidden rounded-lg border bg-muted", isDoc ? "size-20" : "h-32 w-full sm:h-28 sm:w-40")}>
            <MediaThumb media={value} />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-sm font-semibold">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {[value.kind, formatBytes(value.size), value.width && value.height ? `${value.width}×${value.height}px` : ""].filter(Boolean).join(" · ")}
            </p>
            {value.kind === "image" && value.width && value.width < 1000 && (
              <p className="text-xs text-warning">This image is quite small — a larger version will look sharper.</p>
            )}
            {value.kind !== "document" && <AltEditor value={value.alt ?? ""} onChange={(alt) => onChange({ ...value, alt })} />}
            <div className="flex flex-wrap gap-2 pt-1">
              <ReplaceButton accept={accept} onFile={(f) => upload([f])} />
              <Button type="button" size="sm" variant="outline" onClick={() => setLibOpen(true)}><FolderOpen /> Library</Button>
              <a href={value.url} target="_blank" rel="noopener" className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold hover:bg-muted">Open</a>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(null)}><X /> Remove</Button>
            </div>
          </div>
        </div>
      ) : (
        <Dropzone accept={accept} onFiles={upload} onLibrary={() => setLibOpen(true)} disabled={pending.length > 0} />
      )}
      <PendingTiles pending={pending} />
      <LibraryDialog open={libOpen} onOpenChange={setLibOpen} accept={accept} onSelect={(r) => onChange(r[0])} />
    </div>
  );
}

function ReplaceButton({ accept, onFile }: { accept: MediaKind[]; onFile: (f: File) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}><UploadCloud /> Replace</Button>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept={accept.map((k) => ACCEPT[k]).join(",")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function MultiMediaInput({
  value,
  onChange,
  accept,
  folder,
}: {
  value: MediaRef[];
  onChange: (v: MediaRef[]) => void;
  accept: MediaKind[];
  folder: string;
}) {
  const [libOpen, setLibOpen] = React.useState(false);
  const latest = React.useRef(value);
  React.useEffect(() => {
    latest.current = value;
  }, [value]);
  const { pending, upload } = useUploader(folder, accept, (refs) => onChange([...latest.current, ...refs]));

  const move = (i: number, d: number) => {
    const next = value.slice();
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((m, i) => (
            <div key={m.id + i} className="group relative overflow-hidden rounded-xl border bg-muted">
              <div className="aspect-square">
                <MediaThumb media={m} />
              </div>
              {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[0.6rem] font-bold text-background">Main</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="cursor-pointer rounded-md bg-white/90 p-1 text-foreground disabled:opacity-40" aria-label="Move earlier"><ArrowLeft className="size-3.5" /></button>
                  <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="cursor-pointer rounded-md bg-white/90 p-1 text-foreground disabled:opacity-40" aria-label="Move later"><ArrowRight className="size-3.5" /></button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="cursor-pointer rounded-md bg-white/90 p-1 text-destructive" aria-label="Remove"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dropzone accept={accept} multiple compact={value.length > 0} onFiles={upload} onLibrary={() => setLibOpen(true)} />
      <PendingTiles pending={pending} />
      <LibraryDialog open={libOpen} onOpenChange={setLibOpen} accept={accept} multiple onSelect={(r) => onChange([...value, ...r.filter((x) => !value.some((v) => v.id === x.id))])} />
    </div>
  );
}
