'use client'

import { useState } from 'react'
import { Pencil, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StatusBadge } from './StatusBadge'
import { ApplicationImages } from './ApplicationImages'
import { EditModal } from './EditModal'
import { CreateDataModal } from './CreateDataModal'
import { Button } from '@/components/ui/button'
import type { ApplicationData } from '@david-agency/shared'

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
  const [editOpen, setEditOpen] = useState(false)
  const [createDataOpen, setCreateDataOpen] = useState(false)

  // Status-based visibility flags
  // AC-3: Edit button only visible when status is 'raw'
  const canEdit = application.status === 'raw'
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
    // Optimistic update: immediately reflect Ready status in the cache
    const previousData = queryClient.getQueryData<ApplicationData>([
      'applications',
      application.id,
    ])

    queryClient.setQueryData<ApplicationData>(['applications', application.id], (old: ApplicationData | undefined) => {
      if (!old) return old
      return { ...old, status: 'ready' }
    })

    // Close modal immediately (optimistic UX)
    setCreateDataOpen(false)

    try {
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? 'Failed to update status')
      }

      // Invalidate to ensure server state is consistent (AC-9: updated_at recorded)
      await queryClient.invalidateQueries({ queryKey: ['applications'] })
    } catch {
      // AC-8: Roll back optimistic update on failure
      queryClient.setQueryData(['applications', application.id], previousData)

      // AC-8: Persistent error toast
      toast.error('Failed to update status — please try again.', {
        duration: Infinity,
      })
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

          {/* AC-1 (story 3.5): Edit button visible only when status is 'raw'; hidden for ready/submitted/done */}
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

          {/* AC-6 (story 4.1): "Push to eVisa" button — shown when status is 'ready' (story 4.2 will wire this up) */}
          {showPushToEvisa && (
            <Button
              id="push-to-evisa-btn"
              variant="default"
              size="sm"
              className="flex items-center gap-1.5"
              disabled
            >
              Push to eVisa
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Field grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 rounded-lg border border-border p-6 bg-white">
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
    </div>
  )
}
