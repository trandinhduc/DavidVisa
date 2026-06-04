# Acceptance Auditor Code Review Prompt

You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. 

**Output Format:** Output findings as a Markdown list. Each finding must contain:
1. One-line title
2. Which Acceptance Criteria (AC) or constraint in the spec it violates
3. Evidence from the diff

No preamble, no intro, no conclusion. Just the list of findings.

---

## CONTENT TO REVIEW (DIFF):

```diff
diff --git a/apps/web/src/app/api/applications/route.ts b/apps/web/src/app/api/applications/route.ts
new file mode 100644
index 0000000..9976525
--- /dev/null
+++ b/apps/web/src/app/api/applications/route.ts
@@ -0,0 +1,114 @@
+import { NextRequest, NextResponse } from 'next/server'
+import { applicationFormSchema } from '@/lib/form-schemas'
+import { createServiceClient } from '@/lib/supabase-server'
+
+export async function POST(req: NextRequest) {
+  try {
+    const formData = await req.formData()
+    
+    const rawData = {
+      lastName: formData.get('lastName'),
+      firstName: formData.get('firstName'),
+      email: formData.get('email'),
+      arrivalDate: formData.get('arrivalDate'),
+      portraitPhoto: formData.get('portraitPhoto'),
+      passportPhoto: formData.get('passportPhoto'),
+    }
+
+    const parseResult = applicationFormSchema.safeParse(rawData)
+    
+    if (!parseResult.success) {
+      return NextResponse.json(
+        { data: null, error: { message: parseResult.error.issues[0].message, code: "VALIDATION_ERROR" } },
+        { status: 400 }
+      )
+    }
+
+    const data = parseResult.data
+
+    // Parse date from DD/MM/YYYY to YYYY-MM-DD for Supabase
+    const match = data.arrivalDate!.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
+    const arrivalDateIso = `${match![3]}-${match![2]}-${match![1]}`
+
+    const supabase = createServiceClient()
+
+    // 1. Insert row to generate app_id
+    // Note: RLS is bypassed because we use the Service Role Key
+    const { data: dbData, error: dbError } = await supabase
+      .from('applications')
+      .insert({
+        last_name: data.lastName,
+        first_name: data.firstName,
+        email: data.email,
+        arrival_date: arrivalDateIso,
+        status: 'raw',
+      })
+      .select('id, app_id')
+      .single()
+
+    if (dbError) {
+      console.error('Database insertion error:', dbError)
+      return NextResponse.json(
+        { data: null, error: { message: 'Failed to create application record', code: 'DB_ERROR' } },
+        { status: 500 }
+      )
+    }
+
+    const { id, app_id } = dbData
+
+    // 2. Upload photos
+    // Extract file extensions to keep them
+    const portraitExt = data.portraitPhoto!.name.split('.').pop()
+    const passportExt = data.passportPhoto!.name.split('.').pop()
+    
+    // AC specifies: paths {app_id}/portrait.jpg and {app_id}/passport.jpg
+    // We'll use the original extension or fallback to jpg
+    const portraitPath = `${app_id}/portrait.${portraitExt || 'jpg'}`
+    const passportPath = `${app_id}/passport.${passportExt || 'jpg'}`
+
+    const [portraitUpload, passportUpload] = await Promise.all([
+      supabase.storage
+        .from('applications')
+        .upload(portraitPath, data.portraitPhoto!, { upsert: true }),
+      supabase.storage
+        .from('applications')
+        .upload(passportPath, data.passportPhoto!, { upsert: true })
+    ])
+
+    if (portraitUpload.error || passportUpload.error) {
+      console.error('Storage upload error:', portraitUpload.error || passportUpload.error)
+      // Even if one succeeds and one fails, we return error. 
+      return NextResponse.json(
+        { data: null, error: { message: 'Failed to upload photos', code: 'STORAGE_ERROR' } },
+        { status: 500 }
+      )
+    }
+
+    // 3. Update application with storage paths
+    const { error: updateError } = await supabase
+      .from('applications')
+      .update({
+        portrait_path: portraitUpload.data.path,
+        passport_path: passportUpload.data.path
+      })
+      .eq('id', id)
+
+    if (updateError) {
+      console.error('Database update error:', updateError)
+      return NextResponse.json(
+        { data: null, error: { message: 'Failed to finalize application record', code: 'DB_ERROR' } },
+        { status: 500 }
+      )
+    }
+
+    // Return success response exactly as specified
+    return NextResponse.json({ data: { appId: app_id }, error: null }, { status: 200 })
+
+  } catch (error) {
+    console.error('API /applications error:', error)
+    return NextResponse.json(
+      { data: null, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
+      { status: 500 }
+    )
+  }
+}
```

