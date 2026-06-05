import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session — CRITICAL: must be called before any auth check
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Protect all /dashboard/* routes except /dashboard/login
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    if (!session) {
      const loginUrl = new URL('/dashboard/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If already authenticated and trying to access /dashboard/login → redirect to /dashboard
  if (pathname === '/dashboard/login' && session) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
