# Deferred Work

## Deferred from: code review of 1-4-brand-tokens-and-shadcnui-design-system-setup (2026-06-02)

- `@supabase/ssr ^0.10.3` có thể outdated — pre-existing từ Story 1.3, nên audit changelog khi refactor auth/session
- `@david-agency/shared` không có explicit turbo build dependency — pre-existing từ Story 1.1, monitor nếu CI build ordering bị broken

## Deferred from: code review of 1-1 + 1-2 combined (2026-06-01)

- `EXTENSION_ID = 'PLACEHOLDER_EXTENSION_ID'` trong shared package — intentional per spec, Story 4.3 sẽ thay bằng Chrome Extension ID thực
- React 18 (extension) vs React 19 (web) — documented decision, root @types/react: ^19 handle type isolation; monitor khi shared package thêm React components
- turbo.json build outputs thiếu Plasmo output dir (`build/chrome-mv3-*`) — Turbo không cache extension build, CI sẽ luôn rebuild; fix khi CI cost trở nên đáng kể
- `@david-agency/shared` chưa có trong apps/extension deps — intentional, Story 4.3
- `PushToEvisaMessage` signed URLs non-nullable nhưng `ApplicationData` paths nullable — calling code phải validate paths != null trước khi push; Story 4.x cần enforce
- `moduleResolution: bundler` thiếu `exports` field trong packages/shared — nếu consumer chuyển sang node16/nodenext resolution, sẽ fail; acceptable hiện tại
- `ApplicationData` date fields là untyped string — branded types hoặc Date objects có thể cải thiện type safety trong tương lai
- apps/web tsconfig `target: ES2017` vs shared `ES2022` — Next.js SWC xử lý downleveling tại bundler level; monitor nếu thêm native consumers

## Deferred from: code review of 1-1-initialize-monorepo-and-nextjs-app (2026-06-01)

- Plasmo build output `build-chrome-mv3/` không có trong turbo.json outputs — ảnh hưởng caching nhưng không ảnh hưởng correctness
- `apps/extension/tsconfig.json` include `.plasmo/index.d.ts` chỉ tồn tại sau `plasmo dev/build` — cần chú ý khi thêm typecheck script cho extension (Story tiếp theo)
- `packages/shared` trỏ `main`/`types` đến raw `.ts` source — intentional per spec Dev Notes, acceptable với bundler consumers; nếu cần non-bundler consumers thì cần thêm build step + exports field
- Root `.gitignore` chỉ cover `.env.local`, chưa cover `.env.*` tại root level — low risk hiện tại
- `apps/extension/popup.tsx` `<input>` thiếu accessibility — placeholder code sẽ bị thay hoàn toàn ở Story 4.3
- `apps/extension/package.json` author/contributors còn là Plasmo Corp. boilerplate — cosmetic, sửa khi có thời gian

## Deferred from: code review of 1-3-supabase-schema-rls-and-private-storage-setup (2026-06-01)

- Anon có thể set `portrait_path`/`passport_path` trỏ đến file của application khác — sẽ được validate tại API route Story 2.4
- Không có rate-limiting hay abuse protection ở DB layer — thuộc application layer/middleware concern
- `email` column không có format CHECK constraint — email validation thuộc Story 2.4 API layer
- `notification_logs.type` và `channel` không có enum/CHECK constraint — notification types chưa xác định đến Story 5.x
- `applications` không có index trên `email` — email lookup chưa được yêu cầu trong story hiện tại
- `update_updated_at_column()` function name quá generic — refactor khi pattern được reuse
- Non-null assertions `!` trên env vars trong `supabase-client.ts` — central env validation là concern riêng

## Deferred from: code review of 2-2-photo-upload-component-with-heic-support (2026-06-04)

- Race condition nhỏ trong `useEffect` previewUrl (`ImageUpload.tsx:25-34`) — stale objectURL hiển thị brief nếu value thay đổi nhanh; low severity, pre-existing React lifecycle pattern
- `z.instanceof(File)` SSR unsafe (`form-schemas.ts:11-12`) — nếu schema được import trong server context tương lai sẽ gây ReferenceError; acceptable vì schema được khai báo trong `'use client'` component tree

## Deferred from: code review of 2-3-arrival-date-input-with-real-time-confirmation (2026-06-04)

- Incomplete date entry on submit might show 'Required' instead of 'Invalid Format' if blur doesn't happen first — deferred, minor RHF interaction quirk

## Deferred from: code review of 2-5-recaptcha-integration-submit-flow-and-success-page (2026-06-05)

- reCAPTCHA validation silently bypassed if secret key is missing — Tạm hoãn theo yêu cầu của người dùng.
