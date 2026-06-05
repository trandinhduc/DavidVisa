You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

### Specification File
# Story 3.3: Applications List with Filter Tabs & Search

**Story ID:** 3.3
**Story Key:** 3-3-applications-list-with-filter-tabs-and-search
**Status:** review
**Epic:** Epic 3 — Operator Monitors & Manages Applications
**Created:** 2026-06-05

---

## User Story

**As an operator,**
I want to see all applications in a filterable table with real-time search,
So that I can quickly find and prioritise the applications that need my attention.

---

## Acceptance Criteria (BDD)

**AC-1: Filter tabs**
**Given** the operator is on `/dashboard`
**When** the page loads
**Then** filter tabs appear: **Raw** | **All** | **Ready** | **Submitted** | **Done** — default active tab is **Raw**

**AC-2: Count badges on tabs**
**And** each tab shows a count badge when count > 0 (e.g., "Raw (3)"); active tab has `border-b-2 border-accent` (#1D4ED8)

**AC-3: Data table**
**And** a data table shows applications matching the active filter, columns: Application ID | Applicant Name | Arrival Date | Status | Submitted At

**AC-4: Status badges**
**And** each row shows the correct `StatusBadge` variant (pill rounded-full, text label always present): Raw (#F1F5F9/#64748B), Ready (#FEF3C7/#92400E), Submitted (#DBEAFE/#1E40AF), Done (#DCFCE7/#166534)

**AC-5: Real-time search**
**And** a search box filters in real-time (no Enter required) by Last Name, First Name, or Application ID

**AC-6: Sorting**
**And** table is sorted by `created_at` descending (newest first)

**AC-7: Loading state**
**And** while loading: 5 skeleton rows matching the table column structure are shown

**AC-8: Empty state**
**And** when the filtered list is empty: "No [Status] applications." + "Applications will appear here once they reach [Status] status."

**AC-9: Row navigation**
**And** clicking a row navigates to `/dashboard/applications/[id]`

**AC-10: Data fetching**
**And** data is fetched via TanStack Query (Supabase JS client + anon key + RLS)

---

## Developer Context

### ⚠️ CRITICAL ARCHITECTURE NOTES FOR THIS STORY

**TanStack Query Setup:**
Dự án sử dụng TanStack Query cho data fetching. Bạn **PHẢI** cài đặt `@tanstack/react-query` và bọc toàn bộ app với `QueryClientProvider` trước khi có thể sử dụng hook fetching.

**Route Group Modification:**
Trong story trước đó, chúng ta đã chuyển đổi thư mục `page.tsx` và `layout.tsx` của dashboard vào trong Route Group `(protected)` để khắc phục lỗi redirect của Next.js với trang `/dashboard/login`.
Do đó, khi chỉnh sửa trang Dashboard list, bạn phải sửa file `app/dashboard/(protected)/page.tsx` (KHÔNG phải `app/dashboard/page.tsx`).

---

## Technical Requirements

### Stack & Dependencies

- **Data Fetching:** TanStack Query.
- **Icon Library:** `lucide-react` (đã cài).
- **Date Formatting:** Sử dụng `Intl.DateTimeFormat` hoặc utils nội bộ cho human-readable date.

### Cần Cài Đặt Thêm (Bắt Buộc):

```bash
cd apps/web && pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

---

## File Structure — O que criar / modificar

### NEW (tạo mới):

```
apps/web/src/
├── app/
│   └── providers.tsx                     ← [NEW] TanStack QueryClient provider wrapper
├── components/
│   └── dashboard/
│       ├── ApplicationTable.tsx          ← [NEW] Data table component
│       ├── ApplicationFilters.tsx        ← [NEW] Filter tabs and Search component
│       └── StatusBadge.tsx               ← [NEW] Status badge component (4 variants)
└── hooks/
    └── use-applications.ts               ← [NEW] TanStack query hook fetching from Supabase
```

### MODIFY (cập nhật):

```
apps/web/src/
├── app/
│   ├── layout.tsx                        ← [MODIFY] Wrap {children} với <Providers>
│   └── dashboard/(protected)/page.tsx    ← [MODIFY] Combine ApplicationFilters và ApplicationTable
```

### Diff
```diff
diff --git a/apps/web/package.json b/apps/web/package.json
index 4f5f577..4041dd4 100644
--- a/apps/web/package.json
+++ b/apps/web/package.json
@@ -18,6 +18,8 @@
     "@radix-ui/react-tabs": "^1.1.13",
     "@supabase/ssr": "^0.10.3",
     "@supabase/supabase-js": "^2.106.2",
+    "@tanstack/react-query": "^5.101.0",
+    "@tanstack/react-query-devtools": "^5.101.0",
     "class-variance-authority": "^0.7.1",
     "clsx": "^2.1.1",
     "heic2any": "^0.0.4",
diff --git a/apps/web/src/app/dashboard/layout.tsx b/apps/web/src/app/dashboard/(protected)/layout.tsx
similarity index 51%
rename from apps/web/src/app/dashboard/layout.tsx
rename to apps/web/src/app/dashboard/(protected)/layout.tsx
index 7ad4145..be81bd8 100644
--- a/apps/web/src/app/dashboard/layout.tsx
+++ b/apps/web/src/app/dashboard/(protected)/layout.tsx
@@ -1,7 +1,7 @@
 import type { ReactNode } from 'react'
 import { redirect } from 'next/navigation'
-import Link from 'next/link'
 import { createServerComponentClient } from '@/lib/supabase-server-component'
+import { SidebarNav } from '@/components/dashboard/SidebarNav'
 
 export default async function DashboardLayout({ children }: { children: ReactNode }) {
   const supabase = await createServerComponentClient()
@@ -15,20;7,7 @@ export default async function DashboardLayout({ children }: { children: ReactNod
 
   return (
     <div className="flex h-screen overflow-hidden">
-      {/* Sidebar placeholder — will be replaced in Story 3.2 */}
-      <aside className="w-60 shrink-0 bg-primary text-white flex flex-col">
-        <div className="px-4 py-5 border-b border-white/10">
-          <span className="text-sm font-semibold">David Agency</span>
-        </div>
-        <nav className="flex-1 px-2 py-3">
-          <Link
-            href="/dashboard"
-            className="flex items-center px-3 py-2 text-sm font-medium rounded text-white bg-white/15"
-          >
-            Applications
-          </Link>
-        </nav>
-      </aside>
+      <SidebarNav />
 
       {/* Main content */}
       <main className="flex-1 p-6 overflow-auto bg-background">
diff --git a/apps/web/src/app/dashboard/(protected)/page.tsx b/apps/web/src/app/dashboard/(protected)/page.tsx
new file mode 100644
index 0000000..71a5690
--- /dev/null
+++ b/apps/web/src/app/dashboard/(protected)/page.tsx
@@ -0,0 +1,79 @@
+'use client'
+
+import { useState, useMemo } from 'react'
+import { ApplicationFilters, type TabType } from '@/components/dashboard/ApplicationFilters'
+import { ApplicationTable } from '@/components/dashboard/ApplicationTable'
+import { useApplications } from '@/hooks/use-applications'
+import type { ApplicationData } from '@david-agency/shared'
+
+export default function DashboardPage() {
+  const [activeTab, setActiveTab] = useState<TabType>('raw')
+  const [searchQuery, setSearchQuery] = useState('')
+  
+  const { data: applications = [], isLoading } = useApplications()
+
+  const counts = useMemo(() => {
+    const defaultCounts: Record<TabType, number> = {
+      all: 0,
+      raw: 0,
+      ready: 0,
+      submitted: 0,
+      done: 0,
+    }
+    
+    applications.forEach((app: ApplicationData) => {
+      defaultCounts.all++
+      if (app.status in defaultCounts) {
+        defaultCounts[app.status as TabType]++
+      }
+    })
+    
+    return defaultCounts
+  }, [applications])
+
+  const filteredApplications = useMemo(() => {
+    return applications.filter((app: ApplicationData) => {
+      // Tab filter
+      if (activeTab !== 'all' && app.status !== activeTab) {
+        return false
+      }
+      
+      // Search filter
+      if (searchQuery.trim()) {
+        const query = searchQuery.toLowerCase()
+        const fullName = `${app.firstName} ${app.lastName}`.toLowerCase()
+        const idMatch = app.appId.toLowerCase().includes(query)
+        const nameMatch = fullName.includes(query)
+        
+        if (!idMatch && !nameMatch) {
+          return false
+        }
+      }
+      
+      return true
+    })
+  }, [applications, activeTab, searchQuery])
+
+  return (
+    <div className="space-y-6">
+      <div>
+        <h1 className="text-2xl font-semibold text-foreground mb-1">Applications</h1>
+        <p className="text-sm text-muted-foreground">Manage and track visa applications.</p>
+      </div>
+      
+      <ApplicationFilters
+        activeTab={activeTab}
+        setActiveTab={setActiveTab}
+        searchQuery={searchQuery}
+        setSearchQuery={setSearchQuery}
+        counts={counts}
+      />
+      
+      <ApplicationTable
+        applications={filteredApplications}
+        isLoading={isLoading}
+        activeTab={activeTab}
+      />
+    </div>
+  )
+}
diff --git a/apps/web/src/app/dashboard/page.tsx b/apps/web/src/app/dashboard/page.tsx
deleted file mode 100644
index 9618b45..0000000
--- a/apps/web/src/app/dashboard/page.tsx
+++ /dev/null
@@ -1,8 +0,0 @@
-export default function DashboardPage() {
-  return (
-    <div>
-      <h1 className="text-2xl font-bold text-foreground mb-2">Applications</h1>
-      <p className="text-muted-foreground">Application list will be built in Story 3.3.</p>
-    </div>
-  )
-}
diff --git a/apps/web/src/app/layout.tsx b/apps/web/src/app/layout.tsx
index d97cb5a..b671232 100644
--- a/apps/web/src/app/layout.tsx
+++ b/apps/web/src/app/layout.tsx
@@ -4,6 +4,8 @@ import { Geist, Geist_Mono } from "next/font/google";
 import { Toaster } from "@/components/ui/sonner";
 import "./globals.css";
 import RecaptchaProvider from "@/components/providers/RecaptchaProvider";
+import { Providers } from "./providers";
+
 const geistSans = Geist({
   variable: "--font-geist-sans",
   subsets: ["latin"],
@@ -30,10;12 @@ export default function RootLayout({
       className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
     >
       <body className="min-h-full flex flex-col">
-        <RecaptchaProvider>
-          {children}
-          <Toaster position="bottom-center" />
-        </RecaptchaProvider>
+        <Providers>
+          <RecaptchaProvider>
+            {children}
+            <Toaster position="bottom-center" />
+          </RecaptchaProvider>
+        </Providers>
       </body>
     </html>
   );
diff --git a/apps/web/src/app/providers.tsx b/apps/web/src/app/providers.tsx
new file mode 100644
index 0000000..207e9fe
--- /dev/null
+++ b/apps/web/src/app/providers.tsx
@@ -0,0 +1,20 @@
+'use client'
+
+import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
+import { useState } from 'react'
+
+export function Providers({ children }: { children: React.ReactNode }) {
+  const [queryClient] = useState(() => new QueryClient({
+    defaultOptions: {
+      queries: {
+        staleTime: 60 * 1000, // 1 minute
+      },
+    },
+  }))
+
+  return (
+    <QueryClientProvider client={queryClient}>
+      {children}
+    </QueryClientProvider>
+  )
+}
diff --git a/apps/web/src/components/dashboard/ApplicationFilters.tsx b/apps/web/src/components/dashboard/ApplicationFilters.tsx
new file mode 100644
index 0000000..e5f6bd0
--- /dev/null
+++ b/apps/web/src/components/dashboard/ApplicationFilters.tsx
@@ -0,0 +1,66 @@
+import { Input } from "@/components/ui/input"
+import { Search } from "lucide-react"
+
+export type TabType = "all" | "raw" | "ready" | "submitted" | "done"
+
+interface ApplicationFiltersProps {
+  activeTab: TabType;
+  setActiveTab: (tab: TabType) => void;
+  searchQuery: string;
+  setSearchQuery: (query: string) => void;
+  counts: Record<TabType, number>;
+}
+
+const TABS: { id: TabType; label: string }[] = [
+  { id: "raw", label: "Raw" },
+  { id: "all", label: "All" },
+  { id: "ready", label: "Ready" },
+  { id: "submitted", label: "Submitted" },
+  { id: "done", label: "Done" },
+]
+
+export function ApplicationFilters({
+  activeTab,
+  setActiveTab,
+  searchQuery,
+  setSearchQuery,
+  counts,
+}: ApplicationFiltersProps) {
+  return (
+    <div className="space-y-4">
+      {/* Tabs */}
+      <div className="flex items-center gap-6 border-b border-border">
+        {TABS.map((tab) => (
+          <button
+            key={tab.id}
+            onClick={() => setActiveTab(tab.id)}
+            className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium transition-colors ${
+              activeTab === tab.id
+                ? "border-b-2 border-accent text-foreground"
+                : "text-muted-foreground hover:text-foreground"
+            }`}
+          >
+            {tab.label}
+            {counts[tab.id] > 0 && (
+              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
+                {counts[tab.id]}
+              </span>
+            )}
+          </button>
+        ))}
+      </div>
+
+      {/* Search */}
+      <div className="relative max-w-sm">
+        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
+        <Input
+          type="search"
+          placeholder="Search by name or ID..."
+          className="pl-8"
+          value={searchQuery}
+          onChange={(e) => setSearchQuery(e.target.value)}
+        />
+      </div>
+    </div>
+  )
+}
diff --git a/apps/web/src/components/dashboard/ApplicationTable.tsx b/apps/web/src/components/dashboard/ApplicationTable.tsx
new file mode 100644
index 0000000..0bf6cc7
--- /dev/null
+++ b/apps/web/src/components/dashboard/ApplicationTable.tsx
@@ -0,0 +1,118 @@
+import {
+  Table,
+  TableBody,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from "@/components/ui/table"
+import { Skeleton } from "@/components/ui/skeleton"
+import { useRouter } from "next/navigation"
+import { StatusBadge } from "./StatusBadge"
+import type { ApplicationData } from "@david-agency/shared"
+
+interface ApplicationTableProps {
+  applications: ApplicationData[];
+  isLoading: boolean;
+  activeTab: string;
+}
+
+export function ApplicationTable({
+  applications,
+  isLoading,
+  activeTab,
+}: ApplicationTableProps) {
+  const router = useRouter()
+
+  if (isLoading) {
+    return (
+      <div className="rounded-md border border-border bg-white">
+        <Table>
+          <TableHeader>
+            <TableRow>
+              <TableHead>Application ID</TableHead>
+              <TableHead>Applicant Name</TableHead>
+              <TableHead>Arrival Date</TableHead>
+              <TableHead>Status</TableHead>
+              <TableHead>Submitted At</TableHead>
+            </TableRow>
+          </TableHeader>
+          <TableBody>
+            {Array.from({ length: 5 }).map((_, i) => (
+              <TableRow key={i}>
+                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
+                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
+                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
+                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
+                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
+              </TableRow>
+            ))}
+          </TableBody>
+        </Table>
+      </div>
+    )
+  }
+
+  if (applications.length === 0) {
+    const statusText = activeTab === 'all' ? '' : activeTab
+    return (
+      <div className="flex flex-col items-center justify-center rounded-md border border-border border-dashed py-16 text-center">
+        <h3 className="text-lg font-medium text-foreground">
+          {activeTab === 'all' ? "No applications yet." : `No ${statusText} applications.`}
+        </h3>
+        <p className="mt-1 text-sm text-muted-foreground">
+          Applications will appear here once they reach {activeTab === 'all' ? 'the system' : `${statusText} status`}.
+        </p>
+      </div>
+    )
+  }
+
+  return (
+    <div className="rounded-md border border-border bg-white">
+      <Table>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Application ID</TableHead>
+            <TableHead>Applicant Name</TableHead>
+            <TableHead>Arrival Date</TableHead>
+            <TableHead>Status</TableHead>
+            <TableHead>Submitted At</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {applications.map((app) => (
+            <TableRow
+              key={app.id}
+              className="cursor-pointer hover:bg-muted"
+              onClick={() => router.push(`/dashboard/applications/${app.id}`)}
+            >
+              <TableCell className="font-mono text-xs text-muted-foreground">{app.appId}</TableCell>
+              <TableCell className="font-medium">
+                {app.lastName} {app.firstName}
+              </TableCell>
+              <TableCell>
+                {new Intl.DateTimeFormat('en-US', {
+                  month: 'short',
+                  day: 'numeric',
+                  year: 'numeric'
+                }).format(new Date(app.arrivalDate))}
+              </TableCell>
+              <TableCell>
+                <StatusBadge status={app.status} />
+              </TableCell>
+              <TableCell className="text-muted-foreground text-sm">
+                {new Intl.DateTimeFormat('en-US', {
+                  month: 'short',
+                  day: 'numeric',
+                  year: 'numeric',
+                  hour: 'numeric',
+                  minute: '2-digit'
+                }).format(new Date(app.createdAt))}
+              </TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </div>
+  )
+}
diff --git a/apps/web/src/components/dashboard/SidebarNav.tsx b/apps/web/src/components/dashboard/SidebarNav.tsx
new file mode 100644
index 0000000..dd06b08
--- /dev/null
+++ b/apps/web/src/components/dashboard/SidebarNav.tsx
@@ -0,0 +1,72 @@
+'use client'
+
+import Link from 'next/link'
+import { usePathname, useRouter } from 'next/navigation'
+import { LayoutDashboard, LogOut } from 'lucide-react'
+import { createClient } from '@/lib/supabase-client'
+
+const navItems = [
+  {
+    label: 'Applications',
+    href: '/dashboard',
+    icon: LayoutDashboard,
+  },
+]
+
+export function SidebarNav() {
+  const pathname = usePathname()
+  const router = useRouter()
+
+  const handleLogout = async () => {
+    const supabase = createClient()
+    await supabase.auth.signOut()
+    router.push('/dashboard/login')
+    router.refresh()
+  }
+
+  return (
+    <aside className="w-60 shrink-0 bg-primary text-white flex flex-col h-screen">
+      {/* Logo area — px-4 py-5 border-b border-white/10 per UX-DR3 */}
+      <div className="px-4 py-5 border-b border-white/10">
+        <span className="text-sm font-semibold">David Agency</span>
+      </div>
+
+      {/* Nav items */}
+      <nav className="flex-1 px-2 py-3 space-y-1">
+        {navItems.map((item) => {
+          // Active when exact match or when on a sub-route (e.g. /dashboard/applications/[id])
+          const isActive =
+            pathname === item.href ||
+            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
+          const Icon = item.icon
+          return (
+            <Link
+              key={item.href}
+              href={item.href}
+              className={[
+                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors',
+                isActive
+                  ? 'bg-white/15 text-white'
+                  : 'text-white/80 hover:bg-white/10 hover:text-white',
+              ].join(' ')}
+            >
+              <Icon className="h-4 w-4" />
+              {item.label}
+            </Link>
+          )
+        })}
+      </nav>
+
+      {/* Logout button at bottom */}
+      <div className="px-2 pb-4 border-t border-white/10 pt-3">
+        <button
+          onClick={handleLogout}
+          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded text-white/80 hover:bg-white/10 hover:text-white transition-colors"
+        >
+          <LogOut className="h-4 w-4" />
+          Sign Out
+        </button>
+      </div>
+    </aside>
+  )
+}
diff --git a/apps/web/src/components/dashboard/StatusBadge.tsx b/apps/web/src/components/dashboard/StatusBadge.tsx
new file mode 100644
index 0000000..255232b
--- /dev/null
+++ b/apps/web/src/components/dashboard/StatusBadge.tsx
@@ -0,0 +1,23 @@
+import type { ApplicationStatus } from '@david-agency/shared'
+
+const variants = {
+  raw: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
+  ready: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
+  submitted: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
+  done: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
+}
+
+const labels = {
+  raw: 'Raw',
+  ready: 'Ready',
+  submitted: 'Submitted',
+  done: 'Done',
+}
+
+export function StatusBadge({ status }: { status: ApplicationStatus }) {
+  return (
+    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variants[status]}`}>
+      {labels[status]}
+    </span>
+  )
+}
diff --git a/apps/web/src/hooks/use-applications.ts b/apps/web/src/hooks/use-applications.ts
new file mode 100644
index 0000000..101d784
--- /dev/null
+++ b/apps/web/src/hooks/use-applications.ts
@@ -0,0 +1,32 @@
+import { useQuery } from '@tanstack/react-query'
+import { createClient } from '@/lib/supabase-client'
+import type { ApplicationData } from '@david-agency/shared'
+
+export function useApplications() {
+  return useQuery({
+    queryKey: ['applications'],
+    queryFn: async () => {
+      const supabase = createClient()
+      const { data, error } = await supabase
+        .from('applications')
+        .select('*')
+        .order('created_at', { ascending: false })
+
+      if (error) throw error
+
+      return data.map((item) => ({
+        id: item.id,
+        appId: item.app_id,
+        lastName: item.last_name,
+        firstName: item.first_name,
+        email: item.email,
+        arrivalDate: item.arrival_date,
+        status: item.status,
+        portraitPath: item.portrait_path,
+        passportPath: item.passport_path,
+        createdAt: item.created_at,
+        updatedAt: item.updated_at,
+      })) as ApplicationData[]
+    }
+  })
+}
```
