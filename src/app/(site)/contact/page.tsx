import type { Metadata } from "next";
import { ContactView } from "@/components/site/sections/contact";
import type { EnquiryKind } from "@/lib/enquiry-schema";

export const metadata: Metadata = { title: "Contact" };

type Props = { searchParams: Promise<{ type?: string; service?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kind = (["business", "collaboration", "general"].includes(sp.type ?? "") ? sp.type : "business") as EnquiryKind;
  return <ContactView initialKind={kind} initialService={typeof sp.service === "string" ? sp.service.slice(0, 200) : ""} />;
}
