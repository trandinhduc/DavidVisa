'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Pencil, ChevronRight, Download, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StatusBadge } from './StatusBadge'
import { ApplicationImages } from './ApplicationImages'
import { EditModal } from './EditModal'
import { CreateDataModal } from './CreateDataModal'
import { PushConfirmModal } from './PushConfirmModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSignedUrls } from '@/hooks/use-application'
import { Button } from '@/components/ui/button'
import { EXTENSION_ID } from '@david-agency/shared'
import type { ApplicationData, PushToEvisaMessage } from '@david-agency/shared'

interface ApplicationDetailProps {
  application: ApplicationData
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

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [createDataOpen, setCreateDataOpen] = useState(false)
  const [pushConfirmOpen, setPushConfirmOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const { data: signedUrlsData, isLoading: isLoadingSignedUrls } = useSignedUrls(application.id)

  // Auto-open push modal when navigated with ?action=push from the list quick action
  useEffect(() => {
    if (searchParams.get('action') === 'push' && application.status === 'ready') {
      setPushConfirmOpen(true)
    }
  }, [searchParams, application.status])

  // Status-based visibility flags
  // Edit button visible unless status is 'done'
  const canEdit = application.status !== 'done'
  // AC-3 (story 4.1): "Create Data" button only visible when status is 'raw'
  const showCreateData = application.status === 'raw'
  // AC-6: "Push to eVisa" shown when status is 'ready'
  const showPushToEvisa = application.status === 'ready'

  /**
   * Handles the Raw → Ready status transition.
   * AC-5: calls PUT /api/applications/[id]/status with { status: 'ready' }
   * Uses optimistic update — rolls back on failure (AC-8).
   */
  const handleCreateDataConfirm = async () => {
    const mockData = {
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
    };

    if (mockData.passportExpiryDate && !mockData.passportIssueDate) {
      const parts = mockData.passportExpiryDate.split('-');
      if (parts.length === 3) {
        mockData.passportIssueDate = `${parseInt(parts[0], 10) - 10}-${parts[1]}-${parts[2]}`;
      }
    }

    // Optimistic update: immediately reflect mock data and Ready status in the cache
    const previousData = queryClient.getQueryData<ApplicationData>([
      'applications',
      application.id,
    ])

    queryClient.setQueryData<ApplicationData>(['applications', application.id], (old: ApplicationData | undefined) => {
      if (!old) return old
      return { ...old, ...mockData, status: 'ready' }
    })

    // Close modal immediately (optimistic UX)
    setCreateDataOpen(false)

    try {
      // 1. Update the application data
      const dataRes = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData),
      })
      
      const dataJson = await dataRes.json()
      if (!dataRes.ok || dataJson.error) {
        throw new Error(dataJson.error?.message ?? 'Failed to create data')
      }

