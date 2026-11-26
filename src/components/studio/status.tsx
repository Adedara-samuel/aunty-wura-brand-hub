import { CheckCircle2, CircleDashed, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/display";
import type { CompletionState } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export const STATE_META: Record<CompletionState, { label: string; variant: "success" | "warning" | "neutral"; dot: string }> = {
  complete: { label: "Complete", variant: "success", dot: "bg-success" },
  in_progress: { label: "In progress", variant: "warning", dot: "bg-warning" },
  not_started: { label: "Not started", variant: "neutral", dot: "bg-foreground/20" },
};

export function StateBadge({ state, className }: { state: CompletionState; className?: string }) {
  const m = STATE_META[state];
  const Icon = state === "complete" ? CheckCircle2 : state === "in_progress" ? CircleDot : CircleDashed;
  return (
    <Badge variant={m.variant} className={className}>
      <Icon /> {m.label}
    </Badge>
  );
}

export function StateDot({ state, className }: { state: CompletionState; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", STATE_META[state].dot, className)} aria-label={STATE_META[state].label} />;
}

export function PublishBadge({ published, changed }: { published: boolean; changed?: boolean }) {
  if (!published) return <Badge variant="outline">Draft · not live</Badge>;
  if (changed) return <Badge variant="warning">Live · unpublished edits</Badge>;
  return <Badge variant="success">Live on website</Badge>;
}

export function ProgressRing({ value, size = 120, stroke = 10, className, label }: { value: number; size?: number; stroke?: number; className?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }} role="img" aria-label={`${v}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-display text-3xl tabular-nums">{v}%</span>
        {label && <span className="block text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">{label}</span>}
      </div>
    </div>
  );
}
