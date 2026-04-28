-- Daily reward backfill (with referral rewards)
-- Generated: 2026-04-28T11:49:47.191Z

INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (2, 1, 15000, '2026-04-23', '2026-04-23 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'daily_qkey', 'QKEY', 15000, 'Daily reward backfill 2026-04-23 (1.0%, staking #1)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 2, 1, 15000, 3000, '2026-04-23', '2026-04-23 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 3000, 'Level 1 referral bonus backfill 2026-04-23 (15000 QKEY x 20%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (16, 2, 15000, '2026-04-23', '2026-04-23 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (16, 'daily_qkey', 'QKEY', 15000, 'Daily reward backfill 2026-04-23 (1.0%, staking #2)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 16, 1, 15000, 3000, '2026-04-23', '2026-04-23 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 3000, 'Level 1 referral bonus backfill 2026-04-23 (15000 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 16, 2, 15000, 1500, '2026-04-23', '2026-04-23 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 1500, 'Level 2 referral bonus backfill 2026-04-23 (15000 QKEY x 10%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (1, 3, 5250, '2026-04-21', '2026-04-21 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'daily_qkey', 'QKEY', 5250, 'Daily reward backfill 2026-04-21 (0.7%, staking #3)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (1, 3, 5250, '2026-04-22', '2026-04-22 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'daily_qkey', 'QKEY', 5250, 'Daily reward backfill 2026-04-22 (0.7%, staking #3)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (1, 3, 5250, '2026-04-23', '2026-04-23 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'daily_qkey', 'QKEY', 5250, 'Daily reward backfill 2026-04-23 (0.7%, staking #3)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (1, 3, 5250, '2026-04-24', '2026-04-24 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'daily_qkey', 'QKEY', 5250, 'Daily reward backfill 2026-04-24 (0.7%, staking #3)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (1, 3, 5250, '2026-04-27', '2026-04-27 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'daily_qkey', 'QKEY', 5250, 'Daily reward backfill 2026-04-27 (0.7%, staking #3)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (9, 4, 2250, '2026-04-21', '2026-04-21 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (9, 'daily_qkey', 'QKEY', 2250, 'Daily reward backfill 2026-04-21 (0.5%, staking #4)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 9, 1, 2250, 450, '2026-04-21', '2026-04-21 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 450, 'Level 1 referral bonus backfill 2026-04-21 (2250 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 9, 2, 2250, 225, '2026-04-21', '2026-04-21 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 225, 'Level 2 referral bonus backfill 2026-04-21 (2250 QKEY x 10%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (9, 4, 2250, '2026-04-22', '2026-04-22 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (9, 'daily_qkey', 'QKEY', 2250, 'Daily reward backfill 2026-04-22 (0.5%, staking #4)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 9, 1, 2250, 450, '2026-04-22', '2026-04-22 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 450, 'Level 1 referral bonus backfill 2026-04-22 (2250 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 9, 2, 2250, 225, '2026-04-22', '2026-04-22 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 225, 'Level 2 referral bonus backfill 2026-04-22 (2250 QKEY x 10%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (9, 4, 2250, '2026-04-23', '2026-04-23 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (9, 'daily_qkey', 'QKEY', 2250, 'Daily reward backfill 2026-04-23 (0.5%, staking #4)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 9, 1, 2250, 450, '2026-04-23', '2026-04-23 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 450, 'Level 1 referral bonus backfill 2026-04-23 (2250 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 9, 2, 2250, 225, '2026-04-23', '2026-04-23 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 225, 'Level 2 referral bonus backfill 2026-04-23 (2250 QKEY x 10%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (9, 4, 2250, '2026-04-24', '2026-04-24 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (9, 'daily_qkey', 'QKEY', 2250, 'Daily reward backfill 2026-04-24 (0.5%, staking #4)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 9, 1, 2250, 450, '2026-04-24', '2026-04-24 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 450, 'Level 1 referral bonus backfill 2026-04-24 (2250 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 9, 2, 2250, 225, '2026-04-24', '2026-04-24 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 225, 'Level 2 referral bonus backfill 2026-04-24 (2250 QKEY x 10%)');
INSERT INTO daily_rewards (user_id, staking_id, usdt_amount, reward_date, created_at) VALUES (9, 4, 2250, '2026-04-27', '2026-04-27 00:00:01');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (9, 'daily_qkey', 'QKEY', 2250, 'Daily reward backfill 2026-04-27 (0.5%, staking #4)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (2, 9, 1, 2250, 450, '2026-04-27', '2026-04-27 00:00:02');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (2, 'referral_reward', 'QKEY', 450, 'Level 1 referral bonus backfill 2026-04-27 (2250 QKEY x 20%)');
INSERT INTO referral_rewards (referrer_id, referee_id, level, original_amount, reward_amount, reward_date, created_at) VALUES (1, 9, 2, 2250, 225, '2026-04-27', '2026-04-27 00:00:03');
INSERT INTO transactions (user_id, type, coin_type, amount, description) VALUES (1, 'referral_reward', 'QKEY', 225, 'Level 2 referral bonus backfill 2026-04-27 (2250 QKEY x 10%)');

-- Balance updates (consolidated per user)
UPDATE users SET qkey_balance = qkey_balance + 31875 WHERE id = 1;
UPDATE users SET qkey_balance = qkey_balance + 20250 WHERE id = 2;
UPDATE users SET qkey_balance = qkey_balance + 11250 WHERE id = 9;
UPDATE users SET qkey_balance = qkey_balance + 15000 WHERE id = 16;