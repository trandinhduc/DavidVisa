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
  registrationDuration: number | null
  entryType: 'single' | 'multiple' | null
  religion: string
  placeOfBirth: string
  visaValidFrom: string
  passportType: string
  passportExpiryDate: string
  passportIssueDate: string
  permanentAddress: string
  contactAddress: string
  telephone: string
  emergencyName: string
  emergencyAddress: string
  emergencyTelephone: string
  emergencyRelationship: string
  purposeOfEntry: string
  intendedDateOfEntry: string
  intendedLengthOfStay: string
  residentialAddressInVietnam: string
  provinceCity: string
  wardCommune: string
  entryGate: string
  exitGate: string
  portraitFile: File | null
  passportFile: File | null
}

export function EditModal({ application, open, onOpenChange }: EditModalProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState<EditFormState>({
    lastName: application.lastName || '',
    firstName: application.firstName || '',
    email: application.email || '',
    arrivalDate: application.arrivalDate,
    registrationDuration: application.registrationDuration ?? null,
    entryType: application.entryType ?? null,
    religion: application.religion || 'No',
    placeOfBirth: application.placeOfBirth || 'Same as nationality',
    visaValidFrom: application.visaValidFrom || application.arrivalDate || '',
    passportType: application.passportType || 'Ordinary passport',
    passportExpiryDate: application.passportExpiryDate || '',
    passportIssueDate: application.passportIssueDate || '',
    permanentAddress: application.permanentAddress || '2568 Park Ave, Bronx, NY 10451, United State',
    contactAddress: application.contactAddress || '2568 Park Ave, Bronx, NY 10451, United State',
    telephone: application.telephone || '19295265900',
    emergencyName: application.emergencyName || 'WILLIAM BALACHANDAR',
    emergencyAddress: application.emergencyAddress || '2568 Park Ave, Bronx, NY 10451, United State',
    emergencyTelephone: application.emergencyTelephone || '19295265900',
    emergencyRelationship: application.emergencyRelationship || 'Dad',
    purposeOfEntry: application.purposeOfEntry || 'Tourist',
    intendedDateOfEntry: application.intendedDateOfEntry || application.visaValidFrom || application.arrivalDate || '',
    intendedLengthOfStay: application.intendedLengthOfStay || '30',
    residentialAddressInVietnam: application.residentialAddressInVietnam || '39 Hàng Bài, Hoàn Kiếm, Hà Nội',
    provinceCity: application.provinceCity || 'Ha Noi City',
    wardCommune: application.wardCommune || 'HOAN KIEM WARD',
    entryGate: application.entryGate || 'Noi Bai Int Airport',
    exitGate: application.exitGate || 'Noi Bai Int Airport',
    portraitFile: null,
    passportFile: null,
  })

  // Reset form when modal re-opens with fresh application data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        lastName: application.lastName || '',
        firstName: application.firstName || '',
        email: application.email || '',
        arrivalDate: application.arrivalDate,
        registrationDuration: application.registrationDuration ?? null,
        entryType: application.entryType ?? null,
        religion: application.religion || 'No',
        placeOfBirth: application.placeOfBirth || 'Same as nationality',
        visaValidFrom: application.visaValidFrom || application.arrivalDate || '',
        passportType: application.passportType || 'Ordinary passport',
        passportExpiryDate: application.passportExpiryDate || '',
        passportIssueDate: application.passportIssueDate || '',
        permanentAddress: application.permanentAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        contactAddress: application.contactAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        telephone: application.telephone || '19295265900',
        emergencyName: application.emergencyName || 'WILLIAM BALACHANDAR',
        emergencyAddress: application.emergencyAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        emergencyTelephone: application.emergencyTelephone || '19295265900',
        emergencyRelationship: application.emergencyRelationship || 'Dad',
        purposeOfEntry: application.purposeOfEntry || 'Tourist',
        intendedDateOfEntry: application.intendedDateOfEntry || application.visaValidFrom || application.arrivalDate || '',
        intendedLengthOfStay: application.intendedLengthOfStay || '30',
        residentialAddressInVietnam: application.residentialAddressInVietnam || '39 Hàng Bài, Hoàn Kiếm, Hà Nội',
        provinceCity: application.provinceCity || 'Ha Noi City',
        wardCommune: application.wardCommune || 'HOAN KIEM WARD',
        entryGate: application.entryGate || 'Noi Bai Int Airport',
        exitGate: application.exitGate || 'Noi Bai Int Airport',
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
          registrationDuration: form.registrationDuration,
          entryType: form.entryType,
          religion: form.religion,
          placeOfBirth: form.placeOfBirth,
          visaValidFrom: form.visaValidFrom,
          passportType: form.passportType,
          passportExpiryDate: form.passportExpiryDate,
          passportIssueDate: form.passportIssueDate,
          permanentAddress: form.permanentAddress,
          contactAddress: form.contactAddress,
          telephone: form.telephone,
          emergencyName: form.emergencyName,
          emergencyAddress: form.emergencyAddress,
          emergencyTelephone: form.emergencyTelephone,
          emergencyRelationship: form.emergencyRelationship,
          purposeOfEntry: form.purposeOfEntry,
          intendedDateOfEntry: form.intendedDateOfEntry,
          intendedLengthOfStay: form.intendedLengthOfStay,
          residentialAddressInVietnam: form.residentialAddressInVietnam,
          provinceCity: form.provinceCity,
          wardCommune: form.wardCommune,
          entryGate: form.entryGate,
          exitGate: form.exitGate,
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
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-registration-duration">Registration Duration</Label>
              <select
                id="edit-registration-duration"
                value={form.registrationDuration ?? ''}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  registrationDuration: e.target.value ? parseInt(e.target.value, 10) : null,
                  intendedLengthOfStay: e.target.value || prev.intendedLengthOfStay,
                }))}
                disabled={isSaving}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select…</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Entry Type</Label>
              <div className="flex gap-2 pt-1">
                {(['single', 'multiple'] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-1.5 cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                      form.entryType === type
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-input hover:border-primary/50'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      value={type}
                      checked={form.entryType === type}
                      onChange={() => setForm((prev) => ({ ...prev, entryType: type }))}
                      disabled={isSaving}
                      className="sr-only"
                    />
                    {type === 'single' ? 'Single' : 'Multiple'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-religion">Religion</Label>
              <Input
                id="edit-religion"
                value={form.religion}
                onChange={(e) => setForm((prev) => ({ ...prev, religion: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-place-of-birth">Place of Birth</Label>
              <Input
                id="edit-place-of-birth"
                value={form.placeOfBirth}
                onChange={(e) => setForm((prev) => ({ ...prev, placeOfBirth: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-visa-valid-from">Grant e-Visa valid from</Label>
            <Input
              id="edit-visa-valid-from"
              type="date"
              value={form.visaValidFrom}
              onChange={(e) => setForm((prev) => ({ 
                ...prev, 
                visaValidFrom: e.target.value,
                intendedDateOfEntry: e.target.value
              }))}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-passport-type">Passport Type</Label>
              <Input
                id="edit-passport-type"
                value={form.passportType}
                onChange={(e) => setForm((prev) => ({ ...prev, passportType: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-passport-expiry-date">Passport Expiry Date</Label>
              <Input
                id="edit-passport-expiry-date"
                type="date"
                value={form.passportExpiryDate}
                onChange={(e) => setForm((prev) => {
                  const val = e.target.value;
                  const parts = val.split('-');
                  const issue = parts.length === 3 && val ? `${parseInt(parts[0], 10) - 10}-${parts[1]}-${parts[2]}` : prev.passportIssueDate;
                  return { ...prev, passportExpiryDate: val, passportIssueDate: issue };
                })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-passport-issue-date">Passport Issue Date</Label>
              <Input
                id="edit-passport-issue-date"
                type="date"
                value={form.passportIssueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, passportIssueDate: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-permanent-address">Permanent residential address</Label>
            <Input
              id="edit-permanent-address"
              value={form.permanentAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, permanentAddress: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-contact-address">Contact address</Label>
              <Input
                id="edit-contact-address"
                value={form.contactAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, contactAddress: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-telephone">Telephone number</Label>
              <Input
                id="edit-telephone"
                value={form.telephone}
                onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t">
            <h4 className="text-sm font-medium">Emergency Contact</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-emergency-name">Full name</Label>
              <Input
                id="edit-emergency-name"
                value={form.emergencyName}
                onChange={(e) => setForm((prev) => ({ ...prev, emergencyName: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emergency-relationship">Relationship</Label>
              <Input
                id="edit-emergency-relationship"
                value={form.emergencyRelationship}
                onChange={(e) => setForm((prev) => ({ ...prev, emergencyRelationship: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-emergency-address">Current residential address</Label>
              <Input
                id="edit-emergency-address"
                value={form.emergencyAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, emergencyAddress: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-emergency-telephone">Telephone number</Label>
              <Input
                id="edit-emergency-telephone"
                value={form.emergencyTelephone}
                onChange={(e) => setForm((prev) => ({ ...prev, emergencyTelephone: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t">
            <h4 className="text-sm font-medium">Information About The Trip</h4>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-purpose-of-entry">Purpose of entry</Label>
            <Input
              id="edit-purpose-of-entry"
              placeholder="Tourist, Business, etc."
              value={form.purposeOfEntry}
              onChange={(e) => setForm((prev) => ({ ...prev, purposeOfEntry: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-intended-date">Intended date of entry</Label>
              <Input
                id="edit-intended-date"
                type="date"
                value={form.intendedDateOfEntry}
                onChange={(e) => setForm((prev) => ({ ...prev, intendedDateOfEntry: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-intended-length">Intended length of stay</Label>
              <Input
                id="edit-intended-length"
                value={form.intendedLengthOfStay}
                onChange={(e) => setForm((prev) => ({ ...prev, intendedLengthOfStay: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-residential-address-vn">Residential address in VietNam</Label>
            <Input
              id="edit-residential-address-vn"
              value={form.residentialAddressInVietnam}
              onChange={(e) => setForm((prev) => ({ ...prev, residentialAddressInVietnam: e.target.value }))}
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-province">Province/city</Label>
              <Input
                id="edit-province"
                value={form.provinceCity}
                onChange={(e) => setForm((prev) => ({ ...prev, provinceCity: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-ward">Ward / commune</Label>
              <Input
                id="edit-ward"
                value={form.wardCommune}
                onChange={(e) => setForm((prev) => ({ ...prev, wardCommune: e.target.value }))}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-entry-gate">Intended border gate of entry</Label>
              <Input
                id="edit-entry-gate"
                value={form.entryGate}
                onChange={(e) => setForm((prev) => ({ ...prev, entryGate: e.target.value }))}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-exit-gate">Intended border gate of exit</Label>
              <Input
                id="edit-exit-gate"
                value={form.exitGate}
                onChange={(e) => setForm((prev) => ({ ...prev, exitGate: e.target.value }))}
                disabled={isSaving}
              />
            </div>
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
