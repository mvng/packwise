## 2024-05-18 - Tailwind group interactions
**Learning:** React `useState` for hover states (`onMouseEnter`/`onMouseLeave`) to show/hide child components introduces unnecessary re-renders, React serialization issues, and is inaccessible to keyboard navigation by default.
**Action:** Replace React hover states with Tailwind's `group` class on the parent, and `group-hover:opacity-100 focus-within:opacity-100` on the child action elements to ensure smooth UX and full keyboard accessibility.
