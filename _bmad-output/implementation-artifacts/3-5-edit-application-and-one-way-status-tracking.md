---
baseline_commit: 720eb54d46bd42b57af907de4f08b95c7f8b9f35
---

# Story 3.5: Edit Application & One-Way Status Tracking

**Story ID:** 3.5
**Story Key:** 3-5-edit-application-and-one-way-status-tracking
**Status:** ready-for-dev
**Epic:** Epic 3 — Operator Monitors & Manages Applications
**Created:** 2026-06-05

---

## User Story

**As an operator,**
I want to edit application details when the status is Raw and have every status change timestamped,
So that I can correct mistakes before processing and maintain an audit trail.

---

## Acceptance Criteria (BDD)

**AC-1: Edit button visibility**
**Given** the operator is viewing an application detail page
**When** the application status is `raw`
**Then** an "Edit" button is visible in the detail panel

**AC-2: Edit modal pre-filled**
**And** clicking "Edit" opens an `EditModal` (shadcn Dialog) pre-filled with: Last Name, First Name, Email, Arrival Date; with option to replace Portrait/Passport photos

**AC-3: Save action**
**And** on save: `PUT /api/applications/[id]` updates the record; `updated_at` is set; modal closes; detail view refreshes; status remains `raw`

**AC-4: Edit button hidden for non-raw status**
**And** the Edit button is not rendered when status is `ready`, `submitted`, or `done`

**AC-5: Status transition validation**
**And** `PUT /api/applications/[id]/status` rejects backward transitions, returning HTTP 400 `{ data: null, error: { message: "Invalid status transition", code: "INVALID_TRANSITION" } }`

**AC-6: Status change timestamp**
**And** every status change records the transition timestamp in `updated_at`

---

## Developer Context

### ⚠️ CRITICAL ARCHITECTURE NOTES FOR THIS STORY

**1. PUT /api/applications/[id] — phải ADD vào route.ts hiện có:**
File `apps/web/src/app/api/applications/[id]/route.ts` đã có hàm `GET`. Story này phải ADD thêm hàm `PUT` vào cùng file đó — KHÔNG tạo file mới. Hãy đọc file hiện có trước khi chỉnh sửa.

**2. PUT /api/applications/[id]/status — route MỚI:**
Tạo file `apps/web/src/app/api/applications/[id]/status/route.ts` — route này xử lý one-way status transitions (raw → ready → submitted → done). Nếu transition backward → reject HTTP 400.

**3. One-Way Status Flow:**
```
raw → ready → submitted → done
```
KHÔNG cho phép reverse. Validate bằng cách so sánh index trong STATUS_FLOW array.

**4. EditModal với photo upload:**
- Dùng shadcn `Dialog` (đã cài: `src/components/ui/dialog.tsx`)
- Form fields: Last Name, First Name, Email, Arrival Date (input type="date" — giá trị là ISO string `YYYY-MM-DD`)
- Photo replace: input type="file" accept="image/*,.heic" — optional, chỉ upload nếu user chọn file mới
- Nếu user không chọn ảnh mới → KHÔNG overwrite storage paths hiện tại
- Arrival Date value trong input: dùng trực tiếp `application.arrivalDate` (đã là ISO `YYYY-MM-DD` từ DB)

**5. TanStack Query invalidation sau save:**
Sau khi `PUT /api/applications/[id]` thành công, phải gọi `queryClient.invalidateQueries({ queryKey: ['applications', id] })` để refetch và refresh UI.

**6. Photo upload trong edit:**
Nếu user chọn ảnh mới → upload lên Supabase Storage bucket `applications` (path: `{app_id}/portrait.jpg` hoặc `{app_id}/passport.jpg`) qua browser client. Cần dùng `createClient()` từ `src/lib/supabase-client.ts` trong modal — KHÔNG upload qua API route (tương tự pattern của Story 2.2). Hoặc đơn giản hơn: tạo một API route `POST /api/applications/[id]/upload` nhận FormData. Recommendation: dùng browser client trực tiếp trong modal (đơn giản hơn, đã có pattern trong Story 2.2).

**7. Status field trong response:**
API `PUT /api/applications/[id]` sau khi update → vẫn trả về status hiện tại (không thay đổi status qua route này) — status chỉ thay đổi qua `/status` route.

---

## Technical Requirements

### Stack & Dependencies

