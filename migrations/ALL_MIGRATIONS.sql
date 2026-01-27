-- ========================================
-- SAYCOIN STAKING 프로덕션 데이터베이스 전체 마이그레이션
-- 실행 방법: Cloudflare D1 Console에서 전체 복사 후 실행
-- ========================================

-- ========================================
-- 0001: users 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  qta_balance INTEGER DEFAULT 0,
  qx_balance INTEGER DEFAULT 0,
  usdt_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- ========================================
-- 0002: staking 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS staking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  period_months INTEGER NOT NULL,
  qta_reward INTEGER DEFAULT 0,
  qx_reward INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_staking_user_id ON staking(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking(status);
CREATE INDEX IF NOT EXISTS idx_staking_dates ON staking(start_date, end_date);

-- ========================================
-- 0003: daily_rewards 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS daily_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  staking_id INTEGER NOT NULL,
  usdt_amount REAL NOT NULL,
  reward_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (staking_id) REFERENCES staking(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_staking_id ON daily_rewards(staking_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_date ON daily_rewards(reward_date);

-- ========================================
-- 0004: transactions 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  coin_type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ========================================
-- 0005: withdrawals 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  coin_type TEXT NOT NULL,
  amount REAL NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- ========================================
-- 테스트 데이터 삽입 (선택 사항)
-- ========================================

-- 테스트 사용자 추가
INSERT OR IGNORE INTO users (email, password, name, phone, wallet_address, qta_balance, qx_balance, usdt_balance)
VALUES 
  ('test@example.com', 'password123', '테스트유저', '01012345678', '0x1234567890123456789012345678901234567890', 300000, 300000, 15),
  ('admin@saycoin.com', 'admin1234', '관리자', '01087654321', '0xABCDEF1234567890123456789012345678901234', 0, 0, 0),
  ('user1@gmail.com', 'user1234', '사용자1', '01011112222', '0x1111111111111111111111111111111111111111', 500000, 500000, 30),
  ('user2@naver.com', 'user2234', '사용자2', '01022223333', '0x2222222222222222222222222222222222222222', 1000000, 1000000, 75);

-- 테스트 스테이킹 데이터 추가
INSERT OR IGNORE INTO staking (user_id, amount, period_months, qta_reward, qx_reward, start_date, end_date, status)
VALUES 
  (1, 10000000, 6, 300000, 300000, date('now'), date('now', '+6 months'), 'active'),
  (1, 20000000, 12, 600000, 600000, date('now', '-30 days'), date('now', '+11 months'), 'active'),
  (3, 15000000, 6, 450000, 450000, date('now', '-60 days'), date('now', '+4 months'), 'active'),
  (3, 25000000, 12, 750000, 750000, date('now', '-10 days'), date('now', '+11 months', '+20 days'), 'pending'),
  (4, 50000000, 12, 1500000, 1500000, date('now', '-180 days'), date('now', '+6 months'), 'active');

-- 테스트 일일 보상 데이터 추가
INSERT OR IGNORE INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date)
VALUES 
  (1, 1, 7.5, date('now')),
  (1, 1, 7.5, date('now', '-1 day')),
  (1, 2, 15.0, date('now')),
  (3, 3, 11.25, date('now')),
  (4, 5, 37.5, date('now'));

-- 테스트 거래 내역 추가
INSERT OR IGNORE INTO transactions (user_id, type, coin_type, amount, description)
VALUES 
  (1, 'reward', 'QTA', 300000, '스테이킹 보상 지급'),
  (1, 'reward', 'QX', 300000, '스테이킹 보상 지급'),
  (1, 'reward', 'USDT', 7.5, '일일 USDT 보상'),
  (3, 'reward', 'QTA', 450000, '스테이킹 보상 지급'),
  (3, 'reward', 'QX', 450000, '스테이킹 보상 지급'),
  (4, 'reward', 'QTA', 1500000, '스테이킹 보상 지급'),
  (4, 'reward', 'QX', 1500000, '스테이킹 보상 지급');

-- ========================================
-- 데이터 확인 쿼리 (선택 사항)
-- ========================================

-- 테이블 목록 확인
-- SELECT name FROM sqlite_master WHERE type='table';

-- 사용자 수 확인
-- SELECT COUNT(*) as user_count FROM users;

-- 스테이킹 수 확인
-- SELECT COUNT(*) as staking_count FROM staking;

-- 활성 스테이킹 확인
-- SELECT u.name, s.amount, s.period_months, s.status, s.start_date, s.end_date
-- FROM staking s
-- JOIN users u ON s.user_id = u.id
-- WHERE s.status = 'active';

-- 사용자별 잔액 확인
-- SELECT name, qta_balance, qx_balance, usdt_balance
-- FROM users
-- ORDER BY qta_balance DESC;

-- ========================================
-- 완료!
-- ========================================
-- 모든 테이블이 성공적으로 생성되었습니다.
-- 테스트 데이터가 삽입되었습니다.
-- ========================================
