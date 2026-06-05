import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase-server-component'

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
      {/* Sidebar placeholder — will be replaced in Story 3.2 */}
      <aside className="w-60 shrink-0 bg-primary text-white flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <span className="text-sm font-semibold">David Agency</span>
        </div>
        <nav className="flex-1 px-2 py-3">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium rounded text-white bg-white/15"
          >
            Applications
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
