---
title: David Agency — Visa Application Data Collection System
status: final
created: 2026-05-30
updated: 2026-05-30
---

# PRD: David Agency — Visa Application Data Collection System

## 0. Document Purpose

PRD này dành cho developer xây dựng hệ thống David Agency — một nền tảng thu thập thông tin khách hàng xin visa và tự động hóa quy trình nộp hồ sơ lên cổng chính phủ evisa.gov.vn. Tài liệu được cấu trúc theo feature groups với Functional Requirements có ID ổn định (FR-N), Glossary-anchored vocabulary, và assumptions được tag inline. Kiến trúc kỹ thuật chi tiết được tách thành tài liệu riêng.

---

## 1. Vision

David Agency là một visa service agency cần số hóa và tự động hóa quy trình tiếp nhận hồ sơ khách hàng. Hiện tại, việc thu thập thông tin diễn ra thủ công qua WhatsApp, tốn thời gian và dễ sai sót. Hệ thống này cho phép khách hàng nước ngoài tự điền thông tin qua một web form đơn giản, dữ liệu được lưu tự động vào Supabase, và Richard có thể quản lý toàn bộ hồ sơ qua một dashboard nội bộ.

Điểm đột phá của hệ thống là Chrome Extension tích hợp với dashboard, cho phép Richard tự động điền thông tin hồ sơ lên evisa.gov.vn chỉ bằng một vài click — loại bỏ hoàn toàn việc copy-paste thủ công, tiết kiệm ước tính 80% thời gian xử lý mỗi hồ sơ.

Hệ thống được thiết kế theo nguyên tắc simplicity-first: form chỉ thu thập đúng những gì cần thiết, không thu thập thừa; khách hàng không cần tạo tài khoản; một URL cố định duy nhất cho toàn bộ quy trình tiếp nhận.

---

## 2. Target User

### 2.1 Người vận hành (Operator)

**Richard** — chủ David Agency, người duy nhất sử dụng dashboard và Chrome Extension.

Jobs to be done:
- Tiếp nhận thông tin hồ sơ từ khách mà không cần trao đổi qua lại nhiều lần
- Quản lý và theo dõi trạng thái từng hồ sơ
- Nộp hồ sơ lên evisa.gov.vn nhanh nhất có thể, ít thao tác nhất có thể
- Biết ngay khi nào hồ sơ nào cần xử lý

### 2.2 Người nộp đơn (Applicant)

**Khách hàng nước ngoài** — người xin visa du lịch / công tác vào Việt Nam. Đa quốc tịch, đa ngôn ngữ, phần lớn dùng iPhone. Không có tài khoản trên hệ thống.

Jobs to be done:
- Nộp thông tin hồ sơ nhanh chóng, không rườm rà
- Biết rằng hồ sơ đã được tiếp nhận thành công
- Theo dõi trạng thái xử lý mà không cần hỏi lại

### 2.3 Non-Users (v1)

- Bên thứ ba / đại lý — hệ thống không có cơ chế multi-tenant hay phân quyền nhân viên
- Cơ quan chính phủ — không có API tích hợp trực tiếp; Chrome Extension thao tác trên giao diện web của evisa.gov.vn

### 2.4 User Journeys

**UJ-1. Carlos nộp hồ sơ xin visa lần đầu.**
- **Persona + context:** Carlos, 28 tuổi, người Tây Ban Nha, nhận link WhatsApp từ Richard, lần đầu xin visa Việt Nam, dùng iPhone.
- **Entry state:** Chưa đăng ký tài khoản. Mở link trên Safari mobile.
- **Path:**
  1. Truy cập URL → thấy form tiếng Anh với 6 fields rõ ràng
  2. Nhập Last Name, First Name, Email
  3. Chọn ngày Arrival bằng date picker → thấy confirmation *"You will arrive on July 6, 2026"* ngay bên dưới
  4. Upload ảnh chân dung và ảnh passport (HEIC tự động được chấp nhận)
  5. Hoàn thành reCAPTCHA → bấm Submit
- **Climax:** Trang success hiện ngay với mã hồ sơ `DA-2026-0042`. Email xác nhận gửi đến inbox. WhatsApp nhận mã tracking.
- **Resolution:** Carlos biết hồ sơ đã được tiếp nhận. Anh có thể check status bằng email update về sau.
- **Edge case:** Carlos bấm Submit hai lần do mạng chậm → nút bị disable sau click đầu, chỉ một hồ sơ được tạo.

