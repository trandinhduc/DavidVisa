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

-- anon: NO policies on notification_logs → no access
