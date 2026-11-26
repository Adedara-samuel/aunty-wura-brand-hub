import { AtSign, Ghost, Globe, Send } from "lucide-react";
import { cn } from "@/lib/utils";

/* Lightweight brand marks (lucide no longer ships brand icons). */
export function SocialIcon({ platform, className }: { platform?: string; className?: string }) {
  const cls = cn("size-4", className);
  const common = { className: cls, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.5 2.6 2.4 4.4 5 4.6" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9.5 4.5 2.5L10 14.5z" fill="currentColor" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 10.5V16M8 7.8v.01M12 16v-3.2a2.3 2.3 0 0 1 4.6 0V16M12 10.5V16" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4 4 20" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M15 3.5h-2.2A3.8 3.8 0 0 0 9 7.3V10H6.5v3.4H9V21h3.4v-7.6H15l.5-3.4h-3.1V7.6c0-.6.4-1 1-1H15z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10.5 20.5 12.4 12M9.7 13.6c-.7-2.9 1-5.6 3.6-5.6 2 0 3.2 1.4 3.2 3.2 0 2.3-1.3 4.2-3.1 4.2-.9 0-1.5-.5-1.7-1.2" />
        </svg>
      );
    case "threads":
      return <AtSign className={cls} aria-hidden />;
    case "snapchat":
      return <Ghost className={cls} aria-hidden />;
    case "telegram":
      return <Send className={cls} aria-hidden />;
    default:
      return <Globe className={cls} aria-hidden />;
  }
}
