---
baseline_commit: 74e6ab6018b9ac5bbcd8ce06d3bbd30bc94b374e
---

# Story 4.4: Chrome Extension — Auto-Fill evisa.gov.vn & Status Update

Status: done

## Story

As an operator,
I want the Chrome Extension to automatically fill the evisa.gov.vn form with the application data,
So that I only need to review the pre-filled form and click Submit — eliminating all manual copy-paste.

## Acceptance Criteria

1. **Given** the extension has received a `PushToEvisaMessage` và một cửa sổ mới đến trang `https://evisa.gov.vn/e-visa/foreigners` đã được tự động mở
2. **When** the content script `evisa-filler.ts` chạy, nó chờ trang tải xong và kiểm tra xem có ở màn hình popup/confirmation không. Nó sử dụng cơ chế fallback tự động reload trang (`window.location.reload()`) nếu trang bị trắng sau 3.5s.
3. **Then** nó tự động đánh dấu 2 ô checkbox Ant Design (`.ant-checkbox-wrapper`): "Confirm compliance with Vietnamese laws upon entry" và "Confirmation of reading carefully instructions and having completed application".
4. **And** sau khi click 2 ô checkbox, nó tìm nút Next và bấm Next để chuyển sang trang form nhập liệu. Nếu trang form không tải được sau 4s, nó sẽ tự động reload lại trang.
5. **And** khi trang form đã load xong (nhận diện qua chữ "FOREIGNER'S IMAGES"), nó reads `pendingApplication` from `chrome.storage.local`
6. **And** it maps and fills application fields into the corresponding evisa.gov.vn DOM inputs: Last Name, First Name, Arrival Date, and other prepared fields
7. **And** it downloads Portrait and Passport photos via the signed URLs and programmatically sets the file upload inputs on evisa.gov.vn (với 1 khoảng nghỉ 1 giây giữa 2 lần upload ảnh để tránh xung đột state của Vue/AntD).
8. **And** the extension does NOT submit the form — it stops after filling all fields and shows a browser notification: "Form filled — please review and submit."
9. **And** after the operator submits on evisa.gov.vn and returns to the dashboard, they click "Mark as Submitted" which calls `PUT /api/applications/[id]/status` with `{ status: 'submitted' }`
10. **And** after successful status update: "Push to eVisa" button is disabled; StatusBadge shows "Submitted"
11. **And** `chrome.storage.local` key `pendingApplication` is cleared after push completes

## Tasks / Subtasks

- [x] Task 1: Create content script to auto-fill evisa form (AC: 1-8)
  - [x] Tạo file content script `evisa-filler.ts` trong `apps/extension/src/contents/` (match URL evisa.gov.vn).
  - [x] Xử lý multi-step: Ở trang đầu tiên, chờ popup hiển thị, check 2 ô confirm (Compliance và Read Instructions), rồi bấm Next.
  - [x] Chờ sang trang nhập form, kiểm tra DOM elements để xác nhận trang load xong, rồi bắt đầu quá trình auto-fill.
  - [x] Tích hợp hệ thống failsafe tự động F5 nếu server eVisa không phản hồi.
  - [x] Đọc thông tin ứng viên từ `chrome.storage.local` (sử dụng key `pendingApplication`).
  - [x] Ánh xạ các trường dữ liệu (Last Name, First Name, Arrival Date) vào DOM elements và gán giá trị (dispatch events để trigger JS của trang).
  - [x] Hiển thị thông báo: "Form filled — please review and submit." và không tự động submit form.
- [x] Task 2: Handle image downloads and file inputs (AC: 5)
  - [x] Lấy dữ liệu ảnh (fetch blob) từ `portraitSignedUrl` và `passportSignedUrl` thông qua Background Script message để lách CORS.
  - [x] Chuyển đổi dữ liệu thành các `File` object.
  - [x] Gán `File` object vào file upload inputs trên trang evisa bằng `DataTransfer` và trigger event `change` + `input` lần lượt từng ảnh (cách nhau 1s).
