import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "./StatusBadge"
import type { ApplicationData } from "@david-agency/shared"

interface ApplicationTableProps {
  applications: ApplicationData[];
  isLoading: boolean;
  activeTab: string;
}

const statusLabels: Record<string, string> = {
  raw: 'Raw',
  ready: 'Ready',
  submitted: 'Submitted',
  done: 'Done',
}

function formatArrivalDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function formatCreatedAt(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

export function ApplicationTable({
  applications,
  isLoading,
  activeTab,
}: ApplicationTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Applicant Name</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (applications.length === 0) {
    const statusText = activeTab === 'all' ? '' : (statusLabels[activeTab] || activeTab)
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-border border-dashed py-16 text-center">
        <h3 className="text-lg font-medium text-foreground">
          {activeTab === 'all' ? "No applications yet." : `No ${statusText} applications.`}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Applications will appear here once they reach {activeTab === 'all' ? 'the system' : `${statusText} status`}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application ID</TableHead>
            <TableHead>Applicant Name</TableHead>
            <TableHead>Arrival Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow
              key={app.id}
              className="cursor-pointer hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              tabIndex={0}
              role="link"
              onClick={() => router.push(`/dashboard/applications/${app.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/dashboard/applications/${app.id}`)
                }
              }}
            >
              <TableCell className="font-mono text-xs text-muted-foreground">{app.appId || '-'}</TableCell>
              <TableCell className="font-medium">
                {app.lastName || ''} {app.firstName || ''}
              </TableCell>
              <TableCell>
                {formatArrivalDate(app.arrivalDate)}
              </TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatCreatedAt(app.createdAt)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {app.status === 'ready' && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex items-center gap-1 h-7 text-xs px-2"
                    onClick={() => router.push(`/dashboard/applications/${app.id}?action=push`)}
                  >
                    Push to Visa
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
