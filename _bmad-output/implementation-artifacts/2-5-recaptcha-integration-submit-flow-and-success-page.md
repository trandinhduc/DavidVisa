# Story 2.5: reCAPTCHA Integration, Submit Flow & Success Page

Status: done
baseline_commit: 28d0404

## Story

As an applicant,
I want to submit the completed form and be taken to a confirmation page showing my Application ID,
so that I know my application was received and have a reference number for follow-up.

## Acceptance Criteria

1. **Given** the complete form (Stories 2.1–2.4) exists
2. **When** the applicant interacts with the submit zone
3. **Then** a Google reCAPTCHA v3 (invisible) widget is present; reCAPTCHA v2 checkbox is the fallback
4. **And** the Submit button (label: "Submit Application", full-width, primary variant) is disabled if reCAPTCHA has not passed
5. **And** on click: Submit button is immediately disabled; spinner appears; label changes to "Submitting…"
6. **And** on success: applicant is redirected to `/success?id=DA-2026-XXXX`
7. **And** the `/success` page displays: a checkmark icon, heading "Application Received", the Application ID in `font-mono text-2xl font-bold` inside `bg-muted rounded-md px-4 py-2` chip, message "Your application has been received. We'll be in touch within 24 hours."
8. **And** on network/server failure: Submit button re-enables; error toast appears bottom-center (persistent until dismissed): "Submission failed — please try again."; all form data is preserved
9. **And** double-submit is impossible: button remains disabled from first click until redirect or error

## Tasks / Subtasks

- [x] Implement reCAPTCHA integration (AC: 1, 2, 3, 4)
  - [x] Add `react-google-recaptcha-v3` package for reCAPTCHA integration.
  - [x] Integrate reCAPTCHA Provider into the app layout.
  - [x] Wrap form submit to execute reCAPTCHA and get token.
- [x] Implement UI for submit button and states (AC: 4, 5, 8, 9)
  - [x] Handle loading state: disable button, show spinner, change text.
  - [x] Prevent double-submit by keeping button disabled during request.
  - [x] Handle error state: re-enable button and display error toast (using Sonner).
- [x] Implement `/success` page (AC: 6, 7)
  - [x] Create `apps/web/src/app/success/page.tsx`.
  - [x] Display Application ID from URL query param `id`.
  - [x] Style success page according to design requirements (checkmark, message, styled ID chip).
- [x] Integrate API route with reCAPTCHA (Server-side) (AC: 3)
  - [x] Update `POST /api/applications` to verify reCAPTCHA token using Google's verification API.

## Dev Notes

- **Architecture:** We are using Next.js App Router. Server-side validation should ensure the reCAPTCHA token is verified with Google's API before inserting into Supabase.
- **Environment Variables:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` for client, `RECAPTCHA_SECRET_KEY` for server (will use dummy values in `.env` for now as specified in Story 1.1).
- **UI:** Success page should be minimal and match the form's centered aesthetic.
- **Edge cases:** ReCAPTCHA script failed to load, verify API failed. Form data MUST be preserved on failure (react-hook-form preserves data natively if we don't reset).

### References

- Epic 2 Requirements

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

### Completion Notes List

- Added `react-google-recaptcha-v3` and implemented the provider inside `RecaptchaProvider.tsx`.
- Updated `ApplicationForm.tsx` to handle recaptcha token retrieval upon submit.
- Integrated `Toaster` from `sonner` in `layout.tsx` for visual feedback.
- Created `/success` route for post-submission redirection.
- Added server-side reCAPTCHA verification to `/api/applications` API route with `RECAPTCHA_SECRET_KEY`.
- Fixed ESLint and type issues; passed `pnpm typecheck && pnpm lint`.

### File List

- `apps/web/package.json` (modified)
- `apps/web/src/app/layout.tsx` (modified)
- `apps/web/src/components/providers/RecaptchaProvider.tsx` (new)
- `apps/web/src/components/form/ApplicationForm.tsx` (modified)
- `apps/web/src/app/success/page.tsx` (new)
- `apps/web/src/app/api/applications/route.ts` (modified)

### Review Findings
- [x] [Review][Defer] reCAPTCHA validation silently bypassed if secret key is missing — deferred, pre-existing. Reason: Tạm hoãn theo yêu cầu của người dùng.
- [x] [Review][Patch] Missing reCAPTCHA v2 fallback (AC 3) [apps/web/src/components/form/ApplicationForm.tsx] — AC 3 requires a v2 fallback, but only v3 is implemented.
- [x] [Review][Patch] Unsafe parsing of non-JSON error responses [apps/web/src/components/form/ApplicationForm.tsx:317]
- [x] [Review][Patch] Synchronous access of searchParams in Next.js 15 [apps/web/src/app/success/page.tsx:224]
- [x] [Review][Patch] Toast position and persistence not configured (AC 8) [apps/web/src/app/layout.tsx:207]
