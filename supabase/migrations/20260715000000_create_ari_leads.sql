-- Agent Readiness Index: lead capture table
-- Inserts come only from the server-side API route via service-role key.
-- No public read policy is intentional.

CREATE TABLE IF NOT EXISTS ari_leads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL    DEFAULT now(),
  email       text        NOT NULL,
  company     text,
  score       integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  level       integer     NOT NULL CHECK (level BETWEEN 1 AND 4),
  dims        jsonb       NOT NULL,
  answers     jsonb       NOT NULL
);

ALTER TABLE ari_leads ENABLE ROW LEVEL SECURITY;

-- No SELECT policy: reads happen only via service-role key (bypasses RLS)
-- No INSERT policy: inserts happen only via service-role key (bypasses RLS)
-- Public anon key cannot read or write this table.
