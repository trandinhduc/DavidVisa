ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS registration_duration INT CHECK (registration_duration IN (30, 60, 90)),
  ADD COLUMN IF NOT EXISTS entry_type TEXT CHECK (entry_type IN ('single', 'multiple'));
