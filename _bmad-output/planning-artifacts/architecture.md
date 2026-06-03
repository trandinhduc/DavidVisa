---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-05-30'
inputDocuments: ['prds/prd-VisaAgency-2026-05-30/prd.md']
workflowType: 'architecture'
project_name: 'VisaAgency'
user_name: 'Richard'
date: '2026-05-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:** 21 FRs / 5 feature groups
- Public Form: FR-1→6 (form, HEIC upload, reCAPTCHA, submit idempotency)
- Notifications: FR-7→8 (email + WhatsApp triggers, deferred API setup)
- Dashboard: FR-9→15 (auth, list/filter/search, edit, Create Data workflow, pre-push modal, status tracking)
- Chrome Extension: FR-16→19 (auto-fill evisa.gov.vn, operator-confirmed submit)
- Security & Storage: FR-20→21 (private bucket + signed URLs, Supabase RLS)

**Non-Functional Requirements:**
- HTTPS everywhere, Supabase RLS bắt buộc toàn bộ tables
- Form load < 2s trên 4G mobile
- Dashboard list < 1s cho 500 records
- Ảnh chỉ accessible qua Signed URL có thời hạn

**Scale & Complexity:**
- Primary domain: Full-stack Web (Next.js) + Chrome Extension (Manifest V3)
- Complexity level: Thấp-Trung bình
- Single operator, không multi-tenancy, không real-time (không cần WebSocket)
- ~500 records MVP — không có vấn đề performance

### Technical Constraints & Dependencies

- Supabase: Auth, Database, Storage, Edge Functions, Webhooks
- Chrome Extension: Manifest V3, Developer mode only (manual install)
- HEIC conversion: phía client (heic2any), không cần server processing
- evisa.gov.vn: không có API, chỉ DOM automation qua content script
- Email provider: TBD — API key deferred (code built, key configured later)
- WhatsApp Business API: TBD — deferred (code built, key configured later)

### Cross-Cutting Concerns

1. **Auth & RLS** — Supabase Auth + Row Level Security bảo vệ toàn bộ data access
2. **File pipeline** — HEIC convert (client) → upload → private bucket → signed URL serve
3. **Notification triggers** — status change → Webhook → Edge Function → email/WhatsApp
4. **Dashboard ↔ Extension protocol** — chrome.runtime.sendMessage + chrome.storage
5. **Application ID uniqueness** — Supabase SEQUENCE, atomic at DB layer

### Cascading Failure Analysis

| Failure | Impact | Mitigation |
|---|---|---|
| Supabase down | Hệ thống tê liệt hoàn toàn | Accepted (99.9% SLA); friendly error + keep form data |
| evisa.gov.vn DOM change | Extension fail | **Manual Export fallback** button trên Dashboard |
| Email provider down | Silent notification failure | Retry 3x + exponential backoff + Dashboard "failed" badge |
| Extension comm break | Không push được | chrome.runtime.sendMessage với error handling rõ ràng |
| HEIC conversion fail | iPhone users bị block | Fallback error message + hướng dẫn convert |

**Critical addition:** Dashboard cần "Manual Export" — download Application data (JSON/CSV) để Richard tự fill evisa.gov.vn khi Extension bị hỏng.

### Architecture Decision Records

| ADR | Quyết định | Rationale |
|---|---|---|
| ADR-001 | Next.js + Vercel | Single codebase, built-in API Routes, SSR, excellent DX |
| ADR-002 | chrome.runtime.sendMessage + chrome.storage.local | Secure origin verification, Extension-only storage |
| ADR-003 | Supabase Webhook → Edge Function + retry + notification_logs | Decoupled, atomic, auditable |
| ADR-004 | Supabase SEQUENCE | Atomic ID generation, no race conditions |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web + Chrome Extension — dựa trên ADR-001 (Next.js + Vercel) và yêu cầu Chrome Extension Manifest V3.

### Starter 1: Next.js App (Form + Dashboard)

**Initialization Command:**

