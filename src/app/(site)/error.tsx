"use client";

import { Button } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-4 text-5xl">This page couldn&apos;t load</h1>
      <p className="mt-4 max-w-md text-muted-foreground">Please try again in a moment.</p>
      <Button className="mt-8" onClick={reset}>Try again</Button>
    </div>
  );
}
