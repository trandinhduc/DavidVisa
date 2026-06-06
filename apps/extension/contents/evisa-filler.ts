import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import type { PushToEvisaMessage } from "@david-agency/shared"

export const config: PlasmoCSConfig = {
  matches: ["https://evisa.xuatnhapcanh.gov.vn/*", "https://*.evisa.gov.vn/*", "https://evisa.gov.vn/*"]
}

const storage = new Storage()

// Function to close popup if it exists
function handleBlockingPopup() {
  // Common selectors for close buttons or confirmation buttons on ads/notices
  const closeSelectors = [
    '.btn-close', '.modal-close', '[aria-label="Close"]', '#btnClose', '.close-popup',
    'button:contains("Đóng")', 'button:contains("Close")'
  ]
  
  for (const selector of closeSelectors) {
    try {
      // Use standard querySelector, ignoring custom pseudo-classes like :contains for safety
      const btns = document.querySelectorAll(selector.split(':')[0])
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i] as HTMLElement
        if (btn && btn.offsetParent !== null) { // visible
          if (selector.includes('contains')) {
            const text = selector.match(/contains\("(.*)"\)/)?.[1]
            if (text && !btn.textContent?.includes(text)) continue
          }
          btn.click()
          console.log('Closed blocking popup using selector:', selector)
          return
        }
      }
    } catch (e) {
      // ignore invalid selectors
    }
  }
}

// Helper to fill text inputs
function fillInput(selector: string, value: string) {
  const el = document.querySelector(selector) as HTMLInputElement
  if (el) {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur', { bubbles: true }))
  }
}

async function handlePhotoUpload(url: string, selector: string) {
  try {
    // Proxy fetch through background script to bypass potential CORS/CSP restrictions on evisa.gov.vn
    const response = await new Promise<{ success: boolean; dataUrl?: string; error?: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: "FETCH_IMAGE", url }, resolve)
    })

    if (!response.success || !response.dataUrl) {
      throw new Error(response.error || "Unknown proxy fetch error")
    }

    // Convert Data URL back to Blob
    const res = await fetch(response.dataUrl)
    const blob = await res.blob()
    const file = new File([blob], "upload.jpg", { type: blob.type || "image/jpeg" })
    
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    
    const input = document.querySelector(selector) as HTMLInputElement
    if (input) {
      input.files = dataTransfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    } else {
      console.warn("File input not found for selector:", selector)
    }
  } catch (err) {
    console.error("Failed to upload photo from url:", url, err)
  }
}

async function fillForm() {
  // Periodically check for popups and close them
  const popupInterval = setInterval(handleBlockingPopup, 1000)

  try {
    const pendingApp = await storage.get<PushToEvisaMessage>("pendingApplication")
    if (!pendingApp) return

    console.log("Found pending application, starting auto-fill...", pendingApp)

    // Basic heuristic selectors - adjust to match actual evisa.gov.vn DOM
    fillInput('input[name="surname"], input[id*="surname" i], input[id*="lastname" i]', pendingApp.lastName)
    fillInput('input[name="givenName"], input[id*="givenname" i], input[id*="firstname" i]', pendingApp.firstName)
    fillInput('input[name="arrivalDate"], input[id*="arrivaldate" i]', pendingApp.arrivalDate)

    // Handle Photos
    if (pendingApp.portraitSignedUrl) {
      await handlePhotoUpload(pendingApp.portraitSignedUrl, 'input[type="file"][id*="portrait" i], input[type="file"][name*="portrait" i]')
    }
    if (pendingApp.passportSignedUrl) {
      await handlePhotoUpload(pendingApp.passportSignedUrl, 'input[type="file"][id*="passport" i], input[type="file"][name*="passport" i]')
    }

    // Stop and notify user
    alert("Form filled — please review and submit.")
    
  } catch (error) {
    console.error("Error auto-filling form:", error)
  } finally {
    // Clear interval after some time
    setTimeout(() => clearInterval(popupInterval), 10000)
  }
}

// Start execution
window.addEventListener("load", () => {
  setTimeout(fillForm, 1000) // slight delay to allow scripts to initialize
})
