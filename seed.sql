-- Seed data for testing

-- Insert test users (비밀번호: password123)
INSERT OR IGNORE INTO users (id, email, password, name, phone, wallet_address, qta_balance, qx_balance, usdt_balance) VALUES 
  (1, 'test@example.com', 'password123', '테스트유저', '01012345678', '0x1234567890123456789012345678901234567890', 300000, 300000, 0),
  (2, 'test123@example.com', 'password123', '테스트사용자', '01023456789', '0x2345678901234567890123456789012345678901', 600000, 600000, 0),
  (3, 'hbcu00987@gmail.com', 'password123', '원용진', '01034567890', '0x3456789012345678901234567890123456789012', 900000, 900000, 0),
  (4, 'user4@example.com', 'password123', '사용자4', '01045678901', '0x4567890123456789012345678901234567890123', 0, 0, 0),
  (5, 'user5@example.com', 'password123', '사용자5', '01056789012', '0x5678901234567890123456789012345678901234', 0, 0, 0),
  (6, 'user6@example.com', 'password123', '사용자6', '01067890123', '0x6789012345678901234567890123456789012345', 0, 0, 0),
  (7, 'user7@example.com', 'password123', '사용자7', '01078901234', '0x7890123456789012345678901234567890123456', 0, 0, 0),
  (8, 'user8@example.com', 'password123', '사용자8', '01089012345', '0x8901234567890123456789012345678901234567', 0, 0, 0),
  (9, 'testuser@gmail.com', 'password123', 'TestUser', '01090123456', '0x9012345678901234567890123456789012345678', 0, 0, 0),
  (10, 'casetest@naver.com', 'password123', '케이스테스트', '01088889999', '0x6666666666666666666666666666666666666666', 0, 0, 0);

-- Insert active staking records
INSERT OR IGNORE INTO staking (id, user_id, amount, period_months, qta_reward, qx_reward, start_date, end_date, status) VALUES
  (1, 1, 10000000, 6, 300000, 300000, '2026-01-15 10:00:00', '2026-07-15 10:00:00', 'active'),
  (2, 2, 20000000, 12, 600000, 600000, '2026-01-16 11:00:00', '2027-01-16 11:00:00', 'active'),
  (3, 3, 30000000, 12, 900000, 900000, '2026-01-17 12:00:00', '2027-01-17 12:00:00', 'active');

-- Insert pending staking records (for admin approval)
INSERT OR IGNORE INTO staking (id, user_id, amount, period_months, qta_reward, qx_reward, start_date, end_date, status) VALUES
  (4, 4, 15000000, 6, 450000, 450000, NULL, NULL, 'pending'),
  (5, 5, 25000000, 12, 750000, 750000, NULL, NULL, 'pending');