```bash
npx create-next-app@latest david-agency \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**Architectural Decisions Provided:**

| Quyết định | Lựa chọn |
|---|---|
| Language | TypeScript |
| Styling | Tailwind CSS |
| Router | App Router (Next.js 14+) |
| Linting | ESLint |
| Folder structure | `src/` directory |
| Build tool | Turbopack (dev) |
| Deployment | Vercel (zero-config) |

### Starter 2: Chrome Extension (Plasmo Framework)

**Rationale:** Plasmo xử lý Manifest V3 boilerplate (content scripts, background service worker, chrome.storage) một cách clean — phù hợp với yêu cầu ADR-002.

**Initialization Command:**

```bash
npx create-plasmo david-agency-extension
```

**Architectural Decisions Provided:**
- React + TypeScript + HMR built-in
- Auto-generates `manifest.json`
- Content script và background worker được wire up tự động
- chrome.storage và chrome.runtime ready to use

### Repository Structure

```
david-agency/
├── apps/
│   ├── web/          ← Next.js (Form + Dashboard)
│   └── extension/    ← Plasmo (Chrome Extension)
├── packages/
│   └── shared/       ← Shared TypeScript types (ApplicationData, Status, etc.)
└── package.json      ← pnpm workspaces
```

**Note:** Monorepo với pnpm workspaces — types `ApplicationData` và `ApplicationStatus` được share giữa web app và extension, không bao giờ out-of-sync. Project initialization là implementation story đầu tiên.

## Core Architectural Decisions

### Quyết định đã xác nhận

**D1 — Data Fetching Pattern (Hybrid)**
- Form submit → Next.js API Route `/api/applications` → Supabase Service Role key (ẩn key, an toàn)
- Dashboard read → Supabase JS client trực tiếp + Anon key + RLS (đơn giản, nhanh)
- Dashboard mutations (edit, status update) → Next.js API Route (có thể trigger webhook)

**D2 — UI Component Library: shadcn/ui**
- Copy-paste components, Tailwind-based, không lock-in
- Có sẵn: Table, Modal, Button, Badge, Dialog — đúng những gì Dashboard cần

**D3 — Form Handling: React Hook Form + Zod**
- Schema validation TypeScript-native
- Xử lý complex validation: HEIC check, date format, required fields, file size

**D4 — State Management: TanStack Query (React Query)**
- Server-side data fetching với client-side cache
- Optimistic updates, auto-refetch sau status change
- Không cần global store (Zustand) — data chủ yếu server-driven

**D5 — Error Monitoring: Vercel Analytics (MVP)**
- Zero-config, built-in với Vercel deployment
- Structure sẵn để thêm Sentry sau nếu cần

**D6 — Database Schema**

```sql
-- Table: applications
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
app_id        text UNIQUE NOT NULL        -- DA-2026-0001
last_name     text NOT NULL
first_name    text NOT NULL
email         text NOT NULL
arrival_date  date NOT NULL
status        text DEFAULT 'raw'          -- raw | ready | submitted | done
portrait_path text                        -- Supabase Storage path
passport_path text                        -- Supabase Storage path
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()

-- Table: notification_logs
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
application_id uuid REFERENCES applications(id)
type           text NOT NULL              -- received | submitted
channel        text NOT NULL             -- email | whatsapp
status         text NOT NULL             -- success | failed
attempt        int DEFAULT 1
created_at     timestamptz DEFAULT now()
```

### Decision Impact Summary

**Implementation sequence:**
1. Supabase setup (schema, RLS, Storage bucket, sequences)
2. Next.js monorepo scaffold (pnpm workspaces)
3. Shared types package (`packages/shared`)
4. Public Form (`apps/web`) — API Route + React Hook Form + Zod
5. Dashboard (`apps/web`) — TanStack Query + shadcn/ui
6. Edge Functions (notifications)
7. Chrome Extension (`apps/extension`) — Plasmo

**Cross-component dependencies:**
- `packages/shared` types phải tồn tại trước khi build Form hoặc Extension
- Supabase schema phải finalized trước khi viết RLS policies
- API Route `/api/applications` phải ready trước khi Form có thể submit
- Extension phụ thuộc vào Dashboard domain (EXTENSION_ID cần hardcode vào Dashboard config)

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database (snake_case):**
```sql
-- Tables: applications, notification_logs
-- Columns: app_id, last_name, arrival_date, portrait_path, created_at
```

**API Routes (kebab-case):** `/api/applications`, `/api/applications/[id]/status`

**JSON Response (camelCase):**
```json
{ "appId": "DA-2026-0001", "lastName": "Smith", "arrivalDate": "2026-07-06" }
```

**TypeScript:** PascalCase types/interfaces, camelCase variables/functions

**Files:** `kebab-case.ts` cho utilities/hooks, `PascalCase.tsx` cho components

**Storage paths:** `{app_id}/portrait.jpg`, `{app_id}/passport.jpg`

### API Response Format

```ts
// Success: { data: {...}, error: null }
// Error:   { data: null, error: { message: string, code: string } }
// HTTP: 200 success | 400 validation | 401 unauthorized | 404 not found | 500 server
```

### Date Format Rules

| Context | Format | Example |
|---|---|---|
| Database | ISO date string | `2026-07-06` |
| API JSON | ISO string | `"2026-07-06"` |
| Form input | DD/MM/YYYY | user-facing + real-time confirm |
| UI display | Human-readable | `July 6, 2026` |

### Extension ↔ Dashboard Message Protocol

```ts
// packages/shared/types.ts
interface PushToEvisaMessage {
  type: 'PUSH_TO_EVISA'
  applicationId: string      // uuid
  appId: string              // DA-2026-0001
  lastName: string
  firstName: string
  arrivalDate: string        // "2026-07-06"
  portraitSignedUrl: string  // expires 1hr
  passportSignedUrl: string  // expires 1hr
}