- **TanStack Query:** `@tanstack/react-query` (đã cài từ Story 3.3) — dùng `useMutation` + `useQueryClient` để invalidate sau save
- **shadcn Dialog:** đã có `src/components/ui/dialog.tsx`
- **shadcn Input:** đã có `src/components/ui/input.tsx`
- **shadcn Label:** đã có `src/components/ui/label.tsx`
- **Supabase Browser Client:** `createClient()` từ `src/lib/supabase-client.ts` — nếu cần upload ảnh trong modal
- **Supabase Service Role:** `createServiceClient()` từ `src/lib/supabase-server.ts` — trong API routes
- **Shared Types:** `import type { ApplicationData, ApplicationStatus } from '@david-agency/shared'`
- **Constants:** kiểm tra `packages/shared/src/constants.ts` để lấy `STATUS_FLOW` array

### Không cần cài thêm package.

---

## File Structure — Cần tạo / chỉnh sửa

### MODIFY (chỉnh sửa hiện có):

```
apps/web/src/
├── app/
│   └── api/
│       └── applications/
│           └── [id]/
│               └── route.ts                ← [MODIFY] Thêm PUT handler vào file này
├── components/
│   └── dashboard/
│       └── ApplicationDetail.tsx           ← [MODIFY] Thêm Edit button (chỉ khi status === 'raw')
└── hooks/
    └── use-application.ts                  ← [MODIFY] Thêm useUpdateApplication mutation hook
```

### NEW (tạo mới):

```
apps/web/src/
├── app/
│   └── api/
│       └── applications/
│           └── [id]/
│               └── status/
│                   └── route.ts            ← [NEW] PUT /api/applications/[id]/status
└── components/
    └── dashboard/
        └── EditModal.tsx                   ← [NEW] Edit form modal
```

---

## Implementation Guide

### 1. MODIFY `apps/web/src/app/api/applications/[id]/route.ts`

Thêm hàm `PUT` vào cuối file (sau hàm `GET` hiện tại). ĐỪNG xóa hoặc sửa hàm `GET`.

```typescript
// Thêm vào cuối file, sau hàm GET

import { z } from 'zod'

const updateApplicationSchema = z.object({
  lastName: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const parseResult = updateApplicationSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid request body', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const updates = parseResult.data
    const supabase = createServiceClient()

    // Map camelCase → snake_case cho DB
    const dbUpdates: Record<string, unknown> = {}
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate
    dbUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('applications')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found or update failed', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const application = {
      id: data.id,
      appId: data.app_id,
      lastName: data.last_name,
      firstName: data.first_name,
      email: data.email,
      arrivalDate: data.arrival_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ data: application, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
```

**Lưu ý quan trọng về import:** File hiện tại đã có `import { createServiceClient } from '@/lib/supabase-server'` và `import { NextResponse } from 'next/server'`. Chỉ cần thêm `import { z } from 'zod'` — kiểm tra xem zod đã được cài chưa (khả năng cao là có vì Story 2.x đã dùng).

### 2. NEW `apps/web/src/app/api/applications/[id]/status/route.ts`

```typescript
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { ApplicationStatus } from '@david-agency/shared'

// One-way status flow — index trong array thể hiện thứ tự
const STATUS_FLOW: ApplicationStatus[] = ['raw', 'ready', 'submitted', 'done']

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const newStatus = body?.status as ApplicationStatus

    // Validate newStatus is valid
    if (!STATUS_FLOW.includes(newStatus)) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid status value', code: 'INVALID_STATUS' } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const currentIndex = STATUS_FLOW.indexOf(current.status as ApplicationStatus)
    const newIndex = STATUS_FLOW.indexOf(newStatus)

    // Reject backward transitions (one-way only)
    if (newIndex <= currentIndex) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid status transition', code: 'INVALID_TRANSITION' } },
        { status: 400 }
      )
    }

    // Update status — updated_at records the transition timestamp (AC-6)
    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to update status', code: 'UPDATE_FAILED' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { id: data.id, status: data.status, updatedAt: data.updated_at }, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
```

### 3. NEW `apps/web/src/components/dashboard/EditModal.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ApplicationData } from '@david-agency/shared'

