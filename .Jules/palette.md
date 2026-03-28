## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.
## 2024-05-24 - Enhance PasteListModal accessibility
**Learning:** Found a specific a11y issue pattern where dynamically generated list elements (like individual quantity/name inputs in PasteListModal) were missing `aria-label`s, preventing screen readers from associating the inputs with the item they belong to. Additionally, secondary row actions (like 'Remove' buttons) were only visible on mouse `hover` (`group-hover:opacity-100`), making them completely invisible to keyboard-only users who are tab-navigating the list.
**Action:** Always ensure dynamic inputs in mapped lists include `aria-label`s that interpolate the row's context (e.g., \`aria-label={\`Quantity for ${item.name}\`}\`), and ensure hover-only actions also include `focus:opacity-100` or `focus-visible:opacity-100` alongside proper outline rings for keyboard accessibility.
## 2024-05-25 - Add accessible delete buttons to planning board items
**Learning:** Found that delete/close actions revealed on hover often omit `aria-label` attributes and keyboard focus management since their visual state is tied to pointer events (e.g. `group-hover:opacity-100`).
**Action:** Always ensure hover-revealed action buttons have descriptive `aria-label` attributes and explicit `focus-visible` utility classes so screen reader and keyboard users can discover and trigger them.

## 2024-05-20 - Add context-interpolated ARIA labels to dynamically generated icon-only action buttons
**Learning:** When generating identical lists of icon-only action buttons for many items (like delete buttons or "Add to departure checklist" buttons in a packing list), screen reader users are unable to distinguish between identical buttons since they all have identical labels such as `Remove`. Generic static labels should be avoided.
**Action:** Always interpolate the context (like the item name) into the `aria-label` attribute (e.g. `aria-label={"Remove " + item.name + " from packing list"}`) for dynamically generated items to ensure full accessibility.
