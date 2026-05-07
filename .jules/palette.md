## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.
## 2024-05-24 - Enhance PasteListModal accessibility
**Learning:** Found a specific a11y issue pattern where dynamically generated list elements (like individual quantity/name inputs in PasteListModal) were missing `aria-label`s, preventing screen readers from associating the inputs with the item they belong to. Additionally, secondary row actions (like 'Remove' buttons) were only visible on mouse `hover` (`group-hover:opacity-100`), making them completely invisible to keyboard-only users who are tab-navigating the list.
**Action:** Always ensure dynamic inputs in mapped lists include `aria-label`s that interpolate the row's context (e.g., \`aria-label={\`Quantity for ${item.name}\`}\`), and ensure hover-only actions also include `focus:opacity-100` or `focus-visible:opacity-100` alongside proper outline rings for keyboard accessibility.
## 2024-05-25 - Add accessible delete buttons to planning board items
**Learning:** Found that delete/close actions revealed on hover often omit `aria-label` attributes and keyboard focus management since their visual state is tied to pointer events (e.g. `group-hover:opacity-100`).
**Action:** Always ensure hover-revealed action buttons have descriptive `aria-label` attributes and explicit `focus-visible` utility classes so screen reader and keyboard users can discover and trigger them.
## 2024-05-25 - Improved TripMembersSection accessibility
**Learning:** Found an issue pattern in `TripMembersSection` where dynamically generated avatar buttons for trip members had no accessible names (only hover tooltips), and hover actions lacked keyboard focus management.
**Action:** Always ensure dynamic user-avatar buttons have `aria-label` attributes for screen readers, and add `focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1` to ensure they are keyboard navigable and visibly focusable.
