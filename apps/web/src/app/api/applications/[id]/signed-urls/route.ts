import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const EXPIRY = 60 * 60 // 1 hour in seconds

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch app_id and storage paths from database
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('app_id, portrait_path, passport_path')
      .eq('id', id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Build storage paths: {app_id}/portrait.jpg and {app_id}/passport.jpg
    const portraitPath = application.portrait_path ?? `${application.app_id}/portrait.jpg`
    const passportPath = application.passport_path ?? `${application.app_id}/passport.jpg`

    // Generate signed URLs in parallel
    const [portraitResult, passportResult] = await Promise.all([
      supabase.storage.from('applications').createSignedUrl(portraitPath, EXPIRY),
      supabase.storage.from('applications').createSignedUrl(passportPath, EXPIRY),
    ])

    return NextResponse.json({
      data: {
        portraitSignedUrl: portraitResult.data?.signedUrl ?? null,
        passportSignedUrl: passportResult.data?.signedUrl ?? null,
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
