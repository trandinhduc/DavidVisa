'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useApplication } from '@/hooks/use-application'
import { ApplicationDetail } from '@/components/dashboard/ApplicationDetail'
import { Skeleton } from '@/components/ui/skeleton'

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: application, isLoading, isError, error } = useApplication(id)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back navigation — uses router.back() to preserve previous filter state (AC-7) */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back to Applications"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </button>

      {isLoading && (
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-44 w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-[3/4] rounded-md" />
            <Skeleton className="aspect-[3/4] rounded-md" />
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load application:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go back
          </button>
        </div>
      )}

      {!isLoading && !isError && application && (
        <ApplicationDetail application={application} />
      )}
    </div>
  )
}
