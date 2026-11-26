import type { Metadata } from "next";
import { ReviewExport } from "@/components/studio/review";

export const metadata: Metadata = { title: "Review & export" };

export default function ReviewPage() {
  return <ReviewExport />;
}
