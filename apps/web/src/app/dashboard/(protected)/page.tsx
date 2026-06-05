'use client'

import { useState, useMemo } from 'react'
import { ApplicationFilters, type TabType } from '@/components/dashboard/ApplicationFilters'
import { ApplicationTable } from '@/components/dashboard/ApplicationTable'
import { useApplications } from '@/hooks/use-applications'
import type { ApplicationData } from '@david-agency/shared'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('raw')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: applications = [], isLoading, error, isError, refetch } = useApplications()

  const counts = useMemo(() => {
    const defaultCounts: Record<TabType, number> = {
      all: 0,
      raw: 0,
      ready: 0,
      submitted: 0,
      done: 0,
    }
    
    applications.forEach((app: ApplicationData) => {
      defaultCounts.all++
      if (app.status in defaultCounts) {
        defaultCounts[app.status as TabType]++
      }
    })
    
    return defaultCounts
  }, [applications])

  const filteredApplications = useMemo(() => {
    return applications.filter((app: ApplicationData) => {
      // Tab filter
      if (activeTab !== 'all' && app.status !== activeTab) {
        return false
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const firstName = app.firstName || ''
        const lastName = app.lastName || ''
        const appId = app.appId || ''
        const fullName = `${firstName} ${lastName}`.toLowerCase()
        const idMatch = appId.toLowerCase().includes(query)
        const nameMatch = fullName.includes(query)
        
        if (!idMatch && !nameMatch) {
          return false
        }
      }
      
      return true
    })
  }, [applications, activeTab, searchQuery])

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Applications</h1>
          <p className="text-sm text-muted-foreground">Manage and track visa applications.</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load applications: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Applications</h1>
        <p className="text-sm text-muted-foreground">Manage and track visa applications.</p>
      </div>
      
      <ApplicationFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        counts={counts}
      />
      
      <ApplicationTable
        applications={filteredApplications}
        isLoading={isLoading}
        activeTab={activeTab}
      />
    </div>
  )
}
