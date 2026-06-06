---
baseline_commit: 720eb54d46bd42b57af907de4f08b95c7f8b9f35
---

# Story 3.4: Application Detail View with Signed URL Images

**Story ID:** 3.4
**Story Key:** 3-4-application-detail-view-with-signed-url-images
**Status:** done
**Epic:** Epic 3 — Operator Monitors & Manages Applications
**Created:** 2026-06-05

---

## User Story

**As an operator,**
I want to open an application and see all its fields and photos,
So that I can review the submitted information and images before processing.

---

## Acceptance Criteria (BDD)

**AC-1: Row navigation to detail page**
**Given** the operator clicks a row on the applications list
**When** the detail page at `/dashboard/applications/[id]` loads
**Then** the page renders without error

**AC-2: Application ID display**
**And** the Application ID is displayed: `text-sm font-mono text-muted-foreground` as secondary identifier

**AC-3: Field grid**
**And** a field grid shows: Last Name, First Name, Email, Arrival Date (human-readable: "July 6, 2026"), Status badge

**AC-4: Images via Signed URLs**
**And** Portrait Photo and Passport Photo are displayed via `GET /api/applications/[id]/signed-urls` which uses Supabase Service Role to generate signed URLs (1 hour expiry)

**AC-5: Security — no raw paths**
**And** signed URLs API route uses Service Role key server-side — raw storage paths are never exposed to client

**AC-6: Broken image fallback**
**And** if a signed URL fails to load: the image slot shows a broken-image icon + caption "Image unavailable"

**AC-7: Back navigation preserves filter**
**And** browser back-navigation returns to `/dashboard` with the previously active filter preserved

---

## Developer Context

### ⚠️ CRITICAL ARCHITECTURE NOTES FOR THIS STORY

**Route Group `(protected)`:**
Story 3.1/3.2 đã fix redirect loop bằng cách chuyển layout dashboard vào `(protected)` group.
Trang detail mới phải đặt tại: `apps/web/src/app/dashboard/(protected)/applications/[id]/page.tsx`
KHÔNG phải `apps/web/src/app/dashboard/applications/[id]/page.tsx`

**Hybrid Data Fetching Pattern:**
- **Read application detail**: dùng Next.js API Route `GET /api/applications/[id]` với Service Role key (không dùng Supabase JS client trực tiếp ở client vì cần bypass RLS cho ảnh)  
- Alternatively: dùng TanStack Query hook `useApplication(id)` gọi Supabase browser client (data từ `applications` table RLS allow authenticated read)
- **Signed URLs**: gọi `GET /api/applications/[id]/signed-urls` từ client — API route này dùng Service Role để tạo signed URLs

**Signed URL API Route (Server-Only):**
Sử dụng `createServiceClient()` từ `src/lib/supabase-server.ts` — đây là Service Role key, KHÔNG bao giờ expose ra client.
Signed URL expiry: `60 * 60` seconds (1 giờ).
Storage bucket: `applications`.
Paths: `{app_id}/portrait.jpg` và `{app_id}/passport.jpg`.

**Date Display Format:**
Arrival date từ DB là ISO string `"2026-07-06"`. Display dạng `"July 6, 2026"`.
Dùng `new Date(parseInt(year), parseInt(month) - 1, parseInt(day))` để parse an toàn (tránh UTC timezone shift như đã note trong Story 3.3 review).

---

## Technical Requirements

### Stack & Dependencies

- **Data Fetching:** TanStack Query (đã cài từ Story 3.3) — `@tanstack/react-query`
- **HTTP Requests:** Native `fetch()` hoặc TanStack Query queryFn  
- **Supabase Server:** `createServiceClient()` từ `src/lib/supabase-server.ts`
- **Supabase Browser:** `createClient()` từ `src/lib/supabase-client.ts`
- **Icons:** `lucide-react` (đã cài) — dùng `ImageOff`, `ArrowLeft`

### Không cần cài thêm package.

---

## File Structure — Cần tạo / chỉnh sửa

### NEW (tạo mới):