**UJ-2. Richard xử lý hồ sơ của Carlos.**
- **Persona + context:** Richard, operator, đăng nhập dashboard vào buổi sáng.
- **Entry state:** Đã authenticated qua Supabase Auth.
- **Path:**
  1. Dashboard mở với default view = danh sách hồ sơ Raw (chưa xử lý)
  2. Click vào hồ sơ Carlos → xem đầy đủ thông tin và preview ảnh (signed URL)
  3. Click "Edit" nếu cần sửa arrival date theo yêu cầu khách
  4. Click "Create Data" → chuẩn bị thông tin bổ sung cho hồ sơ (theo chuyên môn của Richard)
  5. Hồ sơ chuyển trạng thái Raw → Ready
  6. Click "Push to eVisa" → hiện Confirmation Modal với tên + ảnh + arrival date
  7. Xác nhận → Extension tự động điền evisa.gov.vn
  8. Richard review trên trang chính phủ → Submit
  9. Dashboard tự động cập nhật trạng thái → Submitted
- **Climax:** Hồ sơ được nộp lên evisa.gov.vn trong vài phút, không cần copy-paste thủ công.
- **Resolution:** Carlos nhận WhatsApp + Email thông báo *"Hồ sơ đã được nộp lên cổng chính phủ"*.

---

## 3. Glossary

- **Application** — một hồ sơ xin visa, được tạo khi Applicant submit form. Có Application ID duy nhất.
- **Application ID** — mã định danh duy nhất theo format `DA-YYYY-XXXX` (e.g. `DA-2026-0042`). Primary key của toàn hệ thống. Không phải email.
- **Applicant** — người nước ngoài điền và nộp form xin visa.
- **Operator** — Richard, người duy nhất có quyền truy cập dashboard.
- **Dashboard** — giao diện web nội bộ, chỉ Operator truy cập được sau khi xác thực.
- **Application Form** (hay "Form") — trang web public để Applicant nộp thông tin.
- **Chrome Extension** (hay "Extension") — browser extension tích hợp với dashboard, tự động điền thông tin lên evisa.gov.vn.
- **Status** — trạng thái xử lý của một Application: `Raw` → `Ready` → `Submitted` → `Done`.
- **Raw** — Application vừa được Applicant submit, chưa được Operator xử lý.
- **Ready** — Operator đã hoàn thành bước Create Data, sẵn sàng push lên evisa.gov.vn.
- **Submitted** — đã được push và nộp lên evisa.gov.vn.
- **Done** — quy trình hoàn tất (visa được cấp hoặc kết thúc case).
- **Create Data** — bước Operator chuẩn bị thông tin bổ sung cho Application theo chuyên môn, trước khi push.
- **Push to eVisa** — hành động kích hoạt Extension để auto-fill evisa.gov.vn với data của Application đang chọn.
- **Portrait Photo** — ảnh chân dung của Applicant (selfie hoặc ảnh formal).
- **Passport Photo** — ảnh trang thông tin của hộ chiếu Applicant.
- **Signed URL** — URL tạm thời có thời hạn để truy cập ảnh trong private storage. Hết hạn sau một khoảng thời gian cố định.

---

## 4. Features

### 4.1 Public Application Form

**Description:** Trang web public, accessible qua một URL cố định duy nhất. Hiển thị form tiếng Anh để Applicant nhập thông tin và upload ảnh. Sau khi submit thành công, Applicant nhận được Application ID và email xác nhận. Form không yêu cầu đăng ký tài khoản. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Form fields chuẩn

Applicant có thể điền các fields: Last Name, First Name, Email Address, Portrait Photo (upload), Passport Photo (upload), Arrival Date.

**Consequences (testable):**
- Tất cả 6 fields đều present và required — không thể submit khi thiếu bất kỳ field nào
- Label hiển thị bằng tiếng Anh, rõ ràng: "Last Name (Family Name)", "First Name (Given Name)"
- Validation inline ngay khi rời khỏi field, không đợi đến submit

#### FR-2: Upload ảnh với HEIC support

Applicant có thể upload Portrait Photo và Passport Photo, hệ thống chấp nhận định dạng JPG, PNG, và HEIC. File tối đa 6MB mỗi ảnh.

