import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export type TabType = "all" | "raw" | "ready" | "submitted" | "done"

interface ApplicationFiltersProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  counts: Record<TabType, number>;
}

const TABS: { id: TabType; label: string }[] = [
  { id: "raw", label: "Raw" },
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "submitted", label: "Submitted" },
  { id: "done", label: "Done" },
]

export function ApplicationFilters({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  counts,
}: ApplicationFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or ID..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  )
}
