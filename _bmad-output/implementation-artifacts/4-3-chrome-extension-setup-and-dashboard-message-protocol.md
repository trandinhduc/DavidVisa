---
baseline_commit: 83a6e7ed8f6a5d671af3d1adebd3f73b14446d8c
---

# Story 4.3: Chrome Extension — Setup & Dashboard Message Protocol

Status: review

## Story

As an operator,
I want the Chrome Extension to receive application data from the dashboard when I confirm a push,
So that it has all the information it needs to auto-fill evisa.gov.vn accurately.

## Acceptance Criteria

1. **Given** the Plasmo extension scaffold from Story 1.1 exists
2. **When** the operator confirms "Push to eVisa" in the modal
3. **Then** the Dashboard sends a `PushToEvisaMessage` via `chrome.runtime.sendMessage(EXTENSION_ID, message)` — EXTENSION_ID imported from `packages/shared/src/constants.ts`
4. **And** the message contains: `type: 'PUSH_TO_EVISA'`, `applicationId`, `appId`, `lastName`, `firstName`, `arrivalDate`, `portraitSignedUrl`, `passportSignedUrl` (fresh signed URLs, 1 hour expiry)
5. **And** `background.ts` listens via `chrome.runtime.onMessageExternal.addListener` and verifies `sender.origin === 'https://david-agency.vercel.app'` before processing — messages from other origins are silently ignored
6. **And** on successful receipt: payload stored in `chrome.storage.local` under key `pendingApplication`
7. **And** the background script automatically opens a new Chrome window pointing to `https://evisa.gov.vn`
8. **And** on failed message delivery: Dashboard shows persistent error toast "Extension not found — make sure it is installed and enabled."; application status does not change
9. **And** extension `popup.tsx` shows "Ready to fill" when `pendingApplication` exists in storage, "No pending application" otherwise

## Tasks / Subtasks

- [x] Task 1: Cập nhật Extension Background Script (AC: 1, 5, 6, 7)
  - [x] Thêm listener trong `apps/extension/src/background.ts` sử dụng `chrome.runtime.onMessageExternal.addListener`
  - [x] Xác minh `sender.origin === 'https://david-agency.vercel.app'` - bỏ qua message nếu không hợp lệ
  - [x] Lưu payload vào `chrome.storage.local` với key `pendingApplication` khi nhận được message hợp lệ và tự động mở một cửa sổ trình duyệt mới đến `https://evisa.gov.vn`
- [x] Task 2: Cập nhật Extension Popup (AC: 8)
  - [x] Chỉnh sửa `apps/extension/src/popup.tsx` để đọc `pendingApplication` từ `chrome.storage.local` (sử dụng hook `@plasmohq/storage/hook` nếu có)
  - [x] Hiển thị "Ready to fill" nếu có pending application, ngược lại hiển thị "No pending application"
- [x] Task 3: Tích hợp Gửi Message từ Dashboard (AC: 2, 3, 4, 7)
  - [x] Cập nhật `PushConfirmModal.tsx` để thêm logic xử lý trong `onConfirm` callback
  - [x] Gọi `chrome.runtime.sendMessage(EXTENSION_ID, message)` với payload chứa đầy đủ trường được quy định
  - [x] Xử lý lỗi khi gửi message thất bại (bắt lỗi hoặc kiểm tra `chrome.runtime.lastError`): hiển thị error toast "Extension not found — make sure it is installed and enabled." và đảm bảo status không thay đổi

## Dev Notes

- Chú ý cập nhật type định nghĩa trong shared package nếu cần. `PushToEvisaMessage` đã được định nghĩa trong `packages/shared/src/types.ts`.
- Lấy hằng số `EXTENSION_ID` từ `packages/shared/src/constants.ts`. (Sẽ cần export EXTENSION_ID nếu chưa export đúng giá trị).
- Đối với `PushConfirmModal`, hiện tại nhận `onConfirm`. Cần thêm logic gọi `chrome.runtime.sendMessage` trong Dashboard trước khi hoàn tất hoặc bên trong component có xử lý. Thay vì gọi trực tiếp ở Modal, nên gọi qua handler truyền từ `ApplicationDetail`.
- Dashboard origin check: Phải khớp chính xác `https://david-agency.vercel.app`. Ngoài ra, khi dev có thể check origin `http://localhost:3000` (nên hỗ trợ cấu hình).
- Đảm bảo extension manifest (trong Plasmo) đã cấp quyền `storage` và cấu hình `externally_connectable` cho origin của dashboard.

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
### Review Findings
