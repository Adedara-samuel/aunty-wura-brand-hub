import { redirect } from "next/navigation";
import { PreviewFrame } from "@/components/studio/preview-frame";
import { getSession } from "@/lib/server/auth";

/** Isolated page rendered inside the Studio preview iframe (receives draft content via postMessage). */
export default async function FramePage() {
  if (!(await getSession())) redirect("/content-studio/login");
  return <PreviewFrame />;
}
