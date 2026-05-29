# Aranto Design System - Copilot Prompt

Sistema Médico Integral - Use this document as a reference prompt for GitHub Copilot or other AI coding assistants to maintain consistent styling across your entire application.

---

## Design System Overview

This application uses the **Aranto medical design system** with the following characteristics:

- **Dark mode primary**: Deep forest green (#0f1a1e) with gradient surfaces
- **Light mode**: Clean white with subtle emerald accents
- **Primary accent**: Emerald green (#34A853) - the Aranto brand color
- **Secondary accents**: Teal (info), Orange (warning), Red (error)
- **Typography**: Compact, professional sans-serif
- **Cards**: Compact with subtle gradients, rounded corners (xl/2xl)
- **Spacing**: Consistent 8px grid system
- **Brand**: Healthcare focused, trust and professionalism

---

## COLOR PALETTE

### Background Colors

```css
/* Light mode */
--bg-primary: #ffffff;
--bg-secondary: #f5f7f8;
--bg-tertiary: #eef1f3;
--bg-surface: rgba(245, 247, 248, 0.8);

/* Dark mode */
--bg-primary-dark: #0f1a1e;
--bg-secondary-dark: #151f23;
--bg-tertiary-dark: #1a2529;
--bg-surface-dark: rgba(20, 30, 36, 0.6);
```

### Text Colors

```css
--text-primary: #1e3034 (light) / #ffffff (dark)
--text-secondary: #4a6268 (light) / #cbd5db (dark)
--text-muted: #a0abb2 (light) / #5a6d76 (dark)
```

### Aranto Brand Colors

```css
/* Primary - Emerald Green (Aranto) */
primary-700: #1e3034 (dark green)
primary-500: #34a853 (brand green)
primary-400: #5bc236 (light green)

/* Accent - Teal */
teal-500: #14b8a6
teal-400: #2dd4bf

/* Warning - Orange */
orange-500: #f97316
orange-400: #fb923c

/* Error - Red */
red-500: #ef4444
red-400: #f87171
```

---

## TAILWIND CLASS PATTERNS

### Page Backgrounds

```
/* Main page container */
min-h-screen bg-white dark:bg-[#0f1a1e] text-emerald-900 dark:text-white p-6

/* Section container */
max-w-6xl mx-auto space-y-6
```

### Card Styles

```
/* Standard card */
bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60
border border-emerald-200/70 dark:border-emerald-700/30
rounded-xl p-4

/* Interactive card (hoverable) */
bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60
border border-emerald-200/70 dark:border-emerald-700/30
rounded-xl p-4
hover:border-emerald-300 dark:hover:border-emerald-600/50
hover:shadow-lg dark:hover:shadow-emerald-500/5
transition-all duration-200 cursor-pointer

/* Compact card */
bg-white dark:bg-emerald-900/20
border border-emerald-200/70 dark:border-emerald-700/30
rounded-lg p-3

/* Highlighted card (with glow) */
bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-[#1a2529]/80
border border-emerald-200 dark:border-emerald-500/30
rounded-xl p-4
shadow-[0_0_20px_rgba(52,168,83,0.15)]
```

### Badge/Status Pill

```
/* Base badge structure */
inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide

/* Color variants (Aranto themed) */
Primary: bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400
Teal: bg-teal-100 dark:bg-teal-500/15 border border-teal-300 dark:border-teal-500/40 text-teal-700 dark:text-teal-400
Orange: bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400
Red: bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400
Slate: bg-slate-100 dark:bg-slate-500/15 border border-slate-300 dark:border-slate-500/40 text-slate-700 dark:text-slate-400
```

### Button Styles

```
/* Primary button (Aranto green) */
inline-flex items-center justify-center gap-2
bg-emerald-600 dark:bg-emerald-500
hover:bg-emerald-700 dark:hover:bg-emerald-400
text-white font-semibold
px-4 py-2 rounded-lg
transition-all duration-200
disabled:opacity-50 disabled:cursor-not-allowed

/* Secondary button */
inline-flex items-center justify-center gap-2
bg-slate-100 dark:bg-emerald-900/30
hover:bg-slate-200 dark:hover:bg-emerald-800/50
text-emerald-900 dark:text-emerald-300 font-semibold
px-4 py-2 rounded-lg
border border-emerald-200 dark:border-emerald-700/50
transition-all duration-200

/* Ghost button */
inline-flex items-center justify-center gap-2
bg-transparent
hover:bg-emerald-100 dark:hover:bg-emerald-800/30
text-emerald-700 dark:text-emerald-400 font-medium
px-4 py-2 rounded-lg

/* Outline accent buttons */
Primary: bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20
Teal: bg-teal-50 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20
Orange: bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20

/* Size modifiers */
sm: px-3 py-1.5 text-sm
lg: px-6 py-3 text-lg
```

### Input Fields

```
/* Standard input */
w-full px-3 py-2
bg-white dark:bg-emerald-900/20
border border-emerald-300 dark:border-emerald-700/50
rounded-lg
text-emerald-900 dark:text-white
placeholder:text-emerald-500 dark:placeholder:text-emerald-600
focus:outline-none focus:ring-2 focus:ring-emerald-500/50
transition-all duration-200

/* Input with error */
border-red-500 dark:border-red-500 focus:ring-red-500/50

/* Label */
block text-sm font-medium text-emerald-900 dark:text-emerald-300 mb-1
```

### Icon Containers

```
/* Small (w-8 h-8) */
w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center

/* Medium (w-10 h-10) */
w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center

/* Large (w-12 h-12) */
w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center

/* Colored variants */
Sky: bg-sky-100 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/30
Emerald: bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30
Amber: bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30
Red: bg-red-100 dark:bg-red-500/15 border-red-300 dark:border-red-500/30
```

### Typography

```
/* Page title */
text-2xl font-bold text-emerald-900 dark:text-white

/* Section heading */
text-lg font-semibold text-emerald-800 dark:text-emerald-100

/* Card title */
text-base font-semibold text-emerald-800 dark:text-white

/* Body text */
text-sm text-emerald-700 dark:text-emerald-400

/* Muted/helper text */
text-xs text-emerald-600 dark:text-emerald-500

/* Label */
text-sm font-medium text-emerald-800 dark:text-emerald-300
```

### Border Styles

```
/* Default border */
border border-slate-200/80 dark:border-slate-700/40

/* Hover border */
hover:border-slate-300 dark:hover:border-sky-700/50

/* Focus ring */
focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-sky-400/40

/* Accent borders */
Sky: border-sky-200 dark:border-sky-500/30
Emerald: border-emerald-200 dark:border-emerald-500/30
Amber: border-amber-200 dark:border-amber-500/30
Red: border-red-200 dark:border-red-500/30

/* Left indicator (for priority cards) */
border-l-2 border-l-red-500/70  /* urgent */
border-l-2 border-l-emerald-500/70  /* success */
```

---

## LAYOUT PATTERNS

### Page Layout

```tsx
<div className="min-h-screen bg-white dark:bg-[#060d1a] p-6">
  <div className="max-w-6xl mx-auto space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Title</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Description</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Actions */}
      </div>
    </div>

    {/* Content */}
    {/* ... */}
  </div>
</div>
```

### Grid Layouts

```
/* 2 columns */
grid grid-cols-1 md:grid-cols-2 gap-4

/* 3 columns */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

/* 4 columns */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

/* Stats row */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
```

### Flex Layouts

```
/* Space between */
flex items-center justify-between gap-4

/* Center */
flex items-center justify-center gap-4

/* Start aligned */
flex items-start gap-4
```

---

## COMPONENT PATTERNS

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center mb-4">
    <Icon className="w-10 h-10 text-slate-400 dark:text-slate-600" />
  </div>
  <p className="text-lg text-slate-400">No items found</p>
  <p className="text-sm text-slate-600 dark:text-slate-500 mt-1">Description</p>
</div>
```

### Stat Card

```tsx
<div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/60 dark:to-[#0d1f35]/80 border border-slate-200/80 dark:border-slate-700/40 rounded-xl p-4 flex items-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center flex-shrink-0">
    <Icon className="w-6 h-6 text-sky-500" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Label</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Value</p>
  </div>
</div>
```

### Alert/Notification

```tsx
/* Info (Aranto green) */
<div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl p-4">
  <div className="flex gap-3">
    <Info className="w-5 h-5 flex-shrink-0 text-emerald-500" />
    <div className="flex-1 text-sm">Message</div>
  </div>
</div>

/* Success */
<div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl p-4">
  ...
</div>

/* Warning (Orange) */
<div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 rounded-xl p-4">
  ...
</div>

/* Error (Red) */
<div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 rounded-xl p-4">
  ...
</div>
```

---

## DESIGN PRINCIPLES

1. **Compact over spacious**: Use smaller padding (p-3 to p-4 for cards), tight spacing
2. **Subtle gradients**: Use gradient backgrounds in dark mode for depth - emerald tones
3. **Consistent borders**: emerald-200/70 (light) and emerald-700/30 (dark)
4. **Rounded corners**: Use `rounded-lg` for small elements, `rounded-xl` for cards, `rounded-2xl` for large containers
5. **Hover effects**: Subtle border color change to emerald + light shadow
6. **Focus states**: emerald-500/50 ring
7. **Status colors**: emerald (info/success), orange (warning), red (error)
8. **Text hierarchy**: Use text-xs for labels, text-sm for body, text-base for titles
9. **Transitions**: Use `transition-all duration-200` for interactive elements
10. **Brand alignment**: Always use emerald (#34A853) for primary actions - this is Aranto's brand color

---

## SHADCN/UI COMPATIBILITY (Aranto Theme)

When using shadcn/ui components, apply these modifications:

### Table
```tsx
<div className="rounded-xl border border-emerald-200/70 dark:border-emerald-700/30 overflow-hidden">
  <Table>
    <TableHeader className="bg-emerald-50 dark:bg-emerald-900/30">
      <TableRow className="hover:bg-emerald-100/50 dark:hover:bg-emerald-800/30">
        <TableHead className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Header
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-emerald-50 dark:hover:bg-emerald-800/20">
        <TableCell className="text-sm text-emerald-700 dark:text-emerald-400">
          Data
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### Dialog
```tsx
<DialogContent className="bg-white dark:bg-[#1a2529] border-emerald-200 dark:border-emerald-700/30">
  <DialogHeader>
    <DialogTitle className="text-lg font-semibold text-emerald-900 dark:text-white">
      Title
    </DialogTitle>
    <DialogDescription className="text-sm text-emerald-600 dark:text-emerald-400">
      Description
    </DialogDescription>
  </DialogHeader>
  {/* Content */}
</DialogContent>
```

### Select
```tsx
<Select>
  <SelectTrigger className="bg-white dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50 focus:ring-emerald-500/50">
    <SelectValue placeholder="Select..." className="text-emerald-700 dark:text-emerald-400" />
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-[#1a2529] border-emerald-200 dark:border-emerald-700/30">
    <SelectItem className="hover:bg-emerald-100 dark:hover:bg-emerald-800/50 focus:bg-emerald-50 dark:focus:bg-emerald-500/10">
      Option
    </SelectItem>
  </SelectContent>
</Select>
```

### Tabs
```tsx
<TabsList className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-lg">
  <TabsTrigger
    value="tab1"
    className="data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-800/60 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-emerald-600 dark:text-emerald-500 text-sm font-medium px-4 py-2 rounded-md"
  >
    Tab Label
  </TabsTrigger>
</TabsList>
```

---

## WHEN CREATING NEW COMPONENTS

Always follow these rules:

1. **Start with a wrapper**: Use appropriate card/background style
2. **Add dark mode variants**: Every color must have `dark:` variant
3. **Use semantic HTML**: Proper heading hierarchy
4. **Apply transitions**: `transition-all duration-200` for interactive elements
5. **Test both themes**: Ensure readability in light and dark mode
6. **Keep it compact**: Avoid excessive padding or margins
7. **Use icon containers**: Icons should be in styled boxes, not floating
8. **Status indicators**: Use colored badges with consistent styling

---

## EXAMPLE: COMPLETE PAGE

```tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/design-system';
import { Users, Clock, Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <AppLayout>
      <Head title="Dashboard" />

      <div className="min-h-screen bg-white dark:bg-[#060d1a] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Overview of your medical practice
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Patients Today
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">24</p>
              </div>
            </Card>

            {/* More stat cards... */}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Recent Activity
              </h2>
              {/* Content */}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                Quick Actions
              </h2>
              {/* Content */}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
```

---

## COPY THIS PROMPT FOR COPILOT

When asking Copilot to create or modify components, include this context:

---

**COPILOT INSTRUCTION:**

Follow the **Aranto Design System** (Sistema Médico Integral). Key characteristics:

1. Dark mode uses `#0f1a1e` background with emerald-themed gradient surfaces
2. Card style: `bg-white dark:bg-gradient-to-r dark:from-emerald-900/30 dark:to-[#1a2529]/60 border border-emerald-200/70 dark:border-emerald-700/30 rounded-xl p-4`
3. Border default: `border-emerald-200/70 dark:border-emerald-700/30`
4. Border hover: `hover:border-emerald-300 dark:hover:border-emerald-600/50`
5. Focus ring: `focus:ring-2 focus:ring-emerald-500/50`
6. Badge base: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide`
7. Badge colors: emerald (primary/success), teal (info), orange (warning), red (error)
8. Button styles: Primary uses emerald-600 (Aranto brand green #34A853)
9. Button sizes: default `px-4 py-2`, sm `px-3 py-1.5 text-sm`, lg `px-6 py-3 text-lg`
10. Icon containers: Medium `w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/60 border border-emerald-200 dark:border-emerald-700/40 flex items-center justify-center`
11. Typography: Page titles `text-2xl font-bold text-emerald-900`, section headings `text-lg font-semibold text-emerald-800`
12. Text colors: Primary `text-emerald-900 dark:text-white`, Body `text-sm text-emerald-700 dark:text-emerald-400`
13. Transitions: `transition-all duration-200`
14. Use compact spacing, avoid large padding
15. **Brand color**: Always use emerald (#34A853) for primary actions

Apply `dark:` variant to ALL color classes. Use emerald as the dominant color throughout. Test readability in both themes.
