-- 0015_add_tx_unique_indexes.sql
-- Purpose: DB-level UNIQUE INDEX to permanently prevent duplicate daily_qkey / referral_reward transactions
-- Rule: 영구룰 #중복지급금지 — DB-level guard
-- Applied via /api/diag/apply-tx-unique-index (2026-05-18)
--
-- Mechanism:
--   - Each daily_reward (dr) or referral_reward (rr) record has a unique id.
--   - When inserting the corresponding transaction (tx), ref_id should be set to the dr/rr id.
--   - A unique (user_id, ref_id) constraint per type prevents accidental double insertion
--     even if the application-level EXISTS check is missing or fails (e.g. case-sensitivity bugs).
--
-- NULL ref_id rows are excluded from the index (SQLite partial unique standard behavior).
-- Historical NULL-ref_id rows from legacy fix endpoints are unaffected.

CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_daily_qkey_ref
  ON transactions (user_id, ref_id)
  WHERE type = 'daily_qkey' AND ref_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_referral_ref
  ON transactions (user_id, ref_id)
  WHERE type = 'referral_reward' AND ref_id IS NOT NULL;
