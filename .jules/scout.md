## 2024-03-12 - [SoftwareApplication Schema]
**Learning:** Added `SoftwareApplication` JSON-LD schema into the homepage to signal search engines that the application falls under TravelApplication category and offers a zero price application. This makes the landing page eligible for rich results without modifying its layout.
**Action:** Always consider structured schema implementations on landing pages to clearly categorize apps without visible impact.
## 2024-03-13 - [Login Page Client Component Metadata]
**Learning:** Next.js App Router `'use client'` pages (like `app/(auth)/login/page.tsx`) cannot directly export a `metadata` object. This causes them to inherit generic default titles. To define SEO-friendly metadata for a client page, a co-located `layout.tsx` Server Component must be created to export the `Metadata` object.
**Action:** When auditing or optimizing client-heavy routes, always verify if a `layout.tsx` exists to handle metadata generation; if missing, create one to ensure proper `<title>` and `<meta>` tags are rendered server-side.
## 2025-02-23 - [Dynamic Metadata for Shared Links]
**Learning:** Next.js App Router allows exporting a `generateMetadata` function from Server Components (like `app/claim/[token]/page.tsx`) to dynamically set Open Graph and Twitter card metadata based on database content. This is crucial for improving link unfurling and CTR on external-facing shared pages.
**Action:** Always check public-facing share/claim pages for missing dynamic metadata and implement `generateMetadata` with a `try/catch` fallback to ensure robust SSR.
