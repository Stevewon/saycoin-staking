-- Remove UNIQUE constraint to allow 2 payments per day
-- SQLite doesn't support dropping constraints, so we recreate the table

-- Create new table without UNIQUE constraint
CREATE TABLE IF NOT EXISTS daily_rewards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  staking_id INTEGER NOT NULL,
  usdt_amount REAL NOT NULL,
  reward_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (staking_id) REFERENCES staking(id)
);

-- Copy existing data
INSERT INTO daily_rewards_new (id, user_id, staking_id, usdt_amount, reward_date, created_at)
SELECT id, user_id, staking_id, usdt_amount, reward_date, created_at
FROM daily_rewards;

-- Drop old table
DROP TABLE daily_rewards;

-- Rename new table
ALTER TABLE daily_rewards_new RENAME TO daily_rewards;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_date ON daily_rewards(reward_date);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_staking ON daily_rewards(staking_id, reward_date);
