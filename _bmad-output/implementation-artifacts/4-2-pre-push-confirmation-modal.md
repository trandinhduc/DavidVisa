---
baseline_commit: 83a6e7ed8f6a5d671af3d1adebd3f73b14446d8c
---

# Story 4.2: Pre-Push Confirmation Modal

Status: done

## Story

As an operator,
I want to see a confirmation modal with key applicant details before triggering the Chrome Extension,
So that I can verify I'm pushing the correct application before committing.

## Acceptance Criteria

1. **Given** the operator is on the detail page of an application with status `ready`
2. **When** they click "Push to eVisa"
3. **Then** a shadcn `Dialog` opens with heading "Push to eVisa"
4. **And** the modal displays: portrait photo thumbnail (small, loaded via signed URL), Full Name, Arrival Date (human-readable), Application ID, and body copy "This will submit [Full Name]'s application to evisa.gov.vn."
5. **And** two buttons are shown: "Cancel" (ghost variant) and "Push to eVisa" (primary variant)
6. **And** clicking "Cancel" closes the modal; no action is taken; status remains `ready`
7. **And** focus is trapped within the dialog while open; on close, focus returns to the "Push to eVisa" trigger button
8. **And** the "Push to eVisa" button in the detail panel is disabled (tooltip: "Application must be Ready before pushing") when status is not `ready`

## Tasks / Subtasks

- [x] Task 1: Tạo component `PushConfirmModal.tsx` (AC: 3, 4, 5, 6, 7)
  - [x] Dùng shadcn `Dialog` với heading "Push to eVisa"
  - [x] Hiển thị portrait photo thumbnail — fetch signed URL từ prop (không gọi API mới)
  - [x] Hiển thị Full Name (lastName + firstName), Arrival Date (human-readable), Application ID
  - [x] Hiển thị body copy đúng template: "This will submit [Full Name]'s application to evisa.gov.vn."
  - [x] Button "Cancel" (ghost) đóng modal; button "Push to eVisa" (primary) — hiện tại chỉ đóng modal (Story 4.3 sẽ wire chrome.runtime.sendMessage)
  - [x] Focus trap được xử lý tự động bởi shadcn Dialog — focus trở lại trigger khi modal đóng
- [x] Task 2: Wire "Push to eVisa" button trong `ApplicationDetail.tsx` (AC: 1, 2, 8)
  - [x] Kích hoạt `PushConfirmModal` khi click "Push to eVisa" (bỏ `disabled` hiện tại)
  - [x] Thêm `[pushConfirmOpen, setPushConfirmOpen]` state
  - [x] Thêm `Tooltip` (shadcn) cho button "Push to eVisa" khi `status !== 'ready'` — tooltip: "Application must be Ready before pushing"
  - [x] Button "Push to eVisa" disabled chỉ khi `status !== 'ready'`; enabled khi `status === 'ready'`
  - [x] Mount `PushConfirmModal` khi `showPushToEvisa` là true

## Dev Notes

### Context từ Story 4.1 (Learnings cần áp dụng)

- **Review Patch đã phát hiện:** Trong `handleCreateDataConfirm`, phải invalidate `['applications']` (toàn bộ list), không chỉ `['applications', application.id]` — đã fix trong story 4.1, giữ nguyên pattern này.
- **Optimistic close pattern:** Trong story 4.1, modal được đóng ngay lập tức (optimistic) trước khi API call hoàn thành. Story 4.2 KHÔNG có API call tại modal confirm — nên modal chỉ đóng và gọi callback `onConfirm`. Story 4.3 sẽ thêm `chrome.runtime.sendMessage` vào `onConfirm`.
- **PushConfirmModal chưa tồn tại** trong codebase hiện tại — cần tạo mới.

### State hiện tại của "Push to eVisa" button trong `ApplicationDetail.tsx`

```tsx
// Line 142-154 của ApplicationDetail.tsx hiện tại:
{/* AC-6 (story 4.1): "Push to eVisa" button — shown when status is 'ready' (story 4.2 will wire this up) */}
{showPushToEvisa && (
  <Button
    id="push-to-evisa-btn"
    variant="default"
    size="sm"
    className="flex items-center gap-1.5"
    disabled  // ← Phải bỏ disabled này và wire onClick trong story 4.2
  >
    Push to eVisa
    <ChevronRight className="h-3.5 w-3.5" />
  </Button>
)}
```

**Story 4.2 phải:**
1. Bỏ `disabled` khỏi button trên
2. Thêm `onClick={() => setPushConfirmOpen(true)}`
3. Thêm state `pushConfirmOpen` và `PushConfirmModal` được mount

### Props của PushConfirmModal

```tsx
interface PushConfirmModalProps {
  application: ApplicationData       // để lấy appId, firstName, lastName, arrivalDate
  portraitSignedUrl: string | null   // signed URL đã load ở ApplicationImages — tái dùng
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void              // Story 4.3 sẽ implement thực tế; Story 4.2 chỉ đóng modal
}
```

### Cách lấy portraitSignedUrl cho PushConfirmModal