```
apps/web/src/
├── app/
│   ├── dashboard/
│   │   └── (protected)/
│   │       └── applications/
│   │           └── [id]/
│   │               └── page.tsx              ← [NEW] Detail page (Client Component)
│   └── api/
│       └── applications/
│           └── [id]/
│               ├── route.ts                  ← [NEW] GET /api/applications/[id]
│               └── signed-urls/
│                   └── route.ts              ← [NEW] GET /api/applications/[id]/signed-urls
├── components/
│   └── dashboard/
│       ├── ApplicationDetail.tsx             ← [NEW] Detail view layout component
│       └── ApplicationImages.tsx             ← [NEW] Images with signed URL loading
└── hooks/
    └── use-application.ts                    ← [NEW] TanStack Query hook for single application
```

### MODIFY (không cần chỉnh sửa gì trong story này — SidebarNav đã nhận diện active route qua `pathname.startsWith`):

---

## Implementation Guide

### 1. `src/app/api/applications/[id]/route.ts` [NEW]

API route lấy full application record bằng Service Role (để đảm bảo an toàn, tránh RLS edge case).

```typescript
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Map snake_case → camelCase, NEVER return portrait_path/passport_path
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
      // portraitPath và passportPath KHÔNG được trả về — dùng signed-urls endpoint
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

### 2. `src/app/api/applications/[id]/signed-urls/route.ts` [NEW]

API route tạo signed URLs từ Supabase Storage (Service Role).
Signed URLs expire sau 1 giờ — không cần cache phía server.

```typescript
import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()

    // Lấy app_id từ applications table để build storage paths
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('app_id, portrait_path, passport_path')
      .eq('id', params.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const EXPIRY = 60 * 60 // 1 hour

    // Generate signed URLs — storage paths: {app_id}/portrait.jpg và {app_id}/passport.jpg
    const portraitPath = application.portrait_path || `${application.app_id}/portrait.jpg`
    const passportPath = application.passport_path || `${application.app_id}/passport.jpg`

    const [portraitResult, passportResult] = await Promise.all([
      supabase.storage.from('applications').createSignedUrl(portraitPath, EXPIRY),
      supabase.storage.from('applications').createSignedUrl(passportPath, EXPIRY),
    ])

    return NextResponse.json({
      data: {
        portraitSignedUrl: portraitResult.data?.signedUrl ?? null,
        passportSignedUrl: passportResult.data?.signedUrl ?? null,
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
```

### 3. `src/hooks/use-application.ts` [NEW]

Hook TanStack Query cho single application.

```typescript
import { useQuery } from '@tanstack/react-query'
import type { ApplicationData } from '@david-agency/shared'

export function useApplication(id: string) {
  return useQuery<ApplicationData>({
    queryKey: ['applications', id],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`)
      if (!res.ok) throw new Error('Failed to fetch application')
      const { data, error } = await res.json()
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id,
  })
}

export function useSignedUrls(id: string) {
  return useQuery<{ portraitSignedUrl: string | null; passportSignedUrl: string | null }>({
    queryKey: ['applications', id, 'signed-urls'],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}/signed-urls`)
      if (!res.ok) throw new Error('Failed to fetch signed URLs')
      const { data, error } = await res.json()
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 phút (signed URLs expire sau 1 giờ)
  })
}
```

### 4. `src/components/dashboard/ApplicationImages.tsx` [NEW]

Component hiển thị ảnh qua signed URLs với fallback khi lỗi.

```tsx
'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useSignedUrls } from '@/hooks/use-application'
import { Skeleton } from '@/components/ui/skeleton'

interface ApplicationImagesProps {
  applicationId: string
}

function ImageSlot({
  src,
  alt,
  isLoading,
}: {
  src: string | null | undefined
  alt: string
  isLoading: boolean
}) {
  const [imgError, setImgError] = useState(false)

  if (isLoading) {
    return <Skeleton className="w-full aspect-[3/4] rounded-md" />
  }

  if (!src || imgError) {
    return (
      <div className="flex flex-col items-center justify-center w-full aspect-[3/4] rounded-md border border-border bg-muted text-muted-foreground gap-2">
        <ImageOff className="h-8 w-8" />
        <span className="text-xs">Image unavailable</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full aspect-[3/4] object-cover rounded-md border border-border"
      onError={() => setImgError(true)}
    />
  )
}

export function ApplicationImages({ applicationId }: ApplicationImagesProps) {
  const { data, isLoading } = useSignedUrls(applicationId)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Portrait Photo
        </p>
        <ImageSlot
          src={data?.portraitSignedUrl}
          alt="Portrait Photo"
          isLoading={isLoading}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Passport Photo
        </p>
        <ImageSlot
          src={data?.passportSignedUrl}
          alt="Passport Photo"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
```

### 5. `src/components/dashboard/ApplicationDetail.tsx` [NEW]

Component hiển thị field grid + ảnh.

```tsx
import { StatusBadge } from './StatusBadge'
import { ApplicationImages } from './ApplicationImages'
import type { ApplicationData } from '@david-agency/shared'

interface ApplicationDetailProps {
  application: ApplicationData
}

function formatArrivalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  // Parse tránh UTC timezone shift (dùng local date)
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header — App ID + Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {application.lastName} {application.firstName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-0.5">
            {application.appId}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Field grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-border p-6 bg-white">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Name</dt>
          <dd className="mt-1 text-sm text-foreground font-medium">{application.lastName || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Name</dt>
          <dd className="mt-1 text-sm text-foreground font-medium">{application.firstName || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</dt>
          <dd className="mt-1 text-sm text-foreground">{application.email || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Arrival Date</dt>
          <dd className="mt-1 text-sm text-foreground">{formatArrivalDate(application.arrivalDate)}</dd>
        </div>
      </div>

      {/* Photos */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Photos</h2>
        <ApplicationImages applicationId={application.id} />
      </div>
    </div>
  )
}
```

### 6. `src/app/dashboard/(protected)/applications/[id]/page.tsx` [NEW]

Page component — Client Component để dùng hooks và router.

```tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useApplication } from '@/hooks/use-application'
import { ApplicationDetail } from '@/components/dashboard/ApplicationDetail'
import { Skeleton } from '@/components/ui/skeleton'

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: application, isLoading, isError, error } = useApplication(id)

  return (
    <div className="space-y-6">
      {/* Back button — browser history back (AC-7) */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </button>

      {isLoading && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-[3/4] rounded-md" />
            <Skeleton className="aspect-[3/4] rounded-md" />
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load application: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/95"
          >
            Go back
          </button>
        </div>
      )}

      {!isLoading && !isError && application && (
        <ApplicationDetail application={application} />
      )}
    </div>
  )
}
```

---

## Architecture Compliance Checklist

- [ ] Page đặt tại `dashboard/(protected)/applications/[id]/page.tsx` (route group đúng).
- [ ] `GET /api/applications/[id]` sử dụng `createServiceClient()` (Service Role key).
- [ ] `GET /api/applications/[id]/signed-urls` sử dụng `createServiceClient()` (Service Role key).
- [ ] `portrait_path` và `passport_path` KHÔNG bao giờ trả về từ API — chỉ signed URLs.
- [ ] Arrival date parse an toàn với `new Date(year, month-1, day)` (tránh UTC shift).
- [ ] Image broken fallback hiển thị đúng khi `onError` trigger.
- [ ] Back navigation dùng `router.back()` để giữ browser history (preserve filter tab AC-7).

---

## Previous Story Intelligence

### Từ Story 3.3 (Applications List):
- **Route Group:** File page mới phải ở `app/dashboard/(protected)/applications/[id]/page.tsx`.
- **Supabase Client:** Browser client (`createClient`) dùng cho read operations với RLS; Server client (`createServiceClient`) dùng cho Service Role operations (signed URLs).
- **Timezone Bug:** Arrival date phải parse bằng local date constructor `new Date(year, month-1, day)` — KHÔNG dùng `new Date("2026-07-06")` vì parse UTC sẽ bị lùi 1 ngày.
- **Error handling:** Luôn handle `isError` state trong data fetching hooks.
- **TanStack Query:** Đã setup `QueryClientProvider` trong `src/app/providers.tsx` và wrap ở `src/app/layout.tsx`.

### Từ Story 3.2 (Dashboard Layout):
- `SidebarNav.tsx` đã nhận diện active route qua `pathname.startsWith(item.href + '/')` — nên `/dashboard/applications/[id]` sẽ tự highlight đúng nav item "Applications".

---

## Git Intelligence

Recent commits liên quan:
- `720eb54 feat: implement operator authentication and route protection (Story 3.1)` — đây là commit tạo route group `(protected)`.
- Stories 3.2 và 3.3 đã được implement nhưng không có commit riêng (merged vào HEAD).

---

## Story Completion Status

- [x] Tạo `src/app/api/applications/[id]/route.ts`
- [x] Tạo `src/app/api/applications/[id]/signed-urls/route.ts`
- [x] Tạo `src/hooks/use-application.ts` (2 hooks: `useApplication` và `useSignedUrls`)
- [x] Tạo `src/components/dashboard/ApplicationImages.tsx`
- [x] Tạo `src/components/dashboard/ApplicationDetail.tsx`
- [x] Tạo `src/app/dashboard/(protected)/applications/[id]/page.tsx`
- [x] Verify `pnpm typecheck && pnpm lint` pass
- [x] Verify clicking row from list navigates to detail page correctly
- [x] Verify images load via signed URLs (or show fallback if no image uploaded)

## Dev Agent Record

### Completion Notes
- Tạo API route `GET /api/applications/[id]` sử dụng `createServiceClient()` — Service Role key, không expose raw storage paths.
- Tạo API route `GET /api/applications/[id]/signed-urls` tạo 2 signed URLs (portrait + passport) với expiry 1 giờ, sử dụng Service Role.
- Tạo hook `useApplication(id)` và `useSignedUrls(id)` với TanStack Query — staleTime 30 phút cho signed URLs.
- `ApplicationImages` component xử lý: skeleton loading, broken image fallback (`ImageOff` icon + "Image unavailable"), và `onError` handler.
- `ApplicationDetail` component hiển thị field grid (`<dl>/<dt>/<dd>`), StatusBadge, và ApplicationImages.
- Detail page (`page.tsx`) dùng `router.back()` để preserve filter state khi back navigation (AC-7).
- Date format sử dụng `new Date(year, month-1, day)` để tránh UTC timezone shift bug (đã note từ Story 3.3 review).
- `pnpm typecheck` và `pnpm lint` đều pass (chỉ có 1 pre-existing warning từ ApplicationForm.tsx — không liên quan story này).
- Browser test xác nhận: dashboard login OK, detail page load OK, 404 error handling graceful.

### File List
- `apps/web/src/app/api/applications/[id]/route.ts` [NEW]
- `apps/web/src/app/api/applications/[id]/signed-urls/route.ts` [NEW]
- `apps/web/src/hooks/use-application.ts` [NEW]
- `apps/web/src/components/dashboard/ApplicationImages.tsx` [NEW]
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` [NEW]
- `apps/web/src/app/dashboard/(protected)/applications/[id]/page.tsx` [NEW]

### Change Log
- 2026-06-05: Implement Story 3.4 — Application Detail View with Signed URL Images. Tạo 6 file mới: 2 API routes, 1 hook file (2 hooks), 2 components, 1 page. pnpm typecheck && pnpm lint pass.

### Review Findings

- [x] [Review][Patch] Lỗ hổng bảo mật nghiêm trọng - API Routes không có cơ chế xác thực người dùng (BOLA / IDOR) [apps/web/src/app/api/applications/[id]/route.ts:5]
- [x] [Review][Patch] Thiếu chuyển đổi định dạng ảnh HEIC trong EditModal (HEIC Rendering Issue) [apps/web/src/components/dashboard/EditModal.tsx:68]
- [x] [Review][Patch] Sự không nhất quán trong cache invalidation của TanStack Query [apps/web/src/components/dashboard/ApplicationDetail.tsx:88]
- [x] [Review][Patch] Tiềm ẩn lỗi chuyển trạng thái ngược do boundary index trong status/route.ts [apps/web/src/app/api/applications/[id]/status/route.ts:43]
- [x] [Review][Patch] Thiếu content-type phù hợp khi upload ảnh trong EditModal [apps/web/src/components/dashboard/EditModal.tsx:76]


