---
baseline_commit: eb9098b074d1ab7902a65d048c68470d67e31155
---

# Story 4.5: Manual Export Fallback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator,
I want to download an application's data as a structured file at any time,
So that I can manually fill evisa.gov.vn if the Chrome Extension is broken or the site changes its interface.

## Giao diện / Thiết kế (UX/UI)

- **Vị trí nút**: Đặt nút "Export" ở phần header của giao diện chi tiết hồ sơ (`ApplicationDetail.tsx`), cùng hàng với các nút hành động khác (Edit, Create Data, Push to eVisa, Mark as Submitted).
- **Kiểu nút (Variant)**: Sử dụng variant `ghost` (theo yêu cầu AC là ghost variant).
- **Trạng thái hiển thị**: Luôn luôn hiển thị, không bị ẩn hay vô hiệu hóa (disabled) bởi bất kỳ trạng thái nào của hồ sơ (`raw`, `ready`, `submitted`, `done`).

## Tiêu chí chấp nhận (Acceptance Criteria)

1. **Given** Operator đang ở trang chi tiết hồ sơ bất kỳ (không phân biệt trạng thái)
2. **When** xem danh sách các nút hành động (action buttons)
3. **Then** nút "Export" luôn hiển thị (variant ghost) — không bị chặn bởi trạng thái hồ sơ
4. **And** click nút "Export" kích hoạt tải xuống một file JSON chứa các trường: `appId`, `lastName`, `firstName`, `email`, `arrivalDate`, `status`
5. **And** tên file tải về tuân theo định dạng: `[appId]-export.json` (ví dụ: `DA-2026-0001-export.json`)
6. **And** dữ liệu export KHÔNG bao gồm signed URLs hoặc đường dẫn lưu trữ ảnh (storage paths) — thông tin hình ảnh hoàn toàn bị loại bỏ
7. **And** quá trình export được xử lý hoàn toàn ở phía client từ dữ liệu hồ sơ đã tải sẵn — không thực hiện thêm API call nào khác

## Nhiệm vụ / Công việc (Tasks / Subtasks)

- [x] Task 1: Thêm nút Export vào giao diện Dashboard UI (AC: 1, 2, 3)
  - [x] Import icon `Download` từ thư viện `lucide-react` trong component [ApplicationDetail.tsx](file:///Users/max/Data/Git/VisaAgency/apps/web/src/components/dashboard/ApplicationDetail.tsx).
  - [x] Đặt nút "Export" (variant="ghost", size="sm", id="export-application-btn") trong cụm nút hành động tại header.
- [x] Task 2: Hiện thực hóa logic tải xuống file JSON client-side (AC: 4, 5, 6, 7)
  - [x] Viết hàm `handleExport` trong component `ApplicationDetail`.
  - [x] Lấy dữ liệu từ prop `application` chỉ bao gồm 6 trường bắt buộc: `appId`, `lastName`, `firstName`, `email`, `arrivalDate`, `status`.
  - [x] Tạo đối tượng Blob từ chuỗi JSON đã được định dạng (`JSON.stringify(data, null, 2)`).
  - [x] Tạo thẻ `<a>` tạm thời, gán thuộc tính `download` là `${application.appId}-export.json` và `href` bằng `URL.createObjectURL(blob)`.
  - [x] Thực hiện tự động click thẻ `<a>` để kích hoạt trình duyệt tải file xuống, sau đó giải phóng Object URL (`URL.revokeObjectURL`) và xóa thẻ khỏi DOM.
- [x] Task 3: Kiểm tra và xác thực chất lượng
  - [x] Xác nhận file JSON tải về có cấu trúc chuẩn xác và không chứa thông tin ảnh/signed URL.
  - [x] Chạy kiểm tra tĩnh và build ứng dụng bằng cách chạy lệnh `pnpm build`, `pnpm typecheck`, và `pnpm lint` từ thư mục gốc của project.

## Tài liệu tham khảo & Chỉ dẫn kỹ thuật (Dev Notes)

### Cấu trúc dữ liệu JSON cần xuất
```json
{
  "appId": "DA-2026-XXXX",
  "lastName": "Nguyen",
  "firstName": "An",
  "email": "an.nguyen@example.com",
  "arrivalDate": "2026-06-06",
  "status": "raw"
}
```

### Các tệp tin liên quan trực tiếp
- [ApplicationDetail.tsx](file:///Users/max/Data/Git/VisaAgency/apps/web/src/components/dashboard/ApplicationDetail.tsx) - Nơi chứa giao diện chi tiết hồ sơ và các nút hành động.

### Tài liệu tham chiếu gốc
- Kiến trúc dự án: [architecture.md#Cascading Failure Analysis](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/architecture.md#Cascading%20Failure%20Analysis)
- Danh sách Epic: [epics.md#Story 4.5: Manual Export Fallback](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/epics.md#Story%204.5:%20Manual%20Export%20Fallback)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

- N/A

### Completion Notes List

- Đã import icon `Download` từ `lucide-react` và tích hợp nút "Export" (ghost variant, id `export-application-btn`) vào phần header của giao diện chi tiết hồ sơ `ApplicationDetail.tsx`. Nút này luôn hiển thị ở mọi trạng thái hồ sơ.
- Đã hiện thực hóa logic tải dữ liệu JSON ở client-side từ dữ liệu props đã tải sẵn của component, chỉ bao gồm 6 trường: `appId`, `lastName`, `firstName`, `email`, `arrivalDate`, `status`. Ảnh, đường dẫn lưu trữ, và signed URLs hoàn toàn bị loại bỏ để đảm bảo bảo mật.
- File JSON tải xuống có tên theo định dạng `[appId]-export.json` (ví dụ: `DA-2026-0001-export.json`).
- Khắc phục lỗi build pre-existing `ReferenceError: window is not defined` do thư viện `heic2any` gây ra khi render SSR trang `/` bằng cách chuyển sang dynamic import trong hàm `convertHeicToJpg` của file `apps/web/src/lib/heic-convert.ts`.
- Toàn bộ codebase đã được kiểm tra thành công với `pnpm typecheck && pnpm lint && pnpm build` chạy mượt mà không lỗi.

### File List

- `apps/web/src/components/dashboard/ApplicationDetail.tsx` (MODIFIED)
- `apps/web/src/lib/heic-convert.ts` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED)

### Review Findings

- [x] [Review][Patch] Synchronous Object URL revocation can abort download in some browsers [apps/web/src/components/dashboard/ApplicationDetail.tsx:178]

