import { Storage } from "@plasmohq/storage"
import type { PushToEvisaMessage } from "@david-agency/shared"

const storage = new Storage()

chrome.runtime.onMessageExternal.addListener(
  (message: PushToEvisaMessage, sender, sendResponse) => {
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

    sendResponse({ success: false, error: "Unknown message type" })
    return false // Response sent synchronously
  }
)
