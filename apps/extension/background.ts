import { Storage } from "@plasmohq/storage"
import type { ExtensionMessage } from "@david-agency/shared"

const storage = new Storage()

chrome.runtime.onMessageExternal.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // Determine allowed origin based on environment
    const allowedOrigin =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://david-agency.vercel.app"

    if (sender.origin !== allowedOrigin) {
      console.warn("Ignored message from unauthorized origin:", sender.origin)
      return false
    }

    if (message.type === "PUSH_TO_EVISA") {
      storage.set("pendingApplication", message)
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Failed to store pending application", error)
          sendResponse({ success: false, error: String(error) })
        })
      return true // Keep the message channel open for the async response
    }

    if (message.type === "CLEAR_PENDING_APPLICATION") {
      storage.remove("pendingApplication")
        .then(() => sendResponse({ success: true }))
        .catch((error) => {
          console.error("Failed to clear pending application", error)
          sendResponse({ success: false, error: String(error) })
        })
      return true
    }

    sendResponse({ success: false, error: "Unknown message type" })
    return false // Response sent synchronously
  }
)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_IMAGE") {
    fetch(message.url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => sendResponse({ success: true, dataUrl: reader.result })
        reader.onerror = () => sendResponse({ success: false, error: "Failed to read blob" })
        reader.readAsDataURL(blob)
      })
      .catch((error) => {
        console.error("Failed to proxy fetch image:", error)
        sendResponse({ success: false, error: String(error) })
      })
    return true // Keep channel open for async response
  }
})
