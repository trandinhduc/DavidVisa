---
baseline_commit: NO_VCS
---

# Story 1.4: Brand Tokens & shadcn/ui Design System Setup

Status: done

## Story

As an operator and as an applicant,
I want the web app to use David Agency's brand colors and component library,
so that all UI built in subsequent stories consistently reflects the correct visual identity.

## Acceptance Criteria

1. `components.json` là configured cho App Router + Tailwind + TypeScript ở `apps/web/components.json`
2. `globals.css` chứa HSL-converted overrides: `--primary` (#0A2342), `--accent` (#1D4ED8), `--success` (#16A34A), `--warning` (#D97706), `--destructive` (#DC2626), `--muted` (#F1F5F9), `--border` (#E2E8F0), `--muted-foreground` (#64748B)
3. Các shadcn components sau được install: Button, Input, Label, Dialog, Badge, Table, Tabs, Sonner, Skeleton
4. Manual spot-check xác nhận `<Button>` render với navy background (#0A2342)
5. `pnpm typecheck && pnpm lint` pass không có errors từ monorepo root

## Tasks / Subtasks

- [x] Task 1: Init shadcn/ui trong `apps/web` (AC: 1)
  - [x] 1.1 Từ `apps/web/`, chạy: `pnpm dlx shadcn@latest init` — chọn options: TypeScript=Yes, App Router=Yes, import alias=`@/*`, Tailwind=Yes
  - [x] 1.2 Verify `apps/web/components.json` được tạo với đúng config (xem Dev Notes)
  - [x] 1.3 Verify `apps/web/src/lib/utils.ts` được tạo với `cn()` helper — KHÔNG override nếu đã tồn tại

- [x] Task 2: Override brand CSS variables trong `globals.css` (AC: 2)
  - [x] 2.1 Mở `apps/web/src/app/globals.css` — xóa toàn bộ dark mode media query `@media (prefers-color-scheme: dark) { ... }` (không có dark mode trong MVP)
  - [x] 2.2 Thêm `@layer base { :root { ... } }` block với đầy đủ shadcn CSS variables + brand overrides (xem Dev Notes — exact values)
  - [x] 2.3 Đảm bảo `@theme inline {}` block map tất cả `--color-*` values từ CSS variables (xem Dev Notes)

- [x] Task 3: Install required shadcn components (AC: 3)
  - [x] 3.1 Từ `apps/web/`, chạy: `pnpm dlx shadcn@latest add button input label dialog badge table tabs sonner skeleton`
  - [x] 3.2 Verify tất cả component files tồn tại tại `apps/web/src/components/ui/`
  - [x] 3.3 Verify `sonner` package được thêm vào `apps/web/package.json` dependencies

- [x] Task 4: Verify brand tokens hoạt động (AC: 4)
  - [x] 4.1 Tạo tạm `apps/web/src/app/page.tsx` test render: import Button từ `@/components/ui/button`, render `<Button>Test</Button>`, chạy `pnpm dev` ở `apps/web`
  - [x] 4.2 Mở browser http://localhost:3000 — xác nhận Button có navy (#0A2342) background
  - [x] 4.3 Restore `apps/web/src/app/page.tsx` về trạng thái trước (hoặc giữ một simple placeholder nếu chưa có content)

- [x] Task 5: Final verification (AC: 5)
  - [x] 5.1 Từ monorepo root, chạy: `pnpm typecheck` — phải pass 3/3 packages
  - [x] 5.2 Từ monorepo root, chạy: `pnpm lint` (nếu có script ở root) hoặc `pnpm --filter web lint` — phải pass không có errors

### Review Findings

- [x] [Review][Decision] `sonner.tsx` dùng `useTheme()` nhưng không có `ThemeProvider` → resolved: hardcode `theme="light"`, bỏ `useTheme` và `next-themes` import
- [x] [Review][Patch] `--radius: var(--radius)` tự tham chiếu chính nó trong `@theme inline` — fixed: thay bằng `--radius-sm/md/lg/xl` scale [apps/web/src/app/globals.css:77]
- [x] [Review][Patch] `body {}` dùng bare HSL triplets không có `hsl()` wrapper — fixed: `background: hsl(var(--background))`, `color: hsl(var(--foreground))` [apps/web/src/app/globals.css:81-83]
- [x] [Review][Patch] `sonner.tsx` dùng `React.ComponentProps` namespace mà không import React — fixed: thêm `import * as React from "react"` [apps/web/src/components/ui/sonner.tsx:13]
- [x] [Review][Patch] `skeleton.tsx` dùng `React.HTMLAttributes` type mà không import React — fixed: thêm `import * as React from "react"` [apps/web/src/components/ui/skeleton.tsx:4]
- [x] [Review][Defer] `@supabase/ssr ^0.10.3` có thể outdated — deferred, pre-existing từ Story 1.3
- [x] [Review][Defer] `@david-agency/shared` không có explicit turbo build dependency — deferred, pre-existing từ Story 1.1

## Dev Notes

### CRITICAL: Next.js 16

`apps/web` dùng **Next.js 16.2.6** — khác với Next.js 14/15 trên training data. Đọc `apps/web/node_modules/next/dist/docs/` trước khi viết bất kỳ Next.js code nào. `AGENTS.md` và `CLAUDE.md` tại `apps/web/` đều cảnh báo điều này.

### CRITICAL: Tailwind CSS v4

Dự án dùng **Tailwind CSS v4** — khác hoàn toàn với v3:
- **KHÔNG có `tailwind.config.ts`** — file này không tồn tại và không được tạo
- `globals.css` dùng `@import "tailwindcss"` (không phải `@tailwind base/components/utilities`)
- Brand tokens đi vào `@layer base { :root { ... } }` (CSS vars) + `@theme inline { ... }` (Tailwind class mapping)
- PostCSS plugin: `@tailwindcss/postcss` (xem `apps/web/postcss.config.mjs`)

### shadcn/ui Init cho Tailwind v4

Dùng `shadcn@latest` (v2.x+) — version này support Tailwind v4 natively. Chạy từ `apps/web/`:

```bash
pnpm dlx shadcn@latest init
```

Khi hỏi, chọn:
- TypeScript: **Yes**
- Which style: **Default**
- Base color: **Slate** (sẽ override trong Task 2)
- Global CSS file: `src/app/globals.css`
- CSS variables: **Yes**
- Tailwind config: **(để trống / không áp dụng cho v4)**
- Components location: `@/components`
- Utilities location: `@/lib/utils`
- Server component: **Yes** (React Server Components)
- Import alias: `@/*`

Sau khi init, `components.json` nên trông như sau:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Exact globals.css Content

Sau khi init, override `apps/web/src/app/globals.css` với content này (giữ nguyên `@import "tailwindcss"` ở đầu, xóa dark mode media query):

```css
@import "tailwindcss";

@layer base {
  :root {
    /* ── Background & Foreground ── */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    /* ── Brand Primary (Navy #0A2342) ── */
    --primary: 213 74% 15%;
    --primary-foreground: 0 0% 100%;

    /* ── Card ── */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;

    /* ── Popover ── */
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* ── Secondary ── */
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;

    /* ── Muted (#F1F5F9 / #64748B) ── */
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;

    /* ── Accent (#1D4ED8) ── */
    --accent: 224 76% 48%;
    --accent-foreground: 0 0% 100%;

    /* ── Destructive (#DC2626) ── */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    /* ── Border & Input (#E2E8F0) ── */
    --border: 214 32% 91%;
    --input: 214 32% 91%;

    /* ── Ring ── */
    --ring: 224 76% 48%;

    /* ── Radius ── */
    --radius: 0.375rem;

    /* ── Custom brand tokens (not standard shadcn) ── */
    --success: 142 76% 36%;
    --warning: 32 95% 44%;
  }
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --radius: var(--radius);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}
```

> **Lưu ý**: shadcn/ui CLI có thể override `globals.css` khi init — kiểm tra sau khi init và adjust về đúng content trên. Geist font variables (`--font-geist-sans`, `--font-geist-mono`) đã được set bởi `layout.tsx` qua `next/font/google`, không cần thêm `@font-face`.

### Brand Color Reference (Hex → HSL)

| Token | Hex | HSL |
|---|---|---|
| `--primary` | #0A2342 | 213 74% 15% |
| `--primary-foreground` | #FFFFFF | 0 0% 100% |
| `--foreground` | #0F172A | 222 47% 11% |
| `--muted` | #F1F5F9 | 210 40% 96% |
| `--muted-foreground` | #64748B | 215 16% 47% |
| `--border` | #E2E8F0 | 214 32% 91% |
| `--accent` | #1D4ED8 | 224 76% 48% |
| `--success` | #16A34A | 142 76% 36% |
| `--warning` | #D97706 | 32 95% 44% |
| `--destructive` | #DC2626 | 0 72% 51% |

### File Locations

**Files tạo mới trong story này:**
- `apps/web/components.json` — shadcn config
- `apps/web/src/lib/utils.ts` — shadcn `cn()` helper (nếu chưa tồn tại)
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/label.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/table.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/ui/sonner.tsx`
- `apps/web/src/components/ui/skeleton.tsx`

**Files được modify:**
- `apps/web/src/app/globals.css` — thêm brand CSS variables + theme mapping
- `apps/web/package.json` — thêm `sonner` dependency
- `pnpm-lock.yaml`

**Files KHÔNG được touch trong story này:**
- `apps/web/next.config.ts` — đã có `transpilePackages`
- `apps/web/src/lib/supabase-client.ts` — từ Story 1.3
- `apps/web/src/lib/supabase-server.ts` — từ Story 1.3
- `apps/web/src/lib/application-id.ts` — từ Story 1.3
- `apps/web/src/types/supabase.ts` — từ Story 1.3
- `apps/web/src/app/layout.tsx` — không cần thay đổi (Geist fonts đã được setup)
- `supabase/` — không liên quan đến story này

### utils.ts Pattern

shadcn/ui tạo file này tự động. Nếu `apps/web/src/lib/utils.ts` chưa tồn tại, nội dung là:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Nếu đã tồn tại với content khác, **không override** — chỉ thêm `cn()` nếu chưa có.

### Sonner Component

`shadcn add sonner` tạo wrapper component tại `apps/web/src/components/ui/sonner.tsx` và install `sonner` package. Component này là toast/notification system được dùng từ Epic 2 trở đi. Không cần integrate vào `layout.tsx` trong story này — sẽ được thêm vào khi cần (Story 2.5+).

### Scope — KHÔNG làm trong story này

- Tạo bất kỳ page component nào (Epic 2+)
- Middleware hay authentication (Story 3.1)
- Tích hợp Sonner `<Toaster>` vào `layout.tsx` (Story 2.5)
- Custom non-shadcn components như `StatusBadge`, `UploadArea`, `SidebarNav` (đây là UI primitives, components custom sẽ xây trên chúng ở các Epic sau)
- Dark mode implementation

### Context từ Previous Stories

- **packages/shared**: `@david-agency/shared` export `ApplicationData`, `ApplicationStatus`, `PushToEvisaMessage`, `STATUS_FLOW`, `EXTENSION_ID` — không redefine
- **next.config.ts**: đã có `transpilePackages: ['@david-agency/shared']`
- **Monorepo root**: dùng `pnpm exec` prefix cho CLI tools, hoặc `pnpm --filter web <command>` cho web-specific commands
- **pnpm typecheck**: run từ root, check 3/3 packages (`web`, `extension`, `shared`)
- **Supabase CLI**: v2.102.0, key format mới `sb_publishable_*` và `sb_secret_*` — không liên quan đến story này nhưng đã được setup từ 1.3

### Architecture Compliance

| Rule | Source | Áp dụng cho story này |
|---|---|---|
| shadcn/ui là UI component library | `architecture.md#D2` | ✅ Install shadcn/ui |
| Tailwind CSS v4, không có tailwind.config.ts | Codebase hiện tại | ✅ Dùng @theme inline |
| Import alias `@/*` | `components.json` | ✅ Config trong init |
| PascalCase components | `architecture.md#naming` | ✅ shadcn convention |
| No dark mode trong MVP | UX Design spec | ✅ Xóa dark mode media query |

### References

- UX-DR1: [epics.md — UX Design Requirements](../_bmad-output/planning-artifacts/epics.md)
- Brand colors & component specs: [DESIGN.md](../_bmad-output/planning-artifacts/ux-designs/ux-VisaAgency-2026-05-30/DESIGN.md)
- Architecture D2 (shadcn/ui): [architecture.md — Core Architectural Decisions](../_bmad-output/planning-artifacts/architecture.md)
- Story 1.1 (monorepo scaffold): [1-1-initialize-monorepo-and-nextjs-app.md](./1-1-initialize-monorepo-and-nextjs-app.md)
- Story 1.3 (existing lib files): [1-3-supabase-schema-rls-and-private-storage-setup.md](./1-3-supabase-schema-rls-and-private-storage-setup.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `components.json` được tạo thủ công thay vì chạy `shadcn init` interactive (không có terminal TTY). Content khớp chính xác với Dev Notes expected output.
- `shadcn add` được chạy với `--yes` flag, không cần interactive prompts.
- `lucide-react` và `next-themes` phải install thêm vì `shadcn add sonner` và `shadcn add dialog` depend vào chúng nhưng không tự động install.
- Phát hiện 2 phiên bản `@types/react` (18.2.48 và 19.2.15) gây TypeScript conflicts. Fix: thêm `overrides` trong `pnpm-workspace.yaml` để force `@types/react@^19` monorepo-wide.
- `pnpm.overrides` trong `package.json` đã bị deprecated trong pnpm v11 — phải dùng `pnpm-workspace.yaml`.

### Completion Notes List

- `apps/web/components.json`: configured với App Router + Tailwind v4 + TypeScript (AC1 ✓)
- `apps/web/src/app/globals.css`: brand HSL variables đầy đủ, không có dark mode media query (AC2 ✓)
- 9 shadcn/ui components installed: button, input, label, dialog, badge, table, tabs, sonner, skeleton (AC3 ✓)
- `<Button>` render với `bg-primary` = `hsl(213 74% 15%)` = navy #0A2342 — verified qua curl + CSS inspection (AC4 ✓)
- `pnpm typecheck` 3/3 packages pass, `pnpm lint` 3/3 packages pass (AC5 ✓)
- Thêm dependencies: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `next-themes`, `sonner`, `@radix-ui/*`
- Thêm `overrides` trong `pnpm-workspace.yaml` để resolve @types/react version conflict

### File List

- `apps/web/components.json` (mới)
- `apps/web/src/lib/utils.ts` (mới)
- `apps/web/src/components/ui/button.tsx` (mới)
- `apps/web/src/components/ui/input.tsx` (mới)
- `apps/web/src/components/ui/label.tsx` (mới)
- `apps/web/src/components/ui/dialog.tsx` (mới)
- `apps/web/src/components/ui/badge.tsx` (mới)
- `apps/web/src/components/ui/table.tsx` (mới)
- `apps/web/src/components/ui/tabs.tsx` (mới)
- `apps/web/src/components/ui/sonner.tsx` (mới)
- `apps/web/src/components/ui/skeleton.tsx` (mới)
- `apps/web/src/app/globals.css` (modified — brand CSS variables)
- `apps/web/package.json` (modified — thêm sonner, @radix-ui/*, lucide-react, next-themes, clsx, tailwind-merge, class-variance-authority)
- `package.json` (modified — fix trailing comma)
- `pnpm-workspace.yaml` (modified — thêm @types/react override)
- `pnpm-lock.yaml` (modified)

## Change Log

- 2026-06-02: Story created by create-story workflow — brand tokens, shadcn/ui Tailwind v4 setup, component installation context
- 2026-06-02: Story implemented — shadcn/ui setup, brand tokens, 9 components installed, typecheck + lint pass
