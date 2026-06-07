# Sprint Change Proposal: Tự động mở cửa sổ mới khi Push to eVisa

**Ngày đề xuất:** 2026-06-07
**Trạng thái:** Chờ phê duyệt (Pending Approval)
**Người đề xuất:** Operator (Richard) / Antigravity AI
**Phân loại:** Thay đổi nhỏ (Minor) - Có thể triển khai trực tiếp bởi Developer Agent

---

## 1. Tóm tắt vấn đề (Issue Summary)

Trong thiết kế ban đầu của Epic 4, luồng hoạt động yêu cầu Operator sau khi bấm **Confirm & Push** trên Dashboard phải thực hiện thao tác thủ công là mở một tab/cửa sổ mới và truy cập địa chỉ `evisa.gov.vn` để Extension kích hoạt tự động điền form. 

Nhằm tối ưu hóa trải nghiệm người dùng và tiết kiệm thời gian, Richard mong muốn hệ thống tự động mở một cửa sổ trình duyệt mới (`New Window`) truy cập trang `evisa.gov.vn` ngay sau khi dữ liệu được truyền tải thành công sang Extension.

---

## 2. Phân tích ảnh hưởng (Impact Analysis)

* **Ảnh hưởng Epic:** Ảnh hưởng trực tiếp đến **Epic 4: Operator Processes Applications & Pushes to eVisa**.
* **Ảnh hưởng Story:** 
  * [Story 4.3: Chrome Extension — Setup & Dashboard Message Protocol](file:///Users/max/Data/Git/VisaAgency/_bmad-output/implementation-artifacts/4-3-chrome-extension-setup-and-dashboard-message-protocol.md) (Cần cập nhật logic nhận tin nhắn ở `background.ts` để thực hiện mở cửa sổ mới).
  * [Story 4.4: Chrome Extension — Auto-Fill evisa.gov.vn & Status Update](file:///Users/max/Data/Git/VisaAgency/_bmad-output/implementation-artifacts/4-4-chrome-extension-auto-fill-evisa-gov-vn-and-status-update.md) (Cập nhật ngữ cảnh bắt đầu tự động điền).
* **Xung đột tài liệu (Artifact Conflicts):**
  * **PRD:** Cần cập nhật yêu cầu `FR-17` tại [prd.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/prds/prd-VisaAgency-2026-05-30/prd.md).
  * **Epics:** Cập nhật mô tả nghiệm thu của Story 4.3 và 4.4 tại [epics.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/epics.md).
* **Ảnh hưởng kỹ thuật:** 
  * Cần bổ sung lệnh `chrome.windows.create({ url: "https://evisa.gov.vn" })` vào bên trong callback xử lý thông điệp `PUSH_TO_EVISA` trong [background.ts](file:///Users/max/Data/Git/VisaAgency/apps/extension/background.ts).

---

## 3. Giải pháp đề xuất (Recommended Approach)

* **Lựa chọn:** Điều chỉnh trực tiếp (Direct Adjustment)
* **Lý do chọn:** Sự thay đổi này rất nhỏ về mặt kỹ thuật (chỉ thêm vài dòng mã nguồn gọi Chrome Extension API có sẵn) nhưng mang lại giá trị vận hành cao. Không ảnh hưởng đến kiến trúc dữ liệu hay bảo mật.
* **Mức độ phức tạp & Rủi ro:** Thấp (Low).

---

## 4. Chi tiết các đề xuất chỉnh sửa (Detailed Change Proposals)

### 4.1. Cập nhật PRD

* **Tệp tin:** [prd.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/prds/prd-VisaAgency-2026-05-30/prd.md)
* **Vị trí:** Dòng 295 (Mục FR-17)
* **Thay đổi:**
  ```diff
  - - Extension mở tab evisa.gov.vn (hoặc navigate đến đúng trang form)
  + - Extension tự động mở một cửa sổ trình duyệt mới (New Window) đến trang evisa.gov.vn khi nhận được dữ liệu từ Dashboard.
  ```

### 4.2. Cập nhật Danh sách Epics

* **Tệp tin:** [epics.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/planning-artifacts/epics.md)
* **Vị trí:** Dòng 525 (Story 4.3 Acceptance Criteria) và dòng 539 (Story 4.4 Acceptance Criteria)
* **Thay đổi:**
  ```diff
    Story 4.3 Acceptance Criteria:
  - 6. **And** on successful receipt: payload stored in `chrome.storage.local` under key `pendingApplication`
  + 6. **And** on successful receipt: payload stored in `chrome.storage.local` under key `pendingApplication` và tự động mở một cửa sổ Chrome mới đến trang `https://evisa.gov.vn`
  ```
  ```diff
    Story 4.4 Acceptance Criteria:
  - 1. **Given** the extension has received a `PushToEvisaMessage` and the operator navigates to evisa.gov.vn
  + 1. **Given** the extension has received a `PushToEvisaMessage` và một cửa sổ mới đến trang evisa.gov.vn đã được tự động mở
  - 2. **When** the content script `evisa-filler.ts` runs on the evisa.gov.vn form page
  + 2. **When** the content script `evisa-filler.ts` chạy trên trang form evisa.gov.vn trong cửa sổ mới đó
  ```

### 4.3. Cập nhật tài liệu Story 4.3

* **Tệp tin:** [4-3-chrome-extension-setup-and-dashboard-message-protocol.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/implementation-artifacts/4-3-chrome-extension-setup-and-dashboard-message-protocol.md)
* **Thay đổi:**
  * Bổ sung Acceptance Criteria 9: "Khi nhận và lưu thành công, background script tự động mở một cửa sổ Chrome mới dẫn đến `https://evisa.gov.vn`."
  * Cập nhật Task 1: Thêm việc gọi `chrome.windows.create` sau khi ghi thành công dữ liệu vào `chrome.storage.local`.

### 4.4. Cập nhật tài liệu Story 4.4

* **Tệp tin:** [4-4-chrome-extension-auto-fill-evisa-gov-vn-and-status-update.md](file:///Users/max/Data/Git/VisaAgency/_bmad-output/implementation-artifacts/4-4-chrome-extension-auto-fill-evisa-gov-vn-and-status-update.md)
* **Thay đổi:**
  * Cập nhật Acceptance Criteria 1: Thay thế điều kiện Operator phải tự điều hướng thành cửa sổ mới đã được tự động mở.

---

## 5. Kế hoạch bàn giao (Handoff Plan)

* **Quy mô thay đổi:** Minor (Nhỏ).
* **Người thực hiện:** Developer Agent sẽ trực tiếp sửa đổi các file tài liệu đặc tả và mã nguồn của Extension.
* **Tiêu chí thành công:**
  1. Click "Push to eVisa" trên Dashboard mở cửa sổ modal confirm.
  2. Bấm "Push to eVisa" trong modal gửi thành công thông điệp sang Extension.
  3. Cửa sổ trình duyệt độc lập mới tự động bật lên và truy cập trang `https://evisa.gov.vn`.
  4. Nội dung form trên trang eVisa được tự động điền đầy đủ thông tin khách hàng và tải ảnh lên bình thường.
