-- 추천인 시스템 추가
-- 실행 날짜: 2026-01-28

-- users 테이블에 추천인 관련 컬럼 추가
ALTER TABLE users ADD COLUMN referral_code TEXT;
ALTER TABLE users ADD COLUMN referrer_id INTEGER;

-- 추천인 코드 유니크 인덱스 생성 (UNIQUE 제약조건 대신)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_unique ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);

-- 추천인 보상 내역 테이블 생성
CREATE TABLE IF NOT EXISTS referral_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  original_amount REAL NOT NULL,
  reward_amount REAL NOT NULL,
  reward_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referee ON referral_rewards(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_date ON referral_rewards(reward_date);
