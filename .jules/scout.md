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
## 2024-03-14 - [Next.js App Router Root Canonical URLs]
**Learning:** Do not define a static canonical URL (e.g., `alternates: { canonical: '/' }`) in the root `app/layout.tsx`. Doing so causes Next.js to merge and pass this static canonical URL to all child pages, incorrectly instructing search engines to treat every page as a duplicate of the homepage.
**Action:** When implementing canonical URLs, define them explicitly on a per-page basis or use a dynamically generated layout that relies on the request URL.

## 2024-03-14 - [JSON-LD Stored XSS Prevention]
**Learning:** When injecting JSON-LD structured data via `<script dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`, any user-supplied content within the JSON (like trip names or item names) can break out of the script tag if it contains a `</script>` string, leading to severe Stored XSS vulnerabilities.
**Action:** Always safely escape JSON strings before injecting them into the DOM, e.g., by replacing less-than signs: `JSON.stringify(data).replace(/</g, '\\u003c')`.
