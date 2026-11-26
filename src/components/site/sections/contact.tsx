"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/primitives";
import { ENQUIRY_KINDS, enquirySchema, type EnquiryInput, type EnquiryKind } from "@/lib/enquiry-schema";
import { socialLabel, telLink, whatsappLink } from "@/lib/format";
import { cn, str } from "@/lib/utils";
import { ExtLink, Ph } from "../placeholder";
import { useSite } from "../site-context";
import { PageIntro, Prose } from "./common";
import { SocialIcon } from "../social-icon";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-destructive">{message}</p>;
}

export function EnquiryForm({ initialKind = "business", initialService = "" }: { initialKind?: EnquiryKind; initialService?: string }) {
  const { site, inStudio } = useSite();
  const [status, setStatus] = React.useState<"idle" | "sent" | "error">("idle");
  const [serverError, setServerError] = React.useState("");
  const form = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { kind: initialKind, name: "", email: "", phone: "", organisation: "", subject: "", service: initialService, budget: "", timeline: "", message: "", website: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const { errors, isSubmitting } = form.formState;
  const services = site.services.map((s) => str(s.data.name)).filter(Boolean);

  const onSubmit = form.handleSubmit(async (values) => {
    if (inStudio) return;
    setServerError("");
    try {
      const res = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(body.error || "Your message couldn't be sent. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      form.reset({ ...form.getValues(), name: "", email: "", phone: "", organisation: "", subject: "", message: "", budget: "", timeline: "" });
    } catch {
      setServerError("Network error — please check your connection and try again.");
      setStatus("error");
    }
  });

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center rounded-[1.75rem] border bg-surface px-6 py-16 text-center" role="status">
        <CheckCircle2 className="size-12 text-success" />
        <p className="mt-5 font-display text-3xl">Thank you — message received</p>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your enquiry has been sent{str(site.contact?.responseTime) ? `. Expected response: ${str(site.contact?.responseTime)}.` : ". I'll be in touch soon."}
        </p>
        <Button variant="outline" className="mt-8" onClick={() => setStatus("idle")}>Send another message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[1.75rem] border bg-surface p-5 shadow-[0_30px_80px_-50px_rgba(31,26,23,0.4)] md:p-8">
      <fieldset>
        <legend className="eyebrow">What is this about?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ENQUIRY_KINDS.map((k) => (
            <label
              key={k.value}
              className={cn(
                "cursor-pointer rounded-xl border p-3.5 transition",
                kind === k.value ? "border-primary bg-accent ring-1 ring-primary/40" : "hover:border-foreground/30",
              )}
            >
              <input type="radio" value={k.value} {...form.register("kind")} className="sr-only" />
              <span className="block text-sm font-semibold">{k.label}</span>
              <span className="mt-1 block text-xs leading-snug text-muted-foreground">{k.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {kind === "collaboration" && str(site.contact?.collaborationNote) && (
        <div className="mt-5 rounded-xl bg-surface-2/70 p-4 text-sm leading-relaxed text-muted-foreground">
          {str(site.contact?.collaborationNote)}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="enq-name">Your name *</Label>
          <Input id="enq-name" autoComplete="name" className="mt-2" aria-invalid={!!errors.name} {...form.register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="enq-email">Email address *</Label>
          <Input id="enq-email" type="email" autoComplete="email" className="mt-2" aria-invalid={!!errors.email} {...form.register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="enq-phone">Phone / WhatsApp</Label>
          <Input id="enq-phone" type="tel" autoComplete="tel" className="mt-2" {...form.register("phone")} />
        </div>
        <div>
          <Label htmlFor="enq-org">{kind === "general" ? "Organisation (optional)" : kind === "collaboration" ? "Brand / organisation" : "Company / business"}</Label>
          <Input id="enq-org" autoComplete="organization" className="mt-2" {...form.register("organisation")} />
        </div>
        {kind === "business" && (
          <>
            <div>
              <Label htmlFor="enq-service">Service of interest</Label>
              {services.length > 0 ? (
                <NativeSelect id="enq-service" className="mt-2" {...form.register("service")}>
                  <option value="">Not sure yet</option>
                  {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="Custom package">Custom package</option>
                </NativeSelect>
              ) : (
                <Input id="enq-service" className="mt-2" {...form.register("service")} />
              )}
            </div>
            <div>
              <Label htmlFor="enq-budget">Budget (optional)</Label>
              <Input id="enq-budget" className="mt-2" {...form.register("budget")} />
            </div>
          </>
        )}
        {kind !== "business" && (
          <div className="sm:col-span-2">
            <Label htmlFor="enq-subject">Subject</Label>
            <Input id="enq-subject" className="mt-2" {...form.register("subject")} />
          </div>
        )}
        {kind !== "general" && (
          <div className="sm:col-span-2">
            <Label htmlFor="enq-timeline">Timeline or key dates (optional)</Label>
            <Input id="enq-timeline" className="mt-2" {...form.register("timeline")} />
          </div>
        )}
        <div className="sm:col-span-2">
          <Label htmlFor="enq-message">Message *</Label>
          <Textarea
            id="enq-message"
            rows={6}
            className="mt-2"
            aria-invalid={!!errors.message}
            placeholder={kind === "collaboration" ? "Tell me about your brand, the campaign and what you have in mind…" : "How can I help?"}
            {...form.register("message")}
          />
          <FieldError message={errors.message?.message} />
        </div>
        <div className="hidden" aria-hidden>
          <label>
            Website <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </label>
        </div>
      </div>

      {status === "error" && serverError && (
        <p className="mt-5 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{serverError}</p>
      )}

      <div className="mt-7 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Your details are only used to reply to your enquiry.</p>
        <Button type="submit" size="lg" disabled={isSubmitting || inStudio} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="animate-spin" />} {isSubmitting ? "Sending…" : "Send enquiry"}
        </Button>
      </div>
    </form>
  );
}

export function ContactView({ initialKind, initialService }: { initialKind?: EnquiryKind; initialService?: string }) {
  const { site, ph } = useSite();
  const c = site.contact;
  const email = str(c?.businessEmail);
  const wa = str(c?.whatsapp);
  const phone = str(c?.phone);
  const socials = ((Array.isArray(c?.socials) ? c!.socials : []) as Record<string, string>[]).filter((s) => s.url);

  const methods = [
    email && { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    wa && { icon: MessageCircle, label: "WhatsApp", value: wa, href: whatsappLink(wa, "Hello!"), ext: true },
    phone && { icon: Phone, label: "Call", value: phone, href: telLink(phone) },
    str(c?.managementEmail) && { icon: UserRound, label: "Management", value: str(c?.managementEmail), href: `mailto:${str(c?.managementEmail)}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string; ext?: boolean }[];

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Let’s work together"
        intro={str(c?.contactIntro) ? <Prose text={str(c?.contactIntro)} className="text-lg" /> : ph ? <Ph>Your contact page introduction.</Ph> : undefined}
      />
      <section className="container-page grid gap-12 py-14 md:py-20 lg:grid-cols-12">
        <aside className="space-y-8 lg:col-span-4">
          <div className="space-y-3">
            {methods.length === 0 && ph && (
              <div className="rounded-2xl border border-dashed p-5 text-sm"><Ph>Email, WhatsApp and phone details</Ph></div>
            )}
            {methods.map((m) =>
              m.ext ? (
                <ExtLink key={m.label} href={m.href} className="flex items-center gap-4 rounded-2xl border bg-surface p-4 transition hover:border-primary">
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><m.icon className="size-5" /></span>
                  <span className="min-w-0"><span className="eyebrow block">{m.label}</span><span className="block truncate font-medium">{m.value}</span></span>
                </ExtLink>
              ) : (
                <a key={m.label} href={m.href} className="flex items-center gap-4 rounded-2xl border bg-surface p-4 transition hover:border-primary">
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><m.icon className="size-5" /></span>
                  <span className="min-w-0"><span className="eyebrow block">{m.label}</span><span className="block truncate font-medium">{m.value}</span></span>
                </a>
              ),
            )}
          </div>
          {(str(c?.location) || str(c?.responseTime)) && (
            <div className="space-y-3 text-sm text-muted-foreground">
              {str(c?.location) && <p className="flex items-center gap-2"><MapPin className="size-4" /> {str(c?.location)}</p>}
              {str(c?.responseTime) && <p className="flex items-center gap-2"><Clock className="size-4" /> Usually replies {str(c?.responseTime).toLowerCase()}</p>}
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <p className="eyebrow">Follow along</p>
              <ul className="mt-4 divide-y border-y">
                {socials.map((s, i) => (
                  <li key={i}>
                    <ExtLink href={s.url} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-primary">
                      <span className="flex items-center gap-3"><SocialIcon platform={s.platform} /> {socialLabel(s.platform)}</span>
                      <span className="text-muted-foreground">{s.handle}{s.followers ? ` · ${s.followers}` : ""}</span>
                    </ExtLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
        <div className="lg:col-span-8">
          <EnquiryForm initialKind={initialKind} initialService={initialService} />
        </div>
      </section>
    </>
  );
}
