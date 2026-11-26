import { Overview } from "@/components/studio/overview";
import { getSession } from "@/lib/server/auth";

export default async function StudioHome() {
  const session = await getSession();
  return <Overview name={session?.name ?? ""} />;
}
