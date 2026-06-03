CREATE TABLE IF NOT EXISTS applications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        text        UNIQUE NOT NULL DEFAULT '',
  last_name     text        NOT NULL,
  first_name    text        NOT NULL,
  email         text        NOT NULL,
  arrival_date  date        NOT NULL,
  status        text        NOT NULL DEFAULT 'raw' CHECK (status IN ('raw', 'ready', 'submitted', 'done')),
  portrait_path text,
  passport_path text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
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
