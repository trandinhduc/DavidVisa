---
baseline_commit: NO_VCS
---

# Story 1.1: Initialize Monorepo & Next.js App

Status: done

## Story

As a developer,
I want a working pnpm monorepo with Next.js web app and Plasmo extension scaffold,
so that all subsequent stories have a consistent, correctly structured project to build on.

## Acceptance Criteria

1. Monorepo root tồn tại với: `apps/web/` (Next.js 16+, TypeScript, Tailwind, App Router, `src/`), `apps/extension/` (Plasmo, TypeScript), `packages/shared/` (TypeScript package, empty `src/`), `pnpm-workspace.yaml`, `turbo.json`, `package.json` (workspaces root)
2. `pnpm dev` trong `apps/web` khởi động dev server trên localhost:3000 không có lỗi
3. `pnpm typecheck` và `pnpm lint` pass với không có lỗi trên tất cả packages
4. `apps/web/.env.example` tồn tại với 4 placeholder keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

## Tasks / Subtasks

- [x] Task 1: Khởi tạo root monorepo (AC: 1)
  - [x] 1.1 Tạo `package.json` root với pnpm workspaces config
  - [x] 1.2 Tạo `pnpm-workspace.yaml`
  - [x] 1.3 Tạo `turbo.json` với pipeline config
  - [x] 1.4 Tạo `.gitignore` (node_modules, .next, .env.local, dist, build)
  - [x] 1.5 Chạy `git init` tại root (nếu chưa có)

- [x] Task 2: Scaffold Next.js web app (AC: 1, 2, 3)
  - [x] 2.1 Tạo thư mục `apps/`, chạy `npx create-next-app@latest web` trong `apps/` với đúng flags
  - [x] 2.2 Xác nhận cấu trúc: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css` tồn tại
  - [x] 2.3 Xác nhận `apps/web/next.config.ts` dùng App Router

- [x] Task 3: Scaffold Plasmo Chrome Extension (AC: 1)
  - [x] 3.1 Chạy `npx create-plasmo extension` trong `apps/`
  - [x] 3.2 Xác nhận `apps/extension/popup.tsx` (hoặc `src/popup.tsx`) tồn tại
  - [x] 3.3 Xác nhận `apps/extension/package.json` có TypeScript

- [x] Task 4: Tạo packages/shared (AC: 1)
  - [x] 4.1 Tạo `packages/shared/package.json` với name `@david-agency/shared`
  - [x] 4.2 Tạo `packages/shared/tsconfig.json`
  - [x] 4.3 Tạo `packages/shared/src/index.ts` (empty barrel export — types sẽ được thêm ở Story 1.2)

- [x] Task 5: Wire up workspace cross-references (AC: 3)
  - [x] 5.1 Thêm `"@david-agency/shared": "workspace:*"` vào `apps/web/package.json` dependencies
  - [x] 5.2 Chạy `pnpm install` từ root để link packages

- [x] Task 6: Tạo .env.example (AC: 4)
  - [x] 6.1 Tạo `apps/web/.env.example` với 4 keys placeholder
  - [x] 6.2 Đảm bảo `.env.local` có trong `.gitignore`

- [x] Task 7: Verify build và lint (AC: 2, 3)
  - [x] 7.1 Kiểm tra `apps/web/package.json` có script `"typecheck": "tsc --noEmit"` (create-next-app tự thêm — verify trước khi chạy turbo)
  - [x] 7.2 `pnpm dev` từ `apps/web` → localhost:3000 không lỗi
  - [x] 7.3 `pnpm typecheck` từ root → không có TypeScript errors
  - [x] 7.4 `pnpm lint` từ root → không có lint errors

## Dev Notes

### Prerequisites

- **Node.js ≥ 18.18.0** (yêu cầu bởi `create-next-app@latest`)
- **pnpm ≥ 8** — cài bằng `npm install -g pnpm` nếu chưa có
- Kiểm tra: `node -v && pnpm -v` trước khi bắt đầu

### CRITICAL: Vị trí Monorepo Root

**Monorepo root = project working directory** (`/Users/max/Data/Git/VisaAgency`). **KHÔNG** tạo thêm subdirectory `david-agency/` bên trong. Architecture docs dùng `david-agency/` làm tên label, nhưng tất cả files đặt thẳng tại root.

### Scaffold Commands (thứ tự chuẩn)

```bash
# 1. Init git tại root (nếu chưa có)
git init

