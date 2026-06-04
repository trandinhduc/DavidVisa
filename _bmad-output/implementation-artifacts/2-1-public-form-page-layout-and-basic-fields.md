---
baseline_commit: 36e0b97ec9f7e02990a2387b36b1d631fa72fab8
---

# Story 2.1: Public Form Page Layout & Basic Fields

Status: done

## Story

As an applicant,
I want to see a clean, single-page form with clearly labelled fields for my personal information,
so that I can quickly understand what information is required and fill it in without confusion.

## Acceptance Criteria

1. Khi visitor điều hướng đến root URL `/`, một single-page scrollable form được hiển thị với max-width 640px, centered (`mx-auto`), outer padding `px-4 py-8` trên mobile / `px-0 py-12` trên `sm+`
2. Form chứa các fields theo thứ tự: Last Name (label: "Last Name (Family Name)"), First Name (label: "First Name (Given Name)"), Email Address (label: "Email Address")
3. Tất cả fields có visible `<label>` elements linked via `htmlFor` — placeholder là format hint only, không bao giờ là sole label
4. React Hook Form + Zod schema validate: tất cả fields required; email format valid
5. Inline validation fires `onBlur`: invalid field hiển thị `border-destructive` + error message below (`text-xs text-destructive`) với `aria-describedby` linking input to error (`role="alert"`)
6. `pnpm typecheck && pnpm lint` pass từ monorepo root

## Tasks / Subtasks

- [x] Task 1: Install form dependencies (AC: 4)
  - [x] 1.1 Từ monorepo root, chạy: `pnpm --filter web add react-hook-form zod @hookform/resolvers`
  - [x] 1.2 Verify `apps/web/package.json` có thêm 3 packages mới: `react-hook-form`, `zod`, `@hookform/resolvers`

- [x] Task 2: Create Zod validation schema (AC: 4)
  - [x] 2.1 Tạo `apps/web/src/lib/form-schemas.ts` — export `applicationFormSchema` và `ApplicationFormData` type
  - [x] 2.2 Schema fields: `lastName` (string, required), `firstName` (string, required), `email` (string, required + valid email format)
  - [x] 2.3 Đặt schema ở file riêng vì Stories 2.2 và 2.3 sẽ extend thêm fields (photo, arrivalDate)

- [x] Task 3: Create ApplicationForm component (AC: 2, 3, 4, 5)
  - [x] 3.1 Tạo directory `apps/web/src/components/form/`
  - [x] 3.2 Tạo `apps/web/src/components/form/ApplicationForm.tsx` với `'use client'` directive
  - [x] 3.3 Import `useForm` từ `react-hook-form`, `zodResolver` từ `@hookform/resolvers/zod`, schema từ `@/lib/form-schemas`
  - [x] 3.4 Config `useForm`: `resolver: zodResolver(applicationFormSchema)`, `mode: 'onBlur'` — destructure `register`, `handleSubmit`, `formState: { errors }`
  - [x] 3.5 Thêm `noValidate` vào `<form>` element + `onSubmit={handleSubmit(() => {})}` (Story 2.5 sẽ thay `() => {}` bằng actual submit handler)
  - [x] 3.6 Implement Last Name field: `<Label htmlFor="lastName">Last Name (Family Name)</Label>` + `<Input id="lastName" ...>` + conditional error display
  - [x] 3.7 Implement First Name field: `<Label htmlFor="firstName">First Name (Given Name)</Label>` + `<Input id="firstName" ...>` + conditional error display
  - [x] 3.8 Implement Email Address field: `<Label htmlFor="email">Email Address</Label>` + `<Input id="email" type="email" ...>` + conditional error display
  - [x] 3.9 Mỗi field error: `<p id="{fieldId}-error" role="alert" className="text-xs text-destructive mt-1">` + input có `aria-describedby="{fieldId}-error"` chỉ khi có lỗi
  - [x] 3.10 Apply `cn(errors.{field} && 'border-destructive')` lên `className` của Input khi có lỗi

- [x] Task 4: Update page.tsx với form layout (AC: 1)
  - [x] 4.1 Update `apps/web/src/app/page.tsx` — giữ làm Server Component (KHÔNG thêm `'use client'`)
  - [x] 4.2 Thêm `<h1>` page heading trước `<ApplicationForm />` (xem Dev Notes — exact content)
  - [x] 4.3 Wrap `ApplicationForm` bên trong `<main>` với outer padding responsive + `<div>` centering wrapper (xem Dev Notes — exact classes)
  - [x] 4.4 Import `ApplicationForm` từ `@/components/form/ApplicationForm`

