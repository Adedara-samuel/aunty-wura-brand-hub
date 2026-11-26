import { AVAILABILITY, CLASS_FORMATS, SALES_PLATFORMS, SOCIAL_PLATFORMS } from "./content/definitions";
import type { Price } from "./content/types";

export function formatMoney(amount: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/** Human readable price. Returns "" when nothing is set. */
export function formatPrice(price: Partial<Price> | null | undefined): string {
  if (!price || !price.mode) return "";
  if (price.mode === "quote") return "Custom quote";
  if (price.mode === "free") return "Free";
  if (typeof price.amount !== "number") return "";
  const money = formatMoney(price.amount, price.currency || "NGN");
  return price.mode === "from" ? `From ${money}` : money;
}

export function platformLabel(platform?: string, custom?: string): string {
  if (platform === "other") return custom?.trim() || "the sales page";
  return SALES_PLATFORMS.find((p) => p.value === platform)?.label ?? "the sales page";
}

export function purchaseButtonLabel(kind: "class" | "product", platform?: string, custom?: string, override?: string) {
  if (override?.trim()) return override.trim();
  const where = platformLabel(platform, custom);
  const verb = kind === "class" ? "Enrol" : "Buy";
  return where === "the sales page" ? `${verb} now` : `${verb} on ${where}`;
}

export function availabilityLabel(v?: string) {
  return AVAILABILITY.find((a) => a.value === v)?.label ?? "";
}

export function classFormatLabel(v?: string) {
  return CLASS_FORMATS.find((a) => a.value === v)?.label ?? "";
}

export function socialLabel(v?: string) {
  return SOCIAL_PLATFORMS.find((a) => a.value === v)?.label ?? "Link";
}

export function digitsOnly(phone?: string): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

export function whatsappLink(phone?: string, message?: string): string {
  const n = digitsOnly(phone);
  if (!n) return "";
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function telLink(phone?: string) {
  const n = (phone ?? "").replace(/[^0-9+]/g, "");
  return n ? `tel:${n}` : "";
}

export function youtubeEmbed(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