interface EditModalProps {
  application: ApplicationData
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EditFormState {
  lastName: string
  firstName: string
  email: string
  arrivalDate: string
  portraitFile: File | null
  passportFile: File | null
}

export function EditModal({ application, open, onOpenChange }: EditModalProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<EditFormState>({
    lastName: application.lastName,
    firstName: application.firstName,
    email: application.email,
    arrivalDate: application.arrivalDate,
    portraitFile: null,
    passportFile: null,
  })

  // Reset form when modal re-opens with fresh application data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        lastName: application.lastName,
        firstName: application.firstName,
        email: application.email,
        arrivalDate: application.arrivalDate,
        portraitFile: null,
        passportFile: null,
      })
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // 1. Upload new photos if selected (via browser Supabase client)
      if (form.portraitFile || form.passportFile) {
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()

        if (form.portraitFile) {
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(`${application.appId}/portrait.jpg`, form.portraitFile, { upsert: true })
          if (uploadError) throw new Error(`Portrait upload failed: ${uploadError.message}`)
        }

        if (form.passportFile) {
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(`${application.appId}/passport.jpg`, form.passportFile, { upsert: true })
          if (uploadError) throw new Error(`Passport upload failed: ${uploadError.message}`)
        }
      }

      // 2. Update application fields via API
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: form.lastName,
          firstName: form.firstName,
          email: form.email,
          arrivalDate: form.arrivalDate,
        }),
      })

      const { error: apiError } = await res.json()
      if (!res.ok || apiError) {
        throw new Error(apiError?.message ?? 'Failed to update application')
      }

      // 3. Invalidate queries to refresh detail view (AC-3)
      await queryClient.invalidateQueries({ queryKey: ['applications', application.id] })

      // 4. Also invalidate signed-urls if photos were updated
      if (form.portraitFile || form.passportFile) {
        await queryClient.invalidateQueries({ queryKey: ['applications', application.id, 'signed-urls'] })
      }

      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-last-name">Last Name</Label>
              <Input
                id="edit-last-name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-first-name">First Name</Label>
              <Input
                id="edit-first-name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-arrival-date">Arrival Date</Label>
            <Input
              id="edit-arrival-date"
              type="date"
              value={form.arrivalDate}
              onChange={(e) => setForm((prev) => ({ ...prev, arrivalDate: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-portrait">Replace Portrait Photo (optional)</Label>
            <Input
              id="edit-portrait"
              type="file"
              accept="image/*,.heic"
              disabled={isSaving}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, portraitFile: e.target.files?.[0] ?? null }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-passport">Replace Passport Photo (optional)</Label>
            <Input
              id="edit-passport"
              type="file"
              accept="image/*,.heic"
              disabled={isSaving}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, passportFile: e.target.files?.[0] ?? null }))
              }
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. MODIFY `apps/web/src/components/dashboard/ApplicationDetail.tsx`

Thêm Edit button (chỉ hiện khi `status === 'raw'`) và wire up `EditModal`. Cần chuyển thành `'use client'` vì thêm `useState`.

```tsx
'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { ApplicationImages } from './ApplicationImages'
import { EditModal } from './EditModal'
import { Button } from '@/components/ui/button'
import type { ApplicationData } from '@david-agency/shared'

interface ApplicationDetailProps {
  application: ApplicationData
}

function formatArrivalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return dateStr
  const date = new Date(yearNum, monthNum - 1, dayNum)
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = application.status === 'raw'

  return (
    <div className="space-y-8">
      {/* Header — Full Name + App ID + Status + Edit button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {application.lastName} {application.firstName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-0.5">
            {application.appId}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <StatusBadge status={application.status} />
          {/* AC-1, AC-4: Edit button only visible when status is 'raw' */}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Field grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 rounded-lg border border-border p-6 bg-white">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Last Name
          </dt>
          <dd className="mt-1 text-sm text-foreground font-medium">
            {application.lastName || '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            First Name
          </dt>
          <dd className="mt-1 text-sm text-foreground font-medium">
            {application.firstName || '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Email
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.email || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Arrival Date
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatArrivalDate(application.arrivalDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </dt>
          <dd className="mt-1">
            <StatusBadge status={application.status} />
          </dd>
        </div>
      </dl>

      {/* Photos section */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Photos</h2>
        <ApplicationImages applicationId={application.id} />
      </div>

      {/* Edit Modal — only mounted when status is 'raw' */}
      {canEdit && (
        <EditModal
          application={application}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  )
}
```

**Lưu ý:** Kiểm tra xem `Button` đã được cài trong `src/components/ui/button.tsx` chưa (khả năng cao đã có từ Story 3.x). Nếu chưa có, cài với: `pnpm dlx shadcn@latest add button -c apps/web`.

---

## Architecture Compliance Checklist

- [ ] `PUT /api/applications/[id]` được ADD vào file route.ts hiện có (không tạo mới file).
- [ ] `PUT /api/applications/[id]/status` tạo file mới `status/route.ts`.
- [ ] Status transition validation: `newIndex > currentIndex` (one-way only).
- [ ] `updated_at` được set trên cả PUT application và PUT status.
- [ ] Edit button chỉ hiện khi `status === 'raw'`.
- [ ] `EditModal` dùng shadcn `Dialog` — pre-filled với data hiện tại.
- [ ] Sau save: `queryClient.invalidateQueries` để refresh detail view.
- [ ] Photo upload: upsert với `{ upsert: true }` — không duplicate.
- [ ] Photo upload optional: nếu không có file mới → không overwrite storage.
- [ ] `portrait_path` và `passport_path` KHÔNG bao giờ trả về từ API routes.

