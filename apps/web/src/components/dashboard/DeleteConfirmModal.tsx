'use client'

import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  open: boolean
  applicationName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({
  open,
  applicationName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Xóa hồ sơ</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có chắc muốn xóa hồ sơ{' '}
          <span className="font-medium text-foreground">{applicationName}</span>?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hồ sơ sẽ bị ẩn khỏi dashboard. Bạn có thể khôi phục bằng cách chỉnh sửa trực tiếp trên Supabase.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Hủy
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Xóa
          </Button>
        </div>
      </div>
    </div>
  )
}