**Consequences (testable):**
- File HEIC được tự động convert sang JPG ở phía client trước khi upload
- Hiển thị rõ ngay dưới nút upload: *"Accepted formats: JPG, PNG, HEIC — Max 6MB"*
- Nếu file vượt 6MB: hiển thị lỗi ngay lập tức, không thực hiện upload
- Preview ảnh hiển thị sau khi upload thành công

#### FR-3: Date confirmation real-time

Khi Applicant nhập Arrival Date theo format DD/MM/YYYY, hệ thống hiển thị ngay bên dưới dòng xác nhận bằng ngôn ngữ tự nhiên.

**Consequences (testable):**
- Confirmation cập nhật real-time khi Applicant thay đổi giá trị date
- Format hiển thị: *"✓ You will arrive on [Month Name] [Day], [Year]"* (e.g. *"✓ You will arrive on July 6, 2026"*)
- Confirmation chỉ hiển thị khi date hợp lệ; ẩn hoặc hiện lỗi khi date không hợp lệ

#### FR-4: Spam prevention với reCAPTCHA

Form tích hợp Google reCAPTCHA để ngăn bot tự động submit.

**Consequences (testable):**
- Submit bị block nếu reCAPTCHA chưa pass
- reCAPTCHA v3 (invisible) ưu tiên để không làm phiền người dùng; fallback v2 nếu cần

#### FR-5: Submit idempotent và confirmation

Khi Applicant bấm Submit, hệ thống ngăn double-submit, xử lý request, và hiển thị kết quả rõ ràng.

**Consequences (testable):**
- Nút Submit bị disable ngay sau click đầu tiên
- Loading indicator hiển thị trong thời gian xử lý
- Khi thành công: redirect sang trang success hiển thị Application ID (`DA-YYYY-XXXX`) và thông báo *"Your application has been received!"*
- Khi thất bại (network/server): retry tự động tối đa 3 lần; nếu vẫn thất bại → hiển thị *"Something went wrong, please try again in a few minutes"* và giữ nguyên data đã nhập

#### FR-6: Application ID generation

Hệ thống tự động tạo Application ID duy nhất theo format `DA-YYYY-XXXX` khi Application được tạo thành công.

**Consequences (testable):**
- Application ID hiển thị trên trang success
- Application ID được gửi kèm trong email xác nhận và WhatsApp notification
- Application ID là unique, không bao giờ trùng lặp

---

### 4.2 Notification System

**Description:** Hệ thống gửi thông báo tự động đến Applicant qua Email và WhatsApp tại hai thời điểm: khi Application được tiếp nhận và khi Application đã được nộp lên evisa.gov.vn. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-7: Thông báo tiếp nhận hồ sơ

Khi Application submit thành công, hệ thống tự động gửi thông báo đến Applicant.

**Consequences (testable):**
- Email xác nhận gửi đến địa chỉ email Applicant đã nhập trong vòng 1 phút sau submit
- Email chứa: Application ID, tóm tắt thông tin đã nộp, và thông điệp *"We have received your application and will process it shortly"*
- WhatsApp message gửi đến số điện thoại [ASSUMPTION: Applicant cung cấp số điện thoại — cần xác nhận có thêm field Phone Number vào form không] hoặc qua kênh được cấu hình trước

**Notes:** [NOTE FOR PM] Cần xác nhận cơ chế gửi WhatsApp: qua WhatsApp Business API (Twilio), hay qua số WhatsApp của Richard được gắn với hệ thống? Nếu dùng WhatsApp Business API, cần số điện thoại của Applicant → cần thêm field Phone Number vào form (FR-1).

#### FR-8: Thông báo đã nộp lên chính phủ

Khi Operator cập nhật Application status thành `Submitted`, hệ thống tự động gửi thông báo đến Applicant.

**Consequences (testable):**
- Email và WhatsApp gửi thông báo: *"Your application has been submitted to the Vietnam e-Visa portal"*
- Notification gửi trong vòng 1 phút sau khi status thay đổi thành Submitted

---

### 4.3 Dashboard — Quản lý hồ sơ

**Description:** Giao diện web nội bộ chỉ dành cho Operator (Richard). Yêu cầu xác thực Supabase Auth. Hiển thị danh sách Applications theo status, cho phép xem chi tiết, chỉnh sửa, và quản lý quy trình xử lý. Realizes UJ-2.

