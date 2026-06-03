---
name: David Agency
status: final
created: 2026-05-30
updated: 2026-05-30
surfaces:
  - public-form: /
  - success: /success
  - operator-login: /dashboard/login
  - operator-dashboard: /dashboard
  - application-detail: /dashboard/applications/[id]
sources:
  - _bmad-output/planning-artifacts/prds/prd-VisaAgency-2026-05-30/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/DESIGN.md
---

# David Agency — Experience Design

This document describes the behavioural and experiential layer of David Agency: how users move through the product, how components behave across states, and what principles govern copy, interaction, and accessibility. Visual tokens are defined in `DESIGN.md`; this document cross-references them as `{path.to.token}`.

---

## 1. Foundation

**Platform:** Web application. Desktop-first layout with a mobile-responsive public form.

**UI System:** shadcn/ui components on Next.js 14. Tailwind CSS for utility styling. TypeScript throughout.

**Visual Identity:** All colors, typography, spacing, and component tokens are specified in `DESIGN.md`. This document governs behavior, not appearance.

**Two distinct surfaces with different user goals:**

| Surface | Primary User | Goal |
|---|---|---|
| Public Application Form (`/`) | Foreign national applicant | Submit visa application documents quickly and with confidence |
| Operator Dashboard (`/dashboard`) | Richard (visa agency operator) | Process, manage, and track applications efficiently |

These surfaces share no navigation or session state. The public form is unauthenticated. The dashboard requires authentication.

---

## 2. Information Architecture

### Route Map

```
/                                 Public Application Form (unauthenticated)
/success                          Application Received confirmation (unauthenticated)
/dashboard/login                  Operator login
/dashboard                        Applications list (authenticated)
/dashboard/applications/[id]      Application detail view (authenticated)
```

### Public Surface (`/` and `/success`)

The public surface is a single-purpose funnel. There is no persistent navigation, no account creation, and no multi-step wizard. The form lives on a single scrollable page. After successful submission the user is redirected to `/success`.

**Page hierarchy:**
- `/` — one continuous form; no steps, no progress indicator
- `/success` — terminal state; no further actions available to the applicant

### Operator Dashboard (`/dashboard` and sub-routes)

The dashboard is a protected SPA-style interface. A persistent sidebar (`{components.sidebar-nav}`) provides navigation. All routes under `/dashboard` require an active session; unauthenticated requests redirect to `/dashboard/login`.

**Nav items (sidebar):**
1. Applications (active by default, points to `/dashboard`)
2. (Reserved for future items — no placeholders shown in MVP)

**Dashboard sub-views:**
- `/dashboard` — Applications list with filter tabs and data table
- `/dashboard/applications/[id]` — Application detail with field grid, images, and action buttons

---

## 3. Voice and Tone

### Principles

**Professional and clear.** Copy uses plain English. Avoid government jargon ("pursuant to", "aforementioned"), visa industry jargon ("NOC", "sticker visa"), and technical jargon ("API", "webhook"). If a technical concept must be named, explain it in parentheses on first use.

**Reassuring for applicants.** Applicants are sharing passport photos, personal details, and travel plans with an unfamiliar service. Copy must acknowledge this trust without over-promising. Use present tense and active voice. Avoid passive constructions that imply uncertainty.

**Efficient for operators.** Richard uses this dashboard daily. Operator-facing copy prioritises brevity. Labels should be scannable at a glance. Confirmation dialogs should state the exact action and its consequence — no waffle.

**Error messages: specific, actionable, never blaming.** Bad: "Invalid file." Good: "This file could not be read. Please upload a JPG, PNG, or HEIC under 10 MB." The error message should tell the user what happened and what to do next.

### Copy Patterns

