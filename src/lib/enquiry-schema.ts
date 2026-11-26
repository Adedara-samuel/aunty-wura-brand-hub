import { z } from "zod";

export const ENQUIRY_KINDS = [
  { value: "business", label: "Business enquiry", hint: "Book a service, request a quote or hire me for a project." },
  { value: "collaboration", label: "Collaboration", hint: "Brand partnerships, sponsorships, features and joint projects." },
  { value: "general", label: "General", hint: "Questions about classes, templates, fragrances or anything else." },
] as const;

export type EnquiryKind = (typeof ENQUIRY_KINDS)[number]["value"];

export const enquirySchema = z.object({
  kind: z.enum(["business", "collaboration", "general"]),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(320),
  phone: z.string().trim().max(40).optional().default(""),
  organisation: z.string().trim().max(160).optional().default(""),
  subject: z.string().trim().max(200).optional().default(""),
  service: z.string().trim().max(200).optional().default(""),
  budget: z.string().trim().max(120).optional().default(""),
  timeline: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "Please add a little more detail (at least 10 characters)").max(5000),
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional().default(""),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
