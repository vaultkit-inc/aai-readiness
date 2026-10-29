-- Design partner leads from vaultkit.io, stored alongside ARI leads.
--
-- Written by the vaultkit.io design partner form
-- (vaultkit-inc/vaultkit_landing_page, POST /api/design-partner). Apply it
-- before that form goes live. Existing ARI inserts are unaffected: they omit
-- source, which defaults to 'ari'.
--
-- Rows keep their ARI-only columns required when source = 'ari'; design
-- partner rows carry role, use cases and notes instead. Inserts still come only
-- from server-side routes using the service-role key; RLS stays on with no
-- policies, so the anon key can neither read nor write.

ALTER TABLE ari_leads
  ADD COLUMN IF NOT EXISTS source    text   NOT NULL DEFAULT 'ari',
  ADD COLUMN IF NOT EXISTS role      text,
  ADD COLUMN IF NOT EXISTS use_cases text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes     text;

ALTER TABLE ari_leads
  ALTER COLUMN score   DROP NOT NULL,
  ALTER COLUMN level   DROP NOT NULL,
  ALTER COLUMN dims    DROP NOT NULL,
  ALTER COLUMN answers DROP NOT NULL;

ALTER TABLE ari_leads
  ADD CONSTRAINT ari_leads_source_check
    CHECK (source IN ('ari', 'design_partner')),
  ADD CONSTRAINT ari_leads_ari_fields_check
    CHECK (source <> 'ari' OR (score IS NOT NULL AND level IS NOT NULL AND dims IS NOT NULL AND answers IS NOT NULL)),
  ADD CONSTRAINT ari_leads_design_partner_fields_check
    CHECK (source <> 'design_partner' OR company IS NOT NULL);

CREATE INDEX IF NOT EXISTS ari_leads_source_created_at_idx ON ari_leads (source, created_at DESC);
