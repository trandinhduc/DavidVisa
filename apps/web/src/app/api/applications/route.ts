import { NextRequest, NextResponse } from 'next/server'
import { applicationFormSchema } from '@/lib/form-schemas'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // 1. Content-Type check
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { data: null, error: { message: 'Content-Type must be multipart/form-data', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    
    // 2. Safe mapping with defaults to trigger custom Zod validation errors
    const rawData = {
      lastName: formData.get('lastName') || '',
      firstName: formData.get('firstName') || '',
      email: formData.get('email') || '',
      arrivalDate: formData.get('arrivalDate') || '',
      portraitPhoto: formData.get('portraitPhoto'),
      passportPhoto: formData.get('passportPhoto'),
      registrationDuration: formData.get('registrationDuration') || null,
      entryType: formData.get('entryType') || null,
      religion: formData.get('religion') || '',
      placeOfBirth: formData.get('placeOfBirth') || '',
      visaValidFrom: formData.get('visaValidFrom') || '',
      passportType: formData.get('passportType') || '',
      passportExpiryDate: formData.get('passportExpiryDate') || '',
      passportIssueDate: formData.get('passportIssueDate') || '',
      permanentAddress: formData.get('permanentAddress') || '',
      contactAddress: formData.get('contactAddress') || '',
      telephone: formData.get('telephone') || '',
      emergencyName: formData.get('emergencyName') || '',
      emergencyAddress: formData.get('emergencyAddress') || '',
      emergencyTelephone: formData.get('emergencyTelephone') || '',
      emergencyRelationship: formData.get('emergencyRelationship') || '',
      purposeOfEntry: formData.get('purposeOfEntry') || '',
      intendedDateOfEntry: formData.get('intendedDateOfEntry') || '',
      intendedLengthOfStay: formData.get('intendedLengthOfStay') || '',
      residentialAddressInVietnam: formData.get('residentialAddressInVietnam') || '',
      provinceCity: formData.get('provinceCity') || '',
      wardCommune: formData.get('wardCommune') || '',
      entryGate: formData.get('entryGate') || '',
      exitGate: formData.get('exitGate') || '',
    }

    const parseResult = applicationFormSchema.safeParse(rawData)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { data: null, error: { message: parseResult.error.issues[0].message, code: "VALIDATION_ERROR" } },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // 3. Verify reCAPTCHA token
    const recaptchaToken = formData.get('recaptchaToken')?.toString()
    if (!recaptchaToken) {
      return NextResponse.json(
        { data: null, error: { message: 'Missing security token. Please try again.', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
    // Only verify if we have a real secret key, otherwise bypass (useful for dev without real keys)
    if (recaptchaSecret && recaptchaSecret !== 'dummy_key') {
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`
      })
      const verifyData = await verifyRes.json()
      
      if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
        return NextResponse.json(
          { data: null, error: { message: 'Security check failed. Please try again.', code: 'VALIDATION_ERROR' } },
          { status: 400 }
        )
      }
    }

    // 4. Server-side validation of file size (max 6MB) and MIME type
    const MAX_FILE_SIZE = 6 * 1024 * 1024
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']

    if (data.portraitPhoto!.size > MAX_FILE_SIZE || data.passportPhoto!.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { data: null, error: { message: 'Photo size exceeds the 6MB limit', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(data.portraitPhoto!.type) || !ALLOWED_MIME_TYPES.includes(data.passportPhoto!.type)) {
      return NextResponse.json(
        { data: null, error: { message: 'Only JPEG, PNG, or HEIC files are allowed', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }

    // 5. Safe arrivalDate regex parsing
    const match = data.arrivalDate!.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid arrival date format', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      )
    }
    const arrivalDateIso = `${match[3]}-${match[2]}-${match[1]}`

    let finalEmail = data.email
    if (!finalEmail) {
      finalEmail = `${match[1]}${match[2]}${match[3]}@gmail.com`
    }

    let passportIssueDateIso = null
    if (data.passportIssueDate) {
      const matchIssue = data.passportIssueDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (matchIssue) {
        passportIssueDateIso = `${matchIssue[3]}-${matchIssue[2]}-${matchIssue[1]}`
      } else {
        // Fallback in case it's somehow already YYYY-MM-DD
        passportIssueDateIso = data.passportIssueDate
      }
    }

    const supabase = createServiceClient()

    // Compute visa valid-from (= arrival date) and valid-to based on registration duration
    const registrationDays = data.registrationDuration ? parseInt(data.registrationDuration, 10) : 30
    const arrivalDateObj = new Date(
      parseInt(match[3], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[1], 10)
    )
    const validToObj = new Date(arrivalDateObj)
    validToObj.setDate(validToObj.getDate() + registrationDays)
    const validToIso = `${validToObj.getFullYear()}-${String(validToObj.getMonth() + 1).padStart(2, '0')}-${String(validToObj.getDate()).padStart(2, '0')}`

    // 6. Insert row to generate app_id
    // Note: RLS is bypassed because we use the Service Role Key
    // Auto-fill default data and set status to 'ready' directly (no manual "Create Data" step needed)
    const { data: dbData, error: dbError } = await supabase
      .from('applications')
      .insert({
        last_name: data.lastName || '',
        first_name: data.firstName || '',
        email: finalEmail,
        arrival_date: arrivalDateIso,
        registration_duration: registrationDays,
        entry_type: data.entryType || null,
        religion: data.religion || 'No',
        place_of_birth: data.placeOfBirth || 'Same as nationality',
        visa_valid_from: arrivalDateIso,
        passport_type: data.passportType || 'Ordinary passport',
        passport_expiry_date: data.passportExpiryDate || validToIso,
        passport_issue_date: passportIssueDateIso,
        permanent_address: data.permanentAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        contact_address: data.contactAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        telephone: data.telephone || '19295265900',
        emergency_name: data.emergencyName || 'WILLIAM BALACHANDAR',
        emergency_address: data.emergencyAddress || '2568 Park Ave, Bronx, NY 10451, United State',
        emergency_telephone: data.emergencyTelephone || '19295265900',
        emergency_relationship: data.emergencyRelationship || 'Dad',
        purpose_of_entry: data.purposeOfEntry || 'Tourist',
        intended_date_of_entry: data.intendedDateOfEntry || arrivalDateIso,
        intended_length_of_stay: data.intendedLengthOfStay || String(registrationDays),
        residential_address_in_vietnam: data.residentialAddressInVietnam || '39 Hàng Bài, Hoàn Kiếm, Hà Nội',
        province_city: data.provinceCity || 'Ha Noi City',
        ward_commune: data.wardCommune || 'HOAN KIEM WARD',
        entry_gate: data.entryGate || 'Noi Bai Int Airport',
        exit_gate: data.exitGate || 'Noi Bai Int Airport',
        status: 'ready',
      })
      .select('id, app_id')
      .single()

    if (dbError || !dbData) {
      console.error('Database insertion error:', dbError)
      return NextResponse.json(
        { data: null, error: { message: 'Failed to create application record', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    const { id, app_id } = dbData

    // 7. Upload photos with forced .jpg extension and Content-Type (AC 4)
    const portraitPath = `${app_id}/portrait.jpg`
    const passportPath = `${app_id}/passport.jpg`

    const [portraitUpload, passportUpload] = await Promise.all([
      supabase.storage
        .from('applications')
        .upload(portraitPath, data.portraitPhoto!, { contentType: 'image/jpeg', upsert: true }),
      supabase.storage
        .from('applications')
        .upload(passportPath, data.passportPhoto!, { contentType: 'image/jpeg', upsert: true })
    ])

    if (portraitUpload.error || passportUpload.error) {
      console.error('Storage upload error:', portraitUpload.error || passportUpload.error)
      
      // Rollback database insert on upload failure to prevent orphan records
      await supabase.from('applications').delete().eq('id', id)
      
      return NextResponse.json(
        { data: null, error: { message: 'Failed to upload photos', code: 'STORAGE_ERROR' } },
        { status: 500 }
      )
    }

    // 8. Update application with storage paths
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        portrait_path: portraitUpload.data.path,
        passport_path: passportUpload.data.path
      })
      .eq('id', id)

    if (updateError) {
      console.error('Database update error:', updateError)

      // Rollback: delete database record and uploaded storage files to prevent orphans
      await Promise.all([
        supabase.from('applications').delete().eq('id', id),
        supabase.storage.from('applications').remove([portraitPath, passportPath])
      ])

      return NextResponse.json(
        { data: null, error: { message: 'Failed to finalize application record', code: 'DB_ERROR' } },
        { status: 500 }
      )
    }

    // Return success response exactly as specified
    return NextResponse.json({ data: { appId: app_id }, error: null }, { status: 200 })

  } catch (error) {
    console.error('API /applications error:', error)
    return NextResponse.json(
      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}