# 2. Tạo thư mục apps
mkdir -p apps packages

# 3. Scaffold Next.js — chạy từ apps/
cd apps
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack \
  --no-git
cd ..

# 4. Scaffold Plasmo — chạy từ apps/
cd apps
npx create-plasmo extension
# Plasmo có thể tạo .git riêng — xóa nó đi để tránh nested repo
rm -rf extension/.git
cd ..

# 5. Tạo packages/shared thủ công
mkdir -p packages/shared/src
```

**Dùng `--no-git`** vì root đã có git repo; tránh nested `.git` folders.

### Root package.json

```json
{
  "name": "david-agency",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "lint": {}
  }
}
```

### packages/shared/package.json

```json
{
  "name": "@david-agency/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

### packages/shared/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### packages/shared/src/index.ts (story này — empty barrel)

```ts
// Types và constants sẽ được thêm vào Story 1.2
export {}
```

### .env.example Content

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

### Naming Conventions (áp dụng từ story này trở đi)

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Database columns | snake_case | `app_id`, `last_name` |
| JSON/TypeScript | camelCase | `appId`, `lastName` |
| API routes | kebab-case | `/api/applications` |
| Components | PascalCase.tsx | `ApplicationForm.tsx` |
| Utilities/Hooks | kebab-case.ts | `use-applications.ts` |
| Storage paths | `{app_id}/portrait.jpg` | `DA-2026-0001/portrait.jpg` |

### Workspace Dependency Notes

- Story này chỉ thêm `@david-agency/shared` vào `apps/web` — `apps/extension` chưa cần
- `apps/extension` sẽ được wire với `@david-agency/shared` trong **Story 4.3** (Chrome Extension setup)

### Scope của Story này — KHÔNG làm

- Supabase schema/migrations → Story 1.3
- shadcn/ui và brand tokens → Story 1.4 (kể cả `components.json`)
- Shared types/constants → Story 1.2
- Wire `@david-agency/shared` vào `apps/extension` → Story 4.3
- Bất kỳ feature code nào

### Cấu trúc Cuối Story này

```
/Users/max/Data/Git/VisaAgency/
├── .git/
├── .gitignore
├── package.json              ← workspaces root
├── pnpm-workspace.yaml
├── turbo.json
│
├── packages/
│   └── shared/
│       ├── package.json      ← name: @david-agency/shared
│       ├── tsconfig.json
│       └── src/
│           └── index.ts      ← empty barrel
│
└── apps/
    ├── web/                  ← Next.js 14
    │   ├── package.json      ← có @david-agency/shared dep
    │   ├── next.config.ts
    │   ├── tailwind.config.ts
    │   ├── tsconfig.json
    │   ├── .env.example      ← 4 placeholder keys
    │   # NOTE: components.json KHÔNG có ở đây — được tạo bởi shadcn init ở Story 1.4
    │   └── src/
    │       └── app/
    │           ├── layout.tsx
    │           ├── page.tsx
    │           └── globals.css
    └── extension/            ← Plasmo
        ├── package.json
        ├── tsconfig.json
        └── popup.tsx
```

### Architecture Compliance Checklist

- [x] App Router (`src/app/`) — không dùng Pages Router
- [x] TypeScript strict mode trên tất cả packages
- [x] Turbopack cho dev — bật bằng `--turbopack` flag trong create-next-app
- [x] pnpm workspaces (không dùng npm/yarn)
- [x] `@/*` import alias trong apps/web

### References

- Monorepo structure: [architecture.md#repository-structure](../_bmad-output/planning-artifacts/architecture.md)
- Next.js command: [architecture.md#starter-1](../_bmad-output/planning-artifacts/architecture.md)
- Plasmo command: [architecture.md#starter-2](../_bmad-output/planning-artifacts/architecture.md)
- Full directory structure: [architecture.md#complete-project-directory-structure](../_bmad-output/planning-artifacts/architecture.md)
- Naming conventions: [architecture.md#naming-conventions](../_bmad-output/planning-artifacts/architecture.md)
- AR-1, AR-2: [epics.md#additional-requirements](../_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- pnpm v11 không còn đọc field `"pnpm"` trong `package.json` — overrides phải đặt trong `pnpm-workspace.yaml`
- turbo v2 đổi `pipeline` thành `tasks` trong `turbo.json`
- create-plasmo template dùng `"plasmo": "workspace:*"` — thay bằng `"plasmo": "0.90.5"` để compatible với standalone monorepo
- Duplicate `@types/react` (v18 trong extension, v19 trong web) gây TypeScript module identity conflict — fix bằng `overrides` trong `pnpm-workspace.yaml` để force v19 toàn workspace
- `public-hoist-pattern` và `shamefully-hoist` không hoạt động trong pnpm v11 để hoist `@types/react` lên root
- Code review patches: global @types/react override đã bỏ; thay bằng `@types/react: ^19` trong root `package.json` devDependencies — extension giữ React 18 runtime, web dùng React 19; `.next` cache phải xóa sau khi thay đổi pnpm config để tránh stale validator.ts gây type conflict

### Completion Notes List

- Tạo monorepo root với pnpm workspaces, turbo v2, git init
- Scaffold Next.js 16.2.6 với App Router, TypeScript, Tailwind, Turbopack, src/ dir, @/* alias
- Scaffold Plasmo 0.90.5 Chrome Extension với popup.tsx
- Tạo `packages/shared` với `@david-agency/shared` (empty barrel export)
- Wire `@david-agency/shared` vào `apps/web`
- Fix typecheck: import `ReactNode` explicitly thay vì `React.ReactNode`, đơn giản hóa `page.tsx` (remove default template)
- `pnpm typecheck` và `pnpm lint` pass không có lỗi
- Dev server khởi động trong 245ms trên localhost:3000

### File List

- `.gitignore`
- `.npmrc`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- `apps/web/.gitignore`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/.env.example`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/extension/package.json`
- `apps/extension/popup.tsx`
- `apps/extension/tsconfig.json`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`

## Review Findings

### Decision Needed

- [x] [Review][Decision] React version mismatch → **Resolved: giữ React 18 trong extension, xóa global @types/react override khỏi pnpm-workspace.yaml** — pnpm strict isolation sẽ handle conflict khi shamefully-hoist được xóa [pnpm-workspace.yaml]

### Patches

- [x] [Review][Patch] Xóa `pnpm-lock.yaml` khỏi root `.gitignore` — lockfile phải được commit để đảm bảo reproducible installs [.gitignore:7]
- [x] [Review][Patch] Xóa `apps/web/package-lock.json` (232KB npm lockfile) và thêm vào root `.gitignore` [apps/web/package-lock.json]
- [x] [Review][Patch] Thêm `!.env.example` exception trong `apps/web/.gitignore` — pattern `.env*` hiện tại sẽ gitignore `.env.example`, vi phạm AC 4 [apps/web/.gitignore]
- [x] [Review][Patch] Thêm `typecheck` và `lint` scripts vào `apps/extension/package.json` — hiện turbo silently skip extension, AC 3 "all packages" chưa đạt [apps/extension/package.json]
- [x] [Review][Patch] Thêm `lint` script vào `packages/shared/package.json` — AC 3 "all packages" [packages/shared/package.json]
- [x] [Review][Patch] Dọn `.npmrc` — `shamefully-hoist` và `public-hoist-pattern` không hoạt động trong pnpm v11 (confirmed trong Dev Notes), là dead config gây nhầm lẫn [.npmrc]
- [x] [Review][Patch] Thêm `rel="noopener noreferrer"` vào 2 external links trong `popup.tsx` [apps/extension/popup.tsx]
- [x] [Review][Patch] Cập nhật metadata trong `layout.tsx` — title "Create Next App" và description "Generated by create next app" là placeholder [apps/web/src/app/layout.tsx]
- [x] [Review][Patch] Sửa `globals.css`: `font-family: Arial, Helvetica, sans-serif` trên `body` ghi đè `--font-sans: var(--font-geist-sans)` vừa khai báo phía trên [apps/web/src/app/globals.css]
- [x] [Review][Patch] Đổi tên extension package từ `"with-popup"` thành `"extension"` hoặc `"@david-agency/extension"` [apps/extension/package.json]

### Deferred

- [x] [Review][Defer] Plasmo build output `build-chrome-mv3/` không có trong turbo.json outputs — ảnh hưởng caching, không ảnh hưởng correctness [turbo.json] — deferred, pre-existing
- [x] [Review][Defer] `apps/extension/tsconfig.json` include `.plasmo/index.d.ts` chỉ tồn tại sau `plasmo dev/build` — liên quan đến finding #5 (thiếu typecheck script) [apps/extension/tsconfig.json] — deferred, pre-existing
- [x] [Review][Defer] `packages/shared` trỏ `main`/`types` đến raw `.ts` source — intentional per spec Dev Notes, acceptable với bundler consumers hiện tại — deferred, by-design
- [x] [Review][Defer] Root `.gitignore` chỉ cover `.env.local`, chưa cover `.env.*` tại root level — low risk, apps/web/.gitignore sẽ được fix — deferred, low-risk
- [x] [Review][Defer] `popup.tsx` `<input>` thiếu accessibility (type, aria-label) — placeholder code sẽ bị thay thế hoàn toàn ở Story 4.3 — deferred, temporary code
- [x] [Review][Defer] Extension `author`/`contributors` còn là Plasmo Corp. boilerplate — cosmetic, không ảnh hưởng functionality — deferred, cosmetic

## Review Findings (Round 2)

### Decision Needed

- [x] [Review][Decision] Next.js version là 16.2.6 nhưng AC1 ghi "Next.js 14" — **Resolved: chấp nhận Next.js 16+, AC1 đã cập nhật** [apps/web/package.json]

### Patches

- [x] [Review][Patch] turbo.json lint task thiếu `outputs` — thêm `"outputs": []` để Turbo cache lint results [turbo.json]
- [x] [Review][Patch] apps/extension thiếu .gitignore — Plasmo build dirs (`build/`, `.plasmo/`) sẽ bị commit [apps/extension/]
- [x] [Review][Patch] Root .gitignore chỉ ignore `.env.local` — một root-level `.env` file chứa secrets sẽ không bị ignore [.gitignore]
- [x] [Review][Patch] next.config.ts thiếu `transpilePackages` — production Next.js build có thể fail vì `@david-agency/shared` ship raw `.ts` [apps/web/next.config.ts]
- [x] [Review][Patch] .env.example thiếu comment cảnh báo `SUPABASE_SERVICE_ROLE_KEY` là server-only, KHÔNG được prefix `NEXT_PUBLIC_` [apps/web/.env.example]

### Deferred

- [x] [Review][Defer] `EXTENSION_ID` là placeholder — intentional per spec, Story 4.3 sẽ thay thế [packages/shared/src/constants.ts] — deferred, by-design
- [x] [Review][Defer] React 18 (extension) vs React 19 (web) — documented decision trong dev notes [apps/extension/package.json] — deferred, pre-existing
- [x] [Review][Defer] turbo.json build outputs thiếu Plasmo output dir — confirmed deferred từ Round 1 [turbo.json] — deferred, pre-existing
- [x] [Review][Defer] packages/shared `main`/`types` trỏ raw `.ts` — intentional bundler-mode design, deferred từ Round 1 [packages/shared/package.json] — deferred, by-design
- [x] [Review][Defer] `@david-agency/shared` chưa có trong extension deps — intentional, Story 4.3 [apps/extension/package.json] — deferred, by-design
- [x] [Review][Defer] popup.tsx `<input>` thiếu accessibility — temporary boilerplate, sẽ bị thay hoàn toàn ở Story 4.3 [apps/extension/popup.tsx] — deferred, temporary code
- [x] [Review][Defer] `ApplicationData` date fields là untyped `string` — by-design per spec [packages/shared/src/types.ts] — deferred, by-design
- [x] [Review][Defer] apps/web tsconfig `target: ES2017` vs shared `ES2022` — Next.js SWC xử lý downleveling [apps/web/tsconfig.json] — deferred, acceptable

## Change Log

- 2026-06-01: Implement Story 1.1 — khởi tạo pnpm monorepo với Next.js 16, Plasmo, packages/shared; typecheck và lint pass
- 2026-06-01: Code review — 1 decision needed, 10 patches, 6 deferred
- 2026-06-01: Apply all review patches — lockfile/gitignore fixes, extension typecheck+lint scripts, .npmrc cleaned, popup security, metadata updated, font fix, package renamed; pnpm typecheck + lint pass
- 2026-06-01: Code review Round 2 (combined with Story 1.2) — 1 decision needed, 5 patches, 8 deferred, 5 dismissed
