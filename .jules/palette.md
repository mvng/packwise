## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.
## 2024-05-25 - Add accessible delete buttons to planning board items
**Learning:** Found that delete/close actions revealed on hover often omit `aria-label` attributes and keyboard focus management since their visual state is tied to pointer events (e.g. `group-hover:opacity-100`).
**Action:** Always ensure hover-revealed action buttons have descriptive `aria-label` attributes and explicit `focus-visible` utility classes so screen reader and keyboard users can discover and trigger them.

## 2026-03-13 - Dashboard Empty State
**Learning:** Empty states are crucial touchpoints for user activation. A blank list with standard text is often ignored. Replacing it with a visually distinct card (e.g., dashed borders, centered content, prominent colored icon) and a clear, accessible call-to-action button (with focus states like `focus-visible:ring-2`) significantly improves discoverability and encourages users to take the desired next step.
**Action:** Updated `DashboardClient.tsx` to use a card-style empty state with an accessible `role="img"` emoji and a styled CTA button matching existing Tailwind conventions.
