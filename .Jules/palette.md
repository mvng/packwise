## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.

## 2026-03-18 - Add ARIA labels and focus states to inline forms
**Learning:** Found a pattern where small, inline button actions (like remove, add, confirm, and cancel within lists or compact forms) lacked `aria-label`s for screen readers, and were missing keyboard focus outlines, making them hard to navigate via keyboard.
**Action:** When working on lists or compact forms with icon-only buttons, ensure to add `aria-label`s, hide decorative SVGs with `aria-hidden="true"`, and include Tailwind focus-visible classes like `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1` for keyboard accessibility.
