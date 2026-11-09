# Stitch, Tailwind and accessible UI

1. Read root `DESIGN.md` and `design-system-compliance.md`, then inspect the approved Stitch design and existing `src/app/globals.css` tokens and components before implementing. Do not invent missing design tokens; identify assumptions when a spec is unavailable.
2. Map colors, type, spacing and breakpoints to shared semantic CSS/Tailwind v4 theme tokens; extend `@theme` or existing variables consistently, including dark mode where specified.
3. Implement reusable accessible primitives under `src/components/ui/` and shared feature compositions under `src/components/shared/`; preserve semantic HTML, labels, keyboard access, visible focus and adequate contrast.
4. Use responsive utility classes, test narrow and wide layouts, and apply `clsx` plus `tailwind-merge` when conditional or overrideable classes warrant it. Avoid arbitrary values when a matching token exists.
5. Verify loading, error, disabled and empty states against the design and inspect the resulting UI when possible.
