import type { Metadata } from "next";
import { AboutView } from "@/components/site/sections/about";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <AboutView />;
}
