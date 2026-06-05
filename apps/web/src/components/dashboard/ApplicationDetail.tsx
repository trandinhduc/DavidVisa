'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { ApplicationImages } from './ApplicationImages'
import { EditModal } from './EditModal'
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
  const [editOpen, setEditOpen] = useState(false)

  // AC-1, AC-4: Edit button only visible when status is 'raw'
  const canEdit = application.status === 'raw'

  return (
    <div className="space-y-8">
      {/* Header — Full Name + App ID + Status + Edit button */}
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
          {/* AC-1: Edit button visible only when status is 'raw'; hidden for ready/submitted/done (AC-4) */}
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

      {/* Edit Modal — AC-2: pre-filled with current application data; only mounted when status is 'raw' */}
      {canEdit && (
        <EditModal
          application={application}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  )
}
