-- Prevent backwards status transitions so that records cannot be reverted
-- once advanced (e.g. 'done' → 'raw'). Forward jumps (e.g. 'raw' → 'done')
-- are still allowed for operator flexibility; same-status updates are unaffected.
CREATE OR REPLACE FUNCTION enforce_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  flow text[] := ARRAY['raw', 'ready', 'submitted', 'done'];
BEGIN
  IF array_position(flow, NEW.status) < array_position(flow, OLD.status) THEN
    RAISE EXCEPTION 'Invalid status transition: cannot revert from % to %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_status_transition
  BEFORE UPDATE ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_status_transition();
