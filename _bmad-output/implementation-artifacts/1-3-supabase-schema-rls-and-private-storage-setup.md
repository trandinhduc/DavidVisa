---
baseline_commit: NO_VCS
---

# Story 1.3: Supabase Schema, RLS & Private Storage Setup

Status: done

## Story

As a developer (and the system),
I want a complete Supabase database schema with RLS policies and private image storage configured,
So that all application data and photos are stored securely from the very first form submission.

## Acceptance Criteria

1. Table `applications` tồn tại với columns: `id` (uuid PK), `app_id` (text UNIQUE NOT NULL), `last_name`, `first_name`, `email`, `arrival_date` (date), `status` (text DEFAULT 'raw'), `portrait_path`, `passport_path`, `created_at` (timestamptz), `updated_at` (timestamptz)
2. Table `notification_logs` tồn tại với columns: `id` (uuid PK), `application_id` (uuid FK → applications.id), `type`, `channel`, `status`, `attempt` (int DEFAULT 1), `created_at` (timestamptz)
3. DB SEQUENCE tự động generate `app_id` theo format `DA-YYYY-XXXX` (ví dụ: `DA-2026-0001`) khi INSERT với `app_id` là NULL
4. RLS enabled trên `applications`: anon role chỉ có INSERT; authenticated (operator) có full CRUD
5. RLS enabled trên `notification_logs`: authenticated có full CRUD; anon không có access
6. Private Storage bucket tên `applications` tồn tại với `public = false`; authenticated có thể upload/read; anon không có direct access
7. `supabase status` shows all services running; `supabase db lint` passes với không có errors; `pnpm typecheck` từ root pass

## Tasks / Subtasks

- [x] Task 1: Init Supabase CLI và khởi động local instance (AC: 7)
  - [x] 1.1 Thêm `supabase` CLI vào root devDependencies: `pnpm add -Dw supabase`
  - [x] 1.2 Chạy `supabase init` từ root — tạo `supabase/config.toml` và `supabase/migrations/`
  - [x] 1.3 Chạy `supabase start` (Docker required) — verify `supabase status` shows API URL, anon key, service_role key

- [x] Task 2: Migration 001 — Create applications table (AC: 1)
  - [x] 2.1 Tạo `supabase/migrations/001_create_applications.sql` với exact SQL theo Dev Notes
  - [x] 2.2 Verify table tồn tại sau `supabase db reset`

- [x] Task 3: Migration 002 — Create notification_logs table (AC: 2)
  - [x] 3.1 Tạo `supabase/migrations/002_create_notification_logs.sql` với exact SQL theo Dev Notes

- [x] Task 4: Migration 003 — RLS policies (AC: 4, 5)
  - [x] 4.1 Tạo `supabase/migrations/003_create_rls_policies.sql` với exact SQL theo Dev Notes
  - [x] 4.2 Verify RLS enabled: query `pg_tables` WHERE tablename IN ('applications', 'notification_logs') → rowsecurity = true

- [x] Task 5: Migration 004 — App ID sequence & trigger (AC: 3)
  - [x] 5.1 Tạo `supabase/migrations/004_create_application_sequence.sql` với exact SQL theo Dev Notes
  - [x] 5.2 Verify: INSERT test với NULL app_id → app_id tự động set thành `DA-2026-0001`; xóa test row sau verify

- [x] Task 6: Migration 005 — Private Storage bucket (AC: 6)
  - [x] 6.1 Tạo `supabase/migrations/005_create_storage_bucket.sql` với exact SQL theo Dev Notes
  - [x] 6.2 Verify: bucket `applications` tồn tại, `public = false`

- [x] Task 7: Install Supabase packages và tạo client files (foundation cho Stories 2+)
  - [x] 7.1 Cài vào `apps/web`: `pnpm add --filter web @supabase/supabase-js @supabase/ssr`
  - [x] 7.2 Tạo `apps/web/src/lib/supabase-client.ts` (browser, anon key) — xem Dev Notes
  - [x] 7.3 Tạo `apps/web/src/lib/supabase-server.ts` (server/API routes, service role key) — xem Dev Notes
  - [x] 7.4 Tạo `apps/web/src/lib/application-id.ts` — xem Dev Notes

- [x] Task 8: Generate Supabase TypeScript types (AC: 7 / type safety)
  - [x] 8.1 Tạo folder `apps/web/src/types/`
  - [x] 8.2 Chạy: `supabase gen types typescript --local --schema public > apps/web/src/types/supabase.ts`
  - [x] 8.3 Commit `supabase.ts` (generated schema snapshot — nên commit để type safety nhất quán trong team)

