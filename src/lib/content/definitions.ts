import type { ContentTypeDef, ContentTypeId, FieldDef, FieldOption } from "./types";

/* -------------------------------------------------------------------------- */
/*  Shared option lists                                                        */
/* -------------------------------------------------------------------------- */

export const CURRENCIES: FieldOption[] = [
  { value: "NGN", label: "NGN — Nigerian Naira (₦)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GHS", label: "GHS — Ghanaian Cedi (₵)" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
];

export const SALES_PLATFORMS: FieldOption[] = [
  { value: "selar", label: "Selar" },
  { value: "nestuge", label: "Nestuge" },
  { value: "other", label: "Another platform" },
];

export const SOCIAL_PLATFORMS: FieldOption[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "telegram", label: "Telegram" },
  { value: "website", label: "Other website" },
];

export const AVAILABILITY: FieldOption[] = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "pre_order", label: "Pre-order" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Out of stock" },
];

export const CLASS_FORMATS: FieldOption[] = [
  { value: "self_paced", label: "Self-paced (recorded)" },
  { value: "live", label: "Live sessions" },
  { value: "cohort", label: "Cohort-based" },
  { value: "one_on_one", label: "One-on-one" },
  { value: "hybrid", label: "Hybrid" },
];

/* -------------------------------------------------------------------------- */
/*  Reusable field builders                                                   */
/* -------------------------------------------------------------------------- */

const priceField = (overrides: Partial<FieldDef> = {}): FieldDef => ({
  key: "price",
  type: "price",
  label: "Price",
  heading: "How is this priced?",
  prompt:
    "Choose a fixed price, a 'starting from' price, a custom quote, or free. Enter the amount without commas or currency symbols.",
  required: true,
  ...overrides,
});

const platformFields = (noun: string): FieldDef[] => [
  {
    key: "platform",
    type: "select",
    label: "Sales platform",
    heading: `Where is this ${noun} sold right now?`,
    prompt: `Pick the platform where people currently pay for this ${noun}. Visitors will be sent there to complete their purchase.`,
    options: SALES_PLATFORMS,
    required: true,
    width: "half",
  },
  {
    key: "platformName",
    type: "text",
    label: "Platform name",
    heading: "Which platform?",
    prompt: "Only needed if you chose 'Another platform'.",
    width: "half",
    showWhen: { key: "platform", equals: ["other"] },
  },
  {
    key: "purchaseUrl",
    type: "url",
    label: "Purchase / registration link",
    heading: "Paste the purchase page link",
    prompt: `Open the ${noun} on Selar, Nestuge or your platform, copy the full address from the browser bar and paste it here. Nothing is migrated — we simply link to the page you already have.`,
    placeholder: "https://selar.co/…",
    required: true,
  },
  {
    key: "buttonLabel",
    type: "text",
    label: "Button text",
    heading: "What should the buy button say?",
    prompt: "Optional. Leave blank to use a sensible default such as 'Enrol on Selar'.",
    placeholder: "e.g. Enrol now",
    width: "half",
  },
];

const featuredField = (noun: string): FieldDef => ({
  key: "featured",
  type: "toggle",
  label: "Feature on homepage",
  heading: `Highlight this ${noun} on the homepage`,
  prompt: "Featured items are shown first and appear in the homepage highlights.",
  defaultValue: false,
});

/* -------------------------------------------------------------------------- */
/*  Content types                                                             */
/* -------------------------------------------------------------------------- */

