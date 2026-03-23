## 2024-03-12 - [SoftwareApplication Schema]
**Learning:** Added `SoftwareApplication` JSON-LD schema into the homepage to signal search engines that the application falls under TravelApplication category and offers a zero price application. This makes the landing page eligible for rich results without modifying its layout.
**Action:** Always consider structured schema implementations on landing pages to clearly categorize apps without visible impact.
## 2024-03-13 - [Login Page Client Component Metadata]
**Learning:** Next.js App Router `'use client'` pages (like `app/(auth)/login/page.tsx`) cannot directly export a `metadata` object. This causes them to inherit generic default titles. To define SEO-friendly metadata for a client page, a co-located `layout.tsx` Server Component must be created to export the `Metadata` object.
**Action:** When auditing or optimizing client-heavy routes, always verify if a `layout.tsx` exists to handle metadata generation; if missing, create one to ensure proper `<title>` and `<meta>` tags are rendered server-side.
## 2026-03-15 - [Next.js App Router Dynamic Metadata] **Learning:** When adding SEO improvements like `generateMetadata` to dynamic routes in Next.js App Router (e.g., `/claim/[token]`), ensure the database query is wrapped in a `try/catch` block to safely fallback to default metadata if the record isn't found or the database is unreachable, preventing the entire page route from crashing during server-side rendering. **Action:** Always include a fallback `return { title: 'Default', ... }` inside a `catch` block for dynamic metadata generation.
## 2026-03-14 - [Dynamic Metadata for Claim Pages]
**Learning:** When building public-facing share or claim pages (e.g., `/claim/[token]`), utilizing Next.js `generateMetadata` to dynamically generate Open Graph and Twitter card meta tags based on the specific entity (like trip destination) improves unfurl previews and click-through rates on messaging platforms.
**Action:** Always ensure that any publicly shared route has dynamic metadata configured, extracting key identifiers from `params` to populate descriptive titles and descriptions.
## 2025-02-23 - [Dynamic Metadata for Shared Links]
**Learning:** Next.js App Router allows exporting a `generateMetadata` function from Server Components (like `app/claim/[token]/page.tsx`) to dynamically set Open Graph and Twitter card metadata based on database content. This is crucial for improving link unfurling and CTR on external-facing shared pages.
**Action:** Always check public-facing share/claim pages for missing dynamic metadata and implement `generateMetadata` with a `try/catch` fallback to ensure robust SSR.
## 2024-03-23 - [Robots.ts for Next.js App Router]
**Learning:** To explicitly guide search engine crawlers away from authenticated or private application sections in Next.js App Router, implement an `app/robots.ts` file that returns a `MetadataRoute.Robots` object with specific `allow` and `disallow` rules, rather than relying solely on a static `robots.txt`.
**Action:** Always verify if a `robots.ts` exists to manage crawl budget and privacy, and create one if missing.
## 2024-03-23 - [JSON-LD XSS Prevention]
**Learning:** When rendering JSON-LD structured data inside a `<script type="application/ld+json">` tag, using a plain `JSON.stringify` exposes the application to XSS if the data contains unescaped HTML tags (like `</script>`).
**Action:** Always use a `serializeJsonLd` utility to safely escape `<` and `>` characters when injecting structured schema.