| Context | Pattern | Example |
|---|---|---|
| Field label | Noun phrase, title case | "Date of Arrival" |
| Placeholder | Lowercase format hint | "DD/MM/YYYY" |
| Helper text | Full sentence, present tense | "We'll use this to prepare your application." |
| Inline error | Active voice, specific, actionable | "Please enter your arrival date." |
| Success message | Warm, confirmatory, includes next step | "Your application has been received. We'll be in touch within 24 hours." |
| Operator action label | Verb + object | "Create Data", "Push to eVisa", "Export" |
| Operator confirmation | State the consequence | "This will submit Carlos Ruiz's application to evisa.gov.vn." |
| Date confirmation ({components.date-confirmation}) | "You will arrive on {day} {month} {year}." | "You will arrive on 6 July 2026." |

---

## 4. Component Patterns (Behavioral)

### 4.1 Sidebar Navigation (`{components.sidebar-nav}`)

- Width: `{spacing.sidebar_width}` (240px), fixed, non-collapsible in MVP
- Active route: highlighted with `{colors.sidebar_nav_item_active}` (`rgba(255,255,255,0.15)`) background; full text-white
- Inactive items: `text-white/80`; on hover background `rgba(255,255,255,0.10)`
- Logo or product name sits in the header slot above the nav list
- No icons in MVP — text labels only

### 4.2 Filter Tabs (Dashboard Applications List)

Tabs: **Raw** | **All** | **Ready** | **Submitted** | **Done**

- Rendered as a horizontal tab bar above the applications table
- Active tab: bottom border `2px solid {colors.accent}` (`#1D4ED8`), text `text-foreground`
- Inactive tab: no border, `text-muted-foreground`; on hover `text-foreground`
- Selecting a tab filters the table to that status. "All" shows every application regardless of status.
- Default active tab on load: **Raw** (most urgent for the operator)
- Tab label includes a count badge when count > 0: e.g., "Raw (3)"

### 4.3 Applications Table Row

Each row represents one application.

**Columns (minimum):** Application ID | Applicant Name | Nationality | Date Created | Status | Actions

- **Default state:** Standard table row background (`bg-background`)
- **Hover state:** `bg-muted` (`{colors.muted}`)
- **Selected state:** `bg-muted` with left border accent `border-l-2 border-accent`
- Clicking a row opens the detail panel/view for that application
- **Actions column:** context-aware buttons (see Section 5 — State Patterns)

### 4.4 Status Badges

Rendered using the appropriate `status-badge-{status}` component. See `DESIGN.md` for token values.

- Always display a text label — color is never the sole status indicator (`{a11y.color-only}`)
- Transitions are one-way: Raw → Ready → Submitted → Done
- No UI element in the dashboard allows backward status transition

### 4.5 Upload Area (`{components.upload-area}`)

- Supports click-to-browse and drag-and-drop
- Accepted formats: JPG, PNG, HEIC (HEIC auto-converted server-side before storage)
- Max file size: 10 MB per file
- Format hint visible at rest: e.g., "JPG, PNG, HEIC — max 10 MB"
- One upload area per document slot (e.g., portrait photo, passport bio-page)
- After a successful upload, the area displays a thumbnail; a remove (×) button clears it
- Keyboard accessible: `Tab` focuses the area, `Enter` or `Space` opens the file picker

### 4.6 Date Input with Real-Time Confirmation

- Input format: DD/MM/YYYY (shown as placeholder)
- Mask or guided input recommended to prevent format errors
- Once the user enters a complete, valid date, the `{components.date-confirmation}` string appears below the input in `text-muted-foreground`
- The confirmation string reads: "You will arrive on {day} {month} {year}."
- If the date is cleared or becomes invalid, the confirmation string disappears immediately (no flicker delay)
- The confirmation string is purely informational — it does not affect form validation

### 4.7 Push to eVisa Button

- Only rendered (or only enabled) when the selected application's status is **Ready**
- When status is Raw, Submitted, or Done: the button is either hidden or rendered as `disabled` with a tooltip "Application must be Ready before pushing"
- On click: opens a confirmation modal showing portrait photo thumbnail, full name, and arrival date
- Operator must confirm before the browser extension is triggered
- After confirmation, button enters loading state until extension handoff completes

### 4.8 Manual Export Button

- Always available as a ghost button in the detail panel regardless of status
- Label: "Export"
- Variant: `{components.push-button}` ghost (`<Button variant="ghost">`)
- Exports application data as a structured download (PDF or CSV — format TBD in engineering spec)

