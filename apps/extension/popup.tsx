import { useStorage } from "@plasmohq/storage/hook"
import type { PushToEvisaMessage } from "@david-agency/shared"

function IndexPopup() {
  const [pendingApp] = useStorage<PushToEvisaMessage | null>("pendingApplication", null)

  return (
    <div
      style={{
        padding: 16,
        width: 300,
        fontFamily: "system-ui, sans-serif"
      }}>
      <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>David Agency Extension</h2>
      
      {pendingApp ? (
        <div style={{ padding: "1rem", backgroundColor: "#DCFCE7", color: "#166534", borderRadius: "0.5rem" }}>
          <strong>Ready to fill</strong>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
            Application: {pendingApp.appId}<br/>
            Name: {pendingApp.firstName} {pendingApp.lastName}
          </p>
        </div>
      ) : (
        <div style={{ padding: "1rem", backgroundColor: "#F1F5F9", color: "#64748B", borderRadius: "0.5rem" }}>
          <strong>No pending application</strong>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
            Push an application from the dashboard.
          </p>
        </div>
      )}
    </div>
  )
}

export default IndexPopup
