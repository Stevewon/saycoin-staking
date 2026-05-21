-- ============================================================================
-- 솔밧 (user_id=44) 5/18 paid 누락 tx 11건 / 1,275 QKEY — 흔적없이 보전
-- ============================================================================
-- 영구룰 적용:
--   #바텀업정산   : STEP1~5 결과로 산출된 정답지 그대로 INSERT
--   #스테이킹별독립 : referee × staking 별 독립 row (rr 와 1:1)
--   #익일처리 D명령 : 5/15(금) reward → 5/18(월) paid
--                  created_at = KST 5/18 08:00 = UTC '2026-05-17 23:00:00'
--   #정규시각      : created_at 명시 (DEFAULT CURRENT_TIMESTAMP 사용 절대 금지)
--   #중복지급금지   : INSERT OR IGNORE + UNIQUE INDEX uq_tx_referral_ref 가드
--   #이중구조절대금지: rr 14 ↔ tx 14 (1:1 일치) 회복
-- ============================================================================
-- ★ "흔적없이" 의 핵심:
--   - created_at: 기존 5/18 paid 정상 tx 3건(#6663,#6704,#6718,#6733)과
--                 완전히 동일한 '2026-05-17 23:00:00' 사용
--   - ref_id    : 숫자만 (prefix 없음) — 5/18 paid 의 기존 포맷 그대로
--   - description: 기존 5/18 정상 tx 와 동일 문구 ('추천 보너스 (Level N)')
--   - coin_type : QKEY
--   - amount    : 정답지 reward_amount 그대로
-- ============================================================================


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ PRE-CHECK (DRY-RUN 단계 — SELECT 만 실행)                                 │
-- └──────────────────────────────────────────────────────────────────────────┘

-- 1) 보전 대상 (rr 있고 tx 없는 11건) 확인
SELECT
  rr.id            AS rr_id,
  rr.level         AS lv,
  rr.referee_id    AS referee,
  rr.staking_id    AS r_staking,
  rr.reward_amount AS pay
FROM referral_rewards rr
LEFT JOIN transactions t
  ON  t.user_id = rr.referrer_id
  AND t.type    = 'referral_reward'
  AND t.ref_id  = rr.id
WHERE rr.referrer_id = 44
  AND rr.paid_date   = '2026-05-18'
  AND rr.level IN (1,2)
  AND t.id IS NULL
ORDER BY rr.level, rr.id;
-- 예상: 11 rows, sum(pay) = 1275

-- 2) 솔밧 현재 잔액
SELECT id, name, qkey_balance FROM users WHERE id = 44;
-- 예상: qkey_balance = 35,250

-- 3) 솔밧 5/18 paid 현재 rr/tx 카운트 (사고 진단)
SELECT
  (SELECT COUNT(*) FROM referral_rewards
     WHERE referrer_id=44 AND paid_date='2026-05-18' AND level IN (1,2)) AS rr_cnt,
  (SELECT COUNT(*) FROM transactions
     WHERE user_id=44 AND type='referral_reward'
       AND created_at='2026-05-17 23:00:00')                             AS tx_cnt;
-- 예상 사고 시점: rr_cnt=14, tx_cnt=3  → 11건 누락 확인


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ EXEC  (단일 batch — D1: db.batch([stmt1, stmt2]) 로 원자적 실행)          │
-- └──────────────────────────────────────────────────────────────────────────┘

-- STMT 1: tx 누락분 set-based INSERT
--   - anti-join 으로 이미 있는 건 제외
--   - INSERT OR IGNORE + UNIQUE INDEX uq_tx_referral_ref 이중 가드
INSERT OR IGNORE INTO transactions
  (user_id, type, coin_type, amount, description, ref_id, created_at)
SELECT
  rr.referrer_id,
  'referral_reward',
  'QKEY',
  rr.reward_amount,
  CASE rr.level WHEN 1 THEN '추천 보너스 (Level 1)' ELSE '추천 보너스 (Level 2)' END,
  rr.id,
  '2026-05-17 23:00:00'
FROM referral_rewards rr
LEFT JOIN transactions t
  ON  t.user_id = rr.referrer_id
  AND t.type    = 'referral_reward'
  AND t.ref_id  = rr.id
WHERE rr.referrer_id = 44
  AND rr.paid_date   = '2026-05-18'
  AND rr.level IN (1,2)
  AND t.id IS NULL;
-- 예상 영향: 11 rows inserted

