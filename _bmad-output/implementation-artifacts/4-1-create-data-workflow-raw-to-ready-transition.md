---
baseline_commit: 120f909b550c39ed238edc635384629d9cc89cba
---

# Story 4.1: Create Data Workflow (Raw → Ready Transition)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator,
I want to complete a "Create Data" step that prepares additional information for an application,
So that I can mark it as Ready and confirm it's been reviewed before pushing to the government portal.

## Acceptance Criteria

1. **Given** the operator is on the detail page of an application with status `raw`
2. **When** they view the action buttons
3. **Then** a "Create Data" button is visible (primary variant)
4. **And** clicking "Create Data" opens a `CreateDataModal` (shadcn Dialog) with a confirmation prompt "Confirm application data is ready for submission?" and a "Confirm" button
5. **And** on confirm: `PUT /api/applications/[id]/status` is called with `{ status: 'ready' }`; status badge transitions Raw → Ready via optimistic update
6. **And** after the transition: "Create Data" button is replaced by "Push to eVisa" (enabled since status is now `ready`)
7. **And** the "Create Data" button is not rendered when status is `ready`, `submitted`, or `done`
8. **And** if the API call fails: optimistic update is rolled back; persistent error toast: "Failed to update status — please try again."
9. **And** `updated_at` is recorded on the status change (already implemented in API)

## Tasks / Subtasks

- [x] Task 1: Create `CreateDataModal.tsx` component (AC: 4)
  - [x] Implement shadcn `Dialog` layout with confirmation prompt and "Confirm" / "Cancel" buttons.
  - [x] Implement loading state during confirmation.
- [x] Task 2: Implement "Create Data" button logic in `ApplicationDetail.tsx` (AC: 1, 2, 3, 7)
  - [x] Conditionally render "Create Data" button only when status is `raw`.
  - [x] Ensure "Push to eVisa" is shown when status is `ready`.
- [x] Task 3: Integrate status update API and React Query (AC: 5, 8, 9)
  - [x] Call `PUT /api/applications/[id]/status` with `{ status: 'ready' }` on confirm.
  - [x] Implement optimistic update for `status` using TanStack Query, rolling back on error.
  - [x] Display persistent error toast using `sonner` if the API call fails.

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - Application Status rules: one-way flow (`raw` -> `ready` -> `submitted` -> `done`).
  - Next.js Component Rules: components with interactivity (like `CreateDataModal`) must have `'use client'`.
  - API Response Format: Expect `{ data, error }` wrapper.
  - Use `shadcn/ui` components (Button, Dialog, Toast/Sonner).
- **Source tree components to touch:**
  - `apps/web/src/components/dashboard/CreateDataModal.tsx` (NEW)
  - `apps/web/src/components/dashboard/ApplicationDetail.tsx` (UPDATE)
  - `apps/web/src/hooks/use-application.ts` or related query hooks (UPDATE)

### Project Structure Notes

- Alignment with unified project structure: `apps/web/src/components/dashboard/` holds dashboard components.
- Shared types: Import `ApplicationStatus` from `@david-agency/shared`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Application-Status-Rules]

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro (High)

### Debug Log References

### Completion Notes List

- Implemented `CreateDataModal.tsx` using `shadcn/ui` dialog components with loading states.
- Updated `ApplicationDetail.tsx` to conditionally render the "Create Data" button for `raw` status and "Push to eVisa" for `ready` status.
- Integrated status transition logic calling `PUT /api/applications/[id]/status` with TanStack Query optimistic updates and rollback on error.
- Fixed minor TypeScript and ESLint warnings.

### File List

- `apps/web/src/components/dashboard/CreateDataModal.tsx` (NEW)
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` (MODIFIED)

### Review Findings

- [x] [Review][Decision] Trạng thái enabled của nút "Push to eVisa" — Quyết định: Giữ disabled cho đến khi Story 4.2 hoàn tất để tránh operator click nhầm.
- [x] [Review][Patch] Phạm vi cache invalidation khi cập nhật trạng thái — Trong `handleCreateDataConfirm`, chúng ta chỉ invalidate query key `['applications', application.id]`. Khi quay lại trang dashboard, danh sách ứng dụng chính (`['applications']`) sẽ không được làm mới và vẫn hiển thị trạng thái cũ `raw` cho đến khi trang được tải lại hoặc refetch. Cần chuyển sang invalidate `['applications']` để làm mới cả danh sách và chi tiết. [apps/web/src/components/dashboard/ApplicationDetail.tsx:80]
- [x] [Review][Defer] Cảnh báo cập nhật State trên Component đã unmount — Khi operator bấm xác nhận, modal `CreateDataModal` sẽ bị đóng và unmount ngay lập tức trước khi API call kết thúc (do optimistic update đóng modal ngay). Sau khi API call hoàn thành, phần `finally` của modal sẽ chạy `setIsConfirming(false)` trên component đã unmount, điều này có thể gây ra cảnh báo React. [apps/web/src/components/dashboard/CreateDataModal.tsx:43] — deferred, minor React issue

