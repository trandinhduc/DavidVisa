---
baseline_commit: NO_VCS
---

# Story 1.2: Shared TypeScript Types Package

Status: done

## Story

As a developer,
I want shared TypeScript types and constants available across the monorepo,
so that the web app and Chrome Extension always use the same data models without drift.

## Acceptance Criteria

1. `packages/shared/src/types.ts` exports: `ApplicationData` interface (id, appId, lastName, firstName, email, arrivalDate, status, portraitPath, passportPath, createdAt, updatedAt), `ApplicationStatus` type (`'raw' | 'ready' | 'submitted' | 'done'`), `PushToEvisaMessage` interface (type: 'PUSH_TO_EVISA', applicationId, appId, lastName, firstName, arrivalDate, portraitSignedUrl, passportSignedUrl)
2. `packages/shared/src/constants.ts` exports: `STATUS_FLOW` as `['raw', 'ready', 'submitted', 'done'] as const`, `EXTENSION_ID` as placeholder string constant
3. `packages/shared/src/index.ts` re-exports everything from `types.ts` and `constants.ts` as the package public API
4. `apps/web` can import `import type { ApplicationData } from '@david-agency/shared'` with no TypeScript errors
5. `packages/shared/package.json` has a `build` script; `pnpm build` (run from `packages/shared` or root via turbo) completes without errors

## Tasks / Subtasks

- [x] Task 1: Tạo `packages/shared/src/types.ts` (AC: 1)
  - [x] 1.1 Định nghĩa `ApplicationStatus` type: `'raw' | 'ready' | 'submitted' | 'done'`
  - [x] 1.2 Định nghĩa `ApplicationData` interface với đầy đủ fields theo spec (xem Dev Notes)
  - [x] 1.3 Định nghĩa `PushToEvisaMessage` interface với đầy đủ fields theo spec (xem Dev Notes)

- [x] Task 2: Tạo `packages/shared/src/constants.ts` (AC: 2)
  - [x] 2.1 Export `STATUS_FLOW = ['raw', 'ready', 'submitted', 'done'] as const`
  - [x] 2.2 Export `EXTENSION_ID = 'PLACEHOLDER_EXTENSION_ID'` (sẽ được thay bằng ID thực ở Story 4.3)

- [x] Task 3: Cập nhật `packages/shared/src/index.ts` (AC: 3)
  - [x] 3.1 Re-export tất cả types từ `./types`
  - [x] 3.2 Re-export tất cả constants từ `./constants`

- [x] Task 4: Thêm `build` script vào `packages/shared/package.json` (AC: 5)
  - [x] 4.1 Thêm `"build": "tsc --noEmit"` — package này dùng bundler-mode, không emit JS; build = type verify
  - [x] 4.2 Đảm bảo `turbo.json` đã có `build` task (đã có từ Story 1.1 — verify, không thay đổi)

- [x] Task 5: Verify import trong `apps/web` và chạy validations (AC: 4, 5)
  - [x] 5.1 Thêm test import trong `apps/web/src/app/page.tsx`: `import type { ApplicationData } from '@david-agency/shared'` (chỉ dùng trong comment JSDoc hoặc type annotation — không để lại dead import sau verify)
  - [x] 5.2 Chạy `pnpm typecheck` từ root — phải pass 3/3 packages
  - [x] 5.3 Chạy `pnpm build` từ root — phải pass cho `packages/shared`
  - [x] 5.4 Xóa test import nếu đã thêm tạm (không để dead code trong production files)

## Dev Notes

### Context từ Story 1.1

Story 1.1 đã tạo ra monorepo structure hoàn chỉnh. `packages/shared` hiện tại có:
- `src/index.ts`: chỉ có `export {}` (empty barrel)
- `package.json`: có `typecheck` và `lint` scripts, **chưa có `build`**
- `tsconfig.json`: strict mode, `moduleResolution: "bundler"`, `target: ES2022`
- `main` và `types` trong package.json đều trỏ đến `./src/index.ts` (raw TypeScript — intentional cho bundler-mode consumers)

**KHÔNG thêm compile step hay `dist/` output** — `apps/web` dùng `moduleResolution: "bundler"` nên import được raw `.ts` trực tiếp. `pnpm build` = `tsc --noEmit` (type check only).

### Exact Type Definitions Cần Implement

#### `packages/shared/src/types.ts`

```typescript
export type ApplicationStatus = 'raw' | 'ready' | 'submitted' | 'done'

export interface ApplicationData {
  id: string               // UUID — Supabase gen_random_uuid()
  appId: string            // DA-YYYY-XXXX format (e.g. "DA-2026-0001")
  lastName: string
  firstName: string
  email: string
  arrivalDate: string      // ISO date string YYYY-MM-DD (từ Supabase date column)
  status: ApplicationStatus
  portraitPath: string | null   // Supabase Storage path, e.g. "DA-2026-0001/portrait.jpg"
  passportPath: string | null   // Supabase Storage path
  createdAt: string        // ISO timestamp string
  updatedAt: string        // ISO timestamp string
}

export interface PushToEvisaMessage {
  type: 'PUSH_TO_EVISA'
  applicationId: string    // UUID (maps to applications.id)
  appId: string            // DA-YYYY-XXXX
  lastName: string
  firstName: string
  arrivalDate: string      // ISO date string YYYY-MM-DD
  portraitSignedUrl: string   // Supabase signed URL (temporary)
  passportSignedUrl: string   // Supabase signed URL (temporary)
}
```

> **Lưu ý naming:** Database dùng `snake_case` (last_name, app_id), TypeScript dùng `camelCase` (lastName, appId). Mapping xảy ra ở API layer (Story 2.4) — types ở đây dùng camelCase consistently.

