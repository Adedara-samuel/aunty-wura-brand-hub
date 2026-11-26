import type { Metadata } from "next";
import { LoginForm } from "@/components/studio/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/content-studio") ? next : "/content-studio";
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-noir p-12 text-pearl lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 20% 10%, rgba(200,164,106,.22), transparent 70%)" }} />
        <div aria-hidden className="absolute -right-40 -bottom-40 size-[34rem] rounded-full border border-gold/15" />
        <div aria-hidden className="absolute -right-20 -bottom-20 size-[24rem] rounded-full border border-gold/15" />
        <p className="eyebrow relative text-gold!">Content Studio</p>
        <div className="relative">
          <h1 className="display text-6xl leading-[1.02]">Everything your website needs, in one calm place.</h1>
          <p className="mt-6 max-w-md text-pearl/65">
            Add your story, work, services, classes, products and fragrances step by step — and preview exactly how they will look before anything goes live.
          </p>
        </div>
        <p className="relative text-xs text-pearl/40">Private workspace · Drafts are never shown publicly until you publish them.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow lg:hidden">Content Studio</p>
          <h2 className="display mt-3 text-4xl">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue preparing your website content.</p>
          <LoginForm next={safeNext} />
        </div>
      </div>
    </div>
  );
}
