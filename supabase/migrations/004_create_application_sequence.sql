-- Sequence for app_id numbers (global, does not reset per year — MVP scope ~500 records)
CREATE SEQUENCE IF NOT EXISTS application_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- Function to generate DA-YYYY-XXXX format
CREATE OR REPLACE FUNCTION generate_app_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.app_id := 'DA-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('application_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-set app_id before INSERT
CREATE TRIGGER set_app_id_before_insert
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION generate_app_id();