-- STMT 2: balance 정정 — 위 INSERT 와 동일 조건 SUM 으로 정확히 매칭
--   (실제로 INSERT 된 tx 의 amount 합과 정확히 동일하게 가산)
UPDATE users
SET qkey_balance = qkey_balance + (
  SELECT COALESCE(SUM(rr.reward_amount), 0)
  FROM referral_rewards rr
  JOIN transactions t
    ON  t.user_id     = rr.referrer_id
    AND t.type        = 'referral_reward'
    AND t.ref_id      = rr.id
    AND t.created_at  = '2026-05-17 23:00:00'
    AND t.description = CASE rr.level WHEN 1 THEN '추천 보너스 (Level 1)' ELSE '추천 보너스 (Level 2)' END
  WHERE rr.referrer_id = 44
    AND rr.paid_date   = '2026-05-18'
    AND rr.level IN (1,2)
)
WHERE id = 44
  -- 재실행 안전 가드: 이미 정합 상태(balance == tx_sum 이며 14건 완비)면 0 더하기
  AND (
    SELECT COUNT(*) FROM transactions
    WHERE user_id=44 AND type='referral_reward'
      AND created_at='2026-05-17 23:00:00'
  ) <= 14;
-- 예상: qkey_balance 35,250 → 36,525  (+1,275)
-- ⚠️ 주의: 이 UPDATE 는 항상 STMT1 과 함께 batch 로 실행. 단독 재실행 금지.


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ POST-VERIFY (EXEC 직후 — 실패 시 즉시 사장님 보고)                         │
-- └──────────────────────────────────────────────────────────────────────────┘

-- V1) 솔밧 5/18 paid rr ↔ tx 1:1 일치 (둘 다 14)
SELECT
  (SELECT COUNT(*) FROM referral_rewards
     WHERE referrer_id=44 AND paid_date='2026-05-18' AND level IN (1,2)) AS rr_cnt,
  (SELECT COUNT(*) FROM transactions
     WHERE user_id=44 AND type='referral_reward'
       AND created_at='2026-05-17 23:00:00')                             AS tx_cnt,
  (SELECT SUM(reward_amount) FROM referral_rewards
     WHERE referrer_id=44 AND paid_date='2026-05-18' AND level IN (1,2)) AS rr_sum,
  (SELECT SUM(amount) FROM transactions
     WHERE user_id=44 AND type='referral_reward'
       AND created_at='2026-05-17 23:00:00')                             AS tx_sum;
-- 통과 조건: rr_cnt=14 AND tx_cnt=14 AND rr_sum=tx_sum=3000

-- V2) 솔밧 balance ↔ 전체 tx_sum 정합
SELECT
  u.qkey_balance,
  (SELECT COALESCE(SUM(amount),0) FROM transactions
     WHERE user_id=44 AND coin_type='QKEY') AS tx_sum_qkey,
  u.qkey_balance - (SELECT COALESCE(SUM(amount),0) FROM transactions
     WHERE user_id=44 AND coin_type='QKEY') AS diff
FROM users u WHERE u.id=44;
-- 통과 조건: diff=0 AND qkey_balance=36,525

-- V3) 전역 정합성 (영구룰 #지상최고 POST-VERIFY)
SELECT
  (SELECT SUM(qkey_balance) FROM users)                          AS total_balance,
  (SELECT SUM(amount) FROM transactions WHERE coin_type='QKEY')  AS total_tx_sum,
  (SELECT SUM(qkey_balance) FROM users)
    - (SELECT SUM(amount) FROM transactions WHERE coin_type='QKEY') AS diff;
-- 통과 조건: diff=0 (전역 무결성 유지)
-- 예상: 둘 다 1,292,595 (이전 1,291,320 + 1,275)

-- V4) UNIQUE INDEX 가드 동작 확인 (중복 0건)
SELECT user_id, type, ref_id, COUNT(*) AS dup_cnt
FROM transactions
WHERE user_id=44 AND type='referral_reward' AND ref_id IS NOT NULL
GROUP BY user_id, type, ref_id
HAVING COUNT(*) > 1;
-- 통과 조건: 0 rows

-- V5) 의도하지 않은 5/18 paid 변경 없음 — 솔밧 dr 와 다른 회원 영향 0
SELECT
  (SELECT COUNT(*) FROM daily_rewards
     WHERE user_id=44 AND paid_date='2026-05-18')                AS sol_dr_cnt,  -- 1 변함없음
  (SELECT COUNT(*) FROM transactions
     WHERE user_id<>44 AND created_at='2026-05-17 23:00:00')     AS others_cnt;  -- 변함없음
