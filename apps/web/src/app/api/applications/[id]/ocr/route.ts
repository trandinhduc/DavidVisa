import { createServiceClient } from '@/lib/supabase-server'
import { createServerComponentClient } from '@/lib/supabase-server-component'
import { NextResponse } from 'next/server'
import { extractMrzFromPassport } from '@/lib/ocr-passport'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth guard: chỉ staff đã đăng nhập mới được gọi
    const authClient = await createServerComponentClient()
    const { data: { session } } = await authClient.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()

    // Lấy passport_path của application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('passport_path')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (appError || !application?.passport_path) {
      return NextResponse.json(
        { data: null, error: { message: 'Application or passport not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Tạo signed URL ngắn hạn (2 phút) để OCR.space fetch ảnh
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('applications')
      .createSignedUrl(application.passport_path, 120)

    if (urlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to generate image URL', code: 'STORAGE_ERROR' } },
        { status: 500 }
      )
    }

    const mrz = await extractMrzFromPassport(signedUrlData.signedUrl)

    if (!mrz) {
      return NextResponse.json(
        { data: null, error: { message: 'MRZ not found in passport image — check image includes the 2 bottom lines', code: 'MRZ_NOT_FOUND' } },
        { status: 422 }
      )
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        last_name: mrz.lastName,
        first_name: mrz.firstName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to update application', code: 'UPDATE_FAILED' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { lastName: mrz.lastName, firstName: mrz.firstName },
      error: null,
    })
  } catch (err) {
    console.error('[OCR route]', err)
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
