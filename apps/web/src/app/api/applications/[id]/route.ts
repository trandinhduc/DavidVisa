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
      religion: data.religion,
      placeOfBirth: data.place_of_birth,
      visaValidFrom: data.visa_valid_from,
      passportType: data.passport_type,
      passportExpiryDate: data.passport_expiry_date,
      passportIssueDate: data.passport_issue_date,
      permanentAddress: data.permanent_address,
      contactAddress: data.contact_address,
      telephone: data.telephone,
      emergencyName: data.emergency_name,
      emergencyAddress: data.emergency_address,
      emergencyTelephone: data.emergency_telephone,
      emergencyRelationship: data.emergency_relationship,
      purposeOfEntry: data.purpose_of_entry,
      intendedDateOfEntry: data.intended_date_of_entry,
      intendedLengthOfStay: data.intended_length_of_stay,
      residentialAddressInVietnam: data.residential_address_in_vietnam,
      provinceCity: data.province_city,
      wardCommune: data.ward_commune,
      entryGate: data.entry_gate,
      exitGate: data.exit_gate,
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
  religion: z.string().optional(),
  placeOfBirth: z.string().optional(),
  visaValidFrom: z.string().optional(),
  passportType: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  passportIssueDate: z.string().optional(),
  permanentAddress: z.string().optional(),
  contactAddress: z.string().optional(),
  telephone: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyAddress: z.string().optional(),
  emergencyTelephone: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  purposeOfEntry: z.string().optional(),
  intendedDateOfEntry: z.string().optional(),
  intendedLengthOfStay: z.string().optional(),
  residentialAddressInVietnam: z.string().optional(),
  provinceCity: z.string().optional(),
  wardCommune: z.string().optional(),
  entryGate: z.string().optional(),
  exitGate: z.string().optional(),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: any = { updated_at: new Date().toISOString() }

    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate === "" ? null : updates.arrivalDate
    if (updates.religion !== undefined) dbUpdates.religion = updates.religion
    if (updates.placeOfBirth !== undefined) dbUpdates.place_of_birth = updates.placeOfBirth
    if (updates.visaValidFrom !== undefined) dbUpdates.visa_valid_from = updates.visaValidFrom === "" ? null : updates.visaValidFrom
    if (updates.passportType !== undefined) dbUpdates.passport_type = updates.passportType
    if (updates.passportExpiryDate !== undefined) dbUpdates.passport_expiry_date = updates.passportExpiryDate === "" ? null : updates.passportExpiryDate
    if (updates.passportIssueDate !== undefined) dbUpdates.passport_issue_date = updates.passportIssueDate === "" ? null : updates.passportIssueDate
    if (updates.permanentAddress !== undefined) dbUpdates.permanent_address = updates.permanentAddress
    if (updates.contactAddress !== undefined) dbUpdates.contact_address = updates.contactAddress
    if (updates.telephone !== undefined) dbUpdates.telephone = updates.telephone
    if (updates.emergencyName !== undefined) dbUpdates.emergency_name = updates.emergencyName
    if (updates.emergencyAddress !== undefined) dbUpdates.emergency_address = updates.emergencyAddress
    if (updates.emergencyTelephone !== undefined) dbUpdates.emergency_telephone = updates.emergencyTelephone
    if (updates.emergencyRelationship !== undefined) dbUpdates.emergency_relationship = updates.emergencyRelationship
    if (updates.purposeOfEntry !== undefined) dbUpdates.purpose_of_entry = updates.purposeOfEntry
    if (updates.intendedDateOfEntry !== undefined) dbUpdates.intended_date_of_entry = updates.intendedDateOfEntry === "" ? null : updates.intendedDateOfEntry
    if (updates.intendedLengthOfStay !== undefined) dbUpdates.intended_length_of_stay = updates.intendedLengthOfStay
    if (updates.residentialAddressInVietnam !== undefined) dbUpdates.residential_address_in_vietnam = updates.residentialAddressInVietnam
    if (updates.provinceCity !== undefined) dbUpdates.province_city = updates.provinceCity
    if (updates.wardCommune !== undefined) dbUpdates.ward_commune = updates.wardCommune
    if (updates.entryGate !== undefined) dbUpdates.entry_gate = updates.entryGate
    if (updates.exitGate !== undefined) dbUpdates.exit_gate = updates.exitGate


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
      religion: data.religion,
      placeOfBirth: data.place_of_birth,
      visaValidFrom: data.visa_valid_from,
      passportType: data.passport_type,
      passportExpiryDate: data.passport_expiry_date,
      passportIssueDate: data.passport_issue_date,
      permanentAddress: data.permanent_address,
      contactAddress: data.contact_address,
      telephone: data.telephone,
      emergencyName: data.emergency_name,
      emergencyAddress: data.emergency_address,
      emergencyTelephone: data.emergency_telephone,
      emergencyRelationship: data.emergency_relationship,
      purposeOfEntry: data.purpose_of_entry,
      intendedDateOfEntry: data.intended_date_of_entry,
      intendedLengthOfStay: data.intended_length_of_stay,
      residentialAddressInVietnam: data.residential_address_in_vietnam,
      provinceCity: data.province_city,
      wardCommune: data.ward_commune,
      entryGate: data.entry_gate,
      exitGate: data.exit_gate,
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

