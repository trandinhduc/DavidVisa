---
baseline_commit: 674183204e1a0b3b421a196fc9f7e02990a2387b # approximate, adjust if necessary
---

# Story 2.3: Arrival Date Input with Real-Time Confirmation

Status: done

## Story

As an applicant,
I want to enter my arrival date and immediately see it confirmed in plain English,
So that I can catch date entry errors (e.g., day/month transposition) before submitting.

## Acceptance Criteria

1. **Given** the form from Story 2.1 exists
2. **When** the applicant interacts with the Arrival Date field
3. **Then** an input with placeholder "DD/MM/YYYY" is shown with label "Date of Arrival"
4. **And** as soon as a complete, valid date is entered, a `DateConfirmation` string appears below: `text-xs text-muted-foreground mt-1` — copy: "You will arrive on {day} {month} {year}." (e.g., "You will arrive on 6 July 2026.")
5. **And** the confirmation updates in real-time as the user changes the date value
6. **And** if the date is cleared or becomes invalid, the confirmation string disappears immediately with no flicker
7. **And** invalid date on blur triggers error: `border-destructive` + "Please enter a valid date in DD/MM/YYYY format." with `aria-describedby` + `role="alert"`
8. **And** the Zod schema validates: date is required, date is valid, date is not in the past

## Developer Context

This story introduces the `arrivalDate` field and a new `DateInput` component. The core challenge is real-time validation of a DD/MM/YYYY string and formatting it into a human-readable confirmation string (e.g., "6 July 2026") *without* causing validation errors prematurely while the user is typing.

### Technical Requirements

- **Date Format:** Input is strictly DD/MM/YYYY. Do not use the native `<input type="date">` as its appearance varies wildly across browsers and doesn't match the "DD/MM/YYYY" requirement easily without relying on browser locale. A regular text input with a mask or strict validation is preferred.
- **Real-time Confirmation:** The confirmation must use `Intl.DateTimeFormat` or native JS date formatting (e.g., `new Date(year, monthIndex, day)`). Avoid heavy date libraries like `moment` unless already in the project (date-fns is okay if needed, but native is better for this simple task).
- **Zod Validation:** Update `applicationFormSchema` in `form-schemas.ts`. The schema should parse the DD/MM/YYYY string into a valid Date object (or validate the string format directly) and check that it is not in the past. 

### Architecture Compliance

- **Next.js:** Components must have `'use client'` where React hooks (`useState`, `useEffect`, `useFormContext` etc.) are used.
- **Form State:** Integrate smoothly with React Hook Form. You will likely need `Controller` or `useWatch` to get real-time value changes for the confirmation string.
- **Accessibility:** Must adhere to UX-DR12. Error messages must have `role="alert"` and link via `aria-describedby`.
- **Token Compliance:** Use `--muted-foreground` (via `text-muted-foreground` class) for the confirmation text.

### File Structure Requirements

- **[MODIFY]** `apps/web/src/lib/form-schemas.ts` - Extend schema with `arrivalDate`.
- **[MODIFY]** `apps/web/src/components/form/ApplicationForm.tsx` - Integrate the new DateInput field.
- **[NEW]** `apps/web/src/components/form/DateInput.tsx` - New component handling the DD/MM/YYYY logic and confirmation string.

### Previous Story Intelligence

- In Story 2.1 and 2.2, we established the pattern of using `aria-describedby` effectively and pairing `Controller` or native `register` depending on the complexity of the input.
- `ImageUpload` required `Controller`. `DateInput` will likely also require `Controller` (or careful use of `register` + `useWatch`) because we need to parse the DD/MM/YYYY string, potentially mask it, and display a dynamic confirmation message based on its current value.

## Project Context Reference

- Epic 2: Applicant Submits Visa Application
- UX Designs: `EXPERIENCE.md` (Sections 4.6, 5.3) and `DESIGN.md` (Component `date-confirmation`)

## Tasks / Subtasks

- [x] Task 1: Create DateInput component
  - [x] 1.1 Create `apps/web/src/components/form/DateInput.tsx` with `'use client'`
  - [x] 1.2 Implement input mask/formatting logic for DD/MM/YYYY
  - [x] 1.3 Add real-time date parsing and confirmation string logic

- [x] Task 2: Extend Zod Validation Schema
  - [x] 2.1 Update `apps/web/src/lib/form-schemas.ts` with `arrivalDate`
  - [x] 2.2 Add validation rules: correct format, required, not in the past

- [x] Task 3: Integrate DateInput into ApplicationForm
  - [x] 3.1 Import and add `DateInput` to `ApplicationForm.tsx` using `Controller`
  - [x] 3.2 Add `arrivalDate: ''` to `defaultValues`

- [x] Task 4: Verification
  - [x] 4.1 Typecheck and Lint
  - [x] 4.2 Verify all acceptance criteria are met manually

## Dev Agent Record

### Debug Log
- Handled React's `react-hooks/set-state-in-effect` warning when syncing `localValue` state from external prop.

### Completion Notes
- Implemented `DateInput.tsx` component with real-time formatting (DD/MM/YYYY) and confirmation string using `Intl.DateTimeFormat`.
- Zod schema extended with validations using multiple `.refine()` blocks to ensure standard format and future date validation.
- All tasks have been implemented successfully and typechecks pass.

## File List
- `apps/web/src/lib/form-schemas.ts`
- `apps/web/src/components/form/ApplicationForm.tsx`
- `apps/web/src/components/form/DateInput.tsx`

## Change Log
(Empty)

### Review Findings

- [x] [Review][Defer] Incomplete date entry on submit might show 'Required' instead of 'Invalid Format' if blur doesn't happen first — deferred, minor RHF interaction quirk

## Completion Note

Ultimate context engine analysis completed - comprehensive developer guide created
