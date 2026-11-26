import type { Metadata } from "next";
import { ClassesView } from "@/components/site/sections/classes";

export const metadata: Metadata = { title: "Classes" };

export default function ClassesPage() {
  return <ClassesView />;
}
