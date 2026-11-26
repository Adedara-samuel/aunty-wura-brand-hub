import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grain flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-6xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted-foreground">The page you&apos;re looking for has moved or is no longer available.</p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        Back to the homepage
      </Link>
    </div>
  );
}
