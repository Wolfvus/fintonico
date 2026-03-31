# Fintonico Design System

Reference document for the app's visual design, colors, typography, and component patterns.

---

## Color Palette

### Brand Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | `#0D9488` (teal-600) | `#14B8A6` (teal-500) | Brand color, links, focus rings |
| Primary Hover | `#0F766E` (teal-700) | `#0D9488` (teal-600) | Button hover states |
| Accent | `#F59E0B` (amber-500) | `#F59E0B` (amber-500) | Highlights, badges |

### Tailwind Custom Colors (tailwind.config.js)

| Name | Main Value | Usage |
|------|-----------|-------|
| `primary-500` | `#2FA5A9` | Brand teal |
| `accent-500` | `#F5B700` | Brand gold |
| `navy-900` | `#1E2A38` | Text and headers |

### Surface Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Background | `#F9FAFB` (gray-50) | `#0F172A` (slate-900) | Page background |
| Card | `#FFFFFF` | `#1E293B` (slate-800) | Card backgrounds |
| Elevated | `#F3F4F6` (gray-100) | `#334155` (slate-700) | Secondary surfaces |
| Nav | `#DBEAFE` (blue-100) | `#334155` (slate-700) | Sidebar and header |

### Text Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | `#1F2937` (gray-800) | `#F9FAFB` (gray-50) | Body text, headings |
| Secondary | `#4B5563` (gray-600) | `#D1D5DB` (gray-300) | Captions, labels |
| Muted | `#9CA3AF` (gray-400) | `#9CA3AF` (gray-400) | Placeholders, hints |

### Semantic Colors

| Token | Color | Background | Usage |
|-------|-------|-----------|-------|
| Success | `#10B981` (emerald-500) | `#ECFDF5` / `rgba(16,185,129,0.15)` | Positive state |
| Error | `#EF4444` (red-500) | `#FEF2F2` / `rgba(239,68,68,0.15)` | Negative state |
| Warning | `#F59E0B` (amber-500) | `#FFFBEB` / `rgba(245,158,11,0.15)` | Caution state |
| Info | `#3B82F6` (blue-500) | `#EFF6FF` / `rgba(59,130,246,0.15)` | Informational |

### Financial Amount Colors

| Meaning | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Positive (income, assets) | `text-green-700` | `dark:text-green-400` | Amount values |
| Negative (expense, liabilities) | `text-red-700` | `dark:text-red-400` | Amount values |
| Discretionary / warning | `text-yellow-700` | `dark:text-yellow-400` | Discretionary category, savings rate |
| Min payment / secondary | `text-orange-700` | `dark:text-orange-400` | Min payment amounts |
| Net worth (positive) | `text-blue-600` | `dark:text-blue-400` | Net worth display |
| Neutral | `text-gray-900` | `dark:text-white` | Default amounts |

### Border Colors

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Default | `#E5E7EB` (gray-200) | `#334155` (slate-700) |
| Light | `#F3F4F6` (gray-100) | `#475569` (slate-600) |
| Focus | `#0D9488` (teal-600) | `#0D9488` (teal-600) |

---

## Typography

### Font Stack
- **Sans-serif:** Inter, system-ui, sans-serif (primary)
- **Monospace:** SF Mono, Monaco, Inconsolata, Fira Code (numbers/codes)

### Scale (Tailwind classes)
| Element | Class | Size |
|---------|-------|------|
| Page heading | `text-xl font-bold` | 20px |
| Section heading | `text-lg font-semibold` | 18px |
| Card heading | `text-sm font-medium` | 14px |
| Body text | `text-sm` | 14px |
| Caption/label | `text-xs` | 12px |
| Amount large | `text-lg font-bold` | 18px |
| Amount small | `text-sm font-medium` | 14px |

---

## Spacing

### Card Padding
- Summary cards: `p-3`
- Form cards: `p-3`
- Modal content: `p-6`
- Table cells: `px-2 py-1.5` or `px-3 py-2`

### Layout Gaps
- Grid gaps: `gap-3` (12px)
- Form element gaps: `gap-2` (8px)
- Section spacing: `space-y-4` or `space-y-6`

### Border Radius
- Cards: `rounded-lg` (8px) or `rounded-xl` (12px)
- Buttons: `rounded-lg` (8px)
- Inputs: `rounded` (4px) or `rounded-lg` (8px)
- Badges: `rounded-full`

---

## Component Patterns

### Navigation
- **Desktop:** Fixed left sidebar (`w-16`, expands to `w-64` on hover)
- **Mobile:** Fixed top header + slide-out right drawer
- **Active item:** Green border + green background (`nav-item-active`)
- **Background:** Light blue in light mode, slate-700 in dark mode

### Cards
- Background: `bg-white dark:bg-gray-800`
- Border: `border border-gray-200 dark:border-gray-700`
- Shadow: `shadow-sm`
- Radius: `rounded-lg`

### Tables
- Header: `bg-gray-50 dark:bg-gray-900/50`
- Cell padding: `px-2 py-1.5`
- Border between columns: `border-l border-gray-200 dark:border-gray-700`
- Sortable headers: colored arrows (green for assets, red for liabilities)
- Filters: toggleable row below header, activated by Filter icon

### Buttons
- Primary: teal background, white text
- Secondary: gray background, dark text, border
- Danger: red background, white text
- Ghost: transparent, gray text

### Forms
- Input bg: `bg-gray-50 dark:bg-gray-700`
- Input border: `border-gray-200 dark:border-gray-600`
- Focus: `focus:border-green-500` (income) or `focus:border-red-500` (expense)

---

## Dark/Light Mode

- Controlled via `class` strategy on `<html>` element
- Default: dark mode
- Toggle: Sun/Moon icon in sidebar and mobile menu
- Persisted to localStorage (`fintonico-theme`)

### CSS Custom Properties
All theme-aware values defined in `src/index.css` using `:root` and `.dark` selectors. Components use:
- `var(--color-surface-bg)` for backgrounds
- `var(--color-text-primary)` for text
- `var(--color-border)` for borders
- Tailwind `dark:` prefix for component-level overrides

---

**Last Updated:** 2026-01-27