---

## Previous Story Intelligence

### Từ Story 3.4 (Application Detail View):
- **Route Group:** Page đặt tại `app/dashboard/(protected)/applications/[id]/page.tsx` (đã tồn tại, KHÔNG thay đổi).
- **TanStack Query:** `QueryClientProvider` setup tại `src/app/providers.tsx` — `useQueryClient()` sẵn sàng dùng trong client components.
- **API route.ts pattern:** Params phải `await params` vì Next.js 15 App Router trả về `Promise<{ id: string }>`.
- **Supabase Service Role:** `createServiceClient()` từ `src/lib/supabase-server.ts` — dùng trong tất cả API routes.
- **Signed URL storage paths:** `{app_id}/portrait.jpg` và `{app_id}/passport.jpg` — dùng `application.appId`, không phải `application.id`.

### Từ Story 3.3 (Applications List):
- **TanStack Query:** `@tanstack/react-query` đã cài — dùng `useQuery`, `useMutation`, `useQueryClient`.
- **Timezone Bug:** Arrival Date parse phải dùng `new Date(year, month-1, day)` — đã implement trong `formatArrivalDate` function.

### Từ Story 2.2 (Photo Upload):
- **Supabase Storage Upload:** Dùng browser client (`createClient()`) với `supabase.storage.from('applications').upload(path, file, { upsert: true })`.
- **HEIC support:** Nếu cần, import `heic-convert.ts` — nhưng với EditModal, optional: cho phép user upload HEIC trực tiếp, Supabase storage accept any binary.

---

## Git Intelligence

Recent commits:
- `720eb54 feat: implement operator authentication and route protection (Story 3.1)` — tạo route group `(protected)`.
- Stories 3.2, 3.3, 3.4 được implement nhưng không có commit riêng (merged vào HEAD).
- Không có commit nào thêm `PUT /api/applications/[id]` → cần tạo trong story này.

---

## Story Completion Status

- [x] ADD `PUT` handler vào `apps/web/src/app/api/applications/[id]/route.ts`
- [x] Tạo `apps/web/src/app/api/applications/[id]/status/route.ts`
- [x] Tạo `apps/web/src/components/dashboard/EditModal.tsx`
- [x] MODIFY `apps/web/src/components/dashboard/ApplicationDetail.tsx` (thêm Edit button + EditModal)
- [x] Verify `pnpm typecheck && pnpm lint` pass
- [x] Verify Edit button hiển thị khi status=raw, ẩn khi status≠raw
- [x] Verify EditModal mở pre-filled, save thành công, view refresh
- [x] Verify backward status transition bị reject với HTTP 400

---

## Dev Agent Record

### Completion Notes
- ADD `PUT /api/applications/[id]` vào file `route.ts` hiện có: validate body bằng Zod, map camelCase → snake_case, update `updated_at` timestamp, return updated record (không bao giờ return storage paths).
- Tạo `PUT /api/applications/[id]/status` route mới: validate status là valid value, fetch current status, compare indexes trong STATUS_FLOW array, reject backward transitions với HTTP 400 + `INVALID_TRANSITION` code, update `updated_at` timestamp.
- Tạo `EditModal.tsx`: shadcn Dialog pre-filled từ application data, reset form khi modal re-open, upload photos qua browser Supabase client với `{ upsert: true }`, gọi `PUT /api/applications/[id]`, invalidate TanStack Query cache để refresh detail view.
- MODIFY `ApplicationDetail.tsx`: thêm `'use client'`, `useState` cho modal open state, Edit button với `Pencil` icon (chỉ render khi `status === 'raw'`), mount `EditModal` conditionally.
- Fix TypeScript error: thay `Record<string, unknown>` bằng explicit typed object cho `dbUpdates` để phù hợp với Supabase type requirements.
- `pnpm typecheck` (toàn bộ monorepo gồm web, extension, shared) — ✅ pass.
- `pnpm lint` — ✅ pass (chỉ 1 pre-existing warning từ `ApplicationForm.tsx`, không liên quan story này).

### File List
- `apps/web/src/app/api/applications/[id]/route.ts` [MODIFY] — thêm PUT handler + Zod import
- `apps/web/src/app/api/applications/[id]/status/route.ts` [NEW]
- `apps/web/src/components/dashboard/EditModal.tsx` [NEW]
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` [MODIFY] — thêm 'use client', useState, Edit button, EditModal

### Change Log
- 2026-06-05: Implement Story 3.5 — Edit Application & One-Way Status Tracking. ADD PUT handler vào route.ts; tạo status/route.ts; tạo EditModal.tsx; modify ApplicationDetail.tsx để thêm Edit button và modal. pnpm typecheck + pnpm lint đều pass.

**Status:** review

