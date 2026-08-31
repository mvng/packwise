
## 2026-03-25 - [React Auto-Save Data Loss Bug]
**Learning:** When implementing auto-save on `blur` in React textareas, automatically reverting local state to `lastSavedValue` upon API failure can cause data loss if the user continued typing while the save was in-flight.
**Action:** Remove automatic state reversion on failure in auto-save implementations so user inputs remain out-of-sync safely until the next successful blur.
