---
name: David Agency
status: final
created: 2026-05-30
updated: 2026-05-30
ui_system: shadcn/ui
surfaces:
  - id: public-form
    path: /
    description: Foreign national visa application form
  - id: operator-dashboard
    path: /dashboard
    description: Internal application management for Richard

# Brand-layer delta only. All unlisted tokens inherit from shadcn/ui defaults.

colors:
  primary: "#0A2342"
  primary_foreground: "#FFFFFF"
  background: "#FFFFFF"
  foreground: "#0F172A"
  muted: "#F1F5F9"
  muted_foreground: "#64748B"
  border: "#E2E8F0"
  accent: "#1D4ED8"
  success: "#16A34A"
  warning: "#D97706"
  destructive: "#DC2626"

  status_badges:
    raw:
      bg: "#F1F5F9"
      text: "#64748B"
      border: "#E2E8F0"
    ready:
      bg: "#FEF3C7"
      text: "#92400E"
      border: "#FDE68A"
    submitted:
      bg: "#DBEAFE"
      text: "#1E40AF"
      border: "#BFDBFE"
    done:
      bg: "#DCFCE7"
      text: "#166534"
      border: "#BBF7D0"

typography:
  family: Geist Sans   # shadcn default — no override required
  scale: shadcn default

rounded:
  # inherit shadcn defaults (rounded-md base)
  sidebar_nav_item: rounded-md
  status_badge: rounded-full
  upload_area: rounded-lg
  application_id: rounded-md

spacing:
  sidebar_width: 240px
  sidebar_item_padding: "px-3 py-2"
  form_max_width: 640px
  form_section_gap: "gap-6"
  dashboard_content_padding: "p-6"

components:
  - sidebar-nav
  - status-badge-raw
  - status-badge-ready
  - status-badge-submitted
  - status-badge-done
  - upload-area
  - push-button
  - application-id
  - date-confirmation
---

# David Agency — Design System (Brand-Layer Delta)

This document defines only the brand-layer tokens and custom component patterns that **delta** from shadcn/ui defaults. Engineers must apply these on top of a standard shadcn/ui installation. Any visual property not listed here should be taken directly from shadcn defaults.

---

## Brand & Style

David Agency presents an authoritative yet approachable visual identity appropriate for a government-adjacent visa service. The aesthetic is clean, professional, and trustworthy — not clinical. Navy (`#0A2342`) signals authority; generous whitespace and clear hierarchy reduce anxiety for applicants handling sensitive documents.

The operator dashboard prioritises density and scannability. The public form prioritises reassurance and clarity.

---

## Colors

All values below override or extend the shadcn/ui CSS variable layer (`globals.css`). Variables use the `hsl(...)` shadcn convention; hex values are listed here for reference and must be converted to HSL when applied to CSS custom properties.

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#0A2342` | Authority Navy — sidebar bg, primary buttons, headings |
| `--primary-foreground` | `#FFFFFF` | Text / icons on primary surfaces |
| `--background` | `#FFFFFF` | Page background |
| `--foreground` | `#0F172A` | Default body text |
| `--muted` | `#F1F5F9` | Table row hover, input bg on focus, Raw badge bg |
| `--muted-foreground` | `#64748B` | Secondary text, placeholder text, Raw badge text |
| `--border` | `#E2E8F0` | All borders — inputs, cards, dividers, Raw badge border |
| `--accent` | `#1D4ED8` | Hyperlinks, active filter underline, Submitted badge text |
| `--success` | `#16A34A` | Success states, Done badge text |
| `--warning` | `#D97706` | Warning states, Ready badge text |
| `--destructive` | `#DC2626` | Error states, destructive action buttons |

### Status Badge Color Map

| Status | Background | Text | Border |
|---|---|---|---|
| Raw | `#F1F5F9` | `#64748B` | `#E2E8F0` |
| Ready | `#FEF3C7` | `#92400E` | `#FDE68A` |
| Submitted | `#DBEAFE` | `#1E40AF` | `#BFDBFE` |
| Done | `#DCFCE7` | `#166534` | `#BBF7D0` |

---

## Typography

Geist Sans is the shadcn/ui default font. No font override is required. Apply the standard shadcn type scale throughout.

| Role | Class | Notes |
|---|---|---|
| Page title | `text-2xl font-semibold` | Public form heading, dashboard section title |
| Section heading | `text-lg font-medium` | Form section labels |
| Body | `text-sm` | All field labels, table content |
| Caption / helper | `text-xs text-muted-foreground` | Helper text, format hints, date-confirmation |
| Application ID | `font-mono text-2xl font-bold` | DA-YYYY-XXXX on success screen and detail panel |

---

## Layout & Spacing

### Public Application Form (`/`)

- Max content width: `640px`, centered with `mx-auto`
- Outer padding: `px-4 py-8` on mobile, `px-0 py-12` on `sm+`
- Section gap between logical form groups: `gap-6` (24px)
- Field row gap within a group: `gap-4` (16px)
- Submit zone sits below all fields with `mt-8` separator

### Operator Dashboard (`/dashboard`)

- Layout: fixed sidebar (240px) + fluid main content area
- Sidebar: `w-[240px] min-h-screen bg-primary flex flex-col`
- Main content: `flex-1 p-6 overflow-auto`
- Detail panel (when open): slides in as a right-side panel or replaces main content at mobile breakpoints
- Table: full-width, no horizontal scroll on `lg+`

---

## Elevation & Depth

Inherit shadcn shadow scale. Brand-specific usage:

