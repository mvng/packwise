## 2024-03-12 - [SoftwareApplication Schema]
**Learning:** Added `SoftwareApplication` JSON-LD schema into the homepage to signal search engines that the application falls under TravelApplication category and offers a zero price application. This makes the landing page eligible for rich results without modifying its layout.
**Action:** Always consider structured schema implementations on landing pages to clearly categorize apps without visible impact.
## 2024-03-13 - [Login Page Client Component Metadata]
**Learning:** Next.js App Router `'use client'` pages (like `app/(auth)/login/page.tsx`) cannot directly export a `metadata` object. This causes them to inherit generic default titles. To define SEO-friendly metadata for a client page, a co-located `layout.tsx` Server Component must be created to export the `Metadata` object.
**Action:** When auditing or optimizing client-heavy routes, always verify if a `layout.tsx` exists to handle metadata generation; if missing, create one to ensure proper `<title>` and `<meta>` tags are rendered server-side.
## 2026-03-14 - [Dynamic Metadata for Claim Pages]
**Learning:** When building public-facing share or claim pages (e.g., `/claim/[token]`), utilizing Next.js `generateMetadata` to dynamically generate Open Graph and Twitter card meta tags based on the specific entity (like trip destination) improves unfurl previews and click-through rates on messaging platforms.
**Action:** Always ensure that any publicly shared route has dynamic metadata configured, extracting key identifiers from `params` to populate descriptive titles and descriptions.