---

## SPECIFICATION FILE:

```markdown
# Story 2.4: Application Submission API & Application ID Generation

Status: review

## Story

As the system,
I want a secure API route that stores the application and photos and generates a unique Application ID,
So that every submitted application is persisted to the database with a traceable identifier.

## Acceptance Criteria

1. **Given** the Supabase schema from Story 1.3 exists and the form can send a POST request
2. **When** `POST /api/applications` is called with valid form data (all 6 fields + 2 photo files)
3. **Then** the API route uses Supabase Service Role key server-side only — never exposed to client
4. **And** portrait and passport photos are uploaded to the private `applications` bucket at paths `{app_id}/portrait.jpg` and `{app_id}/passport.jpg`
5. **And** the `app_id` is generated atomically from the DB SEQUENCE in format `DA-YYYY-XXXXXX`
6. **And** a new row is inserted into `applications` with all fields and `status = 'raw'`
7. **And** the response returns `{ data: { appId: "DA-2026-XXXXXX" }, error: null }` with HTTP 200
8. **And** if validation fails: returns `{ data: null, error: { message: string, code: "VALIDATION_ERROR" } }` with HTTP 400
9. **And** raw storage paths are never returned in the response — only `appId`

## Developer Context

This story creates the crucial backend endpoint `POST /api/applications`. It bridges the React Hook Form client submission with Supabase storage and database insertion. Because the client cannot (and should not) bypass RLS directly without anonymous logic gaps, we will use a server-side route with the Service Role Key. 

### Technical Requirements

- **API Route:** Next.js App Router API Route (`app/api/applications/route.ts`).
- **File Upload:** Extract files from `FormData`. Upload the file objects to Supabase Storage (`storage.from('applications').upload(...)`).
- **Database Insertion:** Insert data into the `applications` table. Because `app_id` is generated by a DB trigger upon insertion, you must let the DB generate it.
- **Race Condition Warning:** The file upload path requires `{app_id}`! But we don't know the `{app_id}` until the record is inserted.
  - Solution: Insert the database record *first* with `portrait_path = null` and `passport_path = null`. The INSERT statement will return the generated `app_id` if we append `.select('app_id').single()`. Then, use that `app_id` to upload the images. Finally, update the database record with the final `portrait_path` and `passport_path`.
- **Validation:** Use Zod server-side to validate the incoming `FormData`.

### Architecture Compliance

- **Next.js:** App Router API endpoints use `NextRequest` and `NextResponse`.
- **Supabase:** Must use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS and interact safely from the server. (Use `@supabase/ssr` or `@supabase/supabase-js` `createClient` initialized with service role key).
- **Error Handling:** Return strict `{ data, error }` shaped JSON.

### File Structure Requirements

- **[NEW]** `apps/web/src/app/api/applications/route.ts` - The submission endpoint.
- **[MODIFY]** `apps/web/src/lib/supabase-server.ts` (if needed) - Initialize service role client.

### Previous Story Intelligence

- Form schema is defined in `apps/web/src/lib/form-schemas.ts`. You can reuse `applicationFormSchema` to validate the incoming `FormData`.
```