**Functional Requirements:**

#### FR-9: Authentication

Operator phải đăng nhập bằng Supabase Auth (email/password) trước khi truy cập dashboard. Mọi route của dashboard đều được bảo vệ.

**Consequences (testable):**
- Truy cập bất kỳ URL dashboard nào khi chưa đăng nhập → redirect về trang login
- Sau khi đăng nhập thành công → redirect về dashboard
- Session persistent qua browser reload (không cần đăng nhập lại mỗi lần)

#### FR-10: Danh sách Applications với filtering

Dashboard hiển thị danh sách Applications có thể filter theo status và search theo tên hoặc Application ID.

**Consequences (testable):**
- Default view: chỉ hiển thị Applications ở trạng thái `Raw`
- Filter tabs: All / Raw / Ready / Submitted / Done
- Search box: tìm theo Last Name, First Name, hoặc Application ID (real-time, không cần bấm Enter)
- Mỗi row hiển thị: Application ID, Full Name, Arrival Date, status badge, thời gian submit
- Danh sách sắp xếp theo thời gian submit mới nhất lên đầu

#### FR-11: Chi tiết Application và ảnh

Operator có thể xem đầy đủ thông tin và ảnh của từng Application.

**Consequences (testable):**
- Click vào một Application → hiển thị detail view với toàn bộ thông tin
- Portrait Photo và Passport Photo hiển thị được (dùng Signed URL, có thể xem trong browser)
- Signed URL được generate on-demand, không expose URL cố định của file trong storage

#### FR-12: Edit Application (trạng thái Raw)

Operator có thể chỉnh sửa thông tin của Application ở trạng thái `Raw`.

**Consequences (testable):**
- Nút "Edit" chỉ hiển thị khi Application ở trạng thái `Raw`
- Có thể chỉnh sửa: Last Name, First Name, Email, Arrival Date, thay ảnh Portrait/Passport
- Lưu edit → Application vẫn ở trạng thái `Raw`, log thời gian chỉnh sửa

#### FR-13: Create Data workflow

Operator có bước chuẩn bị dữ liệu bổ sung cho Application trước khi push lên evisa.gov.vn.

**Consequences (testable):**
- Nút "Create Data" hiển thị khi Application ở trạng thái `Raw`
- Sau khi Operator hoàn thành Create Data và confirm → status chuyển từ `Raw` sang `Ready`
- Application ở trạng thái `Ready` mới có nút "Push to eVisa" active
- [ASSUMPTION: Nội dung "Create Data" là thông tin bổ sung mà Richard điền theo chuyên môn — cần xác nhận cụ thể những fields nào cần nhập trong bước này]

#### FR-14: Pre-Push Confirmation Modal

Trước khi kích hoạt Chrome Extension push lên evisa.gov.vn, hệ thống hiển thị modal xác nhận thông tin.

**Consequences (testable):**
- Click "Push to eVisa" (chỉ available khi status = `Ready`) → hiển thị Confirmation Modal
- Modal hiển thị: Portrait Photo thumbnail, Full Name, Arrival Date, Application ID
- Operator phải bấm "Confirm & Push" để tiếp tục, hoặc "Cancel" để hủy
- Sau khi confirm → Extension được kích hoạt với data của Application đang chọn

#### FR-15: Status tracking

Operator có thể cập nhật status của Application theo workflow.

**Consequences (testable):**
- Status flow một chiều: `Raw` → `Ready` → `Submitted` → `Done`
- Không thể đi ngược status (không thể chuyển từ `Ready` về `Raw`)
- Mỗi lần thay đổi status → log timestamp và action vào audit trail
- Status `Submitted` được tự động set khi Extension hoàn thành push (nếu Extension báo thành công)

---

### 4.4 Chrome Extension — Auto-fill evisa.gov.vn

**Description:** Chrome browser extension được cài trên máy tính của Operator. Nhận data từ dashboard và tự động điền các field tương ứng trên evisa.gov.vn, bao gồm upload ảnh. Operator vẫn là người bấm Submit cuối cùng trên trang chính phủ để kiểm soát chất lượng. Realizes UJ-2.

**Functional Requirements:**

#### FR-16: Nhận data từ Dashboard

Extension nhận Application data khi Operator xác nhận Push từ Dashboard.

