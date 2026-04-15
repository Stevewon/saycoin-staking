-- 0008: USDT 지갑주소 컬럼 추가
-- users 테이블에 usdt_wallet_address 컬럼 추가 (바이낸스 USDT 지갑주소)
ALTER TABLE users ADD COLUMN usdt_wallet_address TEXT DEFAULT '';
