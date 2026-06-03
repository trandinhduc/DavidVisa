-- Reject obviously invalid email addresses at the DB layer.
-- The pattern requires at least one non-whitespace char before @,
-- a domain part, and a dot-separated TLD.
ALTER TABLE applications
  ADD CONSTRAINT applications_email_format
  CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
