import type { Metadata } from "next";
import { ProductsView } from "@/components/site/sections/products";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return <ProductsView />;
}