| Surface | Shadow |
|---|---|
| Public form card (if wrapped) | `shadow-sm` |
| Dashboard detail panel | `shadow-md` border-left `border-border` |
| Modals (confirmation) | `shadow-lg` via shadcn Dialog |
| Sidebar | no shadow — background color provides separation |

---

## Shapes

- Default border-radius: `rounded-md` (shadcn default, 6px) — applies to inputs, buttons, cards
- Status badges: `rounded-full` — pill shape to distinguish from interactive elements
- Upload areas: `rounded-lg` — softer to signal a drop target
- Application ID chip: `rounded-md bg-muted px-3 py-1` inline on success screen

---

## Components

### `sidebar-nav`

The primary navigation sidebar for the operator dashboard.

**Structure:** `<aside>` containing logo area + nav item list + optional footer slot.

**Tokens:**
- Background: `bg-primary` (`#0A2342`)
- Text: `text-primary-foreground` (`#FFFFFF`)
- Nav item base: `px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:bg-white/10 transition-colors`
- Nav item active: `bg-white/15 text-white` (i.e., `rgba(255,255,255,0.15)`)
- Logo area: `px-4 py-5 border-b border-white/10`
- Width: `w-[240px]` fixed

**Behavior:** Active state is applied to the currently matched route segment. No collapse in MVP (fixed-width only).

---

### `status-badge-raw`

```
bg: #F1F5F9   text: #64748B   border: 1px solid #E2E8F0
```

Classes: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border`

Always includes a text label ("Raw") — color is never the sole differentiator.

---

### `status-badge-ready`

```
bg: #FEF3C7   text: #92400E   border: 1px solid #FDE68A
```

Same structural classes as `status-badge-raw`. Label: "Ready".

---

### `status-badge-submitted`

```
bg: #DBEAFE   text: #1E40AF   border: 1px solid #BFDBFE
```

Label: "Submitted".

---

### `status-badge-done`

```
bg: #DCFCE7   text: #166534   border: 1px solid #BBF7D0
```

Label: "Done".

---

### `upload-area`

A drag-and-drop file upload zone.

**Visual spec:**
- Border: `2px dashed border-border` (`#E2E8F0`) at rest
- Background: `bg-muted/50` at rest, `bg-muted` on drag-over
- Radius: `rounded-lg`
- Min height: `120px`
- Inner layout: centered column — upload icon (`text-muted-foreground`) + primary label + format hint in `text-xs text-muted-foreground`

**States:**
- **Empty (rest):** Dashed border + "Drag & drop or click to upload" label + format hint (e.g., "JPG, PNG, HEIC — max 10 MB")
- **Drag over:** Border color transitions to `accent` (`#1D4ED8`), background `bg-muted`
- **Uploading:** Progress spinner replaces icon, label "Uploading…"
- **Success:** Thumbnail preview fills area, filename + file size below, remove (×) button top-right
- **Error:** Border `destructive`, error message below area in `text-xs text-destructive`

**Accessibility:** `<input type="file">` visually hidden but keyboard-focusable; area has `role="button"` `tabIndex={0}` `aria-label="Upload [field name]"`.

---

### `push-button`

The primary call-to-action button used for form submission and key operator actions.

Inherits shadcn `<Button variant="default">` (primary fill). No structural override needed — primary color token (`#0A2342`) drives it automatically.

- Size: `w-full` on the public form; standard width in the dashboard
- Loading state: spinner icon replaces leading icon, text stays visible, button `disabled`
- Destructive variant for dangerous actions: `<Button variant="destructive">`

---

### `application-id`

The application reference number displayed on the success screen and detail panel.

**Format:** `DA-YYYY-XXXX` (e.g., `DA-2026-0042`)

**Visual spec:**
- Font: `font-mono text-2xl font-bold text-foreground`
- On success screen: displayed inside a muted chip — `bg-muted rounded-md px-4 py-2 inline-block`
- On detail panel: `text-sm font-mono text-muted-foreground` as a secondary identifier

---

### `date-confirmation`

Real-time natural-language confirmation rendered below a date input field.

**Appearance:** `text-xs text-muted-foreground mt-1`

**Behavior:** Renders immediately once the date input has a valid, fully-entered date (DD/MM/YYYY). Empty or partial dates show nothing.

**Copy template:** "You will arrive on {day} {month} {year}." (e.g., "You will arrive on 6 July 2026.")

**Token reference:** Uses `--muted-foreground` (`#64748B`) — inherits via `text-muted-foreground` class.

---

## Do's and Don'ts

### Do

- Use `bg-primary` (`#0A2342`) exclusively for the sidebar and primary button fills
- Always pair a status badge with its text label — never use color alone
- Show `date-confirmation` text as soon as a valid date is entered — it reduces re-entry errors
- Use `rounded-full` only for status badges; use `rounded-md` for all other interactive elements
- Keep the public form max-width at `640px` — wider layouts increase cognitive load for form completion
- Use `font-mono` exclusively for the `application-id` component
- Maintain the dashed border convention for all upload areas — it signals interactivity without mimicking a button

### Don't

- Don't use `#1D4ED8` (accent) as a button fill — it is reserved for links and active indicators
- Don't render the `push-button` in full-width mode inside the dashboard — reserve full-width for the public form only
- Don't collapse the sidebar in the MVP — a fixed 240px width is the spec
- Don't apply `rounded-full` to buttons — use `rounded-md`
- Don't show a date-confirmation string for invalid or partial dates
- Don't use placeholder text as the sole label for form inputs (accessibility violation)
- Don't transition status badges backward (Raw ← Ready etc.) — statuses are one-way only
