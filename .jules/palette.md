## 2024-03-12 - Icon-only Modal Close Buttons
**Learning:** In custom modal implementations, icon-only close buttons (like an SVG "X" or `&times;`) often lack discernible text for screen readers and miss visible focus rings. This creates an accessibility barrier for keyboard users navigating out of modals.
**Action:** When building custom modals, ensure the close button always has an `aria-label="Close modal"` and `focus:outline-none focus-visible:ring-2` class combinations to establish both semantic meaning and visual tracking.
