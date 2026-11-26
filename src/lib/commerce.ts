/*
 * Commerce layer.
 *
 * Today every purchase is fulfilled off-site:
 *   - classes & digital products → the existing Selar / Nestuge / other sales page
 *   - fragrances                → a pre-filled WhatsApp conversation
 *
 * All "buy" buttons resolve their behaviour through `getPurchaseAction`, so a native cart and
 * checkout (e.g. Paystack or Flutterwave) can be introduced later by:
 *   1. setting NEXT_PUBLIC_ENABLE_CHECKOUT=true,
 *   2. implementing a cart provider + /checkout route and payment webhook,
 *   3. returning `{ kind: "cart" }` here for products that should be sold natively.
 * No public component needs to change.
 */
import { formatMoney, purchaseButtonLabel, whatsappLink } from "./format";
import type { EntryData, Price } from "./content/types";
import { str } from "./utils";

export const CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CHECKOUT === "true";

export type PurchaseAction =
  | { kind: "external"; href: string; label: string }
  | { kind: "whatsapp"; href: string; label: string }
  | { kind: "cart"; productId: string; label: string }
  | { kind: "unavailable"; label: string };

/** A normalised product line — the shape a future cart/checkout will consume. */
export interface CommerceProduct {
  id: string;
  type: "class" | "product" | "fragrance";
  name: string;
  sku?: string;
  price: Price | null;
  variants: { id: string; label: string; amount: number | null; currency: string }[];
}

export function getPurchaseAction(
  type: "class" | "product",
  data: EntryData,
): PurchaseAction {
  const href = str(data.purchaseUrl);
  const label = purchaseButtonLabel(type, str(data.platform), str(data.platformName), str(data.buttonLabel));
  if (!href) return { kind: "unavailable", label: "Link coming soon" };
  return { kind: "external", href, label };
}

export interface FragranceSize {
  label: string;
  price: number | null;
}

export function fragranceSizes(data: EntryData): FragranceSize[] {
  const sizes = Array.isArray(data.sizes) ? (data.sizes as Record<string, unknown>[]) : [];
  return sizes
    .map((s) => ({ label: str(s.label), price: typeof s.price === "number" ? s.price : null }))
    .filter((s) => s.label);
}

export function fragrancePriceRange(data: EntryData): string {
  const currency = str(data.currency) || "NGN";
  const prices = fragranceSizes(data)
    .map((s) => s.price)
    .filter((p): p is number => typeof p === "number");
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min, currency) : `From ${formatMoney(min, currency)}`;
}

export function getFragranceOrderAction(
  product: EntryData,
  brand: EntryData | null,
  contact: EntryData | null,
  size?: string,
): PurchaseAction {
  if (product.availability === "out_of_stock") return { kind: "unavailable", label: "Out of stock" };
  const phone = str(brand?.whatsappNumber) || str(contact?.whatsapp);
  const opener = str(brand?.orderMessage) || "Hello, I'd like to order";
  const message = `${opener}: ${str(product.name)}${size ? ` (${size})` : ""}`;
  const href = whatsappLink(phone, message);
  if (!href) return { kind: "unavailable", label: "Ordering opens soon" };
  return {
    kind: "whatsapp",
    href,
    label: product.availability === "pre_order" ? "Pre-order on WhatsApp" : "Order on WhatsApp",
  };
}
