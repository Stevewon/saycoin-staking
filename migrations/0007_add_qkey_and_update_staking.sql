-- 0007: QKEY 코인 추가 및 스테이킹 시스템 업데이트
-- users 테이블에 qkey_balance 컬럼 추가
ALTER TABLE users ADD COLUMN qkey_balance INTEGER DEFAULT 0;

-- staking 테이블에 qkey_reward, daily_rate 컬럼 추가
ALTER TABLE staking ADD COLUMN qkey_reward INTEGER DEFAULT 0;
ALTER TABLE staking ADD COLUMN daily_rate REAL DEFAULT 0;

-- staking 테이블의 period_months를 period_days로 변환하기 위한 컬럼 추가
ALTER TABLE staking ADD COLUMN period_days INTEGER DEFAULT 0;
