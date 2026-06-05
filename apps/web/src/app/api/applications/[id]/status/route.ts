import { createServiceClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { STATUS_FLOW } from '@david-agency/shared'
import type { ApplicationStatus } from '@david-agency/shared'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const newStatus = body?.status as ApplicationStatus

    // Validate newStatus is a known status value
    if (!STATUS_FLOW.includes(newStatus)) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid status value', code: 'INVALID_STATUS' } },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get current status to validate transition direction
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json(
        { data: null, error: { message: 'Application not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const currentIndex = STATUS_FLOW.indexOf(current.status as ApplicationStatus)
    const newIndex = STATUS_FLOW.indexOf(newStatus)

    // Enforce one-way status transitions — no backward transitions allowed (AC-5)
    if (newIndex <= currentIndex) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid status transition', code: 'INVALID_TRANSITION' } },
        { status: 400 }
      )
    }

    // Update status — updated_at records transition timestamp (AC-6)
    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status, updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null, error: { message: 'Failed to update status', code: 'UPDATE_FAILED' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { id: data.id, status: data.status, updatedAt: data.updated_at },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