- [x] Task 3: Dashboard "Mark as Submitted" (AC: 7, 8, 9)
  - [x] Trên giao diện `ApplicationDetail` của dashboard, thêm nút "Mark as Submitted" hiển thị khi ở trạng thái `ready` (có thể xuất hiện sau khi đã bấm Push to eVisa).
  - [x] Gọi API `PUT /api/applications/[id]/status` chuyển sang `submitted`.
  - [x] Cập nhật UI dashboard hiển thị StatusBadge là "Submitted".
  - [x] Gửi message từ dashboard sang extension để báo hoàn tất và extension thực hiện xóa key `pendingApplication` khỏi `chrome.storage.local`.

## Dev Notes
- Logic auto-fill cần được chia làm 2 phase do trang eVisa có màn hình confirmation ban đầu:
  1. **Phase 1**: Tại `/e-visa/foreigners`, chờ popup xuất hiện. Tìm 2 checkbox Ant Design -> click mô phỏng -> tìm nút Next -> click. Có timeout 3.5s và 4s để tự F5 nếu lỗi.
  2. **Phase 2**: Tại trang form, chờ DOM input elements load xong -> điền form fields và upload ảnh (có delay 1s giữa mỗi ảnh).
- Có thể dùng `setInterval` để kiểm tra liên tục sự xuất hiện của các checkbox trên popup, cũng như các form field, nhằm tránh lỗi script chạy quá sớm trước khi element render.
- Để auto-fill các trường text input, cần dispatch các event thích hợp như `input`, `change` và đôi khi là `blur` để trang nhận ra thay đổi giá trị.
- Đối với upload file, cách tiêu chuẩn là:
  ```javascript
  const dt = new DataTransfer();
  dt.items.add(new File([blob], "filename.jpg", { type: "image/jpeg" }));
  const input = document.querySelectorAll("input[type=file]")[0];
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true })); // Cho Vue/AntD
  ```
- Nếu trang `evisa.gov.vn` có CORS chính sách nghiêm ngặt, việc fetch `signedUrl` trực tiếp ở Content script có thể bị block. Nếu thế, trong thư mục extension, mở một background listener proxy để tải qua fetch ở service worker sau đó trả blob/base64 xuống content script.
- Trên dashboard, giao diện hiện đang có nút "Push to eVisa". Khi status update thành submitted, nút đó sẽ disable hoặc biến mất, thay thế bằng badge Submitted.

## Dev Agent Record

### Debug Log
- N/A

### Completion Notes
- Created `evisa-filler.ts` content script that matches `evisa.gov.vn`.
- Added heuristic popup handler `handleBlockingPopup` to run in a `setInterval` loop to auto-close any obstructing modals before filling the form.
- Added simple DOM element mapping and DataTransfer API logic to load and inject photos.
- Configured dashboard with a "Mark as Submitted" button that successfully changes the application status to `submitted` and sends the `CLEAR_PENDING_APPLICATION` message to the background script.

### File List
- `apps/extension/contents/evisa-filler.ts` (NEW)
- `apps/extension/background.ts` (MODIFIED)
- `apps/web/src/components/dashboard/ApplicationDetail.tsx` (MODIFIED)
- `packages/shared/src/types.ts` (MODIFIED)
- `packages/shared/src/index.ts` (MODIFIED)

### Change Log
- Added content script and popup bypassing logic for evisa site.
- Handled file injection using blob fetch and DataTransfer.
- Updated `ApplicationDetail.tsx` with "Mark as Submitted" optimistic UI and extension message logic.
- Defined `ClearPendingApplicationMessage` type in shared package.

### Status
- Completed and tested via `pnpm build`, `pnpm typecheck`, `pnpm lint`. No errors.

### Review Findings

- [x] [Review][Decision] External Messaging to Extension — `ApplicationDetail.tsx` calls `chrome.runtime.sendMessage` to the extension. This will only work if the web app's domain is listed in `externally_connectable` in `manifest.json`, which isn't included in the diff. Is this already configured, or does it need to be added? — dismissed (already configured)
- [x] [Review][Patch] Photo Upload CORS Risk [`apps/extension/contents/evisa-filler.ts`:98]
- [x] [Review][Defer] Popup Selector Brittle Parsing [`apps/extension/contents/evisa-filler.ts`:66] — deferred, pre-existing
