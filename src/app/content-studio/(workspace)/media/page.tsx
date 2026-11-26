import type { Metadata } from "next";
import { MediaLibrary } from "@/components/studio/media-library";

export const metadata: Metadata = { title: "Media library" };

export default function MediaPage() {
  return <MediaLibrary />;
}
