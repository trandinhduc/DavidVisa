import React from 'react'

export function SiteHeader() {
  return (
    <header className="bg-primary px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-primary-foreground tracking-tight">David Agency</span>
        <span className="text-sm text-slate-300 hidden sm:inline-block">Vietnam E-Visa Application Service</span>
      </div>
    </header>
  )
}
