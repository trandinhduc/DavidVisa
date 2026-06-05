'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ApplicationData } from '@david-agency/shared'

interface EditModalProps {
  application: ApplicationData
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EditFormState {
  lastName: string
  firstName: string
  email: string
  arrivalDate: string
  portraitFile: File | null
  passportFile: File | null
}

export function EditModal({ application, open, onOpenChange }: EditModalProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState<EditFormState>({
    lastName: application.lastName,
    firstName: application.firstName,
    email: application.email,
    arrivalDate: application.arrivalDate,
    portraitFile: null,
    passportFile: null,
  })

  // Reset form when modal re-opens with fresh application data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        lastName: application.lastName,
        firstName: application.firstName,
        email: application.email,
        arrivalDate: application.arrivalDate,
        portraitFile: null,
        passportFile: null,
      })
      setSaveError(null)
    }
    onOpenChange(isOpen)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. Upload new photos if selected (via browser Supabase client with upsert)
      if (form.portraitFile || form.passportFile) {
        // Dynamic import to avoid SSR issues
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()

        if (form.portraitFile) {
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(`${application.appId}/portrait.jpg`, form.portraitFile, { upsert: true })
          if (uploadError) throw new Error(`Portrait upload failed: ${uploadError.message}`)
        }

        if (form.passportFile) {
          const { error: uploadError } = await supabase.storage
            .from('applications')
            .upload(`${application.appId}/passport.jpg`, form.passportFile, { upsert: true })
          if (uploadError) throw new Error(`Passport upload failed: ${uploadError.message}`)
        }
      }

      // 2. Update application fields via PUT API (AC-3)
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: form.lastName,
          firstName: form.firstName,
          email: form.email,
          arrivalDate: form.arrivalDate,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to update application')
      }

      // 3. Invalidate TanStack Query cache to refresh detail view (AC-3)
      await queryClient.invalidateQueries({ queryKey: ['applications', application.id] })

      // 4. Also invalidate signed-urls if photos were replaced
      if (form.portraitFile || form.passportFile) {
        await queryClient.invalidateQueries({
          queryKey: ['applications', application.id, 'signed-urls'],
        })
      }

      // 5. Close modal on success
      onOpenChange(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-last-name">Last Name</Label>
              <Input
                id="edit-last-name"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-first-name">First Name</Label>
              <Input
                id="edit-first-name"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-arrival-date">Arrival Date</Label>
            <Input
              id="edit-arrival-date"
              type="date"
              value={form.arrivalDate}
              onChange={(e) => setForm((prev) => ({ ...prev, arrivalDate: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-portrait">
              Replace Portrait Photo{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-portrait"
              type="file"
              accept="image/*,.heic"
              disabled={isSaving}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, portraitFile: e.target.files?.[0] ?? null }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-passport">
              Replace Passport Photo{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-passport"
              type="file"
              accept="image/*,.heic"
              disabled={isSaving}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, passportFile: e.target.files?.[0] ?? null }))
              }
            />
          </div>

          {saveError && (
            <p className="text-sm text-destructive" role="alert">
              {saveError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
