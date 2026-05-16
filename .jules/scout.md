## 2024-05-16 - Safe string manipulation for sitemap URLs
**Learning:** When using environment variables (like `NEXT_PUBLIC_APP_URL`) for Base URLs in Next.js metadata routes, varying setups can inject trailing slashes causing malformed `.xml` links (e.g. `http://localhost:3000//sitemap.xml`).
**Action:** Always strictly sanitize the string variable by checking for and slicing off a trailing slash using a ternary before concatenating paths.

## 2024-05-16 - Playwright testing for raw Next.js Metadata XML
**Learning:** Using `page.goto()` and `page.content()` in Playwright to test raw text files like `robots.txt` or `sitemap.xml` fails because Chromium sometimes wraps the raw response in an internal HTML document viewer.
**Action:** When validating XML or txt endpoint text responses, use `request.get()` and `.text()` against the endpoint instead of relying on the UI page context.
