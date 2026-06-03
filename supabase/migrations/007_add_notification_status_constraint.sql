-- Enforce valid status values on notification_logs, consistent with the
-- CHECK constraint already present on applications.status.
ALTER TABLE notification_logs
  ADD CONSTRAINT notification_logs_status_check
  CHECK (status IN ('pending', 'sent', 'failed'));
