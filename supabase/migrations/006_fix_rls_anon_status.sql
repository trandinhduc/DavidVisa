-- Restrict anon INSERT to status='raw' only.
-- Without this, any client holding the public anon key can POST status='done'
-- directly to the REST API, bypassing the entire processing workflow.
DROP POLICY "anon_insert_applications" ON applications;

CREATE POLICY "anon_insert_applications"
  ON applications FOR INSERT
  TO anon
  WITH CHECK (status = 'raw');
