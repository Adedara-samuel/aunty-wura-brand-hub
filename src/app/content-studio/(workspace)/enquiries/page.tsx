import type { Metadata } from "next";
import { EnquiriesInbox } from "@/components/studio/enquiries";

export const metadata: Metadata = { title: "Enquiries" };

export default function EnquiriesPage() {
  return <EnquiriesInbox />;
}
