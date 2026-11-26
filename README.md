# Personal Brand Website + Content Studio

A personal brand, portfolio and business website (services, rate card, classes, templates, fragrance shop, contact), plus a private **Content Studio**. In the Studio the client prepares, previews and publishes all website content, with guidance at every step.

- Public website: `/`, `/about`, `/portfolio`, `/services`, `/rate-card`, `/classes`, `/templates`, `/fragrance`, `/contact`, plus detail pages for projects, classes, templates and fragrances.
- Private workspace: `/content-studio` (sign-in required).

Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, shadcn/ui-style components on Radix, Lucide, React Hook Form + Zod, TanStack Query, MongoDB, Cloudinary (optional), @react-pdf/renderer.

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill it in (see below)
npm run dev                    # http://localhost:3000
```

1. Open `/content-studio`. On the very first sign-in, use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`; this creates the first Studio account.
2. Change that password in **Studio → Site settings**.
3. Add more accounts (for example the client's and the developer's), or reset a password:

```bash
npm run user:create -- client@example.com "a long password" "Client Name"
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / build / run in production |
| `npm run lint`, `npm run typecheck` | Static checks |
| `npm run user:create -- <email> <password> [name]` | Create a Studio account or reset its password |
| `npm run test:smoke` | 78-check end-to-end test against a running server (see below) |

**Smoke test:** it creates, publishes and deletes content, so always run it against a **test database**:

```bash
MONGODB_DB=brand_hub_test npm run build && MONGODB_DB=brand_hub_test npx next start -p 3100
BASE_URL=http://localhost:3100 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:smoke
```

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string. With Atlas, allow your host's IPs (`0.0.0.0/0` for Vercel). |
| `MONGODB_DB` | ✅ | Database name, e.g. `brand_hub`. |
| `AUTH_SECRET` | ✅ | 32+ random characters; signs Studio sessions. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | first run | Bootstrap account, used only while no accounts exist. |
| `NEXT_PUBLIC_SITE_URL` | ✅ in prod | Public URL, used in PDFs, exports and emails. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | ✅ on Vercel | Without them, uploads are stored on local disk (`UPLOAD_DIR`). Serverless hosts can't do that. |
| `UPLOAD_DIR` | optional | Local upload folder (default `.data/uploads`). |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_TO_EMAIL` | optional | Emails for new enquiries and "submitted for review". |
| `NEXT_PUBLIC_ENABLE_CHECKOUT` | optional | Reserved for a future native checkout (keep `false`). |

### Deploying to Vercel

1. Import the GitHub repository in Vercel (**Add New → Project**). The Vercel GitHub app must have access to the repo. On a team plan, the commit author must be a team member, or deployments are **blocked**.
2. Add **all** required variables above in **Settings → Environment Variables**, including the Cloudinary keys, then redeploy.
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (Vercel has no fixed IPs on standard plans).
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain.

---

## How it works

### Content model (single source of truth)

Everything is driven by `src/lib/content/definitions.ts`. Each content type lists its fields, with:

- labels and a friendly question;
- writing guidance and a sample answer (shown **only** in the Studio);
- required/optional status, validation and field type.

The forms, Zod validation, progress tracking, completeness checks, exports and PDFs are all generated from it. To add a field or a new content type, edit that file; nothing else needs changing for the Studio to support it.

The 10 Studio sections are defined in `src/lib/content/modules.ts`:

1. Personal Information
2. About Me
3. Portfolio
4. Services
5. Rate Card
6. Classes
7. Digital Products
8. Fragrance Business
9. Gallery & Media
10. Social Media & Contact

Site settings sit outside these ten.

### Draft → publish workflow

- Every entry keeps a working **draft** (`data`) and a separate **published snapshot** (`published`).
- The public site only ever reads published snapshots. Editing never changes the live site until **Publish** / **Update live site** is pressed.
- Publishing is refused while required fields are missing. Drafts can always be saved, and they autosave every few seconds.
- **Unpublish** hides an entry. **Discard changes** reverts a draft to the published version.
- **Site settings** (accent colour, SEO, placeholder mode) apply as soon as they're saved.

### Previews

