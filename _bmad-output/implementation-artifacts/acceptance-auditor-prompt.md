You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

### Specification File
# Story 4.5: Manual Export Fallback

Status: review

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


### Diff
```diff
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index dbd0321..3b0321e 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -35,7 +35,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 
 generated: 2026-05-31
-last_updated: 2026-06-06 (story-4.4-reviewed)
+last_updated: 2026-06-06 (story-4.5-reviewed)
 project: VisaAgency
 project_key: NOKEY
 tracking_system: file-system
@@ -82,7 +82,7 @@ development_status:
   4-2-pre-push-confirmation-modal: review
   4-3-chrome-extension-setup-and-dashboard-message-protocol: review
   4-4-chrome-extension-auto-fill-evisa-gov-vn-and-status-update: done
-  4-5-manual-export-fallback: backlog
+  4-5-manual-export-fallback: review
   epic-4-retrospective: optional
 
   # ─────────────────────────────────────────────
diff --git a/apps/web/src/components/dashboard/ApplicationDetail.tsx b/apps/web/src/components/dashboard/ApplicationDetail.tsx
index ced7a27..4336103 100644
--- a/apps/web/src/components/dashboard/ApplicationDetail.tsx
+++ b/apps/web/src/components/dashboard/ApplicationDetail.tsx
@@ -1,7 +1,7 @@
 'use client'
 
 import { useState } from 'react'
-import { Pencil, ChevronRight } from 'lucide-react'
+import { Pencil, ChevronRight, Download } from 'lucide-react'
 import { useQueryClient } from '@tanstack/react-query'
 import { toast } from 'sonner'
 import { StatusBadge } from './StatusBadge'
@@ -154,6 +154,35 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
     }
   }
 
+  const handleExport = () => {
+    const dataToExport = {
+      appId: application.appId,
+      lastName: application.lastName,
+      firstName: application.firstName,
+      email: application.email,
+      arrivalDate: application.arrivalDate,
+      status: application.status,
+    }
+
+    try {
+      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
+        type: 'application/json',
+      })
+      const url = URL.createObjectURL(blob)
+      const downloadAnchor = document.createElement('a')
+      downloadAnchor.href = url
+      downloadAnchor.download = `${application.appId}-export.json`
+      document.body.appendChild(downloadAnchor)
+      downloadAnchor.click()
+      document.body.removeChild(downloadAnchor)
+      URL.revokeObjectURL(url)
+      toast.success('Xuất file dữ liệu thành công!')
+    } catch (err) {
+      console.error('Failed to export application:', err)
+      toast.error('Có lỗi xảy ra khi xuất dữ liệu.')
+    }
+  }
+
   return (
     <div className="space-y-8">
       {/* Header — Full Name + App ID + Status + action buttons */}
@@ -169,6 +198,18 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
         <div className="flex items-center gap-3 shrink-0 pt-1">
           <StatusBadge status={application.status} />
 
+          {/* Export Button (Ghost variant, always visible) */}
+          <Button
+            id="export-application-btn"
+            variant="ghost"
+            size="sm"
+            onClick={handleExport}
+            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
+          >
+            <Download className="h-3.5 w-3.5" />
+            Export
+          </Button>
+
           {/* AC-1 (story 3.5): Edit button visible only when status is 'raw'; hidden for ready/submitted/done */}
           {canEdit && (
             <Button
diff --git a/apps/web/src/lib/heic-convert.ts b/apps/web/src/lib/heic-convert.ts
index 90838df..98452a4 100644
--- a/apps/web/src/lib/heic-convert.ts
+++ b/apps/web/src/lib/heic-convert.ts
@@ -1,5 +1,3 @@
-import heic2any from 'heic2any';
-
 export async function convertHeicToJpg(file: File): Promise<File> {
   const isHeic = ['image/heic', 'image/heif'].includes(file.type) || /\.(heic|heif)$/i.test(file.name);
   if (!isHeic) {
@@ -7,6 +5,7 @@ export async function convertHeicToJpg(file: File): Promise<File> {
   }
 
   try {
+    const heic2any = (await import('heic2any')).default;
     const convertedBlob = await heic2any({
       blob: file,
       toType: 'image/jpeg',
```
