"use client";

import * as React from "react";
import { ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import type { SiteContent } from "@/lib/site-types";
import { cn } from "@/lib/utils";
import type { PreviewMessage } from "./preview-frame";
import type { PreviewOption } from "./preview-views";

const DEVICES = [
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
  { id: "tablet", label: "Tablet", width: 820, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
] as const;
type DeviceId = (typeof DEVICES)[number]["id"];

/**
 * Live preview: renders the real public components inside an iframe at true device widths,
 * scaled to fit the pane, and fed with unsaved draft content via postMessage.
 */
export function PreviewPane({
  site,
  options,
  itemId,
  itemSlug,
  className,
  height = "calc(100dvh - 9rem)",
}: {
  site: SiteContent;
  options: PreviewOption[];
  itemId?: string;
  itemSlug?: string;
  className?: string;
  height?: string;
}) {
  const [viewIndex, setViewIndex] = React.useState(0);
  const [device, setDevice] = React.useState<DeviceId>("desktop");
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const option = options[Math.min(viewIndex, options.length - 1)];

  const message: PreviewMessage = React.useMemo(
    () => ({ type: "studio-preview", site, view: option.view, itemId }),
    [site, option.view, itemId],
  );
  const latest = React.useRef(message);
  latest.current = message;

  const post = React.useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(latest.current, window.location.origin);
  }, []);

  React.useEffect(() => {
    const t = setTimeout(post, 120);
    return () => clearTimeout(t);
  }, [message, post]);

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "studio-preview-ready" && e.source === frameRef.current?.contentWindow) post();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const deviceWidth = DEVICES.find((d) => d.id === device)!.width;
  const scale = box.w ? Math.min(1, box.w / deviceWidth) : 1;
  const frameW = scale < 1 ? deviceWidth : Math.min(deviceWidth, box.w);
  const frameH = box.h / scale;
  const publicPath = option.path(itemSlug);

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border bg-surface-2/60", className)} style={{ height }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 hidden size-2.5 rounded-full bg-success sm:inline-block" aria-hidden />
          {options.length > 1 ? (
            <div className="flex rounded-full bg-muted p-0.5" role="tablist" aria-label="Preview page">
              {options.map((o, i) => (
                <button
                  key={o.view}
                  role="tab"
                  aria-selected={i === viewIndex}
                  onClick={() => setViewIndex(i)}
                  className={cn("cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition", i === viewIndex ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs font-semibold">{option.label} preview</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              aria-pressed={device === d.id}
              title={d.label}
              className={cn("cursor-pointer rounded-lg p-1.5 transition", device === d.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            >
              <d.icon className="size-4" />
              <span className="sr-only">{d.label}</span>
            </button>
          ))}
          <a
            href={`/api/studio/preview?path=${encodeURIComponent(publicPath)}`}
            target="_blank"
            rel="noopener"
            className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Open the saved draft on the real website (in a new tab)"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div ref={wrapRef} className="relative flex-1 overflow-hidden">
        {box.w > 0 && (
          <div
            className="absolute top-0 left-1/2 origin-top overflow-hidden bg-background shadow-sm"
            style={{ width: frameW, height: frameH, transform: `translateX(-50%) scale(${scale})` }}
          >
            <iframe ref={frameRef} src="/content-studio/frame" title="Website preview" className="size-full border-0" onLoad={post} />
          </div>
        )}
      </div>
      <p className="border-t bg-surface px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        Live preview of your unsaved changes · placeholders show where content is still missing.
      </p>
    </div>
  );
}