### 4.9 Notification Badge

- Visible on the Applications nav item (or a Notifications slot) when `notification_logs` contains a failed entry for the current session context
- Rendered as a small `bg-destructive text-white rounded-full` chip with a count
- Clicking navigates to or highlights the affected application(s)

---

## 5. State Patterns

### 5.1 Form Field States

| State | Visual Behavior |
|---|---|
| **Default** | shadcn input ring at rest; label above; placeholder inside |
| **Focus** | shadcn default focus ring (`ring-2 ring-ring`); label unchanged |
| **Error** | Border `border-destructive`; error message below in `text-xs text-destructive`; `aria-describedby` pointing to error element |
| **Success** | Border returns to default (`border-input`) after correction; no persistent green state on inputs (reduces noise) |

### 5.2 Upload Area States

| State | Visual Behavior |
|---|---|
| **Empty (rest)** | Dashed `border-border` + upload icon + label + format hint |
| **Drag over** | Border transitions to `border-accent` (`#1D4ED8`); background `bg-muted` |
| **Uploading** | Spinner replaces icon; label "Uploading…"; area not interactive during upload |
| **Success** | Thumbnail preview fills area; filename + file size in caption; remove (×) button |
| **Error** | Border `border-destructive`; error message below in `text-xs text-destructive` |

### 5.3 Date Input States

| State | Visual Behavior |
|---|---|
| **Empty** | Placeholder "DD/MM/YYYY"; no confirmation string |
| **Partial** | Standard typing state; no confirmation string |
| **Filled (valid)** | `{components.date-confirmation}` string appears below in `text-muted-foreground` |
| **Invalid** | Standard error state (field border `border-destructive` on blur); no confirmation string |

### 5.4 Submit Button States

| State | Visual Behavior |
|---|---|
| **Default** | Full-width primary button; label "Submit Application" |
| **Loading** | Spinner prepended to label; button `disabled`; label "Submitting…" |
| **Error** | Button re-enabled; error toast or inline message above button; label reverts to "Submit Application" |
| **Success** | User is redirected to `/success` — button is no longer visible |

### 5.5 Application Row States (Dashboard)

| State | Visual Behavior |
|---|---|
| **Default** | `bg-background`, standard text |
| **Hover** | `bg-muted` |
| **Selected** | `bg-muted` + `border-l-2 border-accent` left accent stripe |

### 5.6 Status Badge Transitions

Transitions are one-way and operator-initiated (except Submitted → Done which may be automated on webhook receipt).

```
Raw  →  Ready  →  Submitted  →  Done
```

- **Raw → Ready:** Triggered by operator clicking "Create Data" in the detail panel
- **Ready → Submitted:** Triggered by operator completing the "Push to eVisa" flow
- **Submitted → Done:** Triggered automatically on webhook receipt from evisa.gov.vn, or manually by operator

No UI allows skipping a state or moving backward.

### 5.7 Push to eVisa Button States

| Condition | Button State |
|---|---|
| `status !== 'ready'` | Disabled (or hidden); tooltip explains requirement |
| `status === 'ready'` | Enabled; default variant |
| Loading (post-confirm) | Spinner; disabled |
| Handoff complete | Button transitions to disabled; status badge changes to Submitted |

---

## 6. Interaction Primitives

### Navigation

- Public form: no navigation. Single-page, single-purpose.
- Dashboard: sidebar is the sole navigation. No breadcrumbs in MVP.
- Browser back/forward: standard Next.js routing behavior. Detail view back-navigates to the list.

### Modals and Dialogs

- Used for: Push to eVisa confirmation only (MVP)
- shadcn `<Dialog>` component
- Always include: a clear heading, the specific consequence, Cancel (ghost) + Confirm (primary or destructive) button pair
- Confirm button label mirrors the action: "Push to eVisa", "Confirm"

### Toast Notifications

