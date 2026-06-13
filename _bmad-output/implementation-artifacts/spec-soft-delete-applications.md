---
title: 'Soft Delete Applications'
type: 'feature'
created: '2026-06-13'
status: 'done'
baseline_commit: '013fab47b7bead3551f838a9a3f76be40afd433e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Admin không thể ẩn các record không cần thiết khỏi dashboard — các bản ghi test hoặc sai sót làm lộn xộn danh sách mà không có cách xóa.

**Approach:** Thêm cột `deleted_at` vào bảng `applications`; nút Delete trong dashboard list và application detail sẽ set timestamp này (soft delete). Query dashboard lọc những record này ra. Record vẫn còn trong Supabase và có thể khôi phục bằng cách set `deleted_at = null` trực tiếp trên Supabase.

## Boundaries & Constraints

**Always:**
- Soft delete only — không bao giờ `DELETE FROM applications`; chỉ `UPDATE SET deleted_at = now()`
- Dashboard query phải loại trừ deleted records ở Supabase query level (`.is('deleted_at', null)`)
- Delete yêu cầu bước xác nhận (confirmation modal) trước khi gọi API
- Sau khi delete từ ApplicationDetail, redirect về `/dashboard`
- Migration dùng `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

**Ask First:**
- Nếu cột `deleted_at` đã tồn tại trong production (kiểm tra trước khi chạy migration)

**Never:**
- Không expose restore functionality trong UI — khôi phục thực hiện trực tiếp trên Supabase
- Không thêm tab "Deleted" vào dashboard filter
- Không hard-delete bất kỳ record nào

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Delete từ table row | User click Delete, confirm | `deleted_at` được set, row biến mất khỏi list | Toast error, không xóa optimistic |
| Delete từ detail view | User click Delete, confirm | `deleted_at` được set, redirect về `/dashboard` | Toast error, ở lại trang |
| Hủy confirmation | User click Delete rồi Cancel | Không gọi API | N/A |
| API error | DELETE request thất bại | Hiển thị toast error | State không thay đổi |

</frozen-after-approval>

## Code Map

- `supabase/migrations/017_add_soft_delete.sql` — migration: ADD COLUMN `deleted_at TIMESTAMPTZ NULL`
- `packages/shared/src/database.types.ts` — thêm `deleted_at: string | null` vào Row/Insert/Update
- `apps/web/src/types/supabase.ts` — mirror của database.types.ts, cùng update
- `packages/shared/src/types.ts` — thêm `deletedAt: string | null` vào `ApplicationData`
- `apps/web/src/app/api/applications/[id]/route.ts` — thêm DELETE handler; map `deletedAt` trong GET response
- `apps/web/src/hooks/use-applications.ts` — thêm `.is('deleted_at', null)` vào query; map `deletedAt`
- `apps/web/src/components/dashboard/DeleteConfirmModal.tsx` — NEW: reusable delete confirmation modal
- `apps/web/src/components/dashboard/ApplicationTable.tsx` — thêm Delete button mỗi row; wire tới modal + API
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` — thêm Delete button trong header; wire tới modal + API; redirect on success

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/017_add_soft_delete.sql` — tạo migration với `ALTER TABLE applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL`
- [x] `packages/shared/src/database.types.ts` — thêm `deleted_at: string | null` vào Row; `deleted_at?: string | null` vào Insert/Update
- [x] `apps/web/src/types/supabase.ts` — thêm `deleted_at` giống như database.types.ts
- [x] `packages/shared/src/types.ts` — thêm `deletedAt: string | null` vào interface `ApplicationData`
- [x] `apps/web/src/app/api/applications/[id]/route.ts` — thêm DELETE handler (auth → service client → `.update({ deleted_at: now })` → 200); map `deletedAt: data.deleted_at` trong GET
- [x] `apps/web/src/hooks/use-applications.ts` — thêm `.is('deleted_at', null)` vào select query; thêm `deletedAt: item.deleted_at ?? null` vào map
- [x] `apps/web/src/components/dashboard/DeleteConfirmModal.tsx` — tạo modal mới: props `open`, `onConfirm`, `onCancel`, `applicationName`; hiển thị confirmation với nút "Delete" variant destructive
- [x] `apps/web/src/components/dashboard/ApplicationTable.tsx` — thêm Trash icon Delete button trong cột Actions (stopPropagation); click mở DeleteConfirmModal; confirm gọi DELETE API rồi invalidate query `['applications']`
- [x] `apps/web/src/components/dashboard/ApplicationDetail.tsx` — thêm Trash Delete button trong header (sau Export button); click mở DeleteConfirmModal; confirm gọi DELETE API rồi `router.push('/dashboard')`

**Acceptance Criteria:**
- Given bất kỳ application nào trong dashboard list, when user click Delete và confirm, then row biến mất khỏi list và toast success hiển thị
- Given application detail view, when user click Delete và confirm, then user được redirect về `/dashboard` và record không còn trong list
- Given delete confirmation dialog, when user click Cancel, then không có API call nào được thực hiện và application vẫn hiển thị
- Given dashboard load, then deleted applications (có `deleted_at IS NOT NULL`) không bao giờ hiển thị ở bất kỳ tab hoặc count nào
- Given DELETE API call thất bại, then toast error hiển thị và application vẫn visible

## Design Notes

DELETE API handler dùng cùng pattern như PUT /status: auth check qua `createServerComponentClient`, update qua `createServiceClient`. Set `deleted_at = new Date().toISOString()`.

`DeleteConfirmModal` dùng `variant="destructive"` cho confirm button, matching visual weight của action. Hiển thị tên application trong dialog để user xác nhận đúng record.

## Verification

**Commands:**
- `cd apps/web && npx tsc --noEmit` -- expected: no type errors
- `cd apps/web && npm run build` -- expected: build succeeds

**Manual checks (if no CLI):**
- Dashboard: application đã xóa không còn hiển thị ở bất kỳ tab nào sau khi confirm
- Application detail: Delete button visible, confirmation modal mở, redirect về dashboard sau confirm
- Supabase: cột `deleted_at` có timestamp value sau khi soft delete

## Suggested Review Order

**Database schema & types**

- Migration: single-line ALTER TABLE adds nullable `deleted_at` column
  [`017_add_soft_delete.sql:1`](../../../supabase/migrations/017_add_soft_delete.sql#L1)

- Shared domain type gains `deletedAt: string | null` — consumed by all callers
  [`types.ts:41`](../../../packages/shared/src/types.ts#L41)

- Database row types updated — Row/Insert/Update all include `deleted_at`
  [`database.types.ts:43`](../../../packages/shared/src/database.types.ts#L43)

**API layer**

- DELETE handler: auth → soft-delete update with `deleted_at IS NULL` guard → 200
  [`route.ts:239`](../../../apps/web/src/app/api/applications/%5Bid%5D/route.ts#L239)

- GET handler: added `.is('deleted_at', null)` filter — deleted records return 404
  [`route.ts:26`](../../../apps/web/src/app/api/applications/%5Bid%5D/route.ts#L26)

**Data layer**

- Hook filters `deleted_at IS NULL` at Supabase query level — dashboard never sees deleted records
  [`use-applications.ts:13`](../../../apps/web/src/hooks/use-applications.ts#L13)

**UI components**

- New delete confirmation modal — fixed-position overlay with destructive confirm button
  [`DeleteConfirmModal.tsx:1`](../../../apps/web/src/components/dashboard/DeleteConfirmModal.tsx#L1)

- Table: delete handler captures target, fires DELETE, invalidates query cache on success
  [`ApplicationTable.tsx:71`](../../../apps/web/src/components/dashboard/ApplicationTable.tsx#L71)

- Detail: delete handler closes modal first, fires DELETE, redirects to dashboard on success
  [`ApplicationDetail.tsx:213`](../../../apps/web/src/components/dashboard/ApplicationDetail.tsx#L213)

## Spec Change Log

