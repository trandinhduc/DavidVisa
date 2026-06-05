import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase-server-component'
import { SidebarNav } from '@/components/dashboard/SidebarNav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/dashboard/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
