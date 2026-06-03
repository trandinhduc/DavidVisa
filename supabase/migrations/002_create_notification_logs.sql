CREATE TABLE IF NOT EXISTS notification_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type           text        NOT NULL,
  channel        text        NOT NULL,
  status         text        NOT NULL,
  attempt        int         NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON notification_logs(application_id);
