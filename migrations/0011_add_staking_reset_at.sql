-- 0011_add_staking_reset_at.sql
-- 어드민이 코인 3종(QTA/QX/QKEY)을 리셋했을 때 해당 시점을 기록.
-- reset_at IS NULL  : 정상 스테이킹 (사용자 화면에 노출, 직판 실적 집계)
-- reset_at IS NOT NULL : 리셋된 스테이킹 (사용자 화면 숨김, 직판 실적 제외)
--                       단, 데일리 배당 / 매칭 추천수당은 정상 지급되어야 함.

ALTER TABLE staking ADD COLUMN reset_at DATETIME DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_staking_reset_at ON staking(reset_at);