**Consequences (testable):**
- Extension không hoạt động cho đến khi được kích hoạt từ Dashboard (không tự động chạy)
- Data truyền bao gồm: tất cả fields của Application và URL signed để download ảnh
- Extension xác nhận nhận data trước khi thực hiện bất kỳ thao tác nào

#### FR-17: Auto-fill form evisa.gov.vn

Extension tự động điền các field trên evisa.gov.vn với data của Application.

**Consequences (testable):**
- Extension mở tab evisa.gov.vn (hoặc navigate đến đúng trang form)
- Điền tự động các fields tương ứng: họ tên, ngày đến, và các fields khác do Richard chuẩn bị trong bước Create Data
- Portrait Photo và Passport Photo được upload tự động vào đúng field
- Tất cả thao tác hoàn tất trước khi Operator cần can thiệp

#### FR-18: Operator review và submit cuối

Sau khi Extension hoàn thành điền form, Operator review và quyết định submit trên trang chính phủ.

**Consequences (testable):**
- Extension dừng lại và không tự submit lên evisa.gov.vn — Operator là người bấm Submit cuối cùng
- Extension hiển thị notification hoặc badge khi đã hoàn thành điền form
- Sau khi Operator submit thành công trên evisa.gov.vn → quay lại Dashboard cập nhật status thành `Submitted`

#### FR-19: Extension maintenance

Extension được developer maintain chủ động khi evisa.gov.vn thay đổi giao diện.

**Out of Scope:**
- Extension không được publish lên Chrome Web Store — cài đặt thủ công (Developer mode)
- [NOTE FOR PM] Cần thỏa thuận SLA với developer về thời gian update Extension khi evisa.gov.vn thay đổi

---

### 4.5 Data Security & Storage

**Description:** Dữ liệu Application (bao gồm ảnh passport nhạy cảm) được lưu trữ an toàn trên Supabase với các biện pháp bảo vệ phù hợp. Realizes toàn bộ hệ thống.

**Functional Requirements:**

#### FR-20: Private image storage

Ảnh Portrait và Passport được lưu trong Supabase Storage private bucket, không có public URL.

**Consequences (testable):**
- Bucket storage được set private — không ai có thể truy cập ảnh qua URL cố định
- Dashboard generate Signed URL on-demand khi cần hiển thị ảnh, với thời hạn tối đa 1 giờ
- Extension download ảnh qua Signed URL để upload lên evisa.gov.vn
- Signed URL hết hạn sau thời gian cấu hình, không thể tái sử dụng

#### FR-21: Row Level Security

Chỉ Operator đã xác thực mới có thể đọc và ghi data trong Supabase.

**Consequences (testable):**
- Supabase RLS được bật trên tất cả các bảng
- Public form chỉ có quyền INSERT vào bảng Applications (không read, không update)
- Dashboard (Operator) có full CRUD sau khi xác thực
- Không có user nào khác có thể truy cập data

---

## 5. Non-Goals (Explicit)

- **Không có tài khoản cho Applicant** — Applicant không đăng ký, không đăng nhập, không có profile
- **Không có OCR phía hệ thống** — evisa.gov.vn đã có OCR, không tái tạo
- **Không batch processing** — xử lý case-by-case, không có tính năng xử lý nhiều hồ sơ cùng lúc
- **Không multi-operator** — chỉ một Operator duy nhất (Richard), không có phân quyền nhóm
- **Không mở rộng dịch vụ ngoài visa** — hệ thống chỉ phục vụ Vietnam e-visa
- **Không có trang tracking public cho Applicant** — Applicant nhận update qua email/WhatsApp, không có portal riêng
- **Không tự động submit lên evisa.gov.vn** — Extension điền form nhưng Operator luôn là người bấm Submit cuối cùng
- **Không link cá nhân hóa per Applicant** — một URL form duy nhất cho tất cả

---

## 6. MVP Scope

### 6.1 In Scope (MVP)

- Public Application Form (6 fields, HEIC support, date confirmation, reCAPTCHA, submit flow)
- Application ID generation (DA-YYYY-XXXX)
- Supabase data layer (Applications table, private image storage, RLS)
- Dashboard với Supabase Auth
- Dashboard: danh sách Applications, filtering, search
- Dashboard: view chi tiết Application với ảnh
- Dashboard: Edit Application (Raw status)
- Dashboard: Create Data workflow (Raw → Ready)
- Dashboard: Pre-Push Confirmation Modal
- Dashboard: Status tracking (Raw → Ready → Submitted → Done)
- Chrome Extension: auto-fill evisa.gov.vn
- Email notification: tiếp nhận hồ sơ (Received)
- Email notification: đã nộp chính phủ (Submitted)