export const CONTENT_TYPES: Record<ContentTypeId, ContentTypeDef> = {
  profile: {
    id: "profile",
    kind: "singleton",
    singular: "Personal information",
    plural: "Personal information",
    titleField: "fullName",
    groups: [
      {
        title: "Your name and title",
        description: "This is the first thing visitors read on the homepage and in search results.",
        fields: [
          {
            key: "fullName",
            type: "text",
            label: "Full name",
            heading: "What is your full name?",
            prompt: "Write it exactly as you want it to appear across the website.",
            placeholder: "Your full name",
            required: true,
            width: "half",
          },
          {
            key: "displayName",
            type: "text",
            label: "Display / brand name",
            heading: "Do you use a shorter or brand name?",
            prompt:
              "Optional. If people know you by a nickname, a title or a brand name, add it here. We will use it in the logo area and navigation.",
            placeholder: "e.g. the name on your social handles",
            width: "half",
          },
          {
            key: "professionalTitle",
            type: "text",
            label: "Professional title",
            heading: "How do you describe what you do, in a few words?",
            prompt:
              "A short line that sits under your name. Mention your main roles — you can list two or three, separated by commas or a dot.",
            example: "Content Creator · Brand Strategist · Educator",
            required: true,
          },
          {
            key: "tagline",
            type: "textarea",
            label: "Homepage headline",
            heading: "What is the one sentence you want every visitor to remember?",
            prompt:
              "This is the large headline on your homepage. Speak to the people you serve and the result you help them get. Keep it under 20 words.",
            example:
              "I help growing brands tell their story with content people actually stop to watch.",
            rows: 2,
            maxLength: 180,
            required: true,
          },
          {
            key: "location",
            type: "text",
            label: "Location",
            heading: "Where are you based?",
            prompt: "Optional. A city and country is enough. Add 'available worldwide' if you work remotely.",
            placeholder: "City, Country",
            width: "half",
          },
          {
            key: "availability",
            type: "text",
            label: "Availability note",
            heading: "Are you currently taking on work?",
            prompt: "Optional. A short status line shown on the homepage.",
            example: "Now booking brand collaborations for the next quarter",
            width: "half",
          },
        ],
      },
      {
        title: "Photographs",
        description:
          "High-quality images make the biggest difference to how premium the website feels. Use bright, sharp photos at least 1600px wide.",
        fields: [
          {
            key: "photo",
            type: "image",
            label: "Professional photograph",
            heading: "Upload your main professional photograph",
            prompt:
              "A portrait-orientation photo (taller than it is wide) works best for the homepage. Good lighting, a clean background and a confident expression.",
            required: true,
          },
          {
            key: "heroImage",
            type: "image",
            label: "Secondary photograph",
            heading: "Add a second photo for variety (optional)",
            prompt: "A lifestyle or 'at work' photo. It is used on the About page alongside your story.",
          },
          {
            key: "logo",
            type: "image",
            label: "Logo",
            heading: "Do you have a logo?",
            prompt: "Optional. Upload a PNG or SVG with a transparent background. If you don't have one, your name is set in an elegant typeface instead.",
          },
        ],
      },
    ],
  },

  about: {
    id: "about",
    kind: "singleton",
    singular: "About me",
    plural: "About me",
    titleField: "shortBio",
    groups: [
      {
        title: "Your story",
        fields: [
          {
            key: "shortBio",
            type: "textarea",
            label: "Short biography",
            heading: "Introduce yourself in two or three sentences",
            prompt:
              "This short version appears on the homepage. Say who you are, what you do and who you do it for. Write in first person ('I…') or third person ('She…') — just be consistent.",
            example:
              "I'm a content creator and educator who helps small businesses show up online with confidence. Through brand collaborations, classes and ready-to-use templates, I make professional content feel achievable.",
            rows: 4,
            maxLength: 500,
            required: true,
          },
          {
            key: "fullBio",
            type: "textarea",
            label: "Detailed biography",
            heading: "Tell us about yourself",
            prompt:
              "Introduce yourself, explain what you do, your professional background, your experience and what you want people to know about your brand. Several short paragraphs read better than one long one — leave an empty line between paragraphs.",
            example:
              "Start with how you got started, then the work you are known for now, and end with what you are building next and why it matters to you.",
            rows: 10,
            required: true,
          },
          {
            key: "brandStatement",
            type: "textarea",
            label: "Personal brand statement",
            heading: "What do you stand for?",
            prompt:
              "One or two sentences that capture your mission or philosophy. It is displayed as a large quote on the About page.",
            example: "Great content isn't about being perfect — it's about being clear, consistent and unmistakably you.",
            rows: 3,
            maxLength: 300,
            required: true,
          },
          {
            key: "background",
            type: "textarea",
            label: "Professional background",
            heading: "What is your professional background?",
            prompt:
              "Your education, training, previous roles or industries you have worked in. Only include what you are comfortable sharing publicly.",
            rows: 5,
            required: true,
          },
        ],
      },
      {
        title: "Expertise and experience",
        fields: [
          {
            key: "expertise",
            type: "tags",
            label: "Areas of expertise",
            heading: "What are your areas of expertise?",
            prompt: "Add each skill or speciality separately — press Enter after each one. Aim for 4 to 8.",
            example: "Content strategy, Short-form video, Brand storytelling, Social media growth",
            required: true,
          },
          {
            key: "experience",
            type: "repeater",
            label: "Experience",
            itemLabel: "role",
            heading: "List your key roles and experience",
            prompt: "Optional but recommended. Add the roles, positions or ventures you want visitors to know about.",
            itemFields: [
              { key: "role", type: "text", label: "Role / position", required: true, width: "half" },
              { key: "organisation", type: "text", label: "Organisation or business", width: "half" },
              { key: "period", type: "text", label: "Period", placeholder: "e.g. 2021 – present", width: "half" },
              { key: "description", type: "textarea", label: "What you did", rows: 2 },
            ],
          },
          {
            key: "achievements",
            type: "repeater",
            label: "Achievements",
            itemLabel: "achievement",
            heading: "Achievements, awards and milestones",
            prompt:
              "Optional. Awards, features, speaking engagements, community milestones or certifications. Only add things that are real and verifiable.",
            itemFields: [
              { key: "title", type: "text", label: "Achievement", required: true, width: "half" },
              { key: "year", type: "text", label: "Year", width: "half" },
              { key: "description", type: "textarea", label: "Details", rows: 2 },
            ],
          },
          {
            key: "values",
            type: "list",
            label: "Values",
            itemLabel: "value",
            heading: "What values guide your work? (optional)",
            prompt: "Short phrases such as 'Clarity over complexity'. Shown as a small list on the About page.",
          },
        ],
      },
      {
        title: "Supporting documents",
        fields: [
          {
            key: "cv",
            type: "file",
            label: "CV, media kit or profile document",
            heading: "Upload your CV, media kit or company profile (optional)",
            prompt: "PDF preferred. It helps us write accurate copy and can be offered as a download on the website if you want.",
            accept: ["document"],
          },
          {
            key: "offerCvDownload",
            type: "toggle",
            label: "Offer the document as a public download",
            heading: "Should visitors be able to download this document?",
            defaultValue: false,
          },
        ],
      },
    ],
  },

  portfolio: {
    id: "portfolio",
    kind: "collection",
    singular: "Portfolio project",
    plural: "Portfolio projects",
    titleField: "title",
    subtitleField: "category",
    categoryField: "category",
    imageField: "coverImage",
    detailPath: "/portfolio",
    groups: [
      {
        title: "Project basics",
        fields: [
          {
            key: "title",
            type: "text",
            label: "Project title",
            heading: "What is this project called?",
            prompt: "A clear, specific title. Mention the brand or campaign if you can share it.",
            example: "Product launch campaign — short-form video series",
            required: true,
          },
          {
            key: "category",
            type: "text",
            label: "Category",
            heading: "What kind of work is this?",
            prompt:
              "Use the same category name for similar projects so visitors can filter your portfolio. Pick from categories you have already used, or type a new one.",
            example: "Brand collaboration",
            suggestFromExisting: true,
            required: true,
            width: "half",
          },
          {
            key: "date",
            type: "date",
            label: "Project date",
            heading: "When did it happen?",
            prompt: "The month the project was delivered or published.",
            width: "half",
          },
          {
            key: "client",
            type: "text",
            label: "Client or brand",
            heading: "Who was it for?",
            prompt: "Optional. Only name a client if you have permission to show the work publicly.",
            width: "half",
          },
          {
            key: "role",
            type: "text",
            label: "Your role",
            heading: "What was your role?",
            prompt: "Optional. e.g. Creator, Host, Strategist, Producer.",
            width: "half",
          },
          {
            key: "summary",
            type: "textarea",
            label: "Short summary",
            heading: "Describe the project in one or two sentences",
            prompt: "Shown on the portfolio card. Focus on what you did and for whom.",
            rows: 3,
            maxLength: 240,
            required: true,
          },
          {
            key: "description",
            type: "textarea",
            label: "Full description",
            heading: "Tell the story of the project",
            prompt:
              "What was the brief or challenge? What did you create? How did you approach it? This appears on the project's own page.",
            rows: 7,
          },
          {
            key: "results",
            type: "list",
            label: "Results",
            itemLabel: "result",
            heading: "What were the results? (optional)",
            prompt: "Add real, measurable outcomes only — views, engagement, sales, sign-ups, press coverage.",
            example: "Reached a large new audience in the first week",
          },
        ],
      },
      {
        title: "Images, videos and links",
        fields: [
          {
            key: "coverImage",
            type: "image",
            label: "Cover image",
            heading: "Choose a cover image",
            prompt: "The image shown on the portfolio grid. Landscape or square works best.",
            required: true,
          },
          {
            key: "gallery",
            type: "images",
            label: "Project images and videos",
            heading: "Add more images or video clips",
            prompt: "Optional. Upload stills, behind-the-scenes photos or short video files (MP4).",
            accept: ["image", "video"],
          },
          {
            key: "videoLinks",
            type: "list",
            label: "Video links",
            itemLabel: "link",
            heading: "Links to videos (YouTube, Instagram, TikTok)",
            prompt: "Optional. Paste links to the published content. YouTube links will play directly on the page.",
            placeholder: "https://",
          },
          {
            key: "links",
            type: "repeater",
            label: "Related links",
            itemLabel: "link",
            heading: "Any other links? (optional)",
            prompt: "e.g. a press article, the campaign page or the brand's post.",
            itemFields: [
              { key: "label", type: "text", label: "Link text", required: true, width: "half" },
              { key: "url", type: "url", label: "Address", required: true, width: "half" },
            ],
          },
          featuredField("project"),
        ],
      },
    ],
  },

  service: {
    id: "service",
    kind: "collection",
    singular: "Service",
    plural: "Services",
    titleField: "name",
    subtitleField: "category",
    categoryField: "category",
    imageField: "image",
    groups: [
      {
        title: "About this service",
        fields: [
          {
            key: "name",
            type: "text",
            label: "Service name",
            heading: "What is the service called?",
            example: "Sponsored Instagram Reel",
            required: true,
            width: "half",
          },
          {
            key: "category",
            type: "text",
            label: "Service category",
            heading: "Which group does it belong to?",
            prompt: "Services with the same category are grouped together on the website and rate card.",
            example: "Content creation",
            suggestFromExisting: true,
            required: true,
            width: "half",
          },
          {
            key: "summary",
            type: "textarea",
            label: "Short description",
            heading: "Describe the service in one or two sentences",
            prompt: "What does the client get and why is it valuable?",
            rows: 3,
            maxLength: 260,
            required: true,
          },
          {
            key: "description",
            type: "textarea",
            label: "Full description",
            heading: "More detail (optional)",
            prompt: "How it works, what makes your approach different, and who it is ideal for.",
            rows: 5,
          },
        ],
      },
      {
        title: "Pricing and delivery",
        fields: [
          priceField(),
          {
            key: "deliveryTimeline",
            type: "text",
            label: "Delivery timeline",
            heading: "How long does it take to deliver?",
            example: "5–7 working days after the brief is approved",
            required: true,
          },
          {
            key: "includes",
            type: "list",
            label: "What is included",
            itemLabel: "item",
            heading: "What is included?",
            prompt: "List each deliverable separately. Be specific — clients compare these line by line.",
            example: "1 × 60-second vertical video",
            required: true,
          },
          {
            key: "requirements",
            type: "list",
            label: "Additional requirements",
            itemLabel: "requirement",
            heading: "What do you need from the client? (optional)",
            prompt: "e.g. product samples, a signed brief, 50% deposit, brand guidelines.",
          },
          {
            key: "addOns",
            type: "repeater",
            label: "Add-ons",
            itemLabel: "add-on",
            heading: "Optional extras (add-ons)",
            prompt: "Extra options clients can pay for, such as usage rights or rush delivery.",
            itemFields: [
              { key: "name", type: "text", label: "Add-on", required: true, width: "half" },
              { key: "price", type: "text", label: "Price", placeholder: "e.g. 20000 or 'on request'", width: "half" },
            ],
          },
        ],
      },
      {
        title: "Presentation",
        fields: [
          {
            key: "image",
            type: "image",
            label: "Service image",
            heading: "Add an image or example (optional)",
            prompt: "A photo or screenshot that shows this kind of work.",
          },
          {
            key: "examples",
            type: "images",
            label: "Examples",
            heading: "More examples (optional)",
            accept: ["image", "video"],
          },
          {
            key: "showOnRateCard",
            type: "toggle",
            label: "Include on the rate card",
            heading: "Include this service on the rate card",
            prompt: "Turn off for services you only discuss privately.",
            defaultValue: true,
          },
          featuredField("service"),
        ],
      },
    ],
  },

  rateCard: {
    id: "rateCard",
    kind: "singleton",
    singular: "Rate card",
    plural: "Rate card",
    titleField: "title",
    groups: [
      {
        title: "Rate card details",
        description:
          "Your rate card is built automatically from the services you add in the Services section. Here you add the introduction, terms and policies that frame it.",
        fields: [
          {
            key: "title",
            type: "text",
            label: "Rate card title",
            heading: "What should the rate card be called?",
            example: "Rate Card",
            defaultValue: "Rate Card",
            required: true,
            width: "half",
          },
          {
            key: "validity",
            type: "text",
            label: "Validity period",
            heading: "How long are these rates valid?",
            prompt: "Optional. e.g. a year, or 'until further notice'.",
            width: "half",
          },
          {
            key: "intro",
            type: "textarea",
            label: "Introduction",
            heading: "Write a short welcome for brands and clients",
            prompt: "Explain who the rate card is for and invite them to get in touch for custom packages.",
            example:
              "Thank you for your interest in working together. Below are my standard packages — every collaboration can be tailored to your goals.",
            rows: 4,
            required: true,
          },
          {
            key: "bookingProcess",
            type: "textarea",
            label: "Booking process",
            heading: "How does someone book you?",
            prompt: "Describe the steps from first enquiry to delivery.",
            example: "1. Send an enquiry  2. Receive a proposal  3. Pay a deposit to confirm  4. Content is delivered for review",
            rows: 4,
            required: true,
          },
          {
            key: "paymentTerms",
            type: "textarea",
            label: "Payment terms",
            heading: "What are your payment terms?",
            prompt: "Deposits, payment methods, when the balance is due.",
            rows: 3,
            required: true,
          },
          {
            key: "policies",
            type: "list",
            label: "Policies",
            itemLabel: "policy",
            heading: "Policies (optional)",
            prompt: "Revisions, cancellations, usage rights, exclusivity — one per line.",
          },
          {
            key: "notes",
            type: "textarea",
            label: "Additional notes",
            heading: "Anything else? (optional)",
            rows: 3,
          },
          {
            key: "existingRateCard",
            type: "file",
            label: "Existing rate card",
            heading: "Already have a rate card? Upload it",
            prompt: "Optional. Upload your current rate card (PDF or image) so we can match its pricing and wording.",
            accept: ["document", "image"],
          },
        ],
      },
    ],
  },

  class: {
    id: "class",
    kind: "collection",
    singular: "Class",
    plural: "Classes",
    titleField: "title",
    subtitleField: "format",
    imageField: "banner",
    detailPath: "/classes",
    groups: [
      {
        title: "Course overview",
        fields: [
          {
            key: "title",
            type: "text",
            label: "Class name",
            heading: "What is the class called?",
            prompt: "Use the same name as on Selar or Nestuge so buyers recognise it.",
            required: true,
          },
          {
            key: "summary",
            type: "textarea",
            label: "Short description",
            heading: "Describe the class in one or two sentences",
            prompt: "Shown on the course card. Focus on the transformation — where students start and where they end up.",
            rows: 3,
            maxLength: 260,
            required: true,
          },
          {
            key: "description",
            type: "textarea",
            label: "Full course description",
            heading: "Tell people everything about the class",
            prompt: "You can copy this from your existing sales page and edit it.",
            rows: 7,
            required: true,
          },
          {
            key: "audience",
            type: "textarea",
            label: "Target audience",
            heading: "Who is this class for?",
            prompt: "Describe the ideal student — their level, situation and goals.",
            example: "Beginners who want to start creating content for their small business but don't know where to begin.",
            rows: 3,
            required: true,
          },
          {
            key: "objectives",
            type: "list",
            label: "Learning objectives",
            itemLabel: "objective",
            heading: "What will students be able to do afterwards?",
            prompt: "Start each with an action word: 'Plan…', 'Film…', 'Grow…'.",
            example: "Plan a month of content in one afternoon",
            required: true,
          },
          {
            key: "modules",
            type: "repeater",
            label: "Course outline",
            itemLabel: "module",
            heading: "Course outline or modules",
            prompt: "Optional but recommended. Add each module or lesson in order.",
            itemFields: [
              { key: "title", type: "text", label: "Module title", required: true },
              { key: "description", type: "textarea", label: "What it covers", rows: 2 },
            ],
          },
        ],
      },
      {
        title: "Format and price",
        fields: [
          {
            key: "format",
            type: "select",
            label: "Format",
            heading: "How is the class delivered?",
            options: CLASS_FORMATS,
            width: "half",
          },
          {
            key: "duration",
            type: "text",
            label: "Duration",
            heading: "How long is it?",
            example: "4 weeks · 12 video lessons",
            required: true,
            width: "half",
          },
          {
            key: "startDate",
            type: "text",
            label: "Next start date",
            heading: "When does it start? (optional)",
            prompt: "For live or cohort classes. Leave blank for self-paced.",
            width: "half",
          },
          priceField(),
          ...platformFields("class"),
        ],
      },
      {
        title: "Images",
        fields: [
          {
            key: "banner",
            type: "image",
            label: "Course banner",
            heading: "Upload the course image or promotional banner",
            prompt: "The same artwork you use on Selar or Nestuge is perfect. Landscape (16:9) works best.",
            required: true,
          },
          featuredField("class"),
        ],
      },
    ],
  },

  product: {
    id: "product",
    kind: "collection",
    singular: "Digital product",
    plural: "Digital products & templates",
    titleField: "name",
    subtitleField: "category",
    categoryField: "category",
    imageField: "coverImage",
    detailPath: "/templates",
    groups: [
      {
        title: "Product details",
        fields: [
          {
            key: "name",
            type: "text",
            label: "Product name",
            heading: "What is the product called?",
            required: true,
            width: "half",
          },
          {
            key: "category",
            type: "text",
            label: "Product category",
            heading: "What type of product is it?",
            prompt: "Used for filters on the Templates page. Reuse category names for similar products.",
            example: "Canva templates",
            suggestFromExisting: true,
            required: true,
            width: "half",
          },
          {
            key: "summary",
            type: "textarea",
            label: "Short description",
            heading: "Describe the product in one or two sentences",
            rows: 3,
            maxLength: 240,
            required: true,
          },
          {
            key: "description",
            type: "textarea",
            label: "Full description",
            heading: "Tell buyers more (optional)",
            prompt: "How to use it, what software is needed, and what problem it solves.",
            rows: 6,
          },
          {
            key: "includes",
            type: "list",
            label: "What the buyer gets",
            itemLabel: "item",
            heading: "What exactly does the buyer receive?",
            prompt: "List each file, template or bonus separately.",
            example: "30 editable story templates",
            required: true,
          },
          {
            key: "audience",
            type: "textarea",
            label: "Who it is for",
            heading: "Who is this product for?",
            rows: 2,
            required: true,
          },
          {
            key: "format",
            type: "text",
            label: "File format",
            heading: "Format or software (optional)",
            example: "Canva link · PDF guide",
            width: "half",
          },
        ],
      },
      {
        title: "Price and purchase link",
        fields: [priceField(), ...platformFields("product")],
      },
      {
        title: "Images",
        fields: [
          {
            key: "coverImage",
            type: "image",
            label: "Product cover image",
            heading: "Upload the product cover",
            prompt: "Square (1:1) or portrait (4:5) images look best in the product grid.",
            required: true,
          },
          {
            key: "previewImages",
            type: "images",
            label: "Preview images",
            heading: "Add preview images (optional)",
            prompt: "Show a few pages or screens from inside the product.",
          },
          featuredField("product"),
        ],
      },
    ],
  },

  fragranceBrand: {
    id: "fragranceBrand",
    kind: "singleton",
    singular: "Fragrance brand",
    plural: "Fragrance brand",
    titleField: "brandName",
    groups: [
      {
        title: "The fragrance brand",
        description: "Your fragrance business has its own page with its own look and feel.",
        fields: [
          {
            key: "brandName",
            type: "text",
            label: "Fragrance business name",
            heading: "What is the fragrance business called?",
            required: true,
            width: "half",
          },
          {
            key: "tagline",
            type: "text",
            label: "Tagline",
            heading: "A short tagline (optional)",
            width: "half",
          },
          {
            key: "introduction",
            type: "textarea",
            label: "Brand introduction",
            heading: "Introduce the fragrance brand",
            prompt: "What inspired it, what makes the scents special, and who they are made for.",
            rows: 5,
            required: true,
          },
          {
            key: "logo",
            type: "image",
            label: "Fragrance logo",
            heading: "Fragrance brand logo (optional)",
          },
          {
            key: "heroImage",
            type: "image",
            label: "Fragrance banner image",
            heading: "A beautiful banner photo for the fragrance page",
            prompt: "A styled product shot works well. Landscape orientation.",
          },
        ],
      },
      {
        title: "Ordering and delivery",
        fields: [
          {
            key: "whatsappNumber",
            type: "tel",
            label: "WhatsApp ordering number",
            heading: "Which WhatsApp number takes orders?",
            prompt: "Include the country code, e.g. +234… Visitors tap 'Order on WhatsApp' and a chat opens with the product name already typed.",
            placeholder: "+234…",
            required: true,
            width: "half",
          },
          {
            key: "orderMessage",
            type: "text",
            label: "Order message opening",
            heading: "How should the WhatsApp message start? (optional)",
            prompt: "The product name and size are added automatically after this.",
            placeholder: "Hello, I'd like to order",
            width: "half",
          },
          {
            key: "orderingInstructions",
            type: "textarea",
            label: "Ordering instructions",
            heading: "How does ordering work?",
            prompt: "Explain the steps — message, confirm, pay, receive.",
            rows: 4,
            required: true,
          },
          {
            key: "deliveryInfo",
            type: "textarea",
            label: "Delivery information",
            heading: "How and where do you deliver?",
            prompt: "Locations covered, delivery times, delivery fees, pickup options.",
            rows: 4,
            required: true,
          },
          {
            key: "paymentInfo",
            type: "textarea",
            label: "Payment information",
            heading: "How do customers pay? (optional)",
            rows: 2,
          },
          {
            key: "policies",
            type: "textarea",
            label: "Returns & care",
            heading: "Returns, exchanges or care notes (optional)",
            rows: 3,
          },
        ],
      },
    ],
  },

  fragrance: {
    id: "fragrance",
    kind: "collection",
    singular: "Fragrance",
    plural: "Fragrances",
    titleField: "name",
    subtitleField: "category",
    categoryField: "category",
    imageField: "photos",
    detailPath: "/fragrance",
    groups: [
      {
        title: "The fragrance",
        fields: [
          {
            key: "name",
            type: "text",
            label: "Product name",
            heading: "What is this fragrance called?",
            required: true,
            width: "half",
          },
          {
            key: "category",
            type: "text",
            label: "Fragrance category",
            heading: "What category is it?",
            prompt: "Group your scents the way your customers shop — by family, type or occasion.",
            suggestFromExisting: true,
            required: true,
            width: "half",
          },
          {
            key: "description",
            type: "textarea",
            label: "Product description",
            heading: "Describe how it smells and feels",
            prompt: "Describe the mood, when to wear it and how long it lasts.",
            rows: 4,
            required: true,
          },
          {
            key: "topNotes",
            type: "tags",
            label: "Top notes",
            heading: "Scent notes (optional)",
            prompt: "Top notes — the first impression.",
            width: "half",
          },
          { key: "heartNotes", type: "tags", label: "Heart notes", prompt: "Heart / middle notes.", width: "half" },
          { key: "baseNotes", type: "tags", label: "Base notes", prompt: "Base notes — what lingers.", width: "half" },
          {
            key: "photos",
            type: "images",
            label: "Product photographs",
            heading: "Upload product photographs",
            prompt: "The first photo is the main one. Clean backgrounds and natural light work beautifully.",
            required: true,
          },
        ],
      },
      {
        title: "Sizes, pricing and stock",
        fields: [
          {
            key: "sizes",
            type: "repeater",
            label: "Available sizes",
            itemLabel: "size",
            heading: "Which sizes are available, and at what price?",
            prompt: "Add one row per size. Enter prices as numbers only.",
            required: true,
            itemFields: [
              { key: "label", type: "text", label: "Size", placeholder: "e.g. 50ml", required: true, width: "half" },
              { key: "price", type: "number", label: "Price", required: true, width: "half" },
            ],
          },
          {
            key: "currency",
            type: "select",
            label: "Currency",
            heading: "Currency",
            options: CURRENCIES,
            defaultValue: "NGN",
            required: true,
            width: "half",
          },
          {
            key: "availability",
            type: "select",
            label: "Stock status",
            heading: "Is it available?",
            options: AVAILABILITY,
            defaultValue: "in_stock",
            required: true,
            width: "half",
          },
          {
            key: "variants",
            type: "tags",
            label: "Variants",
            heading: "Other variants (optional)",
            prompt: "e.g. body mist, oil, gift set. Press Enter after each.",
          },
          featuredField("fragrance"),
        ],
      },
    ],
  },

  gallery: {
    id: "gallery",
    kind: "collection",
    singular: "Gallery item",
    plural: "Gallery",
    titleField: "title",
    subtitleField: "category",
    categoryField: "category",
    imageField: "media",
    groups: [
      {
        title: "Gallery item",
        description:
          "Use the gallery for event photos, behind-the-scenes moments and lifestyle images that don't belong to a specific project.",
        fields: [
          {
            key: "media",
            type: "image",
            label: "Photo or video",
            heading: "Upload a photo or short video",
            accept: ["image", "video"],
            required: true,
          },
          { key: "title", type: "text", label: "Title", heading: "Give it a title", required: true, width: "half" },
          {
            key: "category",
            type: "text",
            label: "Category",
            heading: "Category (optional)",
            suggestFromExisting: true,
            width: "half",
          },
          { key: "caption", type: "textarea", label: "Caption", heading: "Caption (optional)", rows: 2 },
          { key: "date", type: "date", label: "Date", heading: "Date (optional)", width: "half" },
          {
            key: "showOnHome",
            type: "toggle",
            label: "Show on homepage",
            heading: "Show in the homepage gallery strip",
            defaultValue: true,
          },
        ],
      },
    ],
  },

  contact: {
    id: "contact",
    kind: "singleton",
    singular: "Contact & social media",
    plural: "Contact & social media",
    titleField: "businessEmail",
    groups: [
      {
        title: "Contact details",
        description: "These details power every 'Contact', 'Email' and 'WhatsApp' button across the website.",
        fields: [
          {
            key: "businessEmail",
            type: "email",
            label: "Business email",
            heading: "Which email should enquiries go to?",
            prompt: "A professional address you check regularly. It is shown publicly.",
            required: true,
            width: "half",
          },
          {
            key: "whatsapp",
            type: "tel",
            label: "WhatsApp number",
            heading: "WhatsApp number",
            prompt: "Include the country code, e.g. +234…",
            required: true,
            width: "half",
          },
          {
            key: "phone",
            type: "tel",
            label: "Contact number",
            heading: "Phone number for calls (optional)",
            prompt: "Leave blank if it's the same as WhatsApp or you prefer not to show it.",
            width: "half",
          },
          {
            key: "location",
            type: "text",
            label: "Location / address",
            heading: "Location (optional)",
            prompt: "A city is enough. Only add a full address if clients visit you.",
            width: "half",
          },
          {
            key: "responseTime",
            type: "text",
            label: "Response time",
            heading: "How quickly do you usually reply? (optional)",
            example: "Within 2 working days",
            width: "half",
          },
          {
            key: "managementEmail",
            type: "email",
            label: "Management / agent email",
            heading: "Do you have a manager or agent? (optional)",
            width: "half",
          },
        ],
      },
      {
        title: "Social media",
        fields: [
          {
            key: "socials",
            type: "repeater",
            label: "Social media accounts",
            itemLabel: "account",
            heading: "Add your social media accounts",
            prompt: "Add each platform with the full profile link. Add them in the order you want them displayed.",
            required: true,
            itemFields: [
              { key: "platform", type: "select", label: "Platform", options: SOCIAL_PLATFORMS, required: true, width: "half" },
              { key: "url", type: "url", label: "Profile link", placeholder: "https://", required: true, width: "half" },
              { key: "handle", type: "text", label: "Handle", placeholder: "@yourname", width: "half" },
              { key: "followers", type: "text", label: "Audience size (optional)", placeholder: "e.g. 25K", width: "half" },
            ],
          },
        ],
      },
      {
        title: "Enquiry forms",
        description: "Visitors can send business, collaboration or general enquiries. They arrive in your Studio inbox.",
        fields: [
          {
            key: "contactIntro",
            type: "textarea",
            label: "Contact page introduction",
            heading: "A friendly line to open the contact page",
            example: "Have a project in mind, a collaboration idea or a question? I'd love to hear from you.",
            rows: 3,
            required: true,
          },
          {
            key: "collaborationNote",
            type: "textarea",
            label: "Collaboration note",
            heading: "What should brands include in a collaboration request? (optional)",
            rows: 3,
          },
        ],
      },
    ],
  },

  settings: {
    id: "settings",
    kind: "singleton",
    singular: "Site settings",
    plural: "Site settings",
    titleField: "siteTitle",
    excludeFromProgress: true,
    groups: [
      {
        title: "Website settings",
        fields: [
          {
            key: "siteTitle",
            type: "text",
            label: "Website title",
            heading: "Website title (shown in browser tabs and Google)",
            prompt: "Usually your name. Leave blank to use your full name.",
          },
          {
            key: "seoDescription",
            type: "textarea",
            label: "Search description",
            heading: "Search engine description",
            prompt: "One or two sentences (under 160 characters) that appear under your name in Google results.",
            rows: 2,
            maxLength: 170,
          },
          {
            key: "accentColor",
            type: "color",
            label: "Brand accent colour",
            heading: "Brand accent colour",
            prompt: "Used for buttons and highlights. Replace this with your brand colour once your identity is final.",
            defaultValue: "#9a5b3f",
            width: "half",
          },
          {
            key: "showPlaceholders",
            type: "toggle",
            label: "Show placeholders on the public site",
            heading: "Show labelled placeholders where content is missing",
            prompt:
              "Keep this ON while the site is being prepared so the full design can be reviewed. Turn it OFF at launch — empty sections are then hidden automatically.",
            defaultValue: true,
          },
          {
            key: "footerNote",
            type: "text",
            label: "Footer note",
            heading: "Footer note (optional)",
          },
        ],
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const CONTENT_TYPE_IDS = Object.keys(CONTENT_TYPES) as ContentTypeId[];

export function isContentTypeId(value: string): value is ContentTypeId {
  return value in CONTENT_TYPES;
}

export function getContentType(id: ContentTypeId): ContentTypeDef {
  return CONTENT_TYPES[id];
}

export function allFields(def: ContentTypeDef): FieldDef[] {
  return def.groups.flatMap((g) => g.fields);
}

export function defaultDataFor(def: ContentTypeDef): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of allFields(def)) {
    out[f.key] = defaultFieldValue(f);
  }
  return out;
}

export function defaultFieldValue(f: FieldDef): unknown {
  if (f.defaultValue !== undefined) return f.defaultValue;
  switch (f.type) {
    case "tags":
    case "list":
    case "images":
    case "repeater":
      return [];
    case "image":
    case "file":
    case "media":
      return null;
    case "toggle":
      return false;
    case "number":
      return null;
    case "price":
      return { mode: "fixed", amount: null, currency: "NGN", note: "" };
    default:
      return "";
  }
}
