---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-VisaAgency-2026-05-30/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/EXPERIENCE.md
---

# VisaAgency - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for David Agency, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Applicant có thể điền 6 fields bắt buộc: Last Name, First Name, Email Address, Portrait Photo (upload), Passport Photo (upload), Arrival Date. Tất cả đều required, validation inline khi rời khỏi field.

FR-2: Applicant có thể upload Portrait Photo và Passport Photo. Hệ thống chấp nhận JPG, PNG, HEIC (tối đa 6MB). HEIC tự động convert sang JPG phía client trước khi upload. Preview ảnh sau khi upload thành công.

FR-3: Khi Applicant nhập Arrival Date theo format DD/MM/YYYY, hệ thống hiển thị real-time dòng xác nhận ngôn ngữ tự nhiên: "✓ You will arrive on [Month] [Day], [Year]". Chỉ hiển thị khi date hợp lệ.

FR-4: Form tích hợp Google reCAPTCHA (v3 invisible ưu tiên, fallback v2) để ngăn bot. Submit bị block nếu reCAPTCHA chưa pass.

FR-5: Khi Applicant bấm Submit: nút disable ngay sau click đầu, loading indicator hiển thị, khi thành công redirect sang success page với Application ID, khi thất bại hiển thị lỗi rõ ràng và giữ nguyên data đã nhập.

FR-6: Hệ thống tự động tạo Application ID duy nhất theo format DA-YYYY-XXXX khi Application được tạo thành công. Application ID hiển thị trên success page và gửi trong email xác nhận.

FR-7: Khi Application submit thành công, hệ thống tự động gửi email xác nhận đến Applicant trong vòng 1 phút. Email chứa: Application ID, tóm tắt thông tin đã nộp, thông điệp tiếp nhận.

FR-8: Khi Operator cập nhật Application status thành Submitted, hệ thống tự động gửi email thông báo đến Applicant trong vòng 1 phút.

