import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import type { SiteContent } from "@/lib/site-types";
import { buildSiteContent } from "@/lib/site-build";
import { getSession } from "./auth";
import { listEntries } from "./entries";

export { buildSiteContent };

/** Request-scoped site content (published, or drafts for signed-in users in preview mode). */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const { isEnabled } = await draftMode();
  const preview = isEnabled ? !!(await getSession()) : false;
  const all = await listEntries();
  return buildSiteContent(all, preview);
});
