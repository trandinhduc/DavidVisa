Review this diff using the bmad-review-adversarial-general skill.
Focus only on the diff provided below. No project context is provided.

```diff
diff --git a/apps/web/src/components/dashboard/ApplicationDetail.tsx b/apps/web/src/components/dashboard/ApplicationDetail.tsx
index 65d8d9c..9b6f374 100644
--- a/apps/web/src/components/dashboard/ApplicationDetail.tsx
+++ b/apps/web/src/components/dashboard/ApplicationDetail.tsx
@@ -1,10 +1,13 @@
 'use client'
 
 import { useState } from 'react'
-import { Pencil } from 'lucide-react'
+import { Pencil, ChevronRight } from 'lucide-react'
+import { useQueryClient } from '@tanstack/react-query'
+import { toast } from 'sonner'
 import { StatusBadge } from './StatusBadge'
 import { ApplicationImages } from './ApplicationImages'
 import { EditModal } from './EditModal'
+import { CreateDataModal } from './CreateDataModal'
 import { Button } from '@/components/ui/button'
 import type { ApplicationData } from '@david-agency/shared'
 
@@ -36,14 +39,67 @@ function formatArrivalDate(dateStr: string | null | undefined): string {
 }
 
 export function ApplicationDetail({ application }: ApplicationDetailProps) {
+  const queryClient = useQueryClient()
   const [editOpen, setEditOpen] = useState(false)
+  const [createDataOpen, setCreateDataOpen] = useState(false)
 
-  // AC-1, AC-4: Edit button only visible when status is 'raw'
+  // Status-based visibility flags
+  // AC-3: Edit button only visible when status is 'raw'
   const canEdit = application.status === 'raw'
+  // AC-3 (story 4.1): "Create Data" button only visible when status is 'raw'
+  const showCreateData = application.status === 'raw'
+  // AC-6: "Push to eVisa" shown when status is 'ready'
+  const showPushToEvisa = application.status === 'ready'
+
+  /**
+   * Handles the Raw → Ready status transition.
+   * AC-5: calls PUT /api/applications/[id]/status with { status: 'ready' }
+   * Uses optimistic update — rolls back on failure (AC-8).
+   */
+  const handleCreateDataConfirm = async () => {
+    // Optimistic update: immediately reflect Ready status in the cache
+    const previousData = queryClient.getQueryData<ApplicationData>([
+      'applications',
+      application.id,
+    ])
+
+    queryClient.setQueryData<ApplicationData>(['applications', application.id], (old: ApplicationData | undefined) => {
+      if (!old) return old
+      return { ...old, status: 'ready' }
+    })
+
+    // Close modal immediately (optimistic UX)
+    setCreateDataOpen(false)
+
+    try {
+      const res = await fetch(`/api/applications/${application.id}/status`, {
+        method: 'PUT',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ status: 'ready' }),
+      })
+
+      const json = await res.json()
+
+      if (!res.ok || json.error) {
+        throw new Error(json.error?.message ?? 'Failed to update status')
+      }
+
+      // Invalidate to ensure server state is consistent (AC-9: updated_at recorded)
+      await queryClient.invalidateQueries({ queryKey: ['applications', application.id] })
+    } catch {
+      // AC-8: Roll back optimistic update on failure
+      queryClient.setQueryData(['applications', application.id], previousData)
+
+      // AC-8: Persistent error toast
+      toast.error('Failed to update status — please try again.', {
+        duration: Infinity,
+      })
+    }
+  }
 
   return (
     <div className="space-y-8">
-      {/* Header — Full Name + App ID + Status + Edit button */}
+      {/* Header — Full Name + App ID + Status + action buttons */}
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-2xl font-semibold text-foreground">
@@ -55,7 +111,8 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
         </div>
         <div className="flex items-center gap-3 shrink-0 pt-1">
           <StatusBadge status={application.status} />
-          {/* AC-1: Edit button visible only when status is 'raw'; hidden for ready/submitted/done (AC-4) */}
+
+          {/* AC-1 (story 3.5): Edit button visible only when status is 'raw'; hidden for ready/submitted/done */}
           {canEdit && (
             <Button
               id="edit-application-btn"
@@ -68,6 +125,33 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
               Edit
             </Button>
           )}
+
+          {/* AC-3 (story 4.1): "Create Data" button — only visible when status is 'raw' */}
+          {showCreateData && (
+            <Button
+              id="create-data-btn"
+              variant="default"
+              size="sm"
+              onClick={() => setCreateDataOpen(true)}
+              className="flex items-center gap-1.5"
+            >
+              Create Data
+            </Button>
+          )}
+
+          {/* AC-6 (story 4.1): "Push to eVisa" button — shown when status is 'ready' (story 4.2 will wire this up) */}
+          {showPushToEvisa && (
+            <Button
+              id="push-to-evisa-btn"
+              variant="default"
+              size="sm"
+              className="flex items-center gap-1.5"
+              disabled
+            >
+              Push to eVisa
+              <ChevronRight className="h-3.5 w-3.5" />
+            </Button>
+          )}
         </div>
       </div>
 
@@ -119,7 +203,7 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
         <ApplicationImages applicationId={application.id} />
       </div>
 
-      {/* Edit Modal — AC-2: pre-filled with current application data; only mounted when status is 'raw' */}
+      {/* Edit Modal — only mounted when status is 'raw' */}
       {canEdit && (
         <EditModal
           application={application}
@@ -127,6 +211,15 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
           onOpenChange={setEditOpen}
         />
       )}
+
+      {/* Create Data Modal — only mounted when status is 'raw' (AC-7) */}
+      {showCreateData && (
+        <CreateDataModal
+          open={createDataOpen}
+          onOpenChange={setCreateDataOpen}
+          onConfirm={handleCreateDataConfirm}
+        />
+      )}
     </div>
   )
 }
diff --git a/apps/web/src/components/dashboard/CreateDataModal.tsx b/apps/web/src/components/dashboard/CreateDataModal.tsx
new file mode 100644
index 0000000..c921365
--- /dev/null
+++ b/apps/web/src/components/dashboard/CreateDataModal.tsx
@@ -0,0 +1,92 @@
+'use client'
+
+import { useState } from 'react'
+import { Loader2 } from 'lucide-react'
+import {
+  Dialog,
+  DialogContent,
+  DialogHeader,
+  DialogTitle,
+  DialogFooter,
+  DialogDescription,
+} from '@/components/ui/dialog'
+import { Button } from '@/components/ui/button'
+
+interface CreateDataModalProps {
+  open: boolean
+  onOpenChange: (open: boolean) => void
+  /** Called when operator clicks Confirm. Should trigger the status update. */
+  onConfirm: () => Promise<void>
+}
+
+/**
+ * CreateDataModal — prompts the operator to confirm that application data is
+ * ready for submission, triggering the Raw → Ready status transition.
+ *
+ * AC-4: shadcn Dialog with "Confirm application data is ready for submission?"
+ *       prompt and a "Confirm" button.
+ */
+export function CreateDataModal({ open, onOpenChange, onConfirm }: CreateDataModalProps) {
+  const [isConfirming, setIsConfirming] = useState(false)
+
+  const handleOpenChange = (isOpen: boolean) => {
+    // Prevent closing mid-confirmation
+    if (isConfirming) return
+    onOpenChange(isOpen)
+  }
+
+  const handleConfirm = async () => {
+    setIsConfirming(true)
+    try {
+      await onConfirm()
+      // onConfirm is responsible for closing the modal on success
+    } finally {
+      setIsConfirming(false)
+    }
+  }
+
+  return (
+    <Dialog open={open} onOpenChange={handleOpenChange}>
+      <DialogContent className="sm:max-w-sm">
+        <DialogHeader>
+          <DialogTitle>Create Data</DialogTitle>
+          <DialogDescription>
+            Confirm application data is ready for submission?
+          </DialogDescription>
+        </DialogHeader>
+
+        <p className="text-sm text-muted-foreground">
+          This will transition the application status from{' '}
+          <span className="font-medium text-foreground">Raw</span> to{' '}
+          <span className="font-medium text-foreground">Ready</span>, enabling the Push to eVisa
+          workflow.
+        </p>
+
+        <DialogFooter className="gap-2 sm:gap-0">
+          <Button
+            id="create-data-cancel-btn"
+            variant="ghost"
+            onClick={() => onOpenChange(false)}
+            disabled={isConfirming}
+          >
+            Cancel
+          </Button>
+          <Button
+            id="create-data-confirm-btn"
+            onClick={handleConfirm}
+            disabled={isConfirming}
+          >
+            {isConfirming ? (
+              <>
+                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
+                Confirming…
+              </>
+            ) : (
+              'Confirm'
+            )}
+          </Button>
+        </DialogFooter>
+      </DialogContent>
+    </Dialog>
+  )
+}
```
