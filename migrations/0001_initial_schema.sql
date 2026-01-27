-- Users table (회원 정보)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  qta_balance REAL DEFAULT 0,
  qx_balance REAL DEFAULT 0,
  usdt_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staking table (스테이킹 정보)
CREATE TABLE IF NOT EXISTS staking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  period_months INTEGER NOT NULL, -- 6 or 12
  qta_reward REAL NOT NULL, -- 3% reward
  qx_reward REAL NOT NULL, -- 3% reward
  start_date DATETIME, -- nullable, set on approval
  end_date DATETIME, -- nullable, set on approval
  status TEXT DEFAULT 'pending', -- pending, active, completed, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily USDT rewards (일일 USDT 보상 기록)
CREATE TABLE IF NOT EXISTS daily_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  staking_id INTEGER NOT NULL,
  usdt_amount REAL NOT NULL, -- 100만개당 0.75 USDT (1천원)
  reward_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (staking_id) REFERENCES staking(id),
  UNIQUE(user_id, staking_id, reward_date) -- 스테이킹별로 하루에 한번만 지급
);

-- Transactions table (거래 내역)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- staking_reward, daily_usdt, withdrawal
  coin_type TEXT NOT NULL, -- QTA, QX, USDT
  amount REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staking_user_id ON staking(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking(status);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_date ON daily_rewards(reward_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