- shadcn `<Toast>` / Sonner pattern
- Position: bottom-right (dashboard); bottom-center (public form)
- Success toasts: `bg-success text-white`, auto-dismiss 4s
- Error toasts: `bg-destructive text-white`, persist until dismissed (errors require acknowledgement)
- Copy: brief, actionable (e.g., "Application submitted to eVisa." / "Push failed — check connection and try again.")

### Loading States

- Page-level loading: Next.js `loading.tsx` skeleton or spinner within the content area
- Table loading: skeleton rows (3–5) matching table column structure
- Button loading: inline spinner (left of label), button disabled
- Upload loading: inline spinner within upload area

### Empty States

- Empty applications list (filtered): "No [Status] applications" + brief instruction ("Applications will appear here once they reach [Status] status.")
- Empty applications list (All): "No applications yet." — no further instruction needed

### Confirmation Patterns

- Destructive or irreversible actions always require a confirmation modal
- Non-destructive status changes (Raw → Ready) may use an inline optimistic update without a modal
- Push to eVisa always requires explicit modal confirmation regardless of reversibility classification

---

## 7. Accessibility Floor

The following requirements are the minimum bar. shadcn/ui provides compliant defaults for most; the items below are David Agency-specific obligations.

### Labelling

- All form inputs have a visible `<label>` associated via `htmlFor` / `id`
- Placeholder text is a format hint only — never the sole label for a field
- Icon-only buttons include `aria-label` describing the action

### Error Association

- Inline error messages are associated with their input via `aria-describedby`
- Pattern: `<input aria-describedby="field-error" />` + `<p id="field-error" role="alert">…</p>`
- `role="alert"` ensures screen readers announce the error immediately on appearance

### Color Independence

- Status badges (`{components.status-badge-raw}` through `{components.status-badge-done}`) always include a text label — color is supplementary, not the sole signal
- Upload area states (success/error) pair color changes with text and icon changes

### Keyboard Access

- All interactive elements reachable by Tab in logical DOM order
- Focus ring visible on all interactive elements (shadcn default `ring-2 ring-ring ring-offset-2`)
- Upload areas: `role="button"` `tabIndex={0}`; `Enter` and `Space` activate the file picker
- Modal: focus trapped within dialog while open; returns to trigger on close
- Filter tabs: arrow-key navigation within the tab group (shadcn Tabs component behavior)

### Focus Management

- On modal open: focus moves to the modal's first focusable element
- On modal close: focus returns to the element that triggered it
- On application row click → detail view open: focus moves to the detail panel heading

### Contrast

- All text meets WCAG 2.1 AA contrast ratios given the color tokens in `DESIGN.md`
- `{colors.muted_foreground}` (`#64748B`) on white (`#FFFFFF`) = 4.6:1 — passes AA for normal text at `text-xs` and above
- Status badge text/background pairs are all AA-compliant

---

## 8. Key Flows

### UJ-1: Carlos submits his visa application (Public Form)

**User:** Carlos, 28, Spanish national. iPhone user, Safari mobile browser. Opens the link from a WhatsApp message.

**Entry point:** `/` via direct link

#### Flow

1. **Landing.** Carlos sees the David Agency form header and a clean single-column form. No navigation, no distractions. The form begins immediately below the header.

2. **Filling personal fields.** Carlos completes 6 fields: full name, nationality, passport number, date of birth, email, and phone. Each field has a visible label above it. If he makes an error and moves focus away, the field border turns `border-destructive` and a specific error message appears below (e.g., "Please enter a valid passport number.").

3. **Uploading photos.** Carlos encounters two upload areas: portrait photo and passport bio-page. He selects HEIC files from his iPhone camera roll. The upload area shows a spinner, then a thumbnail preview. The HEIC-to-JPG conversion happens server-side; Carlos sees only the success thumbnail.

4. **Entering arrival date.** Carlos types his arrival date in the DD/MM/YYYY input. As soon as a valid complete date is entered, the `{components.date-confirmation}` string appears below: "You will arrive on 6 July 2026." This provides immediate reassurance and catches transposition errors before submission.

5. **Pre-submit zone.** Below all fields, Carlos sees the reCAPTCHA widget and the full-width primary Submit button labeled "Submit Application".

