-- 출금 수수료 정책 도입 (사장님 정책 2026-05-11, 5% 공제)
-- A안 결재: 잔액 100% 차감 / 회사 5% 공제 / 실송금 95% / 거절시 100% 환불
ALTER TABLE withdrawals ADD COLUMN fee REAL DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN net_amount REAL DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN fee_rate REAL DEFAULT 0.05;
