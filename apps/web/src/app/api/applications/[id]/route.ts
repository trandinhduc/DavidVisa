import { createServiceClient } from '@/lib/supabase-server'
import { createServerComponentClient } from '@/lib/supabase-server-component'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Map snake_case → camelCase
    // IMPORTANT: portrait_path and passport_path are NEVER returned — use /signed-urls endpoint
    const application = {
      id: data.id,
      appId: data.app_id,
      lastName: data.last_name,
      firstName: data.first_name,
      email: data.email,
      arrivalDate: data.arrival_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ data: application, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// Schema for updating application fields (status is NOT updated here — use /status route)
const updateApplicationSchema = z.object({
  lastName: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createServerComponentClient()
    const { data: { session } } = await authClient.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const parseResult = updateApplicationSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid request body', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const updates = parseResult.data
    const supabase = createServiceClient()

    // Build update payload — only include fields that are provided
    // Always update updated_at (AC-6: timestamp on every change)
    const dbUpdates: {
      last_name?: string
      first_name?: string
      email?: string
      arrival_date?: string
      updated_at: string
    } = { updated_at: new Date().toISOString() }

    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate


    const { data, error } = await supabase
      .from('applications')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found or update failed', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Map snake_case → camelCase
    // IMPORTANT: portrait_path and passport_path are NEVER returned — use /signed-urls endpoint
    const application = {
      id: data.id,
      appId: data.app_id,
      lastName: data.last_name,
      firstName: data.first_name,
      email: data.email,
      arrivalDate: data.arrival_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ data: application, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