`ApplicationImages.tsx` đang gọi `useSignedUrls(applicationId)` riêng. Trong `ApplicationDetail.tsx`, cần gọi thêm `useSignedUrls(application.id)` để lấy `portraitSignedUrl` truyền vào modal. Hoặc chuyển hook lên `ApplicationDetail` và truyền xuống `ApplicationImages`. **Khuyến nghị:** Gọi `useSignedUrls` thêm một lần nữa trong `ApplicationDetail` — TanStack Query cache sẽ dedup request (cùng query key), không gây network call thừa.

```tsx
// Trong ApplicationDetail.tsx
import { useSignedUrls } from '@/hooks/use-application'

// Thêm trong component body:
const { data: signedUrlsData } = useSignedUrls(application.id)
```

### Hiển thị portrait thumbnail trong modal

- Dùng thẻ `<img>` với src = `portraitSignedUrl`
- Size thumbnail: `w-20 h-28 object-cover rounded-md border border-border` (aspect-ratio ~3:4 nhỏ)
- Nếu `portraitSignedUrl` là null hoặc lỗi: hiển thị fallback `ImageOff` icon tương tự `ApplicationImages.tsx`

### Tooltip cho "Push to eVisa" khi disabled

Cần import `Tooltip`, `TooltipContent`, `TooltipTrigger`, `TooltipProvider` từ shadcn. Shadcn Tooltip đã được cài trong story 1.4.

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
```

**Kiểm tra:** `apps/web/src/components/ui/tooltip.tsx` — nếu chưa có, cần `npx shadcn@latest add tooltip`.

### Formatters

`formatArrivalDate()` đã tồn tại trong `ApplicationDetail.tsx` (line 23-39). Tái dùng hàm này trong `PushConfirmModal` — có thể copy hoặc extract ra `lib/format-date.ts` để share.

**Khuyến nghị:** Copy function vào `PushConfirmModal.tsx` đơn giản hơn. Hoặc extract lên `src/lib/format-date.ts` nếu muốn DRY — cả hai đều hợp lệ.

### Architecture Compliance

- `'use client'` bắt buộc cho `PushConfirmModal.tsx` (modal với event handlers)
- Import `ApplicationData` từ `@david-agency/shared` — không redefine
- Không tạo API call mới — modal chỉ confirm trước khi Story 4.3 gửi message
- shadcn `Dialog` handles focus trap natively (UX-DR12: focus trap trong modal, focus returns to trigger)
- Button variants: "Cancel" = `ghost`, "Push to eVisa" = `default` (primary)

### Files cần tạo / sửa

| File | Action | Ghi chú |
|---|---|---|
| `apps/web/src/components/dashboard/PushConfirmModal.tsx` | **NEW** | Modal component |
| `apps/web/src/components/dashboard/ApplicationDetail.tsx` | **UPDATE** | Wire button + add state + useSignedUrls |
| `apps/web/src/components/ui/tooltip.tsx` | **NEW nếu chưa có** | shadcn Tooltip component |

### Kiểm tra shadcn components đã cài

```bash
ls apps/web/src/components/ui/
```

Nếu thiếu `tooltip.tsx`:
```bash
cd apps/web && npx shadcn@latest add tooltip
```

### Body copy template chính xác

Theo epics.md AC:
> "This will submit [Full Name]'s application to evisa.gov.vn."

Full Name = `${firstName} ${lastName}` (First trước Last trong tiếng Anh thông thường) — nhưng xem cách hiển thị trong `ApplicationDetail.tsx` line 106: `{application.lastName} {application.firstName}` (Last First — phù hợp với tiếng Việt). Giữ nhất quán: dùng `{application.firstName} {application.lastName}` trong body copy (readable English), nhưng heading/label "Full Name" display vẫn như detail panel.

### Không thay đổi status trong story này

Story 4.2 KHÔNG gọi bất kỳ API status update nào. Sau khi click "Push to eVisa" trong modal:
- Story 4.2: chỉ đóng modal (onConfirm callback empty hoặc noop)
- Story 4.3: sẽ thêm `chrome.runtime.sendMessage` vào onConfirm
- Story 4.4: sẽ thêm `PUT /api/applications/[id]/status` để mark Submitted

### Git baseline

Commit hiện tại: `83a6e7e feat: Refine Public Form & Success Page UI`

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro (High)

### Debug Log References

### Completion Notes List

- Installed shadcn/ui Tooltip component.
- Created `PushConfirmModal.tsx` with all specified ACs, including thumbnail handling with `ImageOff` fallback.
- Re-used `formatArrivalDate` in `PushConfirmModal` by copying it for simplicity and avoiding diffs across multiple files.
- Updated `ApplicationDetail.tsx` to conditionally disable the "Push to eVisa" button using a Tooltip wrapper.
- Integrated the new modal so it only closes upon clicking "Push to eVisa" (as required by this story before the extension integration in 4.3).
- Ran `pnpm typecheck` and `pnpm lint` and both passed.

### File List

- `apps/web/src/components/ui/tooltip.tsx` (NEW)
- `apps/web/src/components/dashboard/PushConfirmModal.tsx` (NEW)
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` (MODIFIED)

### Review Findings

*(None yet)*