      // 2. Update the status
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to update status')
      }

      // Invalidate to ensure server state is consistent
      await queryClient.invalidateQueries({ queryKey: ['applications'] })
    } catch {
      // Roll back optimistic update on failure
      queryClient.setQueryData(['applications', application.id], previousData)

      toast.error('Failed to create data and update status — please try again.', {
        duration: Infinity,
      })
    }
  }

  const handleMarkAsSubmitted = async () => {
    // Optimistic update
    const previousData = queryClient.getQueryData<ApplicationData>([
      'applications',
      application.id,
    ])

    queryClient.setQueryData<ApplicationData>(['applications', application.id], (old: ApplicationData | undefined) => {
      if (!old) return old
      return { ...old, status: 'submitted' }
    })

    try {
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to update status')
      }

      await queryClient.invalidateQueries({ queryKey: ['applications'] })

      // Clear the extension's pending application
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(EXTENSION_ID, { type: 'CLEAR_PENDING_APPLICATION' })
        }
      } catch (err) {
        console.error('Failed to send clear message to extension:', err)
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      queryClient.setQueryData(['applications', application.id], previousData)
      toast.error(error.message || 'Failed to update status — please try again.', {
        duration: Infinity,
      })
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false)
    try {
      const res = await fetch(`/api/applications/${application.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error?.message ?? 'Failed to delete')
      toast.success('Hồ sơ đã được xóa.')
      router.push('/dashboard')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    } catch {
      toast.error('Xóa thất bại — vui lòng thử lại.', { duration: Infinity })
    }
  }

  const handleExport = () => {
    const dataToExport = {
      appId: application.appId,
      lastName: application.lastName,
      firstName: application.firstName,
      email: application.email,
      arrivalDate: application.arrivalDate,
      status: application.status,
    }

    try {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = url
      downloadAnchor.download = `${application.appId}-export.json`
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      document.body.removeChild(downloadAnchor)
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
      toast.success('Xuất file dữ liệu thành công!')
    } catch (err) {
      console.error('Failed to export application:', err)
      toast.error('Có lỗi xảy ra khi xuất dữ liệu.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header — Full Name + App ID + Status + action buttons */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {application.lastName} {application.firstName}
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-0.5">
            {application.appId}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <StatusBadge status={application.status} />

          {/* Export Button (Ghost variant, always visible) */}
          <Button
            id="export-application-btn"
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          {/* Delete Button (always visible) */}
          <Button
            id="delete-application-btn"
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </Button>

          {/* Edit button visible unless status is 'done' */}
          {canEdit && (
            <Button
              id="edit-application-btn"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}

          {/* AC-3 (story 4.1): "Create Data" button — only visible when status is 'raw' */}
          {showCreateData && (
            <Button
              id="create-data-btn"
              variant="default"
              size="sm"
              onClick={() => setCreateDataOpen(true)}
              className="flex items-center gap-1.5"
            >
              Create Data
            </Button>
          )}

          {/* AC-8 (story 4.2): Tooltip for "Push to eVisa" button when not ready */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block" tabIndex={0}>
                  <Button
                    id="push-to-evisa-btn"
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1.5"
                    disabled={!showPushToEvisa}
                    onClick={() => {
                      if (showPushToEvisa) setPushConfirmOpen(true)
                    }}
                  >
                    Push to eVisa
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TooltipTrigger>
              {!showPushToEvisa && (
                <TooltipContent>
                  <p>Application must be Ready before pushing</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* AC-7 (story 4.4): Mark as Submitted button */}
          {showPushToEvisa && (
            <Button
              id="mark-as-submitted-btn"
              variant="outline"
              size="sm"
              onClick={handleMarkAsSubmitted}
              className="flex items-center gap-1.5"
            >
              Mark as Submitted
            </Button>
          )}
        </div>
      </div>

      {/* Field grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-5 rounded-lg border border-border p-6 bg-white">
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Last Name
          </dt>
          <dd className="mt-1 text-sm text-foreground font-medium">
            {application.lastName || '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            First Name
          </dt>
          <dd className="mt-1 text-sm text-foreground font-medium">
            {application.firstName || '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Email
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.email || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Arrival Date
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {formatArrivalDate(application.arrivalDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Registration Duration
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {application.registrationDuration ? `${application.registrationDuration} days` : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Entry Type
          </dt>
          <dd className="mt-1 text-sm text-foreground capitalize">
            {application.entryType ? `${application.entryType}-entry` : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Religion
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.religion || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Place of Birth
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.placeOfBirth || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Visa Valid From
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatArrivalDate(application.visaValidFrom)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Passport Type
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.passportType || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Passport Expiry Date
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatArrivalDate(application.passportExpiryDate)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Passport Issue Date
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatArrivalDate(application.passportIssueDate)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Permanent Address
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.permanentAddress || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Contact Address
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.contactAddress || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Telephone
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.telephone || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Contact Name
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.emergencyName || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Contact Address
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.emergencyAddress || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Telephone
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.emergencyTelephone || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Relationship
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.emergencyRelationship || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Purpose of Entry
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.purposeOfEntry || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Intended Date of Entry
          </dt>
          <dd className="mt-1 text-sm text-foreground">{formatArrivalDate(application.intendedDateOfEntry)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Length of Stay
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.intendedLengthOfStay || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Residential Addr VN
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.residentialAddressInVietnam || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Province/City VN
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.provinceCity || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Ward/Commune VN
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.wardCommune || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Intended Gate of Entry
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.entryGate || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Intended Gate of Exit
          </dt>
          <dd className="mt-1 text-sm text-foreground">{application.exitGate || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </dt>
          <dd className="mt-1">
            <StatusBadge status={application.status} />
          </dd>
        </div>
      </dl>

      {/* Photos section */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Photos</h2>
        <ApplicationImages applicationId={application.id} />
      </div>

      {/* Edit Modal — only mounted when status is 'raw' */}
      {canEdit && (
        <EditModal
          application={application}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {/* Create Data Modal — only mounted when status is 'raw' (AC-7) */}
      {showCreateData && (
        <CreateDataModal
          open={createDataOpen}
          onOpenChange={setCreateDataOpen}
          onConfirm={handleCreateDataConfirm}
        />
      )}

      {/* Push Confirm Modal — mounted when status is 'ready' */}
      <DeleteConfirmModal
        open={deleteOpen}
        applicationName={`${application.lastName || ''} ${application.firstName || ''}`.trim() || application.appId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />

      {showPushToEvisa && (
        <PushConfirmModal
          application={application}
          portraitSignedUrl={signedUrlsData?.portraitSignedUrl ?? null}
          isLoadingImage={isLoadingSignedUrls}
          open={pushConfirmOpen}
          onOpenChange={setPushConfirmOpen}
          isConfirming={isPushing}
          onConfirm={() => {
            setIsPushing(true)
            const message: PushToEvisaMessage = {
              type: 'PUSH_TO_EVISA',
              applicationId: application.id,
              appId: application.appId,
              lastName: application.lastName,
              firstName: application.firstName,
              email: application.email,
              arrivalDate: application.arrivalDate,
              portraitSignedUrl: signedUrlsData?.portraitSignedUrl ?? null,
              passportSignedUrl: signedUrlsData?.passportSignedUrl ?? null,
              registrationDuration: application.registrationDuration,
              entryType: application.entryType,
              religion: application.religion,
              placeOfBirth: application.placeOfBirth,
              visaValidFrom: application.visaValidFrom,
              passportType: application.passportType,
              passportExpiryDate: application.passportExpiryDate,
              passportIssueDate: application.passportIssueDate,
              permanentAddress: application.permanentAddress,
              contactAddress: application.contactAddress,
              telephone: application.telephone,
              emergencyName: application.emergencyName,
              emergencyAddress: application.emergencyAddress,
              emergencyTelephone: application.emergencyTelephone,
              emergencyRelationship: application.emergencyRelationship,
              purposeOfEntry: application.purposeOfEntry,
              intendedDateOfEntry: application.intendedDateOfEntry,
              intendedLengthOfStay: application.intendedLengthOfStay,
              residentialAddressInVietnam: application.residentialAddressInVietnam,
              provinceCity: application.provinceCity,
              wardCommune: application.wardCommune,
              entryGate: application.entryGate,
              exitGate: application.exitGate,
              isCustomAddress: application.isCustomAddress,
            }

            try {
              if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
                throw new Error("Chrome extension API not available")
              }
              
              chrome.runtime.sendMessage(EXTENSION_ID, message, (response: { success?: boolean } | undefined) => {
                setIsPushing(false)
                if (chrome.runtime.lastError || !response?.success) {
                  console.error('Extension message failed:', chrome.runtime.lastError)
                  toast.error('Extension not found — make sure it is installed and enabled.', {
                    duration: Infinity,
                  })
                } else {
                  setPushConfirmOpen(false)
                }
              })
            } catch (err) {
              setIsPushing(false)
              console.error('Extension error:', err)
              toast.error('Extension not found — make sure it is installed and enabled.', {
                duration: Infinity,
              })
            }
          }}
        />
      )}
    </div>
  )
}
