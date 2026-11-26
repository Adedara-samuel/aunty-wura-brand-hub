import type { ModuleId, StudioModuleDef } from "./types";

export const STUDIO_MODULES: StudioModuleDef[] = [
  {
    id: "personal",
    number: 1,
    title: "Personal Information",
    icon: "user-round",
    summary: "Your name, professional title, homepage headline and photographs.",
    why: "This is the very first impression of your brand. It powers the homepage hero, the navigation, browser tabs and how you appear in search results.",
    tips: [
      "Use your name exactly as you want the public to see it.",
      "Your headline should speak to the people you serve, not just describe you.",
      "Send the highest-resolution photo you have — we can always make it smaller, never sharper.",
    ],
    types: ["profile"],
    publicHref: "/",
  },
  {
    id: "about",
    number: 2,
    title: "About Me",
    icon: "book-open-text",
    summary: "Your biography, background, expertise, experience and brand statement.",
    why: "Visitors decide whether to trust and work with you on the About page. A clear story with real experience builds credibility.",
    tips: [
      "Write the way you speak — warm and confident beats formal and stiff.",
      "Only include achievements and experience that are real and that you are happy to share.",
      "Short paragraphs are easier to read on a phone.",
    ],
    types: ["about"],
    publicHref: "/about",
  },
  {
    id: "portfolio",
    number: 3,
    title: "Portfolio",
    icon: "layout-grid",
    summary: "Your previous work, projects, collaborations and professional activities.",
    why: "Your portfolio is proof. Brands and clients want to see what you have done before they hire you.",
    tips: [
      "Start with your 3–6 strongest projects; you can add more any time.",
      "Use consistent category names so the filters stay tidy.",
      "Only show client work you have permission to share.",
    ],
    types: ["portfolio"],
    publicHref: "/portfolio",
  },
  {
    id: "services",
    number: 4,
    title: "Services",
    icon: "briefcase-business",
    summary: "Each service you offer, with pricing, deliverables and timelines.",
    why: "Clear services help the right clients understand how to work with you, and they generate your rate card automatically.",
    tips: [
      "Add one entry per package or service.",
      "Choose 'Custom quote' if the price depends on the project — you never have to publish a number.",
      "Be specific about what is included; it prevents back-and-forth later.",
    ],
    types: ["service"],
    publicHref: "/services",
  },
  {
    id: "rate-card",
    number: 5,
    title: "Rate Card",
    icon: "receipt-text",
    summary: "The introduction, booking process, payment terms and policies for your rate card.",
    why: "Your rate card is shared with brands and can be downloaded as a polished PDF. The prices come from your Services; this section adds the terms around them.",
    tips: [
      "Add your services first — the rate card fills itself in.",
      "Upload an existing rate card if you have one, so we can match it.",
      "Download the PDF preview to see exactly what brands will receive.",
    ],
    types: ["rateCard"],
    publicHref: "/rate-card",
  },
  {
    id: "classes",
    number: 6,
    title: "Classes",
    icon: "graduation-cap",
    summary: "Your classes and training programmes, linked to their existing Selar or Nestuge pages.",
    why: "Each class gets a beautiful page on your own website that sends buyers to the purchase page you already have. Nothing is moved off Selar or Nestuge.",
    tips: [
      "Copy the description and outline from your existing sales page, then refine it.",
      "Paste the full purchase link — test it after saving with the 'Preview' tab.",
      "Use the same banner artwork as your sales page for recognition.",
    ],
    types: ["class"],
    publicHref: "/classes",
  },
  {
    id: "products",
    number: 7,
    title: "Digital Products",
    icon: "file-stack",
    summary: "Templates and downloadable resources, linked to their purchase pages.",
    why: "A browsable product shop on your own site makes your templates easier to discover and share.",
    tips: [
      "Show what is inside with 2–4 preview images.",
      "List exactly what the buyer receives.",
      "Group products with consistent category names.",
    ],
    types: ["product"],
    publicHref: "/templates",
  },
  {
    id: "fragrance",
    number: 8,
    title: "Fragrance Business",
    icon: "spray-can",
    summary: "Your fragrance brand, product catalogue, sizes, prices, stock and WhatsApp ordering.",
    why: "The fragrance business has its own distinct, luxurious page. Customers browse the catalogue and order directly on WhatsApp.",
    tips: [
      "Fill in the brand details first, then add each product.",
      "Add every size with its own price.",
      "Keep stock status up to date so customers aren't disappointed.",
    ],
    types: ["fragranceBrand", "fragrance"],
    publicHref: "/fragrance",
  },
  {
    id: "gallery",
    number: 9,
    title: "Gallery & Media",
    icon: "images",
    summary: "Event photos, behind-the-scenes and lifestyle images, plus your full media library.",
    why: "A gallery adds personality and life to the website. The media library keeps every file you upload organised in one place.",
    tips: [
      "Upload your best lifestyle and event photos here.",
      "Every file uploaded anywhere in the Studio appears in the media library.",
      "You can download all your media as one ZIP file.",
    ],
    types: ["gallery"],
    publicHref: "/about#gallery",
  },
  {
    id: "contact",
    number: 10,
    title: "Social Media & Contact",
    icon: "at-sign",
    summary: "Your email, WhatsApp, phone, social media accounts and enquiry form wording.",
    why: "These details power every contact button, the footer and the enquiry forms across the website.",
    tips: [
      "Double-check the WhatsApp number includes the country code.",
      "Paste full profile links, e.g. https://instagram.com/yourname.",
      "Enquiries sent through the website arrive in your Studio inbox.",
    ],
    types: ["contact"],
    publicHref: "/contact",
  },
];

export function getModule(id: string): StudioModuleDef | undefined {
  return STUDIO_MODULES.find((m) => m.id === id);
}

export function moduleForType(type: string): StudioModuleDef | undefined {
  return STUDIO_MODULES.find((m) => (m.types as string[]).includes(type));
}

export const MODULE_IDS = STUDIO_MODULES.map((m) => m.id) as ModuleId[];
