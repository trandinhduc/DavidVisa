Review this diff and the project's source files using the bmad-review-edge-case-hunter skill.
Examine boundary conditions, error handling, loading states, and edge cases.

```diff
diff --git a/apps/extension/background.ts b/apps/extension/background.ts
index 3d425a2..5c830df 100644
--- a/apps/extension/background.ts
+++ b/apps/extension/background.ts
@@ -1,10 +1,10 @@
 import { Storage } from "@plasmohq/storage"
-import type { PushToEvisaMessage } from "@david-agency/shared"
+import type { ExtensionMessage } from "@david-agency/shared"
 
 const storage = new Storage()
 
 chrome.runtime.onMessageExternal.addListener(
-  (message: PushToEvisaMessage, sender, sendResponse) => {
+  (message: ExtensionMessage, sender, sendResponse) => {
     // Determine allowed origin based on environment
     const allowedOrigin =
       process.env.NODE_ENV === "development"
@@ -26,6 +26,16 @@ chrome.runtime.onMessageExternal.addListener(
       return true // Keep the message channel open for the async response
     }
 
+    if (message.type === "CLEAR_PENDING_APPLICATION") {
+      storage.remove("pendingApplication")
+        .then(() => sendResponse({ success: true }))
+        .catch((error) => {
+          console.error("Failed to clear pending application", error)
+          sendResponse({ success: false, error: String(error) })
+        })
+      return true
+    }
+
     sendResponse({ success: false, error: "Unknown message type" })
     return false // Response sent synchronously
   }
diff --git a/apps/extension/contents/evisa-filler.ts b/apps/extension/contents/evisa-filler.ts
new file mode 100644
index 0000000..328dbdf
--- /dev/null
+++ b/apps/extension/contents/evisa-filler.ts
@@ -0,0 +1,110 @@
+import type { PlasmoCSConfig } from "plasmo"
+import { Storage } from "@plasmohq/storage"
+import type { PushToEvisaMessage } from "@david-agency/shared"
+
+export const config: PlasmoCSConfig = {
+  matches: ["https://evisa.xuatnhapcanh.gov.vn/*", "https://*.evisa.gov.vn/*", "https://evisa.gov.vn/*"]
+}
+
+const storage = new Storage()
+
+// Function to close popup if it exists
+function handleBlockingPopup() {
+  // Common selectors for close buttons or confirmation buttons on ads/notices
+  const closeSelectors = [
+    '.btn-close', '.modal-close', '[aria-label="Close"]', '#btnClose', '.close-popup',
+    'button:contains("Đóng")', 'button:contains("Close")'
+  ]
+  
+  for (const selector of closeSelectors) {
+    try {
+      // Use standard querySelector, ignoring custom pseudo-classes like :contains for safety
+      const btns = document.querySelectorAll(selector.split(':')[0])
+      for (let i = 0; i < btns.length; i++) {
+        const btn = btns[i] as HTMLElement
+        if (btn && btn.offsetParent !== null) { // visible
+          if (selector.includes('contains')) {
+            const text = selector.match(/contains\("(.*)"\)/)?.[1]
+            if (text && !btn.textContent?.includes(text)) continue
+          }
+          btn.click()
+          console.log('Closed blocking popup using selector:', selector)
+          return
+        }
+      }
+    } catch (e) {
+      // ignore invalid selectors
+    }
+  }
+}
+
+// Helper to fill text inputs
+function fillInput(selector: string, value: string) {
+  const el = document.querySelector(selector) as HTMLInputElement
+  if (el) {
+    el.value = value
+    el.dispatchEvent(new Event('input', { bubbles: true }))
+    el.dispatchEvent(new Event('change', { bubbles: true }))
+    el.dispatchEvent(new Event('blur', { bubbles: true }))
+  }
+}
+
+async function handlePhotoUpload(url: string, selector: string) {
+  try {
+    const response = await fetch(url)
+    const blob = await response.blob()
+    const file = new File([blob], "upload.jpg", { type: blob.type || "image/jpeg" })
+    
+    const dataTransfer = new DataTransfer()
+    dataTransfer.items.add(file)
+    
+    const input = document.querySelector(selector) as HTMLInputElement
+    if (input) {
+      input.files = dataTransfer.files
+      input.dispatchEvent(new Event('change', { bubbles: true }))
+    } else {
+      console.warn("File input not found for selector:", selector)
+    }
+  } catch (err) {
+    console.error("Failed to upload photo from url:", url, err)
+  }
+}
+
+async function fillForm() {
+  // Periodically check for popups and close them
+  const popupInterval = setInterval(handleBlockingPopup, 1000)
+
+  try {
+    const pendingApp = await storage.get<PushToEvisaMessage>("pendingApplication")
+    if (!pendingApp) return
+
+    console.log("Found pending application, starting auto-fill...", pendingApp)
+
+    // Basic heuristic selectors - adjust to match actual evisa.gov.vn DOM
+    fillInput('input[name="surname"], input[id*="surname" i], input[id*="lastname" i]', pendingApp.lastName)
+    fillInput('input[name="givenName"], input[id*="givenname" i], input[id*="firstname" i]', pendingApp.firstName)
+    fillInput('input[name="arrivalDate"], input[id*="arrivaldate" i]', pendingApp.arrivalDate)
+
+    // Handle Photos
+    if (pendingApp.portraitSignedUrl) {
+      await handlePhotoUpload(pendingApp.portraitSignedUrl, 'input[type="file"][id*="portrait" i], input[type="file"][name*="portrait" i]')
+    }
+    if (pendingApp.passportSignedUrl) {
+      await handlePhotoUpload(pendingApp.passportSignedUrl, 'input[type="file"][id*="passport" i], input[type="file"][name*="passport" i]')
+    }
+
+    // Stop and notify user
+    alert("Form filled — please review and submit.")
+    
+  } catch (error) {
+    console.error("Error auto-filling form:", error)
+  } finally {
+    // Clear interval after some time
+    setTimeout(() => clearInterval(popupInterval), 10000)
+  }
+}
+
+// Start execution
+window.addEventListener("load", () => {
+  setTimeout(fillForm, 1000) // slight delay to allow scripts to initialize
+})
diff --git a/apps/web/src/components/dashboard/ApplicationDetail.tsx b/apps/web/src/components/dashboard/ApplicationDetail.tsx
index ded7264..ced7a27 100644
--- a/apps/web/src/components/dashboard/ApplicationDetail.tsx
+++ b/apps/web/src/components/dashboard/ApplicationDetail.tsx
@@ -109,6 +109,51 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
     }
   }
 
+  const handleMarkAsSubmitted = async () => {
+    // Optimistic update
+    const previousData = queryClient.getQueryData<ApplicationData>([
+      'applications',
+      application.id,
+    ])
+
+    queryClient.setQueryData<ApplicationData>(['applications', application.id], (old: ApplicationData | undefined) => {
+      if (!old) return old
+      return { ...old, status: 'submitted' }
+    })
+
+    try {
+      const res = await fetch(`/api/applications/${application.id}/status`, {
+        method: 'PUT',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ status: 'submitted' }),
+      })
+
+      const json = await res.json()
+
+      if (!res.ok || json.error) {
+        throw new Error(json.error?.message ?? 'Failed to update status')
+      }
+
+      await queryClient.invalidateQueries({ queryKey: ['applications'] })
+
+      // Clear the extension's pending application
+      try {
+        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
+          chrome.runtime.sendMessage(EXTENSION_ID, { type: 'CLEAR_PENDING_APPLICATION' })
+        }
+      } catch (err) {
+        console.error('Failed to send clear message to extension:', err)
+      }
+
+    } catch (err) {
+      const error = err instanceof Error ? err : new Error('Unknown error occurred')
+      queryClient.setQueryData(['applications', application.id], previousData)
+      toast.error(error.message || 'Failed to update status — please try again.', {
+        duration: Infinity,
+      })
+    }
+  }
+
   return (
     <div className="space-y-8">
       {/* Header — Full Name + App ID + Status + action buttons */}
@@ -178,6 +223,19 @@ export function ApplicationDetail({ application }: ApplicationDetailProps) {
               )}
             </Tooltip>
           </TooltipProvider>
+
+          {/* AC-7 (story 4.4): Mark as Submitted button */}
+          {showPushToEvisa && (
+            <Button
+              id="mark-as-submitted-btn"
+              variant="outline"
+              size="sm"
+              onClick={handleMarkAsSubmitted}
+              className="flex items-center gap-1.5"
+            >
+              Mark as Submitted
+            </Button>
+          )}
         </div>
       </div>
 
diff --git a/packages/shared/src/index.ts b/packages/shared/src/index.ts
index 085abc6..3f7437f 100644
--- a/packages/shared/src/index.ts
+++ b/packages/shared/src/index.ts
@@ -1,2 +1,2 @@
-export type { ApplicationData, ApplicationStatus, PushToEvisaMessage } from './types'
+export type { ApplicationData, ApplicationStatus, PushToEvisaMessage, ClearPendingApplicationMessage, ExtensionMessage } from './types'
 export { STATUS_FLOW, EXTENSION_ID } from './constants'
diff --git a/packages/shared/src/types.ts b/packages/shared/src/types.ts
index 1d21e8d..3a007fb 100644
--- a/packages/shared/src/types.ts
+++ b/packages/shared/src/types.ts
@@ -26,3 +26,9 @@ export interface PushToEvisaMessage {
   portraitSignedUrl: string | null
   passportSignedUrl: string | null
 }
+
+export interface ClearPendingApplicationMessage {
+  type: 'CLEAR_PENDING_APPLICATION'
+}
+
+export type ExtensionMessage = PushToEvisaMessage | ClearPendingApplicationMessage
```