- [x] Task 9: Cập nhật .env.local và verify toàn bộ (AC: 7)
  - [x] 9.1 Tạo `apps/web/.env.local` với local Supabase credentials từ `supabase status` (xem Dev Notes)
  - [x] 9.2 Chạy `supabase db reset` — apply tất cả 5 migrations từ scratch, không có errors
  - [x] 9.3 Chạy `supabase db lint` — phải pass không có errors
  - [x] 9.4 Chạy `pnpm typecheck` từ root — phải pass 3/3 packages

## Dev Notes

### Prerequisites

- **Docker Desktop** phải đang chạy trước `supabase start`
- **pnpm ≥ 8** (đã có từ Story 1.1)
- **Monorepo root** = `/Users/max/Data/Git/VisaAgency`
- **Next.js 16 cảnh báo**: `apps/web/AGENTS.md` nói "This is NOT the Next.js you know" — đọc `node_modules/next/dist/docs/` trước khi viết bất kỳ Next.js code nào

### Context từ Stories 1.1 & 1.2

- `@david-agency/shared` đã export: `ApplicationData`, `ApplicationStatus` (`typeof STATUS_FLOW[number]`), `PushToEvisaMessage`, `STATUS_FLOW`, `EXTENSION_ID`
- **KHÔNG** redefine types — luôn import từ `@david-agency/shared`
- `packages/shared` dùng bundler-mode raw `.ts` (không có dist/) — `apps/web` consume trực tiếp, `transpilePackages` đã config trong `next.config.ts`
- DB columns: `snake_case` | TypeScript: `camelCase` | Mapping xảy ra ở API layer (Story 2.4)

### Supabase CLI Commands

```bash
# 1. Init (chạy từ monorepo root)
pnpm exec supabase init

# 2. Start local instance (Docker required)
pnpm exec supabase start

# 3. Xem keys và connection info
pnpm exec supabase status
# Output ví dụ:
#   API URL:         http://localhost:54321
#   DB URL:          postgresql://postgres:postgres@localhost:54322/postgres
#   Studio URL:      http://localhost:54323
#   anon key:        eyJhbGciOiJIUzI1NiIs...
#   service_role key: eyJhbGciOiJIUzI1NiIs...

# 4. Apply/reset tất cả migrations
pnpm exec supabase db reset

# 5. Lint
pnpm exec supabase db lint

# 6. Generate TypeScript types
pnpm exec supabase gen types typescript --local --schema public > apps/web/src/types/supabase.ts

# 7. Stop
pnpm exec supabase stop
```

### CRITICAL: Migration File Naming

Architecture spec dùng format `001_name.sql` (không phải timestamp). Tạo files **thủ công** — KHÔNG dùng `supabase migration new` (sẽ tạo tên timestamp khác). Files sẽ được apply theo thứ tự alphabetical:

```
supabase/migrations/
├── 001_create_applications.sql
├── 002_create_notification_logs.sql
├── 003_create_rls_policies.sql
├── 004_create_application_sequence.sql
└── 005_create_storage_bucket.sql
```

### Migration SQL (Exact Content)

#### 001_create_applications.sql

```sql
CREATE TABLE IF NOT EXISTS applications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id       text        UNIQUE NOT NULL,
  last_name    text        NOT NULL,
  first_name   text        NOT NULL,
  email        text        NOT NULL,
  arrival_date date        NOT NULL,
  status       text        NOT NULL DEFAULT 'raw',
  portrait_path text,
  passport_path text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 002_create_notification_logs.sql

```sql
CREATE TABLE IF NOT EXISTS notification_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type           text        NOT NULL,
  channel        text        NOT NULL,
  status         text        NOT NULL,
  attempt        int         NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

#### 003_create_rls_policies.sql

```sql
-- ============================================================
-- RLS: applications
-- ============================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- anon: INSERT only (public form submission)
CREATE POLICY "anon_insert_applications"
  ON applications FOR INSERT
  TO anon
  WITH CHECK (true);

-- authenticated (operator): full CRUD
CREATE POLICY "authenticated_select_applications"
  ON applications FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "authenticated_insert_applications"
  ON applications FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_applications"
  ON applications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_applications"
  ON applications FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- RLS: notification_logs
-- ============================================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- authenticated (operator): full CRUD
CREATE POLICY "authenticated_select_notification_logs"
  ON notification_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "authenticated_insert_notification_logs"
  ON notification_logs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_notification_logs"
  ON notification_logs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_notification_logs"
  ON notification_logs FOR DELETE
  TO authenticated USING (true);

-- anon: NO policies trên notification_logs → no access
```

#### 004_create_application_sequence.sql

