import {
  AtSign,
  BookOpenText,
  BriefcaseBusiness,
  FileStack,
  GraduationCap,
  Images,
  LayoutGrid,
  ReceiptText,
  SprayCan,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const MODULE_ICONS: Record<string, LucideIcon> = {
  "user-round": UserRound,
  "book-open-text": BookOpenText,
  "layout-grid": LayoutGrid,
  "briefcase-business": BriefcaseBusiness,
  "receipt-text": ReceiptText,
  "graduation-cap": GraduationCap,
  "file-stack": FileStack,
  "spray-can": SprayCan,
  images: Images,
  "at-sign": AtSign,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MODULE_ICONS[name] ?? LayoutGrid;
  return <Icon className={className} aria-hidden />;
}
