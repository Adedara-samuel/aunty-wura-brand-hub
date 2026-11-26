import type { Metadata } from "next";
import { SettingsPage } from "@/components/studio/settings";

export const metadata: Metadata = { title: "Site settings" };

export default function Page() {
  return <SettingsPage />;
}