// Extension MUST verify sender origin before processing
chrome.runtime.onMessageExternal.addListener((msg, sender) => {
  if (sender.origin !== 'https://david-agency.vercel.app') return
})
```

### Application Status Rules

```ts
type ApplicationStatus = 'raw' | 'ready' | 'submitted' | 'done'
// One-way only — no reverse transitions
// Edit button:        status === 'raw'
// Create Data button: status === 'raw'
// Push to eVisa:      status === 'ready'
```

### Next.js Component Rules

- Default: Server Component (data fetching, no interactivity)
- `'use client'`: Forms, modals, toast, event handlers only

### Mandatory Rules for All Agents

1. `snake_case` database, `camelCase` JSON/TypeScript
2. Wrap all API responses in `{ data, error }` structure
3. Import shared types from `packages/shared` — never redefine
4. Store images at `{app_id}/portrait.jpg` and `{app_id}/passport.jpg`
5. Never reverse Application status flow
6. Always verify Extension message origin
7. Always use Signed URLs — never expose raw storage paths

## Project Structure & Boundaries

### Complete Project Directory Structure

```
david-agency/
├── package.json                       ← pnpm workspaces config
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
│
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── types.ts               ← ApplicationData, ApplicationStatus, PushToEvisaMessage
│           └── constants.ts           ← STATUS_FLOW, EXTENSION_ID
│
├── apps/
│   ├── web/                           ← Next.js (Form + Dashboard)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── components.json
│   │   ├── .env.local
│   │   └── src/
│   │       ├── middleware.ts          ← Auth guard /dashboard/*
│   │       ├── app/
│   │       │   ├── globals.css
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx           ← Public Form (FR-1 đến FR-6)
│   │       │   ├── success/
│   │       │   │   └── page.tsx       ← Success + DA code (FR-5, FR-6)
│   │       │   ├── dashboard/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── login/
│   │       │   │   │   └── page.tsx   ← Auth login (FR-9)
│   │       │   │   ├── page.tsx       ← Applications list (FR-10)
│   │       │   │   └── applications/
│   │       │   │       └── [id]/
│   │       │   │           └── page.tsx ← Detail + workflow (FR-11 đến FR-15)
│   │       │   └── api/
│   │       │       └── applications/
│   │       │           ├── route.ts          ← POST submit (FR-5, FR-6)
│   │       │           └── [id]/
│   │       │               ├── route.ts      ← GET/PUT (FR-11, FR-12)
│   │       │               ├── status/
│   │       │               │   └── route.ts  ← PUT status (FR-15)
│   │       │               └── signed-urls/
│   │       │                   └── route.ts  ← GET signed URLs (FR-20)
│   │       ├── components/
│   │       │   ├── ui/                ← shadcn/ui components
│   │       │   ├── form/
│   │       │   │   ├── ApplicationForm.tsx
│   │       │   │   ├── ImageUpload.tsx        ← HEIC support (FR-2)
│   │       │   │   ├── DateInput.tsx          ← Real-time confirm (FR-3)
│   │       │   │   └── RecaptchaWrapper.tsx   ← reCAPTCHA (FR-4)
│   │       │   └── dashboard/
│   │       │       ├── ApplicationTable.tsx   ← FR-10
│   │       │       ├── ApplicationFilters.tsx ← FR-10
│   │       │       ├── ApplicationDetail.tsx  ← FR-11
│   │       │       ├── ApplicationImages.tsx  ← FR-11, FR-20
│   │       │       ├── EditModal.tsx          ← FR-12
│   │       │       ├── CreateDataModal.tsx    ← FR-13
│   │       │       ├── PushConfirmModal.tsx   ← FR-14
│   │       │       ├── ManualExport.tsx       ← Extension fallback
│   │       │       ├── StatusBadge.tsx        ← FR-15
│   │       │       └── NotificationBadge.tsx  ← Notification failed alert
│   │       ├── hooks/
│   │       │   ├── use-applications.ts
│   │       │   ├── use-application.ts
│   │       │   └── use-signed-urls.ts
│   │       └── lib/
│   │           ├── supabase-client.ts         ← Browser (anon key)
│   │           ├── supabase-server.ts         ← Server (service role)
│   │           ├── heic-convert.ts            ← FR-2
│   │           ├── application-id.ts
│   │           └── utils.ts
│   │
│   └── extension/                     ← Plasmo Chrome Extension
│       ├── package.json
│       └── src/
│           ├── background.ts          ← Message listener (FR-16)
│           ├── contents/
│           │   └── evisa-filler.ts    ← Auto-fill (FR-17, FR-18)
│           └── popup.tsx
│
└── supabase/
    ├── functions/
    │   ├── notify-received/
    │   │   └── index.ts               ← FR-7
    │   └── notify-submitted/
    │       └── index.ts               ← FR-8
    └── migrations/
        ├── 001_create_applications.sql
        ├── 002_create_notification_logs.sql
        ├── 003_create_rls_policies.sql
        └── 004_create_application_sequence.sql
```

### API Boundaries

| Route | Method | Auth | FR |
|---|---|---|---|
| `/api/applications` | POST | anon + reCAPTCHA | FR-5, FR-6 |
| `/api/applications/[id]` | GET | Service Role | FR-11 |
| `/api/applications/[id]` | PUT | Service Role | FR-12 |
| `/api/applications/[id]/status` | PUT | Service Role | FR-15 |
| `/api/applications/[id]/signed-urls` | GET | Service Role | FR-20 |

### Data Flow

```
Applicant → POST /api/applications → Supabase DB + Storage
  → Webhook → notify-received Edge Function → Email

Richard → Dashboard (Supabase JS client, RLS)
  → Mutations via API Routes (service role)
  → chrome.runtime.sendMessage → Extension background.ts
  → evisa-filler.ts content script → evisa.gov.vn DOM
  → Richard submits → PUT /api/applications/[id]/status
  → Webhook → notify-submitted Edge Function → Email
```

### FR → File Mapping

| FR Group | Files |
|---|---|
| FR-1 đến FR-6 (Form) | `app/page.tsx`, `components/form/*` |
| FR-2 (HEIC) | `lib/heic-convert.ts`, `ImageUpload.tsx` |
| FR-3 (Date) | `components/form/DateInput.tsx` |
| FR-4 (reCAPTCHA) | `components/form/RecaptchaWrapper.tsx` |
| FR-7, FR-8 (Notifications) | `supabase/functions/notify-*/index.ts` |
| FR-9 (Auth) | `middleware.ts`, `dashboard/login/page.tsx` |
| FR-10 (List) | `dashboard/page.tsx`, `ApplicationTable.tsx` |
| FR-11 đến FR-15 (Dashboard workflow) | `dashboard/applications/[id]/page.tsx`, `dashboard/components/*` |
| FR-16 đến FR-18 (Extension) | `extension/src/background.ts`, `contents/evisa-filler.ts` |
| FR-20, FR-21 (Security) | `lib/supabase-server.ts`, `migrations/003_rls.sql` |

## Architecture Validation Results

### Coherence Validation ✅

Tất cả công nghệ compatible: Next.js 14 + Supabase JS + TanStack Query + shadcn/ui + Plasmo + pnpm workspaces. TypeScript xuyên suốt. Patterns nhất quán. 21/21 FRs mapped đến files cụ thể.

### Requirements Coverage ✅

| Group | FRs | Status |
|---|---|---|
| Public Form | FR-1→6 | ✅ Covered |
| Notifications | FR-7, FR-8 | ✅ Covered |
| Dashboard | FR-9→15 | ✅ Covered |
| Extension | FR-16→19 | ✅ Covered |
| Security | FR-20, FR-21 | ✅ Covered |

NFRs: HTTPS (Vercel auto), performance (SSR + edge + TanStack cache), security (RLS + private bucket + signed URLs) — tất cả addressed.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented (4 ADRs + 6 core decisions)
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Gap Analysis

**Critical Gaps:** Không có

**Minor (non-blocking):**
- Environment variables list → document trong `.env.example`
- Testing strategy → defer đến implementation
- CI/CD → Vercel auto-deploy + GitHub Actions lint/typecheck

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION** ✅
**Confidence Level:** High

**Key Strengths:**
- Supabase làm backbone — minimal infrastructure complexity
- Monorepo + shared types — không bao giờ type mismatch
- Plasmo abstracts Manifest V3 complexity
- Manual Export fallback — resilient khi evisa.gov.vn thay đổi

**Areas for Future Enhancement:** Batch processing, WhatsApp API, advanced image validation, full audit log

### Implementation Handoff — First Steps

```bash
# 1. Scaffold monorepo
mkdir david-agency && cd david-agency && pnpm init

# 2. Next.js app
cd apps && npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir

# 3. Plasmo extension  
cd apps && npx create-plasmo extension

# 4. Supabase
supabase init && supabase start
```

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Import shared types from `packages/shared` — never redefine
- Use `{ data, error }` wrapper for all API responses
- Never expose storage paths — always use Signed URLs
- Respect one-way status flow: raw → ready → submitted → done
