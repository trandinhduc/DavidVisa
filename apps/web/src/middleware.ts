import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  try {
    // Check if env variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('MIDDLEWARE ERROR: Missing Supabase environment variables');
      // Let the request pass through, but auth won't work.
      // Alternatively, we could redirect to an error page.
    }

    const response = NextResponse.next({ request })
    const supabase = createMiddlewareClient(request, response)

    // Refresh session — CRITICAL: must be called before any auth check
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('MIDDLEWARE ERROR: getSession failed', error);
    }

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
  } catch (error) {
    console.error('MIDDLEWARE UNHANDLED ERROR:', error)
    // In case of unhandled error, we still want to return a NextResponse
    // to avoid the 500 MIDDLEWARE_INVOCATION_FAILED hard crash
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
