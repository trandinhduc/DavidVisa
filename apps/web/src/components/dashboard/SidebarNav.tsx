'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

const navItems = [
  {
    label: 'Applications',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/dashboard/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 bg-primary text-white flex flex-col h-screen">
      {/* Logo area — px-4 py-5 border-b border-white/10 per UX-DR3 */}
      <div className="px-4 py-5 border-b border-white/10">
        <span className="text-sm font-semibold">David Agency</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          // Active when exact match or when on a sub-route (e.g. /dashboard/applications/[id])
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
