-- Increase sequence padding from 4 to 6 digits so the ID format stays
-- consistent until record 999,999. With 4-digit padding the format silently
-- changed at record 10,000; 6-digit padding gives ample headroom for this
-- service's expected scale.
CREATE OR REPLACE FUNCTION generate_app_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.app_id := 'DA-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('application_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