```sql
-- Sequence toàn cục cho app_id (không reset theo năm — MVP scope ~500 records)
CREATE SEQUENCE IF NOT EXISTS application_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- Function tạo DA-YYYY-XXXX format
CREATE OR REPLACE FUNCTION generate_app_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.app_id IS NULL OR NEW.app_id = '' THEN
    NEW.app_id := 'DA-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('application_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: set app_id tự động trước INSERT
CREATE TRIGGER set_app_id_before_insert
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION generate_app_id();
```

> **Lưu ý**: Sequence không reset theo năm — đây là intentional cho MVP. Record thứ 500 của năm 2027 sẽ có số tiếp theo toàn cục. Nếu cần reset theo năm, cần CRON job PostgreSQL — defer post-MVP.

#### 005_create_storage_bucket.sql

```sql
-- Private bucket: không có public URL, chỉ accessible qua service role / signed URLs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications',
  false,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated (operator) có thể access storage objects
CREATE POLICY "authenticated_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'applications');

-- Note: Form submission upload ảnh qua Next.js API Route dùng service role key
-- (service role bypass RLS hoàn toàn) — anon không cần policy storage
```

> **Storage paths chuẩn**: `{app_id}/portrait.jpg` và `{app_id}/passport.jpg` (ví dụ: `DA-2026-0001/portrait.jpg`). Path này được set bởi API route ở Story 2.4.

### Supabase Client Files (Exact Code)

#### apps/web/src/lib/supabase-client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

> Dùng cho: Dashboard reads (Story 3.x) — Supabase JS client trực tiếp + RLS.

#### apps/web/src/lib/supabase-server.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

> Dùng cho: Next.js API Routes (Story 2.4+) — bypass RLS, server-only.
> `SUPABASE_SERVICE_ROLE_KEY` **KHÔNG** được prefix `NEXT_PUBLIC_`.

#### apps/web/src/lib/application-id.ts

```typescript
const APP_ID_REGEX = /^DA-\d{4}-\d{4}$/

export function isValidAppId(appId: string): boolean {
  return APP_ID_REGEX.test(appId)
}
```

### apps/web/.env.local (Local Dev — KHÔNG commit)

```
# Lấy từ: pnpm exec supabase status
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key từ supabase status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key từ supabase status>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=test-placeholder
```

`.env.local` đã có trong `apps/web/.gitignore` — KHÔNG commit.

### Scope — KHÔNG làm trong Story này

- `supabase/functions/` (Edge Functions cho notifications) → Story 5.1, 5.2
- Supabase Auth / login page / session management → Story 3.1
- `apps/web/src/lib/heic-convert.ts` → Story 2.2
- Signed URL generation (display ảnh trên dashboard) → Story 3.4
- Form submission API route `/api/applications` → Story 2.4
- Remote Supabase project setup (production deploy) → sau MVP

### Architecture Compliance

| Rule | Source | Status |
|------|--------|--------|
| `snake_case` DB columns | `architecture.md#naming-conventions` | ✅ |
| `gen_random_uuid()` cho id | `architecture.md#D6` | ✅ |
| RLS bắt buộc trên tất cả tables | `architecture.md#cross-cutting` | ✅ |
| Private bucket (public = false) | `architecture.md#D6` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` không expose client | `architecture.md#mandatory-rules` | ✅ |
| Storage path `{app_id}/portrait.jpg` | `architecture.md#mandatory-rules` | ✅ (enforced Story 2.4) |
| ADR-004: Supabase SEQUENCE | `architecture.md#ADR-004` | ✅ |

### References

- DB Schema: [architecture.md — D6](../_bmad-output/planning-artifacts/architecture.md)
- Data Fetching: [architecture.md — D1](../_bmad-output/planning-artifacts/architecture.md)
- RLS/Storage: [prd.md — FR-20, FR-21](../_bmad-output/planning-artifacts/prds/prd-VisaAgency-2026-05-30/prd.md)
- ADR-004 Sequence: [architecture.md — ADR-004](../_bmad-output/planning-artifacts/architecture.md)
- Shared types: [packages/shared/src/types.ts](../../packages/shared/src/types.ts)

### Review Findings