- [x] Task 5: Verification (AC: 6)
  - [x] 5.1 Từ monorepo root, chạy: `pnpm typecheck` — phải pass 3/3 packages
  - [x] 5.2 Từ monorepo root, chạy: `pnpm --filter web lint` — phải pass không có errors
  - [x] 5.3 Chạy `pnpm --filter web dev`, mở http://localhost:3000 và verify: form centered với max-width ~640px, padding responsive; tab qua Last Name rồi bỏ trống → `border-destructive` + error text xuất hiện; nhập email sai format rồi blur → error message hiển thị đúng

## Dev Notes

### CRITICAL: Next.js 16

`apps/web` dùng **Next.js 16.2.6** — có breaking changes so với Next.js 14/15. Đọc `apps/web/node_modules/next/dist/docs/01-app/` trước khi viết bất kỳ Next.js code nào. `AGENTS.md` và `CLAUDE.md` tại `apps/web/` đều cảnh báo điều này.

### CRITICAL: Tailwind CSS v4

Dự án dùng **Tailwind CSS v4** — khác hoàn toàn với v3:
- **KHÔNG có `tailwind.config.ts`** — file này không tồn tại, không được tạo
- `globals.css` dùng `@import "tailwindcss"` (không phải `@tailwind base/components/utilities`)
- Brand tokens đã được setup trong `apps/web/src/app/globals.css` từ Story 1.4 — **không override**
- Tất cả utility classes (`border-destructive`, `text-muted-foreground`, etc.) hoạt động bình thường

### CRITICAL: Không Có Test Framework

Dự án **chưa có** jest/vitest/playwright. Không cần viết test files. Verification = `pnpm typecheck` + `pnpm lint` + visual review khi chạy dev server.

### Package Installation

Dùng `pnpm --filter web add` cho monorepo:

```bash
pnpm --filter web add react-hook-form zod @hookform/resolvers
```

**Không dùng**: `npm install`, `yarn add`, hay `pnpm add` (không có `--filter`).

### Packages Cần Thêm

Chưa có trong `apps/web/package.json`:
- `react-hook-form` — form state management, validation lifecycle (onBlur mode)
- `zod` — TypeScript-first schema validation
- `@hookform/resolvers` — bridge: `zodResolver(schema)` cho react-hook-form

### File Structure Cho Story Này

```
apps/web/src/
├── app/
│   └── page.tsx                          ← UPDATE (server component)
├── components/
│   └── form/
│       └── ApplicationForm.tsx           ← NEW ('use client')
└── lib/
    └── form-schemas.ts                   ← NEW (schema, extendable)
```

### page.tsx — Exact Implementation

`page.tsx` là **Server Component** (không có `'use client'`):

```tsx
import ApplicationForm from "@/components/form/ApplicationForm";

export default function Home() {
  return (
    <main className="px-4 py-8 sm:px-0 sm:py-12">
      <div className="mx-auto w-full max-w-[640px]">
        <h1 className="text-2xl font-semibold mb-8">Vietnam Visa Application</h1>
        <ApplicationForm />
      </div>
    </main>
  );
}
```

**Layout spec**: `px-4 py-8` mobile → `sm:px-0 sm:py-12` desktop, max-width `640px` centered. [Source: DESIGN.md — Layout & Spacing]

**Page heading**: EXPERIENCE.md mô tả *"Carlos sees the David Agency form header"* — heading `text-2xl font-semibold mb-8` phù hợp với typography scale (DESIGN.md — Page title). Heading là Server Component content, không ảnh hưởng đến Client Component boundary.

### form-schemas.ts — Exact Implementation

```typescript
import { z } from 'zod'

export const applicationFormSchema = z.object({
  lastName: z.string().min(1, 'Last name is required'),
  firstName: z.string().min(1, 'First name is required'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>
```

**Lý do tách file riêng**: Stories 2.2 và 2.3 sẽ **MODIFY trực tiếp file `form-schemas.ts`** — thêm fields vào `applicationFormSchema` gốc, không tạo schema mới:
```typescript
// Story 2.2 sẽ THÊM vào applicationFormSchema trong form-schemas.ts:
portraitPhoto: z.instanceof(File, { message: 'Portrait photo is required' }),
passportPhoto: z.instanceof(File, { message: 'Passport photo is required' }),

// Story 2.3 sẽ THÊM vào applicationFormSchema trong form-schemas.ts:
arrivalDate: z.string().min(1, 'Arrival date is required'),
```
`ApplicationFormData` type tự động update vì là `z.infer<typeof applicationFormSchema>`.

### ApplicationForm.tsx — Pattern Chi Tiết

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { applicationFormSchema, type ApplicationFormData } from '@/lib/form-schemas'

