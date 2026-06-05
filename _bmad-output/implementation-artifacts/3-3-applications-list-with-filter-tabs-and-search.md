---
baseline_commit: HEAD
---

# Story 3.3: Applications List with Filter Tabs & Search

**Story ID:** 3.3
**Story Key:** 3-3-applications-list-with-filter-tabs-and-search
**Status:** done
**Epic:** Epic 3 — Operator Monitors & Manages Applications
**Created:** 2026-06-05

---

## User Story

**As an operator,**
I want to see all applications in a filterable table with real-time search,
So that I can quickly find and prioritise the applications that need my attention.

---

## Acceptance Criteria (BDD)

**AC-1: Filter tabs**
**Given** the operator is on `/dashboard`
**When** the page loads
**Then** filter tabs appear: **Raw** | **All** | **Ready** | **Submitted** | **Done** — default active tab is **Raw**

**AC-2: Count badges on tabs**
**And** each tab shows a count badge when count > 0 (e.g., "Raw (3)"); active tab has `border-b-2 border-accent` (#1D4ED8)

**AC-3: Data table**
**And** a data table shows applications matching the active filter, columns: Application ID | Applicant Name | Arrival Date | Status | Submitted At

**AC-4: Status badges**
**And** each row shows the correct `StatusBadge` variant (pill rounded-full, text label always present): Raw (#F1F5F9/#64748B), Ready (#FEF3C7/#92400E), Submitted (#DBEAFE/#1E40AF), Done (#DCFCE7/#166534)

**AC-5: Real-time search**
**And** a search box filters in real-time (no Enter required) by Last Name, First Name, or Application ID

**AC-6: Sorting**
**And** table is sorted by `created_at` descending (newest first)

**AC-7: Loading state**
**And** while loading: 5 skeleton rows matching the table column structure are shown

**AC-8: Empty state**
**And** when the filtered list is empty: "No [Status] applications." + "Applications will appear here once they reach [Status] status."

**AC-9: Row navigation**
**And** clicking a row navigates to `/dashboard/applications/[id]`

**AC-10: Data fetching**
**And** data is fetched via TanStack Query (Supabase JS client + anon key + RLS)

---

## Developer Context

### ⚠️ CRITICAL ARCHITECTURE NOTES FOR THIS STORY

**TanStack Query Setup:**
Dự án sử dụng TanStack Query cho data fetching. Bạn **PHẢI** cài đặt `@tanstack/react-query` và bọc toàn bộ app với `QueryClientProvider` trước khi có thể sử dụng hook fetching.

**Route Group Modification:**
Trong story trước đó, chúng ta đã chuyển đổi thư mục `page.tsx` và `layout.tsx` của dashboard vào trong Route Group `(protected)` để khắc phục lỗi redirect của Next.js với trang `/dashboard/login`.
Do đó, khi chỉnh sửa trang Dashboard list, bạn phải sửa file `app/dashboard/(protected)/page.tsx` (KHÔNG phải `app/dashboard/page.tsx`).

---

## Technical Requirements

### Stack & Dependencies

- **Data Fetching:** TanStack Query.
- **Icon Library:** `lucide-react` (đã cài).
- **Date Formatting:** Sử dụng `Intl.DateTimeFormat` hoặc utils nội bộ cho human-readable date.

### Cần Cài Đặt Thêm (Bắt Buộc):

```bash
cd apps/web && pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

---

## File Structure — O que criar / modificar

### NEW (tạo mới):

```
apps/web/src/
├── app/
│   └── providers.tsx                     ← [NEW] TanStack QueryClient provider wrapper
├── components/
│   └── dashboard/
│       ├── ApplicationTable.tsx          ← [NEW] Data table component
│       ├── ApplicationFilters.tsx        ← [NEW] Filter tabs and Search component
│       └── StatusBadge.tsx               ← [NEW] Status badge component (4 variants)
└── hooks/
    └── use-applications.ts               ← [NEW] TanStack query hook fetching from Supabase
```

### MODIFY (cập nhật):

```
apps/web/src/
├── app/
│   ├── layout.tsx                        ← [MODIFY] Wrap {children} với <Providers>
│   └── dashboard/(protected)/page.tsx    ← [MODIFY] Combine ApplicationFilters và ApplicationTable
```

---

## Implementation Guide

### 1. `src/app/providers.tsx` [NEW]

Tạo một Client Component wrap React Query `QueryClientProvider`.

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 2. `src/app/layout.tsx` [MODIFY]

Thêm `<Providers>` bọc quanh `children`. Đảm bảo file được đánh dấu `'use client'` nếu cần, hoặc để `Providers` xử lý việc này (khuyến nghị).

### 3. `src/hooks/use-applications.ts` [NEW]

Hook TanStack query lấy data từ Supabase. Dùng `createClient()` (browser client).

```typescript
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      // Nhớ map snake_case sang camelCase theo đúng ApplicationData interface
      return data
    }
  })
}
```

### 4. `src/components/dashboard/StatusBadge.tsx` [NEW]

Component badge với 4 trạng thái theo UX-DR2.

```tsx
import type { ApplicationStatus } from '@david-agency/shared'

const variants = {
  raw: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  ready: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  submitted: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
  done: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
}

const labels = {
  raw: 'Raw',
  ready: 'Ready',
  submitted: 'Submitted',
  done: 'Done',
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variants[status]}`}>
      {labels[status]}
    </span>
  )
}
```

### 5. `src/components/dashboard/ApplicationFilters.tsx` [NEW]

