'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CreateDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when operator clicks Confirm. Should trigger the status update. */
  onConfirm: () => Promise<void>
}

/**
 * CreateDataModal — prompts the operator to confirm that application data is
 * ready for submission, triggering the Raw → Ready status transition.
 *
 * AC-4: shadcn Dialog with "Confirm application data is ready for submission?"
 *       prompt and a "Confirm" button.
 */
export function CreateDataModal({ open, onOpenChange, onConfirm }: CreateDataModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    // Prevent closing mid-confirmation
    if (isConfirming) return
    onOpenChange(isOpen)
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      // onConfirm is responsible for closing the modal on success
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Data</DialogTitle>
          <DialogDescription>
            Confirm application data is ready for submission?
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This will transition the application status from{' '}
          <span className="font-medium text-foreground">Raw</span> to{' '}
          <span className="font-medium text-foreground">Ready</span>, enabling the Push to eVisa
          workflow.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            id="create-data-cancel-btn"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            id="create-data-confirm-btn"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming…
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