### 6.2 Out of Scope for MVP

- **WhatsApp notification** — [NOTE FOR PM] Phụ thuộc vào quyết định về WhatsApp Business API và việc có thêm field Phone Number vào form hay không. Defer sang v2.
- **Application tracking code gửi qua WhatsApp** — defer sang v2 cùng với WhatsApp integration
- **Auto-retry khi submit form thất bại** — v1 hiển thị lỗi rõ ràng và giữ data; retry tự động là v2
- **Advanced image validation** (blur detection, face detection) — Applicant tự chịu trách nhiệm; thêm vào v2 nếu thực tế phát sinh vấn đề
- **Audit log đầy đủ** (ai làm gì lúc mấy giờ) — basic timestamp là đủ cho MVP

---

## 7. Success Metrics

**Primary**

- **SM-1**: Tỷ lệ hồ sơ được xử lý hoàn tất (Raw → Submitted) trong ngày — mục tiêu 90%. Validates FR-13, FR-14, FR-17.
- **SM-2**: Thời gian xử lý một hồ sơ (từ Raw đến Submitted) — mục tiêu < 5 phút. Validates FR-17, FR-18.

**Secondary**

- **SM-3**: Tỷ lệ form submit thành công (không bị lỗi validation hay technical error) — mục tiêu > 95%. Validates FR-1, FR-2, FR-5.
- **SM-4**: Tỷ lệ Applicant nhận email xác nhận trong vòng 1 phút — mục tiêu > 99%. Validates FR-7.

**Counter-metrics (do not optimize)**

- **SM-C1**: Số lượng hồ sơ duplicate (cùng Applicant submit nhiều lần) — không được tăng dù tối ưu conversion rate. Counterbalances SM-3.

---

## 8. Open Questions

1. **evisa.gov.vn form structure:** Extension cần map đúng fields. Cần phân tích cụ thể form trên evisa.gov.vn để xác định CSS selectors và file upload mechanism trước khi build Extension.

2. **"Create Data" fields cụ thể:** Richard sẽ define rules và fields cụ thể trong bước này ở giai đoạn sau. MVP build UI placeholder dạng form có thể mở rộng. *(D-014)*

3. **Phone Number field:** Nếu WhatsApp notification cần gửi đến số điện thoại Applicant, cần thêm field Phone Number vào form (FR-1). Defer đến khi setup WhatsApp provider. *(D-013)*

---

## 9. Assumptions Index

- **[A-1]** §4.2 / FR-7: Phone Number field chưa có trong MVP form — WhatsApp notification sẽ cần giải pháp khi Richard setup provider. Defer. *(D-013)*
- **[A-2]** §4.3 / FR-13: "Create Data" UI build dạng extensible form — Richard sẽ define fields cụ thể sau khi MVP chạy được. *(D-014)*
- **[A-3]** §4.4 / FR-17: Extension có thể tự động hóa toàn bộ thao tác upload ảnh trên evisa.gov.vn — phụ thuộc vào cấu trúc DOM thực tế của trang chính phủ. Cần phân tích trước khi build. *(OQ-1)*
- **[A-4]** §4.4 / FR-19: Extension cài thủ công qua Chrome Developer mode — không publish Web Store. *(D-015)*

---

## Cross-Cutting NFRs

**Bảo mật:**
- Tất cả traffic qua HTTPS
- Supabase RLS bắt buộc trên mọi bảng
- Ảnh chỉ accessible qua Signed URL, không public
- Dashboard route protected bằng authentication

**Performance:**
- Form load time < 2 giây trên mobile 4G
- Image upload với progress indicator (không để người dùng chờ không có feedback)
- Dashboard list render < 1 giây cho đến 500 records

**Accessibility:**
- Form labels rõ ràng, hỗ trợ screen reader cơ bản
- Error messages mô tả cụ thể vấn đề và cách sửa

**File size:**
- Portrait Photo: tối đa 6MB
- Passport Photo: tối đa 6MB
- Accepted formats: JPG, PNG, HEIC (auto-convert HEIC → JPG phía client)