#### `packages/shared/src/constants.ts`

```typescript
export const STATUS_FLOW = ['raw', 'ready', 'submitted', 'done'] as const

// Placeholder — thay bằng Chrome Extension ID thực ở Story 4.3
export const EXTENSION_ID = 'PLACEHOLDER_EXTENSION_ID'
```

> `as const` ở STATUS_FLOW cho phép TypeScript infer tuple type `readonly ['raw', 'ready', 'submitted', 'done']` thay vì `string[]`.

#### `packages/shared/src/index.ts` (cập nhật)

```typescript
export type { ApplicationData, ApplicationStatus, PushToEvisaMessage } from './types'
export { STATUS_FLOW, EXTENSION_ID } from './constants'
```

> Dùng `export type { ... }` cho type-only exports để tương thích với `isolatedModules: true`.

### Turbo Pipeline — Không cần thay đổi

`turbo.json` từ Story 1.1 đã có `"build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] }`. Task `build` đã cover tất cả packages. **Không sửa `turbo.json`.**

### Scope — KHÔNG làm trong Story này

- Supabase client types (Supabase generates these — Story 1.3)
- Form validation schemas (Zod — Story 2.1)
- Dashboard-specific types (Story 3.x)
- `@david-agency/shared` vào `apps/extension` — Story 4.3
- Bất kỳ runtime logic nào — story này chỉ types và constants

### Architecture Compliance

| Rule | Source | Compliance Required |
|------|--------|--------------------|
| `camelCase` cho TypeScript fields | `architecture.md#naming-conventions` | ✅ (see type defs above) |
| `snake_case` cho DB columns | `architecture.md#naming-conventions` | N/A (types, không phải DB) |
| TypeScript strict mode | Story 1.1 tsconfig | ✅ — đã set trong `packages/shared/tsconfig.json` |
| `moduleResolution: bundler` | Story 1.1 tsconfig | ✅ — đã set, không thay đổi |
| `isolatedModules` | Web app tsconfig | Dùng `export type {}` cho type re-exports |

### Debug Log từ Story 1.1 (relevant)

- **Module identity:** Sau khi thay đổi pnpm config, `pnpm install` + xóa `.next` + `pnpm typecheck` để tránh stale type cache
- **@types/react:** `@types/react: ^19` ở root `package.json` devDependencies — không liên quan story này nhưng nhớ khi debug

### References

- Type definitions: [epics.md — Story 1.2 AC](../_bmad-output/planning-artifacts/epics.md)
- Database schema: [architecture.md — D6](../_bmad-output/planning-artifacts/architecture.md)
- Naming conventions: [architecture.md#naming-conventions](../_bmad-output/planning-artifacts/architecture.md)
- packages/shared hiện tại: `packages/shared/src/index.ts`, `packages/shared/package.json`, `packages/shared/tsconfig.json`
- Extension ID usage context: [architecture.md — ADR-002](../_bmad-output/planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `tsc --noEmit` pass 3/3 packages (shared, web, extension) — không có lỗi type
- `pnpm build --filter=@david-agency/shared` pass — warning về `no output files` là expected (intentional, không emit JS)
- Test import `import type { ApplicationData } from '@david-agency/shared'` verify OK, sau đó đã xóa

### Completion Notes List

- ✅ Tạo `packages/shared/src/types.ts` với `ApplicationStatus`, `ApplicationData`, `PushToEvisaMessage` — dùng `export type {}` để tương thích `isolatedModules`
- ✅ Tạo `packages/shared/src/constants.ts` với `STATUS_FLOW as const` và `EXTENSION_ID` placeholder
- ✅ Cập nhật `packages/shared/src/index.ts`: re-export types (dùng `export type {}`) và constants
- ✅ Thêm `"build": "tsc --noEmit"` vào `packages/shared/package.json`
- ✅ `turbo.json` đã có `build` task từ Story 1.1 — không thay đổi
- ✅ `pnpm typecheck` pass 3/3, `pnpm build` pass cho shared package
- ✅ Xóa dead import sau verify — production files sạch

### File List

- `packages/shared/src/types.ts` (mới tạo)
- `packages/shared/src/constants.ts` (mới tạo)
- `packages/shared/src/index.ts` (cập nhật)
- `packages/shared/package.json` (cập nhật — thêm build script)

## Review Findings

### Patches

- [x] [Review][Patch] `STATUS_FLOW` và `ApplicationStatus` được định nghĩa độc lập — derive type từ constant: `export type ApplicationStatus = typeof STATUS_FLOW[number]` [packages/shared/src/types.ts, packages/shared/src/constants.ts]
- [x] [Review][Patch] packages/shared `tsconfig.json` thiếu `"isolatedModules": true` — không enforce `export type {}` pattern ở compile time [packages/shared/tsconfig.json]
- [x] [Review][Patch] packages/shared `tsconfig.json` thiếu `"noEmit": true` — direct `tsc` call (không có flag) sẽ emit files trái với design [packages/shared/tsconfig.json]

### Deferred

- [x] [Review][Defer] `PushToEvisaMessage` signed URLs non-nullable nhưng `ApplicationData` paths nullable — caller validate khi push, Story 4.x [packages/shared/src/types.ts] — deferred, caller responsibility
- [x] [Review][Defer] `moduleResolution: bundler` thiếu `exports` field — acceptable với current bundler consumers [packages/shared/package.json] — deferred, by-design

## Change Log

- 2026-06-01: Story created by create-story workflow — comprehensive type definitions from epics + architecture
- 2026-06-01: Implemented by dev agent — types, constants, index exports, build script; all ACs satisfied, typecheck pass 3/3
- 2026-06-01: Code review (combined with Story 1.1) — 3 patches, 2 deferred
