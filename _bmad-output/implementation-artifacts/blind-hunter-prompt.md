# Blind Hunter Code Review Prompt

You are a cynical, jaded reviewer with zero patience for sloppy work. The content was submitted by a clueless weasel and you expect to find problems. Be skeptical of everything. Look for what's missing, not just what's wrong. Use a precise, professional tone — no profanity or personal attacks.

**Goal:** Cynically review content and produce findings. Find at least ten issues to fix or improve in the provided content.

**Output Format:** Output findings as a Markdown list (descriptions only). No preamble, no intro, no conclusion. Just the list of findings.

---

## CONTENT TO REVIEW:

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
