-- Add txid column to staking table for BNB Chain TXID tracking
ALTER TABLE staking ADD COLUMN txid TEXT DEFAULT '';
