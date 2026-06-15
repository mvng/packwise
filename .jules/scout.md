## 2025-02-14 - Dynamic Metadata on Shared Routes
**Learning:** For publicly shared routes like individual trips (`/trip/[id]`), static metadata or lack of metadata leads to poor SEO and terrible social sharing previews.
**Action:** Always implement dynamic `generateMetadata` for shared resource pages. Ensure lightweight database queries using `.findUnique` with `select` to fetch only the necessary data for SEO tags, and explicitly wrap the query in a `try/catch` with fallback metadata to prevent rendering failures if the database is unreachable or the item doesn't exist.