Sử dụng HTML/Tailwind hoặc shadcn Tabs cho filter tab, và một Input cho search bar (real-time, không cần Enter). Component này nhận `activeTab`, `setActiveTab`, `searchQuery`, `setSearchQuery` và `counts` object.

### 6. `src/components/dashboard/ApplicationTable.tsx` [NEW]

Hiển thị danh sách, xử lý skeleton loading, xử lý empty state. Render `StatusBadge`. Table headers: Application ID | Applicant Name | Arrival Date | Status | Submitted At. 
Sự kiện onClick trên row sẽ dùng `useRouter().push('/dashboard/applications/[id]')`.

### 7. `src/app/dashboard/(protected)/page.tsx` [MODIFY]

Đây là Client Component (`'use client'`) kết hợp Query, Filters và Table. Lọc data (search + tab) ở phía client (vì chỉ 500 records).

---

## Architecture Compliance Checklist

- [ ] Route Group `(protected)` được sử dụng đúng cho page.
- [ ] TanStack Query bọc ở Root Layout (`app/layout.tsx`).
- [ ] Supabase browser client (`createClient`) được dùng trong hook `use-applications.ts`.
- [ ] Component `StatusBadge` tuân thủ đúng màu sắc và shape pill.
- [ ] Skeleton (5 rows) hiển thị khi data đang load (`isLoading`).
- [ ] Lọc search và tabs kết hợp mượt mà ở phía client.

---

## Previous Story Intelligence

- **Route Group Fix:** Story 3.1 & 3.2 để lại một redirect loop do `layout.tsx` bọc lấy `login/page.tsx`. Lỗi này đã được fix bằng cách tạo route group `(protected)`. Các file code liên quan đến layout dashboard nằm trong `app/dashboard/(protected)/`.
- **Browser Client:** Cả `SidebarNav` (Story 3.2) và Data Fetching (Story 3.3) đều dùng `src/lib/supabase-client.ts`. Do RLS policy (FR-21), session authenticated sẽ tự động cấp quyền truy cập full CRUD cho Operator.

---

## Story Completion Status

- [x] Cài đặt `@tanstack/react-query`.
- [x] Tạo `providers.tsx` và update `layout.tsx`.
- [x] Tạo `use-applications.ts` query hook.
- [x] Tạo `StatusBadge.tsx`.
- [x] Tạo `ApplicationFilters.tsx` (Tabs + Search input).
- [x] Tạo `ApplicationTable.tsx` (Table + Skeletons + Empty State).
- [x] Update `app/dashboard/(protected)/page.tsx`.

## Dev Agent Record

### Completion Notes
- Đã cài đặt và config `@tanstack/react-query`.
- Đã tạo hook `useApplications` gọi data từ Supabase client.
- Các component `StatusBadge`, `ApplicationFilters` và `ApplicationTable` được xây dựng đúng design spec.
- Lọc (tab, search) và sorting đã hoạt động trơn tru.
- Typecheck và build success.

### File List
- `apps/web/package.json`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/hooks/use-applications.ts`
- `apps/web/src/components/dashboard/StatusBadge.tsx`
- `apps/web/src/components/dashboard/ApplicationFilters.tsx`
- `apps/web/src/components/dashboard/ApplicationTable.tsx`
- `apps/web/src/app/dashboard/(protected)/page.tsx`

### Change Log
- Thêm `Providers` wrapper ở `RootLayout`.
- Xây dựng component Table và Filter list theo Figma.
- Hiển thị skeleton loader khi data đang load.
- Implement filter data trực tiếp phía client cho DashboardPage.

### Review Findings

- [x] [Review][Decision] Múi Giờ Khi Phân Tích Ngày Đến (Timezone Shift for Date-Only Fields) — Trường 'arrivalDate' là chuỗi chỉ ngày (vd "2026-06-10"). Khi parse qua 'new Date("2026-06-10")', JS sẽ parse theo múi giờ UTC, dẫn đến việc chuyển đổi múi giờ địa phương (local timezone) của trình duyệt operator có thể bị lùi đi 1 ngày (vd thành 9 tháng 6).
- [x] [Review][Patch] Khởi Tạo Lại Supabase Browser Client Trong useApplications [apps/web/src/hooks/use-applications.ts:5]
- [x] [Review][Patch] Thiếu Xử Lý Lỗi API Cho useApplications Trong Dashboard Page [apps/web/src/app/dashboard/(protected)/page.tsx:70]
- [x] [Review][Patch] Thiếu Guard Check Cho Giá Trị Ngày Null/Invalid Trong Table [apps/web/src/components/dashboard/ApplicationTable.tsx:378]
- [x] [Review][Patch] Chữ Thường Trong Cảnh Báo Trạng Thái Trống (AC-8 Case Inconsistency) [apps/web/src/components/dashboard/ApplicationTable.tsx:341]
- [x] [Review][Patch] Inaccessible table row click target [apps/web/src/components/dashboard/ApplicationTable.tsx:118]
- [x] [Review][Patch] Supabase client recreation inside useQuery queryFn [apps/web/src/hooks/use-applications.ts:9]
- [x] [Review][Patch] Search Filter Crash Risk — appId, firstName, and lastName could be null from DB causing .toLowerCase() to crash. [apps/web/src/app/dashboard/(protected)/page.tsx:105]
- [x] [Review][Patch] StatusBadge Fallback — Missing fallback if status is invalid/unexpected. [apps/web/src/components/dashboard/StatusBadge.tsx:16]
- [x] [Review][Defer] Pagination/Limits — useApplications fetches all records (select('*')), which could lead to performance issues. [apps/web/src/hooks/use-applications.ts:9] — deferred, pre-existing