- **Live preview** in the editor: the real public components render in an iframe at desktop, tablet and mobile widths, updating with every keystroke, before anything is saved.
- **Preview on the real website**: Next.js Draft Mode shows saved drafts on the actual public pages, with a banner. It only works for a signed-in Studio user; the preview cookie alone reveals nothing.

### Placeholder / pre-launch mode

While **Site settings → Show placeholders** is on (the default), missing content appears as clearly labelled dashed placeholders. A banner explains the site is in preparation, and search engines are asked not to index it. Turn it off at launch: empty sections and their navigation items are then hidden automatically. No invented names, prices, testimonials or clients are ever shown.

### Media

- Uploads are validated by type and size: images up to 15 MB, videos up to 100 MB, documents up to 25 MB.
- With Cloudinary configured, files upload **directly from the browser to Cloudinary** (signed); the server verifies the signature before registering them.
- Locally stored files are **private** (Studio users only) until they're used by published content.
- The media library supports alt text, a usage check before delete, per-file download, and a ZIP of everything.

### Security

- Studio pages and APIs are protected twice: by `src/proxy.ts`, and by a server-side session check in every route.
- Sessions are httpOnly JWT cookies (7 days). Passwords use bcrypt.
- Rate limiting covers login (10 per 15 min per IP) and the enquiry forms (5 per 10 min per IP); the forms also have a honeypot.
- `X-Robots-Tag: noindex` is sent on the Studio. Enquiry IPs are never sent to the browser.

### Export & review

**Studio → Review & export** shows every section in order, with missing details marked in red. It can download:

- a styled **PDF content pack**;
- **Markdown** and **JSON** exports;
- a **ZIP of all media**;
- the **rate card PDF**.

**Submit for review** stores a full snapshot with an optional note, and emails the developer if Resend is configured.

---

## Database structure (MongoDB)

| Collection | Purpose | Key fields |
| --- | --- | --- |
| `entries` | All website content (singletons and collections) | `type` (profile, about, portfolio, service, rateCard, class, product, fragranceBrand, fragrance, gallery, contact, settings), `data` (draft), `published` (live snapshot or `null`), `slug`, `publishedSlug`, `order`, `hasUnpublishedChanges`, `createdAt`, `updatedAt`, `publishedAt` |
| `media` | Uploaded files | `provider` (local/cloudinary), `key`, `url`, `publicId`, `kind` (image/video/document), `mime`, `size`, `width`, `height`, `name`, `alt`, `folder`, `isPublic`, `createdAt` |
| `users` | Studio accounts | `email` (unique), `name`, `passwordHash`, `createdAt`, `lastLoginAt` |
| `enquiries` | Contact form messages | `kind` (business/collaboration/general), `name`, `email`, `phone`, `organisation`, `subject`, `service`, `budget`, `timeline`, `message`, `status` (new/read/archived), `meta`, `createdAt` |
| `submissions` | "Submit for review" snapshots | `note`, `submittedBy`, `percent`, `completed`, `totalSections`, `missingRequired`, `snapshot`, `createdAt` |

Indexes are created automatically on first connection.

---

## Future e-commerce

Every buy or order button resolves through `getPurchaseAction` / `getFragranceOrderAction` in `src/lib/commerce.ts`:

- **Classes and templates** link to their existing Selar, Nestuge or other sales page. Nothing is migrated.
- **Fragrances** open a pre-filled WhatsApp order.
- Prices, sizes, variants and stock are stored as structured data.

To add a native cart and checkout later (e.g. Paystack or Flutterwave):

1. Implement a cart provider, a `/checkout` route and a payment webhook.
2. Return `{ kind: "cart" }` from the commerce resolver.
3. Set `NEXT_PUBLIC_ENABLE_CHECKOUT=true`.

The public components don't need to change.

---

## Project structure

```
src/
  app/(site)/            public pages
  app/content-studio/    private Studio (login, workspace, preview frame)
  app/api/               public + Studio API routes, PDFs, media
  components/site/       public design system & sections (also used by Studio previews)
  components/studio/     Studio UI (editor, fields, media, review, …)
  components/ui/         shadcn-style primitives
  lib/content/           content model, schemas, completion, reports
  lib/server/            DB, auth, entries, media, PDFs, notifications
  proxy.ts               request gate for the Studio
scripts/                 create-user, smoke-test
```
