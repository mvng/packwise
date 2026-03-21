## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.

## 2026-03-21 - Improve accessibility of hover-revealed action buttons
**Learning:** Tying the visibility of action buttons strictly to React state (`onMouseEnter` -> `isHovered`) instead of using CSS `group-hover` creates the same accessibility barrier for keyboard users: the buttons remain invisible when tabbed into. Manual `focus-within:opacity-100` along with proper `focus-visible` outlines and `aria-label`s must be applied to the button wrapper.
**Action:** When creating components that reveal actions on hover using React state, always add `focus-within:opacity-100` to the container, and ensure individual buttons have `aria-label` and explicit `focus-visible:ring-2` styles.
