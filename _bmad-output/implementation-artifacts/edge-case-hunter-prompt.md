# Edge Case Hunter Code Review Prompt

You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
Scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.

**Goal:** Walk every branching path and boundary condition within scope — report only unhandled ones.
Walk all branching paths: control flow (conditionals, loops, error handlers, early returns) and domain boundaries (where values, states, or conditions transition). Derive the relevant edge classes from the content itself — don't rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps.
For each path: determine whether the content handles it.
Collect only the unhandled paths as findings — discard handled ones silently.

**Output Format:** Return ONLY a valid JSON array of objects. Each object must contain exactly these four fields and nothing else:

```json
[{
  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```
No extra text, no explanations, no markdown wrapping (i.e. do NOT wrap the JSON in ```json ... ``` blocks). An empty array `[]` is valid when no unhandled paths are found.

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

## RELATED FILES FOR READ CONTEXT:

### `apps/web/src/lib/form-schemas.ts`
```typescript
import { z } from 'zod'

export const applicationFormSchema = z.object({
  lastName: z.string().trim().min(1, 'Last name is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  portraitPhoto: z
    .instanceof(File)
    .nullable()
    .refine((f) => f !== null, { message: 'Portrait photo is required' }),
  passportPhoto: z
    .instanceof(File)
    .nullable()
    .refine((f) => f !== null, { message: 'Passport photo is required' }),
  arrivalDate: z
    .string()
    .nullable()
    .refine((val) => val !== null && val.length > 0, {
      message: 'Date of Arrival is required',
    })
    .refine((val) => {
      if (!val) return false
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return false
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      if (month < 1 || month > 12) return false
      const date = new Date(year, month - 1, day)
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    }, { message: 'Please enter a valid date in DD/MM/YYYY format.' })
    .refine((val) => {
      if (!val) return false
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return false
      const date = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today
    }, { message: 'Arrival date cannot be in the past.' }),
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>
```

### `apps/web/src/lib/supabase-server.ts`
```typescript
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```
