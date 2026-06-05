---
title: 'Refine Public Form & Success Page UI'
type: 'feature'
created: '2026-06-05T23:26:44+07:00'
status: 'done'
baseline_commit: '120f909b550c39ed238edc635384629d9cc89cba'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current implementation of the Public Form and Success Page (`/` and `/success`) lacks the refined layout and detailed styling defined in the `key-public-form.html` brainstorm mockup.
**Approach:** Update `page.tsx`, `ApplicationForm.tsx`, and `success/page.tsx` to match the mockup exactly. This includes adding a dark navy site header, side-by-side name fields, correct container backgrounds/borders, and the detailed "What happens next" steps on the success screen.

## Boundaries & Constraints

**Always:** Use existing shadcn/ui components and Tailwind utility classes (using the brand tokens already in `globals.css` like `bg-primary`, `bg-muted`, etc.). Maintain all existing form validation, accessibility attributes, and reCAPTCHA logic.
**Ask First:** If any new reusable component needs to be created that affects files outside the specified Code Map.
**Never:** Break the existing submission flow or hardcode hex colors that should come from Tailwind theme variables.

</frozen-after-approval>

## Code Map

- `apps/web/src/app/page.tsx` -- Main public form page container.
- `apps/web/src/components/form/ApplicationForm.tsx` -- The application form itself (needs field layout adjustments).
- `apps/web/src/app/success/page.tsx` -- The success page.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/web/src/app/page.tsx` -- Add the Site Header (navy background, wordmark, tagline) and wrap the `<ApplicationForm />` in a styled white form card over a muted background (`bg-slate-50` / `bg-muted`).
- [ ] `apps/web/src/components/form/ApplicationForm.tsx` -- Update the Last Name and First Name fields to sit side-by-side (`grid-cols-1 sm:grid-cols-2`). Refine input and button margins to closely match the mockup spacing.
- [ ] `apps/web/src/app/success/page.tsx` -- Rewrite the success layout. Implement the Checkmark icon container, styled Application ID code block, email confirmation note, and the 3-step "What happens next" section. Include the Site Header here as well.

**Acceptance Criteria:**
- Given a user visits `/`, when they view the page, then they see the dark navy site header and side-by-side name fields inside a cleanly bordered card.
- Given a user successfully submits the form, when redirected to `/success?id=...`, then they see the exact success screen matching the mockup, complete with the 3 steps.

## Verification

**Commands:**
- `cd apps/web && pnpm typecheck` -- expected: Passes without errors.
- `cd apps/web && pnpm lint` -- expected: Passes without errors.

**Manual checks:**
- Open `http://localhost:3000` and visually verify the form matches the mockup.
- Navigate to `http://localhost:3000/success?id=DA-2026-0042` and verify the success screen matches the right column of the mockup.

## Suggested Review Order

- Top-level container layout and SiteHeader addition for the public form.
  [`page.tsx:6`](../../apps/web/src/app/page.tsx#L6)

- Completely redesigned success page with checkmark, application ID, and next steps.
  [`page.tsx:11`](../../apps/web/src/app/success/page.tsx#L11)

- Form grid layout for name fields and secure footer note with lock icon.
  [`ApplicationForm.tsx:112`](../../apps/web/src/components/form/ApplicationForm.tsx#L112)

- The new shared SiteHeader component used in both pages.
  [`SiteHeader.tsx:3`](../../apps/web/src/components/SiteHeader.tsx#L3)
