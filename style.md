# UI Style Guide

## Foundations
- **Color Palette:** Defined in `src/styles/theme.ts` and mirrored as CSS variables in `src/index.css`. Core tones are Navy `#1E2A38`, Teal `#2FA5A9`, Soft Gray `#F2F4F7`, and Accent Gold `#F5B700`, each with light/dark ramps (`navyLight`, `navyDark`, etc.). Dark mode swaps the CSS variable values instead of redefining utilities.
- **Typography:** Inter is the default sans stack (`tailwind.config.js`). Headings use Tailwind font weights (`font-bold`), while body copy remains `font-medium`/`font-normal`. Mono is reserved for numeric data when needed via the `font-mono` utility.
- **Spacing & Layout:** Rely on Tailwind spacing scale. Cards and sections commonly use `p-4`/`p-6` on desktop and collapse to tighter padding (`p-3`) on mobile via responsive variants.
- **Elevation & Borders:** Components tend to pair `rounded-xl`, `shadow-lg`, and a subtle `border border-blue-200` (or `dark:border-gray-700`). The shared `app-card` layer in `index.css` embeds that recipe.
- **Icons & Illustration:** Lucide icons drive visual affordances; keep stroke width consistent (`w-4 h-4` or `w-5 h-5`) and wrap them in the themed icon containers used across dashboard and navigation.

## Dark Mode
- Dark mode is class-based (`darkMode: 'class'` in Tailwind). `useThemeStore` and the fallback in `App.tsx` add or remove the `dark` class on `<html>`.
- All palette colors defer to the CSS variables declared under `:root` in `src/index.css`; the `.dark` block overrides them to maintain contrast.
- Shared components (`Card`, `Tabs`, navigation) apply `dark:` variants for borders, text, and backgrounds. When introducing new components, ensure both the base and `dark:` colors read against background `#111827`.

## Form Patterns
- `src/styles/formStyles.ts` stores canonical class strings for inputs, labels, buttons, cards, and errors. Import and spread them instead of hardcoding Tailwind strings in forms.
- Inputs maintain a minimum hit target (`min-h-[44px]`) for accessibility, with focus rings implemented via Tailwind `focus:` utilities and custom box-shadows in `index.css`.
- Primary actions adopt the green theme (`bg-green-600` / `dark:bg-green-500`); secondary actions are neutral gray with `dark` variants.
- Validation messages use the shared `error` style (`text-xs text-red-500`), and invalid states should append Tailwind error borders rather than diverging from the established classes.

## Cards, Tabs, and Lists
- The shared `Card` component (`src/components/ui/Card.tsx`) wraps Tailwind utilities for consistent padding, radius, and background. Prefer it for new panels instead of re-creating card markup.
- Tabs (`Tabs.tsx`) expose head/body slots with Tailwind classes already baked in; pass `className` overrides cautiously to avoid mismatched padding.
- Tables and transaction lists lean on flex layouts with border accents (`border border-gray-200 dark:border-gray-700`) and `hover:bg-gray-50 dark:hover:bg-gray-700/50` for interaction feedback.
- Data chips (`CurrencyBadge`, badges in dashboard) rely on Tailwind pill patterns (`inline-flex`, `rounded-full`, `px-2 py-1`) and apply palette-aware background classes.

## Animation & Motion
- Tailwind is extended with `glow` and `pulse-glow` keyframes (`tailwind.config.js`). Use them sparingly for call-to-action emphasis (e.g., hero stats) and ensure reduced-motion fallbacks are considered if motion increases.
- Loading indicators favor simple Tailwind animations (`animate-spin`) paired with the theme colors.

## Implementation Checklist
- Import `src/index.css` globals to stay aligned with app-wide tokens.
- Use Tailwind responsive variants to adjust padding/gaps for mobile-first layouts.
- When new colors are required, add them to `src/styles/theme.ts` and expose corresponding CSS variables before using them in components.
- Keep class strings declarative; if a combination becomes reusable, promote it to `formStyles`, a shared component prop, or a new utility class in `index.css`.
