import type { Metadata } from "next";
import { SiteProvider } from "@/components/site/site-context";
import { PreviewBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getSiteContent } from "@/lib/server/site";
import { siteTitle } from "@/lib/site-nav";
import { brandStyle } from "@/lib/theme";
import { str } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  const title = siteTitle(site);
  const description =
    str(site.settings.seoDescription) || str(site.about?.shortBio).slice(0, 160) || str(site.profile?.tagline) || undefined;
  const photo = site.profile?.photo as { url?: string } | null | undefined;
  return {
    title: { default: title, template: `%s — ${title}` },
    description,
    openGraph: { title, description, images: photo?.url ? [photo.url] : undefined, type: "website" },
    robots: site.showPlaceholders ? { index: false, follow: false } : undefined,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();
  return (
    <SiteProvider site={site}>
      <div className="flex min-h-dvh flex-col" style={brandStyle(site.settings.accentColor)}>
        <PreviewBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </SiteProvider>
  );
}
