-- Replace DEFAULT '' with a unique fallback so that if the trigger is ever
-- disabled (e.g. during pg_restore or maintenance), rows still get a unique
-- app_id instead of all colliding on the same empty string.
ALTER TABLE applications
  ALTER COLUMN app_id SET DEFAULT gen_random_uuid()::text;
