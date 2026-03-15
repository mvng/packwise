## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.
## 2024-05-25 - Add accessible delete buttons to planning board items
**Learning:** Found that delete/close actions revealed on hover often omit `aria-label` attributes and keyboard focus management since their visual state is tied to pointer events (e.g. `group-hover:opacity-100`).
**Action:** Always ensure hover-revealed action buttons have descriptive `aria-label` attributes and explicit `focus-visible` utility classes so screen reader and keyboard users can discover and trigger them.

## 2024-05-19 - Accessibility Improvements to Modal Close Buttons
**Learning:** Icon-only close buttons (like "✕") in custom modals are frequently missing `aria-label`s and visual keyboard focus indicators, making them invisible to screen readers and difficult to navigate for keyboard-only users. Modal forms can also sometimes miss `htmlFor` and `id` linking.
**Action:** Always add `aria-label="Close modal"`, `focus:outline-none focus-visible:ring-2`, and `rounded-md` (or similar) to icon-only buttons to guarantee screen reader and keyboard accessibility without changing pointer UX. Ensure inputs map securely to labels with corresponding `id`s.
