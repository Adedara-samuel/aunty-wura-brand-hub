import type { Metadata } from "next";
import { StudioProviders } from "@/components/studio/providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Content Studio", template: "%s · Content Studio" },
  robots: { index: false, follow: false },
};

export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return <StudioProviders>{children}</StudioProviders>;
}