- [x] [Review][Decision] notification_logs UPDATE/DELETE policies — giữ full CRUD theo AC5 (accepted, dismissed)
- [x] [Review][Patch] `app_id` thiếu DEFAULT '' trong schema → TypeScript Insert type bắt buộc `app_id: string` thay vì optional [001_create_applications.sql] — fixed: thêm `DEFAULT ''` vào column, cập nhật supabase.ts Insert type thành `app_id?: string`
- [x] [Review][Patch] Anon có thể bypass sequence trigger bằng cách tự cung cấp `app_id` non-null [004_create_application_sequence.sql] — fixed: bỏ IF condition, trigger luôn override app_id
- [x] [Review][Patch] Anon có thể INSERT `status` tùy ý (kể cả `'done'`) vì không có CHECK constraint [001_create_applications.sql] — fixed: thêm `CHECK (status IN ('raw','ready','submitted','done'))`
- [x] [Review][Patch] `isValidAppId` regex `\d{4}` sẽ reject ID hợp lệ khi sequence vượt 9,999 [apps/web/src/lib/application-id.ts:1] — fixed: regex sửa thành `/^DA-\d{4}-\d{4,}$/`
- [x] [Review][Patch] `supabase-server.ts` thiếu `import 'server-only'` guard [apps/web/src/lib/supabase-server.ts] — fixed: thêm `import 'server-only'` ở đầu file
- [x] [Review][Patch] `notification_logs` thiếu index trên `application_id` FK [002_create_notification_logs.sql] — fixed: thêm `CREATE INDEX ON notification_logs(application_id)`
- [x] [Review][Patch] `isValidAppId` không trim whitespace trước khi test regex [apps/web/src/lib/application-id.ts:3] — fixed: `return APP_ID_REGEX.test(appId.trim())`
- [x] [Review][Defer] Anon có thể set `portrait_path`/`passport_path` trỏ đến file của application khác [003_create_rls_policies.sql] — deferred, pre-existing; sẽ được validate tại API route Story 2.4
- [x] [Review][Defer] Không có rate-limiting hay abuse protection ở DB layer [003_create_rls_policies.sql] — deferred, pre-existing; thuộc application layer/middleware concern
- [x] [Review][Defer] `email` column không có format CHECK constraint [001_create_applications.sql] — deferred, pre-existing; email validation thuộc Story 2.4 API layer
- [x] [Review][Defer] `notification_logs.type` và `channel` không có enum/CHECK constraint [002_create_notification_logs.sql] — deferred, pre-existing; notification types chưa được xác định đến Story 5.x
- [x] [Review][Defer] `applications` không có index trên `email` column [001_create_applications.sql] — deferred, pre-existing; email lookup chưa được yêu cầu trong bất kỳ story nào hiện tại
- [x] [Review][Defer] `update_updated_at_column()` function name quá generic (collision risk nếu tables khác dùng cùng tên) [001_create_applications.sql] — deferred, pre-existing; refactor khi pattern được reuse
- [x] [Review][Defer] Non-null assertions `!` trên env vars trong `supabase-client.ts` không có runtime guard [apps/web/src/lib/supabase-client.ts] — deferred, pre-existing; central env validation là concern riêng

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `supabase gen types typescript` output line "Connecting to db 5432" đi vào stdout — fix bằng `2>/dev/null` redirect
- Supabase CLI v2.102.0 dùng key format mới: `sb_publishable_*` (thay anon JWT) và `sb_secret_*` (thay service_role JWT)
- `supabase db execute` không còn là subcommand hợp lệ trong CLI v2 — dùng `supabase db query` thay thế

### Completion Notes List

- ✅ Supabase CLI v2.102.0 init + start (Docker) — local instance running tại http://127.0.0.1:54321
- ✅ 5 migrations apply thành công qua `supabase db reset`
- ✅ `applications` table: 11 columns đúng spec, uuid PK, NOT NULL constraints
- ✅ `notification_logs` table: 7 columns, FK → applications.id ON DELETE CASCADE
- ✅ RLS enabled trên cả 2 tables (rowsecurity = true)
- ✅ Sequence trigger: INSERT test → `DA-2026-0001` generate tự động
- ✅ Private storage bucket `applications` (public = false), 6MB limit, image MIME types
- ✅ `@supabase/supabase-js` + `@supabase/ssr` installed vào apps/web
- ✅ supabase-client.ts, supabase-server.ts, application-id.ts tạo xong
- ✅ TypeScript types generated từ live local schema
- ✅ `supabase db lint` — No schema errors
- ✅ `pnpm typecheck` — 3/3 packages pass

### File List

- `supabase/config.toml`
- `supabase/migrations/001_create_applications.sql`
- `supabase/migrations/002_create_notification_logs.sql`
- `supabase/migrations/003_create_rls_policies.sql`
- `supabase/migrations/004_create_application_sequence.sql`
- `supabase/migrations/005_create_storage_bucket.sql`
- `apps/web/src/lib/supabase-client.ts`
- `apps/web/src/lib/supabase-server.ts`
- `apps/web/src/lib/application-id.ts`
- `apps/web/src/types/supabase.ts`
- `apps/web/package.json` (thêm @supabase/supabase-js, @supabase/ssr)
- `package.json` (thêm supabase CLI devDependency)
- `pnpm-lock.yaml`

## Change Log

- 2026-06-01: Story created by create-story workflow — full Supabase schema, RLS, storage, client files context
- 2026-06-01: Implemented — 5 migrations, Supabase client files, TypeScript types; all ACs verified, lint + typecheck pass
