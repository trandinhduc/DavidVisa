import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import type { PushToEvisaMessage } from "@david-agency/shared"

export const config: PlasmoCSConfig = {
  matches: ["https://evisa.xuatnhapcanh.gov.vn/*", "https://*.evisa.gov.vn/*", "https://evisa.gov.vn/*"]
}

const storage = new Storage()

function handleBlockingPopup() {
  const closeSelectors = [
    '.btn-close', '.modal-close', '[aria-label="Close"]', '#btnClose', '.close-popup',
    'button:contains("Đóng")', 'button:contains("Close")'
  ]
  
  for (const selector of closeSelectors) {
    try {
      const btns = document.querySelectorAll(selector.split(':')[0])
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i] as HTMLElement
        if (btn && btn.offsetParent !== null) { 
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
    }
  }
}

function fillInput(selector: string, value: string) {
  const el = document.querySelector(selector) as HTMLInputElement
  if (el) {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new Event('blur', { bubbles: true }))
  }
}

async function handlePhotoUploadByElement(url: string, input: HTMLInputElement) {
  try {
    const response = await new Promise<{ success: boolean; dataUrl?: string; error?: string }>((resolve) => {
      chrome.runtime.sendMessage({ type: "FETCH_IMAGE", url }, resolve)
    })

    if (!response.success || !response.dataUrl) {
      throw new Error(response.error || "Unknown proxy fetch error")
    }

    const res = await fetch(response.dataUrl)
    const blob = await res.blob()
    const file = new File([blob], "upload.jpg", { type: blob.type || "image/jpeg" })
    
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    
    input.files = dataTransfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('input', { bubbles: true }))
  } catch (err) {
    console.error("Failed to upload photo from url:", url, err)
  }
}