export default function ApplicationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    mode: 'onBlur',
  })

  // Story 2.5 sẽ thay () => {} bằng async submit handler gọi POST /api/applications
  return (
    <form noValidate onSubmit={handleSubmit(() => {})} className="flex flex-col gap-6">
      {/* Last Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lastName">Last Name (Family Name)</Label>
        <Input
          id="lastName"
          placeholder="family name"
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          className={cn(errors.lastName && 'border-destructive')}
          {...register('lastName')}
        />
        {errors.lastName && (
          <p id="lastName-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* First Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="firstName">First Name (Given Name)</Label>
        <Input
          id="firstName"
          placeholder="given name"
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          className={cn(errors.firstName && 'border-destructive')}
          {...register('firstName')}
        />
        {errors.firstName && (
          <p id="firstName-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Email Address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={cn(errors.email && 'border-destructive')}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive mt-1">
            {errors.email.message}
          </p>
        )}
      </div>
    </form>
  )
}
```

### Error Display Pattern — Accessibility Requirements

Theo NFR-8, NFR-9, UX-DR12:

```
noValidate        → BẮT BUỘC trên <form> — ngăn browser native popup cho type="email"
aria-describedby  → chỉ set khi có lỗi (không set empty string)
role="alert"      → screen reader announce ngay khi error xuất hiện
id pattern        → "{fieldId}-error" (e.g., "lastName-error")
border class      → cn(errors.field && 'border-destructive') — apply via cn()
error text class  → "text-xs text-destructive mt-1"
```

**Quan trọng**: `aria-describedby={errors.field ? 'field-error' : undefined}` — `undefined` để không render attribute khi không có lỗi. Không dùng empty string `""`.

**Tại sao cần `noValidate`**: Browser native validation cho `type="email"` hiển thị popup riêng trước khi RHF có cơ hội xử lý. Với `noValidate`, toàn bộ validation do RHF/Zod quản lý — đảm bảo `role="alert"` errors luôn được hiển thị nhất quán.

### Existing Files — KHÔNG THAY ĐỔI

| File | Trạng thái |
|---|---|
| `apps/web/src/app/layout.tsx` | KHÔNG thay đổi — Geist fonts đã setup |
| `apps/web/src/app/globals.css` | KHÔNG thay đổi — brand CSS vars đã setup |
| `apps/web/src/components/ui/*` | KHÔNG thay đổi — shadcn components |
| `apps/web/src/lib/utils.ts` | KHÔNG thay đổi — cn() helper |
| `apps/web/src/lib/supabase-*.ts` | KHÔNG thay đổi |
| `apps/web/src/lib/application-id.ts` | KHÔNG thay đổi |
| `packages/shared/*` | KHÔNG thay đổi |
| `supabase/*` | KHÔNG liên quan |

### Scope — KHÔNG Làm Trong Story 2.1

- **Story 2.2**: `UploadArea` component, photo upload fields, HEIC conversion
- **Story 2.3**: `DateInput` component, arrivalDate field, date confirmation display
- **Story 2.4**: API route `POST /api/applications`, form submit logic
- **Story 2.5**: reCAPTCHA, Submit button, success redirect, Sonner `<Toaster>` trong layout.tsx

Form trong story 2.1 **không có** submit logic thực sự. `handleSubmit(() => {})` là scaffold forward-compatible — Story 2.5 thay `() => {}` bằng `async (data) => { /* POST /api/applications */ }`. `noValidate` trên form element là bắt buộc để RHF/Zod xử lý validation thay browser native (quan trọng cho email field). `ApplicationForm.tsx` sẽ được các story tiếp theo update thêm fields (2.2, 2.3) và submit handler (2.5).

### Context Từ Previous Stories

- **shadcn Input** (`@/components/ui/input`) — đã install từ Story 1.4
- **shadcn Label** (`@/components/ui/label`) — đã install từ Story 1.4  
- **cn() helper** (`@/lib/utils`) — đã setup từ Story 1.4
- **Brand CSS variables** active: `--destructive` (red errors), `--muted`, `--border` — đã có
- **Monorepo pnpm**: dùng `pnpm --filter web` cho web-specific commands
- **pnpm typecheck**: run từ root, check 3/3 packages (web, extension, shared)

### Architecture Compliance

| Rule | Source | Story này |
|---|---|---|
| React Hook Form + Zod | architecture.md D3 | ✅ `useForm` + `zodResolver` |
| Server Component default | architecture.md Next.js rules | ✅ `page.tsx` không có `'use client'` |
| `'use client'` cho forms | architecture.md Next.js rules | ✅ `ApplicationForm.tsx` |
| PascalCase component files | architecture.md naming | ✅ `ApplicationForm.tsx` |
| kebab-case utility files | architecture.md naming | ✅ `form-schemas.ts` |
| Visible labels với htmlFor | NFR-8, UX-DR12 | ✅ Accessibility compliance |
| aria-describedby + role="alert" | NFR-9, UX-DR12 | ✅ Error association |

### UX Design Compliance

| Requirement | Source | Giá trị |
|---|---|---|
| Form max-width | DESIGN.md — Layout | `max-w-[640px]` |
| Mobile padding | DESIGN.md — Layout | `px-4 py-8` |
| Desktop padding | DESIGN.md — Layout | `sm:px-0 sm:py-12` |
| Section gap | DESIGN.md — Layout | `gap-6` |
| Error border | EXPERIENCE.md — 5.1 | `border-destructive` |
| Error text | EXPERIENCE.md — 5.1 | `text-xs text-destructive` |
| Placeholder is hint only | EXPERIENCE.md — 7 Accessibility | ✅ Labels via htmlFor |

### References

- Story requirements: [epics.md — Epic 2, Story 2.1](_bmad-output/planning-artifacts/epics.md)
- NFR-8 (accessible labels): [epics.md — NonFunctional Requirements](_bmad-output/planning-artifacts/epics.md)
- NFR-9 (error messages): [epics.md — NonFunctional Requirements](_bmad-output/planning-artifacts/epics.md)
- Architecture D3 (React Hook Form + Zod): [architecture.md — Core Architectural Decisions](_bmad-output/planning-artifacts/architecture.md)
- Form layout specs: [DESIGN.md — Layout & Spacing](_bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/DESIGN.md)
- Error states: [EXPERIENCE.md — 5.1 Form Field States](_bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/EXPERIENCE.md)
- Story 1.4 (shadcn/ui setup, Tailwind v4 context): [1-4-brand-tokens-and-shadcnui-design-system-setup.md](_bmad-output/implementation-artifacts/1-4-brand-tokens-and-shadcnui-design-system-setup.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (create-story), claude-sonnet-4-6 (dev-story)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Cài đặt `react-hook-form@7.77.0`, `zod@4.4.3`, `@hookform/resolvers@5.4.0` via `pnpm --filter web add`
- ✅ Task 2: Tạo `apps/web/src/lib/form-schemas.ts` với `applicationFormSchema` (lastName, firstName, email) và type `ApplicationFormData` — file thiết kế để extendable cho Story 2.2 (photo fields) và 2.3 (arrivalDate)
- ✅ Task 3: Tạo `apps/web/src/components/form/ApplicationForm.tsx` — Client Component (`'use client'`), useForm với `zodResolver` + `mode: 'onBlur'`, `noValidate` trên form, 3 fields với Label/Input/error display đúng accessibility (aria-describedby conditional, role="alert", cn(errors.field && 'border-destructive'))
- ✅ Task 4: Update `apps/web/src/app/page.tsx` — Server Component (không có `'use client'`), layout `px-4 py-8 sm:px-0 sm:py-12`, container `mx-auto w-full max-w-[640px]`, h1 "Vietnam Visa Application", import ApplicationForm
- ✅ Task 5: `pnpm typecheck` pass 3/3 packages (web, extension, shared); `pnpm --filter web lint` pass 0 errors; visual verification qua browser xác nhận form centered, 3 fields hiển thị đúng, validation errors (red border + message) hoạt động onBlur

### File List

- `apps/web/package.json` (modified — added react-hook-form, zod, @hookform/resolvers)
- `apps/web/src/lib/form-schemas.ts` (new — Zod schema and type)
- `apps/web/src/components/form/ApplicationForm.tsx` (new — form Client Component)
- `apps/web/src/app/page.tsx` (modified — layout update with form)

## Change Log

- 2026-06-03: Story created by create-story workflow — comprehensive dev context cho public form layout và 3 basic fields
- 2026-06-03: Story validated and improved — added noValidate, handleSubmit scaffold, page heading, visual verification step, UX-compliant placeholders, clarified schema extension pattern
- 2026-06-03: Story implemented by dev-story — installed form deps, created form-schemas.ts, ApplicationForm.tsx, updated page.tsx; typecheck + lint pass; visual verification confirmed all ACs
- 2026-06-03: Code review complete (claude-sonnet-4-6) — 2 patches applied, 1 decision dismissed, 3 deferred

### Review Findings

- [x] [Review][Patch] Whitespace-only input bypass — `z.string().min(1)` không trim; `"   "` pass validation [form-schemas.ts] — **Fixed**: thêm `.trim()` vào chain cho cả 3 fields
- [x] [Review][Patch] Placeholder copy vi phạm DESIGN.md Copy Patterns — `"family name"` / `"given name"` là value suggestions, không phải format hints [ApplicationForm.tsx:28,45] — **Fixed**: xóa placeholders khỏi lastName và firstName
- [x] [Review][Defer] Form submit no-op — handleSubmit(() => {}) không có loading/feedback state — deferred, intentional scaffold, scope Story 2.5
- [x] [Review][Defer] Không có `<fieldset>` semantic grouping — form 3 fields đơn, không bắt buộc với ARIA pattern hiện tại — deferred
- [x] [Review][Defer] Không có Next.js metadata (title, meta description) — ngoài scope Story 2.1 — deferred
