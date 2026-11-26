import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio/shell";
import { getSession } from "@/lib/server/auth";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/content-studio/login");
  return <StudioShell user={{ name: session.name, email: session.email }}>{children}</StudioShell>;
}
