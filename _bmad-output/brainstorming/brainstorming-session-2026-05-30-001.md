---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'Website "David Agency" - Form thu thập thông tin người nước ngoài xin visa, lưu trữ trên Supabase'
session_goals: 'Brainstorm toàn diện: kiến trúc kỹ thuật, UX/UI form, tính năng mở rộng, bảo mật dữ liệu'
selected_approach: ''
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Richard
**Date:** 2026-05-30

## Session Overview

**Topic:** Website "David Agency" — Form thu thập thông tin người nước ngoài xin visa, lưu lên Supabase

**Goals:** Brainstorm toàn diện về kỹ thuật, UX/UI, tính năng mở rộng

**Đối tượng người dùng:** Người nước ngoài xin visa

**Ràng buộc kỹ thuật:**
- File upload tối đa 6MB mỗi file
- Dữ liệu lưu trên Supabase

**Fields bắt buộc:**
- Họ (Last name)
- Tên (First name)
- Email
- Ảnh chân dung (portrait photo)
- Ảnh passport
- Arrival date

### Session Setup

_Phiên brainstorming toàn diện - khám phá kỹ thuật, UX/UI và tính năng mở rộng cho David Agency._

## Phase 4: Reverse Brainstorming — Kết quả

**[Reverse #1]**: Google reCAPTCHA — Chặn bot, bảo vệ Supabase khỏi spam submissions.

**[Reverse #2]**: Supabase Auth — Dashboard protected, chỉ Richard truy cập được dữ liệu nhạy cảm.

**[Reverse #3]**: Extension Maintenance Protocol — Developer chủ động theo dõi và update Extension khi evisa.gov.vn thay đổi.

**[Reverse #4]**: Dashboard Edit Button — Sửa arrival date, ảnh trực tiếp trên dashboard cho hồ sơ Raw.

**[Reverse #5]**: Private Storage + Signed URLs — Bucket ảnh private, URL tạm thời có thời hạn, không bao giờ bị leak.

**[Reverse #6]**: Auto-retry + Keep Data on Error — Retry 3 lần khi Supabase down, giữ nguyên data đã nhập nếu thất bại.

**[Reverse #7]**: Application ID as Primary Key — DA-2026-XXXX là định danh chính, email không phải unique key. Cho phép nhiều hồ sơ từ cùng một email.

**[Reverse #8]**: Pre-Push Confirmation Modal — Hiện ảnh + tên + arrival date trước khi push. Bước kiểm tra cuối tránh nhầm hồ sơ.

**[Reverse #9]**: Smart Dashboard Filtering — Default view = Raw (cần xử lý). Filter: All / Raw / Ready / Submitted / Done. Search theo tên hoặc mã hồ sơ.

## Phase 3: Role Playing — Kết quả

**[Role #1]**: English-First Form — Toàn bộ form bằng tiếng Anh phổ thông: Last Name, First Name, Email, Portrait Photo, Passport Photo, Arrival Date.

**[Role #2]**: HEIC Support + Inline Format Guide — Tự động convert HEIC→JPG (client-side). Hiển thị "Accepted: JPG, PNG, HEIC — Max 6MB" ngay dưới nút upload từ đầu. KH chủ yếu dùng iPhone.

**[Role #3 + 4]**: Unambiguous Date Input — Nhập DD/MM/YYYY nhưng hiển thị real-time confirmation: _"✓ You will arrive on July 6, 2026"_ để người dùng tự xác nhận.

**[Role #5]**: Submit Confirmation + Duplicate Prevention — Disable nút sau click đầu tiên, loading spinner, redirect sang trang success với mã hồ sơ DA-2026-XXXX.

## Phase 2: SCAMPER — Kết quả

| SCAMPER | Insight chốt |
|---|---|
| S | Không cần OCR — tận dụng OCR của evisa.gov.vn |
| C | Auto WhatsApp + Email khi nhận hồ sơ & khi đã nộp chính phủ |
| A | Mã tracking DA-2026-XXXX + email status update tự động |
| M | Dashboard có bước "Create Data" trước khi Push to eVisa |
| P | Focus 100% visa — không mở rộng sang dịch vụ khác |
| E | Validation cơ bản (6MB, format), khách tự chịu trách nhiệm ảnh |
| R | Một URL cố định duy nhất, gửi thẳng qua WhatsApp |

**[M-Idea #2]**: Dashboard "Create Data" Workflow
_Concept_: Dashboard có 2 trạng thái: Raw (hồ sơ mới nộp) → Ready (đã chuẩn bị xong). Chỉ hồ sơ Ready mới có nút Push to eVisa active.
_Novelty_: Ngăn push nhầm hồ sơ chưa được chuẩn bị — kiểm soát chất lượng tự nhiên.

## Phase 1: First Principles Thinking — Kết quả

**Kiến trúc cốt lõi được phát hiện:**

| Thành phần | Vai trò |
|---|---|
| Public Form | Khách nước ngoài tự điền thông tin |
| Supabase | Lưu trữ data + ảnh |
| Dashboard | Quản lý hồ sơ, xem trạng thái |
| Chrome Extension | Auto-fill evisa.gov.vn khi xử lý |

**[Kỹ thuật #1]**: Visa Data Automation Core
_Concept_: Hệ thống là một pipeline tự động: client tự nhập → dữ liệu tự vào Supabase → quản lý trên dashboard. Không cần trao đổi email qua lại, không cần nhập tay.
_Novelty_: Form là cổng thu thập dữ liệu trong một quy trình nghiệp vụ lớn hơn — không chỉ là UI.

**[Kỹ thuật #2]**: Export-First Design
_Concept_: Thiết kế ngược — output (nộp evisa.gov.vn) định nghĩa input (fields cần thu thập).
_Novelty_: Form được xây từ ngoài vào trong thay vì developer tự nghĩ ra fields.

**[Kỹ thuật #3]**: The Real Bottleneck
_Concept_: Bottleneck thực sự là bước chuyển dữ liệu từ dashboard sang evisa.gov.vn thủ công.
_Novelty_: Giải quyết bước này = tiết kiệm 80% thời gian xử lý hồ sơ.

**[Giải pháp #1]**: Chrome Extension "One-Click Fill"
_Concept_: Extension nhận dữ liệu từ dashboard và tự điền vào form evisa.gov.vn — ảnh được đính kèm tự động.
_Novelty_: Chạy hoàn toàn trên trình duyệt bằng JavaScript thuần, không cần backend phức tạp.

**[Giải pháp #2]**: Smart Extension Flow
_Concept_: Chọn hồ sơ → click "Send to eVisa" → Extension mở tab mới, điền toàn bộ thông tin, upload ảnh — trong vài giây.
_Novelty_: Extension hoạt động như "robot thư ký" biết đúng hồ sơ đang xử lý.

**[Giải pháp #3]**: Case-by-Case Workflow với Status Tracking
_Concept_: Mỗi hồ sơ có trạng thái rõ ràng: Pending → Submitted → Done.
_Novelty_: Không bao giờ nhầm hoặc bỏ sót hồ sơ.
