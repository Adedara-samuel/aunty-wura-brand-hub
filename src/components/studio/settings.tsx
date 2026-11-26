"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/display";
import { Input, Label } from "@/components/ui/primitives";
import { api, useEntries } from "@/lib/studio/api";
import { EntryEditor } from "./entry-editor";
import { PageHeader } from "./shell";

function PasswordCard() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const mismatch = confirm.length > 0 && next !== confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 10) return toast.error("Use at least 10 characters for your new password");
    if (next !== confirm) return toast.error("The new passwords don't match");
    setBusy(true);
    try {
      await api("/api/studio/account/password", { method: "POST", body: JSON.stringify({ current, next }) });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 md:p-7">
      <h3 className="flex items-center gap-2 font-display text-2xl"><KeyRound className="size-5" /> Change your password</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">Use a long password you don&apos;t use anywhere else.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="pw-current">Current password</Label>
          <Input id="pw-current" type="password" autoComplete="current-password" className="mt-2" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pw-new">New password</Label>
          <Input id="pw-new" type="password" autoComplete="new-password" className="mt-2" value={next} onChange={(e) => setNext(e.target.value)} minLength={10} required />
        </div>
        <div>
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <Input id="pw-confirm" type="password" autoComplete="new-password" className="mt-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} required />
          {mismatch && <p className="mt-1.5 text-xs text-destructive">Passwords don&apos;t match</p>}
        </div>
        <div className="md:col-span-3">
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Update password</Button>
        </div>
      </form>
    </Card>
  );
}

export function SettingsPage() {
  const { data: entries, isLoading } = useEntries();
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Site settings"
        description="Brand colour, search engine details and pre-launch options. Settings apply to the website as soon as they are saved."
      />
      <div className="mx-auto max-w-[110rem] space-y-8 px-4 py-6 md:px-8">
        {isLoading || !entries ? (
          <Skeleton className="h-96" />
        ) : (
          <EntryEditor type="settings" entry={entries.find((e) => e.type === "settings") ?? null} allEntries={entries} />
        )}
        <div className="max-w-5xl pb-12">
          <PasswordCard />
        </div>
      </div>
    </div>
  );
}
