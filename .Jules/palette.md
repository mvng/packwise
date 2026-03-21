## 2024-05-24 - Add accessible close buttons to modals
**Learning:** Found a pattern across multiple modal components (`EditTripModal`, `LuggagePickerModal`, `InventoryPickerModal`) where icon-only close buttons lacked `aria-label`s and the modals lacked `Escape` key close handlers.
**Action:** When creating or editing modals in the future, ensure that icon-only buttons have descriptive `aria-label`s and that keyboard accessibility (like the Escape key) is implemented to close the modals.

## 2026-03-21 - Add keyboard accessibility to modals
**Learning:** Found a missing keyboard accessibility feature on `AddCategoryModal` and `PasteListModal` where they lacked an `Escape` key close handler.
**Action:** When creating or editing modals in the future, ensure that they handle keyboard accessibility such as the `Escape` key to close the modal for a better user experience.
