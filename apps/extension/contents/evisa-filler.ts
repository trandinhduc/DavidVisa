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

async function autoFill(selector: string, value: string | null | undefined, labelTextFallback?: string) {
  if (!value) return;
  let el = document.querySelector(selector) as HTMLInputElement;

  if (!el && labelTextFallback) {
    const labels = Array.from(document.querySelectorAll('label, .ant-form-item-label label'));
    const targetLabel = labels.find(l => (l.textContent || '').toLowerCase().includes(labelTextFallback.toLowerCase()));
    if (targetLabel) {
      const htmlFor = targetLabel.getAttribute('for');
      if (htmlFor) {
        el = document.getElementById(htmlFor) as HTMLInputElement;
      } else {
        const wrapper = targetLabel.closest('.ant-row, .form-group, .ant-form-item');
        if (wrapper) el = wrapper.querySelector('input') as HTMLInputElement;
      }
    }
  }

  if (!el) {
    console.warn("Could not find element for:", selector, labelTextFallback);
    return;
  }

  let disabledRetries = 0;
  while (disabledRetries < 10) {
    const parentSelect = el.closest('.ant-select');
    const isDisabled = el.disabled || el.hasAttribute('disabled') || (parentSelect && parentSelect.classList.contains('ant-select-disabled'));
    if (!isDisabled) break;
    await new Promise(r => setTimeout(r, 500));
    disabledRetries++;
  }

  if (el.className.includes('ant-select-selection-search-input')) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.click();
    await new Promise(r => setTimeout(r, 150));
    
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    
    let optionClicked = false;
    let optRetries = 0;
    while (!optionClicked && optRetries < 15) {
      await new Promise(r => setTimeout(r, 200));
      
      const listboxId = el.getAttribute('aria-controls');
      if (listboxId) {
        const options = document.querySelectorAll(`#${listboxId} .ant-select-item-option-content`);
        for (const opt of Array.from(options)) {
          if ((opt.textContent || '').trim().toLowerCase() === value.toLowerCase()) {
            (opt.parentElement as HTMLElement).click();
            optionClicked = true;
            break;
          }
        }
      }
      
      if (!optionClicked) {
        const allOptions = document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content');
        for (const opt of Array.from(allOptions)) {
          if ((opt.textContent || '').trim().toLowerCase() === value.toLowerCase()) {
            (opt.parentElement as HTMLElement).click();
            optionClicked = true;
            break;
          }
        }
      }
      optRetries++;
    }
    
    if (!optionClicked) {
      console.warn("Could not find option to click for:", selector, value);
    }
    
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
  } else {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
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

    console.log("Found pending application, determining page load status...");

    // Helper to check for form page
    const isFormPage = () => document.body.innerText.includes("Portrait photography") || 
                             document.body.innerText.includes("Passport data page image");

    // Helper to check for confirmation page
    const getConfirmationCheckboxes = () => {
      let checkbox1: HTMLElement | null = null;
      let checkbox2: HTMLElement | null = null;
      const allCheckboxes = document.querySelectorAll('.ant-checkbox-wrapper');
      for (const wrapper of Array.from(allCheckboxes)) {
        const text = (wrapper as HTMLElement).innerText || wrapper.textContent || '';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('compliance') || lowerText.includes('vietnamese laws')) checkbox1 = wrapper as HTMLElement;
        if (lowerText.includes('reading') || lowerText.includes('instructions')) checkbox2 = wrapper as HTMLElement;
      }
      if ((!checkbox1 || !checkbox2) && allCheckboxes.length >= 2) {
         const isConfirmationTextPresent = document.body.innerText.includes('compliance') || document.body.innerText.includes('instructions');
         if (isConfirmationTextPresent) {
           checkbox1 = allCheckboxes[0] as HTMLElement;
           checkbox2 = allCheckboxes[1] as HTMLElement;
         }
      }
      return { checkbox1, checkbox2 };
    };

    let waitTime = 0;
    const interval = 200;
    let pageType: 'form' | 'confirmation' | 'none' = 'none';

    while (waitTime < 2000) {
      if (isFormPage()) {
        pageType = 'form';
        break;
      }
      const { checkbox1, checkbox2 } = getConfirmationCheckboxes();
      if (checkbox1 && checkbox2) {
        pageType = 'confirmation';
        break;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
      waitTime += interval;
    }

    if (pageType === 'none') {
      console.log("Page not loaded properly after 2s. Refreshing...");
      window.location.reload();
      return;
    }

    if (pageType === 'confirmation') {
      console.log("On confirmation page, scrolling and checking ant-checkboxes...");
      const { checkbox1, checkbox2 } = getConfirmationCheckboxes();
      
      const modalBody = document.querySelector('.ant-modal-body, .modal-body, .v-dialog');
      if (modalBody) {
         modalBody.scrollTop = modalBody.scrollHeight;
      } else if (checkbox2) {
         checkbox2.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      await new Promise(r => setTimeout(r, 1000));
      
      const isChecked1 = checkbox1!.querySelector('.ant-checkbox-checked') !== null;
      const isChecked2 = checkbox2!.querySelector('.ant-checkbox-checked') !== null;

      if (!isChecked1) checkbox1!.click();
      if (!isChecked2) checkbox2!.click();
      
      await new Promise(r => setTimeout(r, 1000));
      
      const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="button"], input[type="submit"]')) as HTMLElement[];
      const nextBtn = buttons.find(b => {
        const btnText = b.innerText?.trim() || (b as HTMLInputElement).value?.trim() || '';
        return btnText.toLowerCase() === 'next' || btnText.toLowerCase() === 'tiếp tục';
      });
      
      if (nextBtn && !nextBtn.hasAttribute('disabled') && !(nextBtn as HTMLButtonElement).disabled) {
        console.log("Clicking Next...");
        nextBtn.click();
      } else {
        console.warn("Next button disabled or not found.");
      }
      
      // Wait for form to appear after clicking next
      console.log("Waiting for form to load after confirmation...");
      let waitFormTime = 0;
      while (!isFormPage() && waitFormTime < 10000) {
        await new Promise(r => setTimeout(r, 500));
        waitFormTime += 500;
      }
      
      if (!isFormPage()) {
        console.log("Form did not load within 10s after confirmation. Refreshing...");
        window.location.reload();
        return;
      }
    }

    console.log("Page loaded successfully. Uploading photos...");

    // Start popup handler to auto-close any blocking modals
    const popupInterval = setInterval(handleBlockingPopup, 1000);

    try {
      // Upload Photos
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
      let portraitInput: HTMLInputElement | null = null;
      let passportInput: HTMLInputElement | null = null;
      
      if (fileInputs.length >= 2) {
         portraitInput = fileInputs[0];
         passportInput = fileInputs[1];
      } else if (fileInputs.length === 1) {
         portraitInput = fileInputs[0];
      }

      if (portraitInput && pendingApp.portraitSignedUrl) {
        await handlePhotoUploadByElement(pendingApp.portraitSignedUrl, portraitInput)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn("Could not find file input for portrait photo");
      }

      if (passportInput && pendingApp.passportSignedUrl) {
        await handlePhotoUploadByElement(pendingApp.passportSignedUrl, passportInput)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn("Could not find file input for passport photo");
      }

      // Wait for Face compare signal
      console.log("Waiting for Face compare signal...");
      let matchWaitMs = 0;
      let isFaceCompared = false;
      while (matchWaitMs < 60000) { // wait up to 60s
        await new Promise(r => setTimeout(r, 1000));
        matchWaitMs += 1000;
        const bodyText = document.body.innerText.toLowerCase();
        if (bodyText.includes('face compare') || bodyText.includes('mức độ khớp') || bodyText.includes('tương đồng') || bodyText.includes('matching') || bodyText.includes('khớp') || bodyText.includes('tỷ lệ') || bodyText.includes('similarity')) {
          isFaceCompared = true;
          break;
        }
      }

      if (!isFaceCompared) {
        console.warn("Did not see Face compare signal after 60s.");
      }

      console.log("Face compare successful. Proceeding to fill remaining info...");
      
      // Personal
      await autoFill('#basic_ttcnEmail', pendingApp.email);
      await autoFill('#basic_ttcnConfirmEmail', pendingApp.email);
      
      // Uncheck "Agree to create account" if present
      const emailCheckboxes = document.querySelectorAll('.ant-checkbox-wrapper, label.ant-checkbox-wrapper');
      for (const wrapper of Array.from(emailCheckboxes)) {
        const text = (wrapper as HTMLElement).innerText || wrapper.textContent || '';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('agree to create') || lowerText.includes('create account') || lowerText.includes('tạo tài khoản')) {
          const checkboxInput = wrapper.querySelector('input[type="checkbox"]') as HTMLInputElement;
          const isChecked = wrapper.querySelector('.ant-checkbox-checked') !== null || (checkboxInput && checkboxInput.checked);
          if (isChecked) {
            (wrapper as HTMLElement).click();
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }

      await autoFill('#basic_ttcnTonGiao', pendingApp.religion);
      await autoFill('#basic_ttcnNoiSinh', pendingApp.placeOfBirth);

      // Passport
      await autoFill('#basic_hcLoai', pendingApp.passportType);
      await autoFill('#basic_hcNgayCapStr', formatDate(pendingApp.passportIssueDate));
      // Note: Expire date (#basic_hcGiaTriDenStr) is intentionally skipped as evisa auto-fills it
      
      await autoFill('#basic_nddnTtdtTuNgayStr', formatDate(pendingApp.visaValidFrom));

      let validToDate = '';
      const fromDateStr = pendingApp.visaValidFrom || pendingApp.arrivalDate;
      const durationDays = pendingApp.registrationDuration ?? 30;
      if (fromDateStr) {
        const parts = fromDateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          d.setDate(d.getDate() + (durationDays - 1));
          validToDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      await autoFill('#basic_nddnTtdtDenNgayStr', formatDate(validToDate));

      // Addresses
      await autoFill('#basic_ttllDcThuongTru', pendingApp.permanentAddress);
      await autoFill('#basic_ttllDcLienHe', pendingApp.contactAddress);
      await autoFill('#basic_ttllSdt', pendingApp.telephone);

      // Emergency Contact
      await autoFill('#basic_ttllLlHoTen', pendingApp.emergencyName);
      await autoFill('#basic_ttllLlNoiOHienTai', pendingApp.emergencyAddress);
      await autoFill('#basic_ttllLlSdt', pendingApp.emergencyTelephone);
      await autoFill('#basic_ttllLlQuanHe', pendingApp.emergencyRelationship);

      // Trip Info
      await autoFill('#basic_ttcdMucDich', pendingApp.purposeOfEntry);
      await autoFill('#basic_ttcdThoiGianNcStr', formatDate(pendingApp.intendedDateOfEntry || pendingApp.arrivalDate));
      await autoFill('#basic_ttcdSoNgayTamTru', pendingApp.intendedLengthOfStay);
      await autoFill('#basic_ttcdDcTamTru', pendingApp.residentialAddressInVietnam);
      await autoFill('#basic_ttcdTinhTp', pendingApp.provinceCity);
      await new Promise(r => setTimeout(r, 500));
      await autoFill('#basic_ttcdPhuongXa', pendingApp.wardCommune);
      await autoFill('#basic_ttcdNcCuaKhau', pendingApp.entryGate);
      await new Promise(r => setTimeout(r, 800));

      // Select Single-entry or Multiple-entry after face matching succeeds
      if (pendingApp.entryType) {
        const targetLabel = pendingApp.entryType === 'single' ? 'single' : 'multiple';
        let entrySelected = false;
        let entryRetries = 0;
        while (!entrySelected && entryRetries < 10) {
          const radioWrappers = Array.from(document.querySelectorAll('.ant-radio-wrapper, label.ant-radio-button-wrapper'));
          for (const wrapper of radioWrappers) {
            const text = ((wrapper as HTMLElement).innerText || wrapper.textContent || '').toLowerCase();
            if (text.includes(targetLabel)) {
              const isChecked = wrapper.querySelector('.ant-radio-checked, .ant-radio-button-wrapper-checked') !== null;
              if (!isChecked) {
                (wrapper as HTMLElement).click();
                await new Promise(r => setTimeout(r, 300));
              }
              entrySelected = true;
              break;
            }
          }
          if (!entrySelected) {
            await new Promise(r => setTimeout(r, 500));
            entryRetries++;
          }
        }
        if (!entrySelected) {
          console.warn('Could not find entry type radio button for:', targetLabel);
        }
      }

      await autoFill('#basic_ttcdXcCuaKhau', 'Cam Pha Seaport');
      await new Promise(r => setTimeout(r, 500));

      // Check confirmation checkboxes at the bottom of the form
      const formCheckboxes = document.querySelectorAll('.ant-checkbox-wrapper, label.ant-checkbox-wrapper');
      for (const wrapper of Array.from(formCheckboxes)) {
        const text = (wrapper as HTMLElement).innerText || wrapper.textContent || '';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('i hereby declare') || lowerText.includes('vietnamese laws') || lowerText.includes('above statements are true') || lowerText.includes('committed to declare')) {
          const isChecked = wrapper.querySelector('.ant-checkbox-checked') !== null;
          if (!isChecked) {
            (wrapper as HTMLElement).click();
          }
        }
      }

      // Final validation scan
      console.log("Scanning for required field errors...");
      await new Promise(r => setTimeout(r, 1000)); // give UI a moment to validate and show errors
      
      const errorElements = Array.from(document.querySelectorAll('.ant-form-item-has-error'));
      const errorMessages: string[] = [];
      
      for (const el of errorElements) {
        const labelEl = el.querySelector('.ant-form-item-label label');
        let labelText = 'Unknown field';
        if (labelEl) {
          labelText = labelEl.textContent?.replace('*', '').trim() || 'Unknown field';
        }
        
        const explainEl = el.querySelector('.ant-form-item-explain-error');
        const explainText = explainEl?.textContent?.trim() || 'Required field';
        
        errorMessages.push(`- ${labelText}: ${explainText}`);
      }
      
      // Clear data cache
      await storage.remove("pendingApplication");
      
      if (errorMessages.length > 0) {
        alert("The form was filled, but the following fields have errors:\n\n" + errorMessages.join("\n"));
      } else {
        alert("Form filled successfully with no errors.");
      }

    } finally {
      setTimeout(() => {
        clearInterval(popupInterval);
      }, 5000);
    }
  } catch (error) {
    console.error("Error in fillForm logic:", error)
  }
}

// Start execution
window.addEventListener("load", () => {
  setTimeout(fillForm, 1000)
})