FR-9: Operator phải đăng nhập bằng Supabase Auth (email/password) trước khi truy cập dashboard. Mọi route /dashboard/* đều được bảo vệ. Session persistent qua browser reload.

FR-10: Dashboard hiển thị danh sách Applications có thể filter theo status (All/Raw/Ready/Submitted/Done) và search theo tên hoặc Application ID (real-time). Default view: Raw. Mỗi row hiển thị: Application ID, Full Name, Arrival Date, status badge, thời gian submit.

FR-11: Operator có thể xem đầy đủ thông tin và ảnh của từng Application. Portrait Photo và Passport Photo hiển thị qua Signed URL on-demand.

FR-12: Operator có thể chỉnh sửa thông tin Application ở trạng thái Raw (Last Name, First Name, Email, Arrival Date, ảnh). Nút Edit chỉ hiển thị khi status = Raw.

FR-13: Operator có bước Create Data chuẩn bị dữ liệu bổ sung cho Application. Sau khi confirm → status chuyển từ Raw sang Ready. Nút Push to eVisa chỉ active khi status = Ready.

FR-14: Trước khi kích hoạt Extension push lên evisa.gov.vn, hệ thống hiển thị Confirmation Modal với: Portrait Photo thumbnail, Full Name, Arrival Date, Application ID. Operator phải bấm "Confirm & Push" để tiếp tục.

FR-15: Status flow một chiều: Raw → Ready → Submitted → Done. Không thể đi ngược. Mỗi lần thay đổi status → log timestamp.

FR-16: Extension nhận Application data khi Operator xác nhận Push từ Dashboard qua chrome.runtime.sendMessage. Extension xác nhận nhận data trước khi thực hiện thao tác.

FR-17: Extension tự động điền các field trên evisa.gov.vn với data của Application, bao gồm upload Portrait Photo và Passport Photo tự động.

FR-18: Extension dừng lại và không tự submit lên evisa.gov.vn. Operator là người bấm Submit cuối cùng. Extension hiển thị notification khi hoàn thành điền form.

FR-19: Extension cài đặt thủ công qua Chrome Developer mode (không publish Web Store). Developer maintain chủ động khi evisa.gov.vn thay đổi giao diện.

FR-20: Ảnh Portrait và Passport được lưu trong Supabase Storage private bucket. Dashboard generate Signed URL on-demand với thời hạn tối đa 1 giờ. Không bao giờ expose raw storage paths.

FR-21: Supabase RLS được bật trên tất cả các bảng. Public form chỉ có quyền INSERT vào bảng applications. Dashboard (Operator) có full CRUD sau khi xác thực.

### NonFunctional Requirements

NFR-1: (Bảo mật) Tất cả traffic qua HTTPS.

NFR-2: (Bảo mật) Supabase RLS bắt buộc trên mọi bảng — không có exception.

NFR-3: (Bảo mật) Ảnh chỉ accessible qua Signed URL có thời hạn, không bao giờ có public URL cố định.

NFR-4: (Bảo mật) Tất cả dashboard routes protected bằng authentication. Unauthenticated request → redirect /dashboard/login.

NFR-5: (Performance) Form load time < 2 giây trên mobile 4G.

NFR-6: (Performance) Image upload phải có progress indicator — không để người dùng chờ không có feedback.

NFR-7: (Performance) Dashboard list render < 1 giây cho đến 500 records.

NFR-8: (Accessibility) Tất cả form inputs có visible label liên kết qua htmlFor/id. Placeholder text là format hint only, không bao giờ là sole label.

NFR-9: (Accessibility) Error messages mô tả cụ thể vấn đề và cách sửa. Liên kết với input qua aria-describedby. role="alert" để screen reader announce ngay.

NFR-10: (File constraints) Portrait/Passport Photo tối đa 6MB. Accepted formats: JPG, PNG, HEIC (auto-convert HEIC → JPG phía client).

NFR-11: (Reliability) Notification retry 3x + exponential backoff. Dashboard notification badge khi notification thất bại.

NFR-12: (Resilience) Manual Export fallback button trên Dashboard để Richard tự fill evisa.gov.vn khi Extension bị hỏng.

### Additional Requirements

- AR-1: Monorepo scaffold với pnpm workspaces: apps/web (Next.js), apps/extension (Plasmo), packages/shared (TypeScript types). Project initialization là implementation story đầu tiên.
- AR-2: packages/shared phải được tạo trước khi build Form hoặc Extension — chứa types ApplicationData, ApplicationStatus, PushToEvisaMessage, constants STATUS_FLOW, EXTENSION_ID.
- AR-3: Supabase schema: bảng applications (với app_id sequence DA-YYYY-XXXX), notification_logs, RLS policies, private storage bucket — phải finalized trước khi viết RLS policies.
- AR-4: API routes theo pattern: POST /api/applications (anon + reCAPTCHA), GET/PUT /api/applications/[id] (Service Role), PUT /api/applications/[id]/status, GET /api/applications/[id]/signed-urls.
- AR-5: API response format bắt buộc: { data: {...}, error: null } hoặc { data: null, error: { message, code } }. HTTP: 200/400/401/404/500.
- AR-6: Extension ↔ Dashboard communication: chrome.runtime.sendMessage với origin verification bắt buộc (sender.origin === 'https://visa-agency-ivory.vercel.app'). Storage: chrome.storage.local.
- AR-7: Naming conventions bắt buộc: snake_case DB columns, camelCase JSON/TypeScript, kebab-case API routes, PascalCase components, kebab-case utility files.
- AR-8: Date format rules: Database = ISO date string, API JSON = ISO string, Form input = DD/MM/YYYY, UI display = human-readable "Month Day, Year".
- AR-9: Storage paths: {app_id}/portrait.jpg và {app_id}/passport.jpg — luôn dùng Signed URL, không bao giờ expose path.
- AR-10: Vercel Analytics (zero-config) cho error monitoring ở MVP. Structure sẵn để thêm Sentry sau.

### UX Design Requirements

UX-DR1: Brand color tokens phải override shadcn/ui CSS variables trong globals.css: --primary #0A2342, --accent #1D4ED8, --success #16A34A, --warning #D97706, --destructive #DC2626, --muted #F1F5F9, --border #E2E8F0.

UX-DR2: StatusBadge component (4 variants: raw/ready/submitted/done) — pill shape (rounded-full), luôn có text label kèm theo màu, inline-flex với border. Raw: bg #F1F5F9 text #64748B; Ready: bg #FEF3C7 text #92400E; Submitted: bg #DBEAFE text #1E40AF; Done: bg #DCFCE7 text #166534.

UX-DR3: SidebarNav component: fixed 240px width, bg-primary (#0A2342), text-white, active route bg rgba(255,255,255,0.15), hover bg rgba(255,255,255,0.10). Không collapse trong MVP. Logo area trên cùng với border-b border-white/10.

UX-DR4: UploadArea component: drag-and-drop + click-to-browse, dashed border 2px #E2E8F0, rounded-lg, min-height 120px. States: empty/drag-over (border accent #1D4ED8)/uploading (spinner)/success (thumbnail + remove button)/error (border destructive + message). Keyboard: role="button" tabIndex={0} aria-label. HEIC auto-convert client-side.

UX-DR5: DateConfirmation component: text-xs text-muted-foreground mt-1. Xuất hiện ngay khi date hợp lệ, biến mất khi date không hợp lệ hoặc bị xóa. Copy: "You will arrive on {day} {month} {year}."

UX-DR6: ApplicationId component: font-mono text-2xl font-bold trên success screen (bg-muted rounded-md px-4 py-2). Dạng secondary trên detail panel: text-sm font-mono text-muted-foreground.

UX-DR7: FilterTabs component: tabs Raw|All|Ready|Submitted|Done, default active = Raw. Active tab: border-b 2px solid #1D4ED8. Count badge khi count > 0 (e.g., "Raw (3)"). Arrow-key navigation (shadcn Tabs behavior).

UX-DR8: ApplicationsTable: columns Application ID | Applicant Name | Nationality | Date Created | Status | Actions. Row states: default/hover (bg-muted)/selected (bg-muted + border-l-2 border-accent). Skeleton loading rows (3–5).

UX-DR9: Toast notifications: shadcn Toast / Sonner. Position: bottom-right (dashboard), bottom-center (public form). Success: bg-success, auto-dismiss 4s. Error: bg-destructive, persist until dismissed.

UX-DR10: Loading states: page-level (Next.js loading.tsx skeleton), table (skeleton rows 3–5), button (inline spinner + disabled), upload (spinner trong area).

UX-DR11: PushToEvisaModal: shadcn Dialog, heading "Push to eVisa", portrait thumbnail + Full Name + Arrival Date + consequence message. Buttons: Cancel (ghost) | Push to eVisa (primary). Focus trap khi modal mở.

UX-DR12: Accessibility floor: aria-describedby cho error inputs, role="alert" cho error messages, focus trap trong modal, focus returns to trigger khi modal đóng, Tab order logical, focus ring visible (shadcn default ring-2 ring-ring ring-offset-2).

UX-DR13: Empty states: "No [Status] applications" + instruction text. All list empty: "No applications yet."

UX-DR14: ManualExport button: ghost variant, luôn available trong detail panel bất kể status. Label: "Export". Download application data dạng structured format (JSON/CSV).

### FR Coverage Map

FR-1: Epic 2 — Form 6 fields bắt buộc (Last Name, First Name, Email, Arrival Date, Portrait Photo, Passport Photo)
FR-2: Epic 2 — Image upload với HEIC support, client-side conversion, 6MB limit, preview
FR-3: Epic 2 — Real-time date confirmation display
FR-4: Epic 2 — reCAPTCHA v3/v2 spam prevention
FR-5: Epic 2 — Submit idempotency, loading state, success redirect, error handling
FR-6: Epic 2 — Application ID generation (DA-YYYY-XXXX) và display on success
FR-7: Epic 5 — Email notification tiếp nhận hồ sơ (triggered by application insert webhook)
FR-8: Epic 5 — Email notification đã nộp hồ sơ lên chính phủ (triggered by status change webhook)
FR-9: Epic 3 — Operator authentication (Supabase Auth, session persistence, route protection)
FR-10: Epic 3 — Applications list với filter tabs và real-time search
FR-11: Epic 3 — Application detail view với ảnh qua signed URLs
FR-12: Epic 3 — Edit application (Raw status only)
FR-13: Epic 4 — Create Data workflow (Raw → Ready transition)
FR-14: Epic 4 — Pre-Push Confirmation Modal
FR-15: Epic 3 — One-way status tracking với audit timestamp
FR-16: Epic 4 — Extension nhận data từ Dashboard qua chrome.runtime.sendMessage
FR-17: Epic 4 — Extension auto-fill evisa.gov.vn
FR-18: Epic 4 — Operator review và submit trên gov site, status update về Submitted
FR-19: Epic 4 — Extension maintenance (manual install, Developer mode, no Web Store)
FR-20: Epic 1 (bucket creation) + Epic 2 (upload to private bucket) + Epic 3 (signed URL viewing) — Private storage + Signed URLs
FR-21: Epic 1 (setup) — Supabase RLS policies trên tất cả tables

## Epic List

### Epic 1: Project Foundation & Infrastructure
Developers có monorepo scaffolded với Supabase kết nối (schema, RLS, private storage bucket, sequences, shared types) và shadcn/ui brand tokens — nền tảng hoàn chỉnh cho tất cả epics tiếp theo.
**FRs covered:** FR-20 (partial - bucket creation), FR-21 (partial - RLS migrations setup)
**ARs covered:** AR-1 đến AR-10
**UX covered:** UX-DR1 (brand tokens)

### Epic 2: Applicant Submits Visa Application
Khách hàng nước ngoài có thể truy cập form tại một URL cố định, điền 6 fields (upload ảnh kể cả HEIC), nhận xác nhận arrival date real-time, pass reCAPTCHA, và nhận Application ID khi submit thành công.
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6
**UX covered:** UX-DR4 (UploadArea), UX-DR5 (DateConfirmation), UX-DR6 (ApplicationId), UX-DR10 (loading states), UX-DR12 (accessibility)

### Epic 3: Operator Monitors & Manages Applications
Richard có thể đăng nhập dashboard, xem toàn bộ applications với filter/search, xem đầy đủ chi tiết kèm ảnh qua signed URLs, chỉnh sửa applications ở trạng thái Raw, và theo dõi status flow.
**FRs covered:** FR-9, FR-10, FR-11, FR-12, FR-15
**UX covered:** UX-DR2 (StatusBadge), UX-DR3 (SidebarNav), UX-DR7 (FilterTabs), UX-DR8 (ApplicationsTable), UX-DR12 (accessibility), UX-DR13 (empty states)

### Epic 4: Operator Processes Applications & Pushes to eVisa
Richard có thể hoàn thành Create Data workflow để đưa application sang trạng thái Ready, rồi kích hoạt Chrome Extension auto-fill evisa.gov.vn, xem lại form đã điền và submit — với Manual Export làm fallback khi Extension hỏng.
**FRs covered:** FR-13, FR-14, FR-16, FR-17, FR-18, FR-19
**UX covered:** UX-DR11 (PushModal), UX-DR14 (ManualExport)

### Epic 5: Automated Email Notifications
Applicants tự động nhận email xác nhận khi hồ sơ được tiếp nhận và khi đã nộp lên cổng chính phủ — với retry handling và notification badge trên dashboard khi gửi thất bại.
**FRs covered:** FR-7, FR-8
**NFRs covered:** NFR-11 (retry 3x + exponential backoff + failed badge)
**UX covered:** UX-DR9 (Toast notifications)

---

## Epic 1: Project Foundation & Infrastructure

Developers có monorepo scaffolded với Supabase kết nối (schema, RLS, private storage bucket, sequences, shared types) và shadcn/ui brand tokens — nền tảng hoàn chỉnh cho tất cả epics tiếp theo.

### Story 1.1: Initialize Monorepo & Next.js App

As a developer,
I want a working pnpm monorepo with Next.js web app and Plasmo extension scaffold,
So that all subsequent stories have a consistent, correctly structured project to build on.

**Acceptance Criteria:**

**Given** an empty working directory
**When** the developer runs the initialization commands (create-next-app + create-plasmo + pnpm workspace config)
**Then** the following structure exists: `david-agency/apps/web/` (Next.js 14, TypeScript, Tailwind, App Router, src/), `apps/extension/` (Plasmo, TypeScript), `packages/shared/` (TypeScript package, empty src/), `pnpm-workspace.yaml`, `turbo.json`, `package.json` (workspaces root)
**And** `pnpm dev` in `apps/web` starts dev server on localhost:3000 without errors
**And** `pnpm typecheck` and `pnpm lint` pass with no errors across all packages
**And** `.env.example` is created in `apps/web` with placeholder keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

---

### Story 1.2: Shared TypeScript Types Package

As a developer,
I want shared TypeScript types and constants available across the monorepo,
So that the web app and Chrome Extension always use the same data models without drift.

**Acceptance Criteria:**

**Given** the monorepo from Story 1.1 exists
**When** `packages/shared` is configured and built
**Then** `packages/shared/src/types.ts` exports: `ApplicationData` interface (id, appId, lastName, firstName, email, arrivalDate, status, portraitPath, passportPath, createdAt, updatedAt), `ApplicationStatus` type (`'raw' | 'ready' | 'submitted' | 'done'`), `PushToEvisaMessage` interface (type: 'PUSH_TO_EVISA', applicationId, appId, lastName, firstName, arrivalDate, portraitSignedUrl, passportSignedUrl)
**And** `packages/shared/src/constants.ts` exports: `STATUS_FLOW` as `['raw', 'ready', 'submitted', 'done'] as const`, `EXTENSION_ID` as placeholder string
**And** `apps/web` can import `import type { ApplicationData } from '@david-agency/shared'` with no TypeScript errors
**And** TypeScript build passes for `packages/shared` with `pnpm build`

---

### Story 1.3: Supabase Schema, RLS & Private Storage Setup

As a developer (and the system),
I want a complete Supabase database schema with RLS policies and private image storage configured,
So that all application data and photos are stored securely from the very first form submission.

**Acceptance Criteria:**

**Given** a Supabase project is initialized (`supabase init && supabase start`)
**When** all migration files are applied
**Then** table `applications` exists with columns: id (uuid PK), app_id (text UNIQUE NOT NULL), last_name, first_name, email, arrival_date (date), status (text DEFAULT 'raw'), portrait_path, passport_path, created_at (timestamptz), updated_at (timestamptz)
**And** table `notification_logs` exists with columns: id (uuid PK), application_id (uuid FK → applications.id), type, channel, status, attempt (int DEFAULT 1), created_at (timestamptz)
**And** a DB SEQUENCE generates sequential numbers for `app_id` in format `DA-YYYY-XXXX` (e.g. `DA-2026-0001`)
**And** RLS is enabled on `applications`: anon role can INSERT only (no SELECT/UPDATE/DELETE); authenticated operator has full CRUD
**And** RLS is enabled on `notification_logs`: authenticated operator has full CRUD; anon has no access
**And** a private Storage bucket named `applications` exists with no public access policy
**And** `supabase status` shows all services running; `supabase db lint` passes with no errors

---

### Story 1.4: Brand Tokens & shadcn/ui Design System Setup

As an operator and as an applicant,
I want the web app to use David Agency's brand colors and component library,
So that all UI built in subsequent stories consistently reflects the correct visual identity.

**Acceptance Criteria:**

**Given** `apps/web` from Story 1.1 exists
**When** shadcn/ui is initialized and brand tokens applied
**Then** `components.json` is configured for App Router + Tailwind + TypeScript
**And** `globals.css` contains HSL-converted overrides: `--primary` (#0A2342), `--accent` (#1D4ED8), `--success` (#16A34A), `--warning` (#D97706), `--destructive` (#DC2626), `--muted` (#F1F5F9), `--border` (#E2E8F0), `--muted-foreground` (#64748B)
**And** these shadcn components are installed: Button, Input, Label, Dialog, Badge, Table, Tabs, Sonner, Skeleton
**And** a manual spot-check confirms a `<Button>` renders with navy (#0A2342) background
**And** `pnpm typecheck && pnpm lint` pass with no errors

---

## Epic 2: Applicant Submits Visa Application

Khách hàng nước ngoài có thể truy cập form tại một URL cố định, điền 6 fields (upload ảnh kể cả HEIC), nhận xác nhận arrival date real-time, pass reCAPTCHA, và nhận Application ID khi submit thành công.

### Story 2.1: Public Form Page Layout & Basic Fields

As an applicant,
I want to see a clean, single-page form with clearly labelled fields for my personal information,
So that I can quickly understand what information is required and fill it in without confusion.

**Acceptance Criteria:**

**Given** a visitor navigates to the root URL `/`
**When** the page loads
**Then** a single-page scrollable form is displayed with max-width 640px, centered (`mx-auto`), outer padding `px-4 py-8` on mobile / `px-0 py-12` on sm+
**And** the form contains these fields in order: Last Name (label: "Last Name (Family Name)"), First Name (label: "First Name (Given Name)"), Email Address (label: "Email Address")
**And** all fields have visible `<label>` elements linked via `htmlFor` — placeholder is a hint only, never the sole label
**And** React Hook Form + Zod schema validates: all fields required; email format valid
**And** inline validation fires `onBlur`: invalid field shows `border-destructive` + error message below (`text-xs text-destructive`) with `aria-describedby` linking input to error (`role="alert"`)
**And** `pnpm typecheck && pnpm lint` pass

---

### Story 2.2: Photo Upload Component with HEIC Support

As an applicant,
I want to upload my portrait photo and passport photo (including HEIC from my iPhone),
So that I can submit my application even when my photos are in iPhone's default format.

**Acceptance Criteria:**

**Given** the form from Story 2.1 exists
**When** the applicant interacts with the upload areas
**Then** two `UploadArea` components appear: one for Portrait Photo, one for Passport Photo
**And** each upload area shows: dashed border `2px #E2E8F0`, rounded-lg, min-height 120px, format hint "JPG, PNG, HEIC — max 6MB"
**And** HEIC files are automatically converted to JPG client-side (using `heic2any`) before any upload; no HEIC bytes leave the browser
**And** files exceeding 6MB are rejected immediately with error: "This file is too large. Maximum size is 6MB."
**And** on drag-over: border color transitions to `border-accent` (#1D4ED8), background becomes `bg-muted`
**And** after successful file selection: thumbnail preview fills the area; a remove (×) button appears top-right
**And** the upload area is keyboard accessible: `role="button"` `tabIndex={0}`, Enter/Space opens file picker, `aria-label="Upload Portrait Photo"` / `aria-label="Upload Passport Photo"`
**And** uploading state shows spinner + "Uploading…" label; area is not interactive during upload

---

### Story 2.3: Arrival Date Input with Real-Time Confirmation

As an applicant,
I want to enter my arrival date and immediately see it confirmed in plain English,
So that I can catch date entry errors (e.g., day/month transposition) before submitting.

**Acceptance Criteria:**

**Given** the form from Story 2.1 exists
**When** the applicant interacts with the Arrival Date field
**Then** an input with placeholder "DD/MM/YYYY" is shown with label "Date of Arrival"
**And** as soon as a complete, valid date is entered, a `DateConfirmation` string appears below: `text-xs text-muted-foreground mt-1` — copy: "You will arrive on {day} {month} {year}." (e.g., "You will arrive on 6 July 2026.")
**And** the confirmation updates in real-time as the user changes the date value
**And** if the date is cleared or becomes invalid, the confirmation string disappears immediately with no flicker
**And** invalid date on blur triggers error: `border-destructive` + "Please enter a valid date in DD/MM/YYYY format." with `aria-describedby` + `role="alert"`
**And** the Zod schema validates: date is required, date is valid, date is not in the past

---

### Story 2.4: Application Submission API & Application ID Generation

As the system,
I want a secure API route that stores the application and photos and generates a unique Application ID,
So that every submitted application is persisted to the database with a traceable identifier.

**Acceptance Criteria:**

**Given** the Supabase schema from Story 1.3 exists and the form can send a POST request
**When** `POST /api/applications` is called with valid form data (all 6 fields + 2 photo files)
**Then** the API route uses Supabase Service Role key server-side only — never exposed to client
**And** portrait and passport photos are uploaded to the private `applications` bucket at paths `{app_id}/portrait.jpg` and `{app_id}/passport.jpg`
**And** the `app_id` is generated atomically from the DB SEQUENCE in format `DA-YYYY-XXXX`
**And** a new row is inserted into `applications` with all fields and `status = 'raw'`
**And** the response returns `{ data: { appId: "DA-2026-XXXX" }, error: null }` with HTTP 200
**And** if validation fails: returns `{ data: null, error: { message: string, code: "VALIDATION_ERROR" } }` with HTTP 400
**And** raw storage paths are never returned in the response — only `appId`

---

### Story 2.5: reCAPTCHA Integration, Submit Flow & Success Page

As an applicant,
I want to submit the completed form and be taken to a confirmation page showing my Application ID,
So that I know my application was received and have a reference number for follow-up.

**Acceptance Criteria:**

**Given** the complete form (Stories 2.1–2.4) exists
**When** the applicant interacts with the submit zone
**Then** a Google reCAPTCHA v3 (invisible) widget is present; reCAPTCHA v2 checkbox is the fallback
**And** the Submit button (label: "Submit Application", full-width, primary variant) is disabled if reCAPTCHA has not passed
**And** on click: Submit button is immediately disabled; spinner appears; label changes to "Submitting…"
**And** on success: applicant is redirected to `/success?id=DA-2026-XXXX`
**And** the `/success` page displays: a checkmark icon, heading "Application Received", the Application ID in `font-mono text-2xl font-bold` inside `bg-muted rounded-md px-4 py-2` chip, message "Your application has been received. We'll be in touch within 24 hours."
**And** on network/server failure: Submit button re-enables; error toast appears bottom-center (persistent until dismissed): "Submission failed — please try again."; all form data is preserved
**And** double-submit is impossible: button remains disabled from first click until redirect or error

---

## Epic 3: Operator Monitors & Manages Applications

Richard có thể đăng nhập dashboard, xem toàn bộ applications với filter/search, xem đầy đủ chi tiết kèm ảnh qua signed URLs, chỉnh sửa applications ở trạng thái Raw, và theo dõi status flow.

### Story 3.1: Operator Authentication & Route Protection

As an operator,
I want to log in with email and password and have my session persist across reloads,
So that I can access the dashboard securely without re-authenticating every time.

**Acceptance Criteria:**

**Given** a visitor navigates to any `/dashboard/*` route while unauthenticated
**When** the middleware runs
**Then** they are immediately redirected to `/dashboard/login`
**And** `middleware.ts` protects all `/dashboard` routes using Supabase session cookie
**And** the login page at `/dashboard/login` shows an email + password form with "Sign In" button
**And** on successful login: Supabase Auth session is established; user is redirected to `/dashboard`
**And** session persists across browser reloads (cookie-based, not in-memory)
**And** on login failure: inline error message "Invalid email or password." is shown; password field is cleared
**And** after login, navigating to `/dashboard/login` redirects to `/dashboard` (no re-login if already authenticated)

---

### Story 3.2: Dashboard Layout & Sidebar Navigation

As an operator,
I want a consistent dashboard layout with sidebar navigation,
So that I can orient myself quickly and navigate between sections without losing context.

**Acceptance Criteria:**

**Given** the operator is authenticated and navigates to `/dashboard`
**When** the dashboard layout renders
**Then** a fixed 240px sidebar appears on the left with `bg-primary` (#0A2342) background, David Agency logo/name in header slot (`px-4 py-5 border-b border-white/10`)
**And** the sidebar contains nav item "Applications" pointing to `/dashboard` with `text-sm font-medium`
**And** the active route is highlighted: `bg-white/15 text-white`; inactive: `text-white/80 hover:bg-white/10`
**And** main content area is `flex-1 p-6 overflow-auto` to the right of the sidebar
**And** the layout is a Next.js `layout.tsx` at `app/dashboard/layout.tsx` — all `/dashboard` child routes inherit it
**And** the sidebar is fixed-width (non-collapsible) in MVP

---

### Story 3.3: Applications List with Filter Tabs & Search

As an operator,
I want to see all applications in a filterable table with real-time search,
So that I can quickly find and prioritise the applications that need my attention.

**Acceptance Criteria:**

**Given** the operator is on `/dashboard`
**When** the page loads
**Then** filter tabs appear: **Raw** | **All** | **Ready** | **Submitted** | **Done** — default active tab is **Raw**
**And** each tab shows a count badge when count > 0 (e.g., "Raw (3)"); active tab has `border-b-2 border-accent` (#1D4ED8)
**And** a data table shows applications matching the active filter, columns: Application ID | Applicant Name | Arrival Date | Status | Submitted At
**And** each row shows the correct `StatusBadge` variant (pill rounded-full, text label always present): Raw (#F1F5F9/#64748B), Ready (#FEF3C7/#92400E), Submitted (#DBEAFE/#1E40AF), Done (#DCFCE7/#166534)
**And** a search box filters in real-time (no Enter required) by Last Name, First Name, or Application ID
**And** table is sorted by `created_at` descending (newest first)
**And** while loading: 5 skeleton rows matching the table column structure are shown
**And** when the filtered list is empty: "No [Status] applications." + "Applications will appear here once they reach [Status] status."
**And** clicking a row navigates to `/dashboard/applications/[id]`
**And** data is fetched via TanStack Query (Supabase JS client + anon key + RLS)

---

### Story 3.4: Application Detail View with Signed URL Images

As an operator,
I want to open an application and see all its fields and photos,
So that I can review the submitted information and images before processing.

**Acceptance Criteria:**

**Given** the operator clicks a row on the applications list
**When** the detail page at `/dashboard/applications/[id]` loads
**Then** the Application ID is displayed: `text-sm font-mono text-muted-foreground` as secondary identifier
**And** a field grid shows: Last Name, First Name, Email, Arrival Date (human-readable: "July 6, 2026"), Status badge
**And** Portrait Photo and Passport Photo are displayed via `GET /api/applications/[id]/signed-urls` which uses Supabase Service Role to generate signed URLs (1 hour expiry)
**And** signed URLs API route uses Service Role key server-side — raw storage paths are never exposed to client
**And** if a signed URL fails to load: the image slot shows a broken-image icon + caption "Image unavailable"
**And** browser back-navigation returns to `/dashboard` with the previously active filter preserved

---

### Story 3.5: Edit Application & One-Way Status Tracking

As an operator,
I want to edit application details when the status is Raw and have every status change timestamped,
So that I can correct mistakes before processing and maintain an audit trail.

**Acceptance Criteria:**

**Given** the operator is viewing an application detail page
**When** the application status is `raw`
**Then** an "Edit" button is visible in the detail panel
**And** clicking "Edit" opens an `EditModal` (shadcn Dialog) pre-filled with: Last Name, First Name, Email, Arrival Date; with option to replace Portrait/Passport photos
**And** on save: `PUT /api/applications/[id]` updates the record; `updated_at` is set; modal closes; detail view refreshes; status remains `raw`
**And** the Edit button is not rendered when status is `ready`, `submitted`, or `done`
**And** `PUT /api/applications/[id]/status` rejects backward transitions, returning HTTP 400 `{ data: null, error: { message: "Invalid status transition", code: "INVALID_TRANSITION" } }`
**And** every status change records the transition timestamp in `updated_at`

---

## Epic 4: Operator Processes Applications & Pushes to eVisa

Richard có thể hoàn thành Create Data workflow để đưa application sang trạng thái Ready, rồi kích hoạt Chrome Extension auto-fill evisa.gov.vn, xem lại form đã điền và submit — với Manual Export làm fallback khi Extension hỏng.

### Story 4.1: Create Data Workflow (Raw → Ready Transition)

As an operator,
I want to complete a "Create Data" step that prepares additional information for an application,
So that I can mark it as Ready and confirm it's been reviewed before pushing to the government portal.

**Acceptance Criteria:**

**Given** the operator is on the detail page of an application with status `raw`
**When** they view the action buttons
**Then** a "Create Data" button is visible (primary variant)
**And** clicking "Create Data" opens a `CreateDataModal` (shadcn Dialog) with a confirmation prompt "Confirm application data is ready for submission?" and a "Confirm" button
**And** on confirm: `PUT /api/applications/[id]/status` is called with `{ status: 'ready' }`; status badge transitions Raw → Ready via optimistic update
**And** after the transition: "Create Data" button is replaced by "Push to eVisa" (enabled since status is now `ready`)
**And** the "Create Data" button is not rendered when status is `ready`, `submitted`, or `done`
**And** if the API call fails: optimistic update is rolled back; persistent error toast: "Failed to update status — please try again."
**And** `updated_at` is recorded on the status change

---

### Story 4.2: Pre-Push Confirmation Modal

As an operator,
I want to see a confirmation modal with key applicant details before triggering the Chrome Extension,
So that I can verify I'm pushing the correct application before committing.

**Acceptance Criteria:**

**Given** the operator is on the detail page of an application with status `ready`
**When** they click "Push to eVisa"
**Then** a shadcn `Dialog` opens with heading "Push to eVisa"
**And** the modal displays: portrait photo thumbnail (small, loaded via signed URL), Full Name, Arrival Date (human-readable), Application ID, and body copy "This will submit [Full Name]'s application to evisa.gov.vn."
**And** two buttons are shown: "Cancel" (ghost variant) and "Push to eVisa" (primary variant)
**And** clicking "Cancel" closes the modal; no action is taken; status remains `ready`
**And** focus is trapped within the dialog while open; on close, focus returns to the "Push to eVisa" trigger button
**And** the "Push to eVisa" button in the detail panel is disabled (tooltip: "Application must be Ready before pushing") when status is not `ready`

---

### Story 4.3: Chrome Extension — Setup & Dashboard Message Protocol

As an operator,
I want the Chrome Extension to receive application data from the dashboard when I confirm a push,
So that it has all the information it needs to auto-fill evisa.gov.vn accurately.

**Acceptance Criteria:**

**Given** the Plasmo extension scaffold from Story 1.1 exists
**When** the operator confirms "Push to eVisa" in the modal
**Then** the Dashboard sends a `PushToEvisaMessage` via `chrome.runtime.sendMessage(EXTENSION_ID, message)` — EXTENSION_ID imported from `packages/shared/src/constants.ts`
**And** the message contains: `type: 'PUSH_TO_EVISA'`, `applicationId`, `appId`, `lastName`, `firstName`, `arrivalDate`, `portraitSignedUrl`, `passportSignedUrl` (fresh signed URLs, 1 hour expiry)
**And** `background.ts` listens via `chrome.runtime.onMessageExternal.addListener` and verifies `sender.origin === 'https://visa-agency-ivory.vercel.app'` before processing — messages from other origins are silently ignored
**And** on successful receipt: payload stored in `chrome.storage.local` under key `pendingApplication` và tự động mở một cửa sổ Chrome mới đến trang `https://evisa.gov.vn`
**And** on failed message delivery: Dashboard shows persistent error toast "Extension not found — make sure it is installed and enabled."; application status does not change
**And** extension `popup.tsx` shows "Ready to fill" when `pendingApplication` exists in storage, "No pending application" otherwise

---

### Story 4.4: Chrome Extension — Auto-Fill evisa.gov.vn & Status Update

As an operator,
I want the Chrome Extension to automatically fill the evisa.gov.vn form with the application data,
So that I only need to review the pre-filled form and click Submit — eliminating all manual copy-paste.

**Acceptance Criteria:**

**Given** the extension has received a `PushToEvisaMessage` và một cửa sổ mới đến trang evisa.gov.vn đã được tự động mở
**When** the content script `evisa-filler.ts` chạy trên trang form evisa.gov.vn trong cửa sổ mới đó
**Then** it reads `pendingApplication` from `chrome.storage.local`
**And** it maps and fills application fields into the corresponding evisa.gov.vn DOM inputs: Last Name, First Name, Arrival Date, and other prepared fields
**And** it downloads Portrait and Passport photos via the signed URLs and programmatically sets the file upload inputs on evisa.gov.vn
**And** the extension does NOT submit the form — it stops after filling all fields and shows a browser notification: "Form filled — please review and submit."
**And** after the operator submits on evisa.gov.vn and returns to the dashboard, they click "Mark as Submitted" which calls `PUT /api/applications/[id]/status` with `{ status: 'submitted' }`
**And** after successful status update: "Push to eVisa" button is disabled; StatusBadge shows "Submitted"
**And** `chrome.storage.local` key `pendingApplication` is cleared after push completes

---

### Story 4.5: Manual Export Fallback

As an operator,
I want to download an application's data as a structured file at any time,
So that I can manually fill evisa.gov.vn if the Chrome Extension is broken or the site changes its interface.

**Acceptance Criteria:**

**Given** the operator is on any application detail page regardless of status
**When** they view the action buttons
**Then** an "Export" button is always visible (ghost variant) — not gated by status
**And** clicking "Export" triggers a JSON file download containing: appId, lastName, firstName, email, arrivalDate, status
**And** the downloaded filename follows the pattern: `DA-2026-XXXX-export.json`
**And** the export does NOT include signed URLs or storage paths — image data is not included
**And** the export is generated client-side from already-loaded application data — no additional API call required

---

## Epic 5: Automated Email Notifications

Applicants tự động nhận email xác nhận khi hồ sơ được tiếp nhận và khi đã nộp lên cổng chính phủ — với retry handling và notification badge trên dashboard khi gửi thất bại.

### Story 5.1: Supabase Webhook & Edge Function Infrastructure

As a developer,
I want Supabase webhooks configured to trigger notification Edge Functions on key application events,
So that notifications fire automatically without any polling or manual intervention.

**Acceptance Criteria:**

**Given** the Supabase project from Story 1.3 exists
**When** webhooks and Edge Functions are deployed
**Then** two Edge Functions are deployed: `notify-received` (triggers on new application INSERT) and `notify-submitted` (triggers on status update to `submitted`)
**And** a Supabase Webhook is configured on `applications` table for INSERT events → calls `notify-received`
**And** a Supabase Webhook is configured on `applications` table for UPDATE events where `status = 'submitted'` → calls `notify-submitted`
**And** both Edge Functions accept the Supabase webhook payload and extract `application_id` from it
**And** both Edge Functions read email provider API key from Supabase environment secrets (not hardcoded)
**And** `supabase functions deploy notify-received && supabase functions deploy notify-submitted` completes without errors
**And** a manual test insert into `applications` triggers `notify-received` (verifiable via Supabase function logs)

---

### Story 5.2: Application Received Email Notification

As an applicant,
I want to automatically receive a confirmation email when my application is submitted,
So that I have proof of submission and a reference number without needing to ask the agency.

**Acceptance Criteria:**

**Given** the `notify-received` Edge Function and webhook from Story 5.1 exist
**When** a new row is inserted into `applications`
**Then** the Edge Function fetches the full application record using `application_id` from the webhook payload
**And** an email is sent to the applicant's `email` address within 1 minute of the insert
**And** the email contains: Application ID (`DA-YYYY-XXXX`), Full Name, Arrival Date (human-readable), and message "We have received your application and will process it shortly."
**And** a row is inserted into `notification_logs`: `type = 'received'`, `channel = 'email'`, `status = 'success'`, `application_id` set
**And** if the email provider call fails: the Edge Function retries up to 3 times with exponential backoff (1s, 2s, 4s delays)
**And** if all 3 retries fail: a row is inserted into `notification_logs` with `status = 'failed'` and `attempt = 3`

---

### Story 5.3: Application Submitted Email Notification

As an applicant,
I want to automatically receive an email when my application has been submitted to the Vietnam e-Visa portal,
So that I know the agency has taken action without needing to follow up.

**Acceptance Criteria:**

**Given** the `notify-submitted` Edge Function and webhook from Story 5.1 exist
**When** an application's `status` is updated to `submitted`
**Then** the Edge Function sends an email to the applicant's `email` address within 1 minute
**And** the email contains: Application ID and message "Your application has been submitted to the Vietnam e-Visa portal."
**And** a row is inserted into `notification_logs`: `type = 'submitted'`, `channel = 'email'`, `status = 'success'`
**And** retry logic (3x exponential backoff) applies identically to Story 5.2
**And** on all-retries-failed: `notification_logs` row inserted with `status = 'failed'`

---

### Story 5.4: Notification Failure Badge on Dashboard

As an operator,
I want to see a visible badge on the dashboard when an email notification has failed,
So that I can identify which applicants did not receive their notification and follow up manually.

**Acceptance Criteria:**

**Given** the dashboard from Epic 3 exists and `notification_logs` contains failed entries
**When** the operator views the dashboard
**Then** a `NotificationBadge` appears on the "Applications" sidebar nav item: `bg-destructive text-white rounded-full` chip showing the count of failed notifications
**And** clicking the badge navigates to `/dashboard` and highlights the affected application rows with a warning indicator
**And** on an affected application's detail page: a warning banner shows "Email notification failed for this application — consider contacting the applicant directly."
**And** the badge count decreases when the operator acknowledges/dismisses the warning on the detail page
**And** TanStack Query auto-invalidates dashboard data after status changes, triggering a re-fetch (UX-DR9)