async function fillForm() {
  try {
    const pendingApp = await storage.get<PushToEvisaMessage>("pendingApplication")
    if (!pendingApp) return

    console.log("Found pending application, waiting for page content...", pendingApp)

    let hasHandledConfirmation = false;
    let hasFilledForm = false;
    let isConfirming = false;
    let popupInterval: ReturnType<typeof setInterval> | null = null;
    let nextClickedTime = 0;
    const scriptStartTime = Date.now();

    const mainInterval = setInterval(async () => {
      if (hasFilledForm) {
        clearInterval(mainInterval);
        return;
      }

      // Check if the page is completely blank/broken on initial load for > 3.5s
      if (!hasHandledConfirmation && !hasFilledForm && Date.now() - scriptStartTime > 3500) {
        const bodyText = document.body.innerText || '';
        if (bodyText.length < 50 && document.querySelectorAll('input, button, div').length < 10) {
           console.log("Page seems to have failed loading initially. Reloading...");
           window.location.reload();
           return;
        }
      }

      // If we clicked Next, and 4 seconds have passed but form is still not found -> reload
      if (hasHandledConfirmation && !hasFilledForm && nextClickedTime > 0) {
        if (Date.now() - nextClickedTime > 4000) {
          console.log("Form did not load within 4s after clicking Next. Reloading page...");
          window.location.reload();
          return;
        }
      }

      // 1. Check for Confirmation Page
      if (!hasHandledConfirmation) {
        let checkbox1: HTMLElement | null = null;
        let checkbox2: HTMLElement | null = null;
        
        // Find Ant Design checkboxes
        const allCheckboxes = document.querySelectorAll('.ant-checkbox-wrapper');
        for (const wrapper of Array.from(allCheckboxes)) {
          const text = (wrapper as HTMLElement).innerText || wrapper.textContent || '';
          const lowerText = text.toLowerCase();
          
          if (lowerText.includes('compliance') || lowerText.includes('vietnamese laws')) checkbox1 = wrapper as HTMLElement;
          if (lowerText.includes('reading') || lowerText.includes('instructions')) checkbox2 = wrapper as HTMLElement;
        }

        // Fallback: If we couldn't match text but there are exactly 2 checkboxes or more, pick the first two
        if ((!checkbox1 || !checkbox2) && allCheckboxes.length >= 2) {
           const isConfirmationTextPresent = document.body.innerText.includes('compliance') || document.body.innerText.includes('instructions');
           if (isConfirmationTextPresent) {
             checkbox1 = allCheckboxes[0] as HTMLElement;
             checkbox2 = allCheckboxes[1] as HTMLElement;
           }
        }

        if (checkbox1 && checkbox2 && !isConfirming) {
          isConfirming = true;
          console.log("On confirmation page, scrolling and checking ant-checkboxes...");
          
          const modalBody = document.querySelector('.ant-modal-body, .modal-body, .v-dialog');
          if (modalBody) {
             modalBody.scrollTop = modalBody.scrollHeight;
          } else {
             checkbox2.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          setTimeout(() => {
            const isChecked1 = checkbox1!.querySelector('.ant-checkbox-checked') !== null;
            const isChecked2 = checkbox2!.querySelector('.ant-checkbox-checked') !== null;

            if (!isChecked1) checkbox1!.click();
            if (!isChecked2) checkbox2!.click();
            
            setTimeout(() => {
              const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="button"], input[type="submit"]')) as HTMLElement[];
              const nextBtn = buttons.find(b => {
                const btnText = b.innerText?.trim() || (b as HTMLInputElement).value?.trim() || '';
                return btnText.toLowerCase() === 'next';
              });
              
              if (nextBtn && !nextBtn.hasAttribute('disabled') && !(nextBtn as HTMLButtonElement).disabled) {
                console.log("Clicking Next...");
                nextBtn.click();
                hasHandledConfirmation = true;
                nextClickedTime = Date.now();
                isConfirming = false;
              } else {
                console.log("Next button disabled or not found, retrying...");
                isConfirming = false;
              }
            }, 1000);
          }, 1000);
          return;
        }
      }

      // 2. Check for Form Page
      // Use more robust text-based detection from the screenshot
      const isFormPage = document.body.innerText.includes("FOREIGNER'S IMAGES") || 
                         document.body.innerText.includes("Portrait photography") ||
                         document.body.innerText.includes("Passport data page image");
                         
      if (isFormPage && !hasFilledForm) {
        hasFilledForm = true;
        console.log("On form page, starting auto-fill...");
        if (!popupInterval) popupInterval = setInterval(handleBlockingPopup, 1000);

        try {
          // Fill Text Fields
          fillInput('input[name="surname"], input[id*="surname" i], input[id*="lastname" i]', pendingApp.lastName)
          fillInput('input[name="givenName"], input[id*="givenname" i], input[id*="firstname" i]', pendingApp.firstName)
          fillInput('input[name="arrivalDate"], input[id*="arrivaldate" i]', pendingApp.arrivalDate)

          // Upload Photos
          const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
          let portraitInput: HTMLInputElement | null = null;
          let passportInput: HTMLInputElement | null = null;
          
          if (fileInputs.length >= 2) {
             // Visual order is strict: Portrait is first, Passport is second
             portraitInput = fileInputs[0];
             passportInput = fileInputs[1];
          } else if (fileInputs.length === 1) {
             portraitInput = fileInputs[0]; // best effort
          }

          if (portraitInput && pendingApp.portraitSignedUrl) {
            await handlePhotoUploadByElement(pendingApp.portraitSignedUrl, portraitInput)
            // Wait 1 second before uploading the next image to prevent UI state overwrite
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.warn("Could not find file input for portrait photo");
          }

          if (passportInput && pendingApp.passportSignedUrl) {
            await handlePhotoUploadByElement(pendingApp.passportSignedUrl, passportInput)
          } else {
            console.warn("Could not find file input for passport photo");
          }

          alert("Form filled — please review and submit.")
        } catch (error) {
          console.error("Error auto-filling form:", error)
        } finally {
          setTimeout(() => {
            if (popupInterval) clearInterval(popupInterval);
          }, 10000)
        }
      }
    }, 1000);
    
    // Failsafe: stop mainInterval after 2 minutes
    setTimeout(() => clearInterval(mainInterval), 120000);

  } catch (error) {
    console.error("Error in fillForm logic:", error)
  }
}

// Start execution
window.addEventListener("load", () => {
  setTimeout(fillForm, 1000)
})
