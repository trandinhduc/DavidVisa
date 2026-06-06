'use client'

import { ImageOff, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ApplicationData } from '@david-agency/shared'

interface PushConfirmModalProps {
  application: ApplicationData
  portraitSignedUrl: string | null
  isLoadingImage?: boolean
  isConfirming?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Safely parse a date-only ISO string (e.g., "2026-07-06") using local date constructor
 * to avoid UTC timezone shift bug (using new Date("2026-07-06") parses as UTC midnight
 * which can display as the previous day in local timezone).
 */
function formatArrivalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return dateStr
  const date = new Date(yearNum, monthNum - 1, dayNum)
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function PushConfirmModal({
  application,
  portraitSignedUrl,
  isLoadingImage,
  isConfirming,
  open,
  onOpenChange,
  onConfirm,
}: PushConfirmModalProps) {
  const fullName = `${application.firstName} ${application.lastName}`
  const displayFullName = `${application.lastName} ${application.firstName}`

  const handleOpenChange = (isOpen: boolean) => {
    if (isConfirming) return
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Push to eVisa</DialogTitle>
          <DialogDescription className="sr-only">
            Confirm pushing application data to evisa.gov.vn
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-4 mb-4">
            {isLoadingImage ? (
              <div className="w-20 h-28 rounded-md border border-border bg-muted animate-pulse shrink-0" />
            ) : portraitSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portraitSignedUrl}
                alt={`${fullName} portrait`}
                className="w-20 h-28 object-cover rounded-md border border-border shrink-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-20 h-28 rounded-md border border-border bg-muted text-muted-foreground shrink-0">
                <ImageOff className="h-6 w-6 opacity-40" />
              </div>
            )}
            
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-lg">{displayFullName}</span>
              <span className="text-sm text-foreground">
                Arriving: {formatArrivalDate(application.arrivalDate)}
              </span>
              <span className="text-sm font-mono text-muted-foreground mt-1">
                {application.appId}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-foreground">
            This will submit {fullName}&apos;s application to evisa.gov.vn.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pushing...
              </>
            ) : (
              'Push to eVisa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