6. **Submission.** Carlos completes the reCAPTCHA and clicks Submit. The button enters loading state ("Submitting…", disabled). A spinner is visible. The form is not re-enterable during submission.

7. **Success redirect.** On successful server response, Carlos is redirected to `/success`. He sees:
   - A checkmark icon
   - Heading: "Application Received"
   - The application ID in large monospace (`{components.application-id}`): `DA-2026-0042`
   - Confirmation message: "Your application has been received. We'll be in touch within 24 hours."

8. **Email confirmation.** Carlos receives an email containing the application ID `DA-2026-0042` and the same confirmation message. The email is sent by the server asynchronously after the form submission is stored.

**Failure paths:**
- Network error on submit: button re-enables, error toast appears ("Submission failed — please try again."), form data preserved
- File upload failure: upload area shows error state with message, other fields unaffected
- reCAPTCHA failure: standard reCAPTCHA error handling, submit button remains disabled until passed

---

### UJ-2: Richard processes Carlos's application (Operator Dashboard)

**User:** Richard, visa agency operator. Authenticated session on desktop browser.

**Entry point:** `/dashboard` with Raw tab active

#### Flow

1. **Dashboard landing.** Richard sees the Applications list. The Raw tab is active by default and shows a count badge: "Raw (3)". Carlos's application `DA-2026-0042` is visible in the table with status badge `{components.status-badge-raw}` ("Raw").

2. **Opening the application.** Richard clicks Carlos's row. The row enters selected state (`bg-muted` + `border-l-2 border-accent`). The detail panel opens (or the view transitions to `/dashboard/applications/DA-2026-0042`).

3. **Reviewing the detail panel.** Richard sees:
   - Application ID (`{components.application-id}`) at the top
   - Field grid: full name, nationality, passport number, date of birth, email, phone, arrival date
   - Image placeholders that load portrait and passport bio-page via signed URL (images render once the signed URL resolves)
   - Action buttons: **Create Data** (primary) and **Export** (ghost)
   - Status badge: Raw

4. **Creating data.** Richard clicks **Create Data**. The status badge transitions from Raw (`{components.status-badge-raw}`) to Ready (`{components.status-badge-ready}`) via an optimistic update. The detail panel action buttons update: **Create Data** is replaced by **Push to eVisa** (now enabled since status === Ready).

5. **Pushing to eVisa.** Richard clicks **Push to eVisa**. A confirmation modal opens (shadcn Dialog) containing:
   - Heading: "Push to eVisa"
   - Portrait thumbnail (small)
   - Name: Carlos Ruiz
   - Arrival date: 6 July 2026
   - Body: "This will submit Carlos Ruiz's application to evisa.gov.vn."
   - Buttons: Cancel (ghost) | Push to eVisa (primary)

6. **Confirming.** Richard clicks **Push to eVisa** in the modal. The button enters loading state. The browser extension is triggered and begins auto-filling the evisa.gov.vn form. The modal closes; the detail panel shows the **Push to eVisa** button in loading/disabled state.

7. **Review on gov site.** Richard's browser navigates to (or opens a tab for) evisa.gov.vn with fields pre-filled by the extension. Richard reviews the auto-filled data and submits the gov form himself.

8. **Return to dashboard.** Richard returns to the David Agency dashboard. The application status has updated to Submitted (`{components.status-badge-submitted}`). The **Push to eVisa** button is now disabled (status no longer Ready).

9. **Notification to Carlos.** A "submitted" email notification is sent to Carlos automatically on the Submitted status transition (webhook or status change trigger).

**Failure paths:**
- Push to eVisa extension error: error toast ("Push failed — check connection and try again."); button re-enables; status remains Ready; `notification_logs` entry created → notification badge appears in sidebar
- Signed URL image load failure: image placeholder shows a broken image icon + "Image unavailable" caption; other fields unaffected
- Session expiry mid-flow: redirect to `/dashboard/login` with a "Your session expired. Please sign in again." message; redirect back to original URL after login

---

*End of EXPERIENCE.md*
