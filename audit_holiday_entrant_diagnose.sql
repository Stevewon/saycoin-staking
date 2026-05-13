-- ============================================================
-- 휴일진입자 평일 데일리 누락 정밀 진단 SQL (B안 — 읽기 전용)
-- 작성: 2026-05-13
-- 목적: audit 엔드포인트 라벨 -1일 버그를 우회하여 실제 누락 날짜 확정
-- 안전: 모두 SELECT only — DB 변경 절대 없음
-- ============================================================
--
-- 실행 방법 (사장님 직접 실행):
--   cd /home/user/webapp
--   각 쿼리를 wrangler d1 execute 로 개별 실행:
--   npx wrangler d1 execute quantarium-staking-production --remote --file=audit_holiday_entrant_diagnose.sql
--
-- 또는 개별 쿼리:
--   npx wrangler d1 execute quantarium-staking-production --remote --command="<쿼리 한 줄>"
-- ============================================================


-- ============================================================
-- ① 휴일진입자 27건 staking 명단 추출
-- ============================================================
SELECT 
  s.id AS staking_id,
  s.user_id,
  u.name AS user_name,
  u.email,
  s.amount,
  s.daily_rate,
  date(datetime(s.start_date, '+9 hours')) AS kst_start_date,
  CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) AS kst_start_weekday,
  CASE CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER)
    WHEN 0 THEN '일' WHEN 1 THEN '월' WHEN 2 THEN '화' WHEN 3 THEN '수'
    WHEN 4 THEN '목' WHEN 5 THEN '금' WHEN 6 THEN '토'
  END AS kst_start_weekday_name,
  ROUND(s.amount * s.daily_rate * 150) AS expected_qkey_per_day,
  u.referrer_id AS l1_user_id
FROM staking s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active'
  AND (
    CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) IN (0, 6)
    OR date(datetime(s.start_date, '+9 hours')) IN (
      '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01',
      '2026-05-01','2026-05-05','2026-05-24','2026-06-06','2026-08-15',
      '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-09','2026-12-25'
    )
  )
ORDER BY s.id ASC;


-- ============================================================
-- ② 휴일진입자 27건의 daily_rewards 실제 지급 이력
-- ============================================================
SELECT 
  dr.staking_id,
  dr.reward_date,
  dr.usdt_amount AS qkey_amount,
  dr.paid_date,
  dr.created_at
FROM daily_rewards dr
WHERE dr.staking_id IN (
  SELECT s.id
  FROM staking s
  WHERE s.status = 'active'
    AND (
      CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) IN (0, 6)
      OR date(datetime(s.start_date, '+9 hours')) IN (
        '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01',
        '2026-05-01','2026-05-05','2026-05-24','2026-06-06','2026-08-15',
        '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-09','2026-12-25'
      )
    )
)
ORDER BY dr.staking_id ASC, dr.reward_date ASC;


-- ============================================================
-- ③ 휴일진입자별 누락 평일 정밀 산출 (핵심 진단)
-- ============================================================
WITH holiday_entrants AS (
  SELECT 
    s.id AS staking_id,
    s.user_id,
    date(datetime(s.start_date, '+9 hours')) AS kst_start_date,
    ROUND(s.amount * s.daily_rate * 150) AS expected_qkey_per_day
  FROM staking s
  WHERE s.status = 'active'
    AND (
      CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) IN (0, 6)
      OR date(datetime(s.start_date, '+9 hours')) IN (
        '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01',
        '2026-05-01','2026-05-05','2026-05-24','2026-06-06','2026-08-15',
        '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-09','2026-12-25'
      )
    )
),
weekday_candidates AS (
  SELECT date_str FROM (
    SELECT '2026-04-01' AS date_str UNION SELECT '2026-04-02' UNION SELECT '2026-04-03'
    UNION SELECT '2026-04-06' UNION SELECT '2026-04-07' UNION SELECT '2026-04-08'
    UNION SELECT '2026-04-09' UNION SELECT '2026-04-10' UNION SELECT '2026-04-13'
    UNION SELECT '2026-04-14' UNION SELECT '2026-04-15' UNION SELECT '2026-04-16'
    UNION SELECT '2026-04-17' UNION SELECT '2026-04-20' UNION SELECT '2026-04-21'
    UNION SELECT '2026-04-22' UNION SELECT '2026-04-23' UNION SELECT '2026-04-24'
    UNION SELECT '2026-04-27' UNION SELECT '2026-04-28' UNION SELECT '2026-04-29'
    UNION SELECT '2026-04-30' UNION SELECT '2026-05-04' UNION SELECT '2026-05-06'
    UNION SELECT '2026-05-07' UNION SELECT '2026-05-08' UNION SELECT '2026-05-11'
    UNION SELECT '2026-05-12'
    -- 제외 (KST 휴일/공휴일): 모든 토/일, 5/1 근로자의날, 5/5 어린이날
  )
)
SELECT 
  he.staking_id,
  he.user_id,
  he.kst_start_date,
  he.expected_qkey_per_day,
  wc.date_str AS missing_weekday
FROM holiday_entrants he
CROSS JOIN weekday_candidates wc
WHERE wc.date_str > he.kst_start_date
  AND wc.date_str <= '2026-05-12'
  AND NOT EXISTS (
    SELECT 1 FROM daily_rewards dr
    WHERE dr.staking_id = he.staking_id
      AND dr.reward_date = wc.date_str
  )
ORDER BY he.staking_id ASC, wc.date_str ASC;


-- ============================================================
-- ④ 누락 합계 검증 (총 일수 / 총 QKEY / 영향 staking 수)
-- ============================================================
WITH holiday_entrants AS (
  SELECT s.id AS staking_id, ROUND(s.amount * s.daily_rate * 150) AS qpd,
         date(datetime(s.start_date, '+9 hours')) AS kst_start_date
  FROM staking s
  WHERE s.status = 'active'
    AND (
      CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) IN (0, 6)
      OR date(datetime(s.start_date, '+9 hours')) IN (
        '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01',
        '2026-05-01','2026-05-05','2026-05-24','2026-06-06','2026-08-15',
        '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-09','2026-12-25'
      )
    )
),
weekday_candidates AS (
  SELECT date_str FROM (
    SELECT '2026-04-01' AS date_str UNION SELECT '2026-04-02' UNION SELECT '2026-04-03'
    UNION SELECT '2026-04-06' UNION SELECT '2026-04-07' UNION SELECT '2026-04-08'
    UNION SELECT '2026-04-09' UNION SELECT '2026-04-10' UNION SELECT '2026-04-13'
    UNION SELECT '2026-04-14' UNION SELECT '2026-04-15' UNION SELECT '2026-04-16'
    UNION SELECT '2026-04-17' UNION SELECT '2026-04-20' UNION SELECT '2026-04-21'
    UNION SELECT '2026-04-22' UNION SELECT '2026-04-23' UNION SELECT '2026-04-24'
    UNION SELECT '2026-04-27' UNION SELECT '2026-04-28' UNION SELECT '2026-04-29'
    UNION SELECT '2026-04-30' UNION SELECT '2026-05-04' UNION SELECT '2026-05-06'
    UNION SELECT '2026-05-07' UNION SELECT '2026-05-08' UNION SELECT '2026-05-11'
    UNION SELECT '2026-05-12'
  )
)
SELECT 
  COUNT(*) AS total_missing_days,
  SUM(he.qpd) AS total_missing_qkey,
  COUNT(DISTINCT he.staking_id) AS stakings_with_missing
FROM holiday_entrants he
CROSS JOIN weekday_candidates wc
WHERE wc.date_str > he.kst_start_date
  AND wc.date_str <= '2026-05-12'
  AND NOT EXISTS (
    SELECT 1 FROM daily_rewards dr
    WHERE dr.staking_id = he.staking_id AND dr.reward_date = wc.date_str
  );


-- ============================================================
-- ⑤ 날짜별 누락 분포 (audit 라벨 버그 vs 실제 누락 검증)
-- ============================================================
WITH holiday_entrants AS (
  SELECT s.id AS staking_id, date(datetime(s.start_date, '+9 hours')) AS kst_start_date,
         ROUND(s.amount * s.daily_rate * 150) AS qpd
  FROM staking s
  WHERE s.status = 'active'
    AND (
      CAST(strftime('%w', datetime(s.start_date, '+9 hours')) AS INTEGER) IN (0, 6)
      OR date(datetime(s.start_date, '+9 hours')) IN (
        '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01',
        '2026-05-01','2026-05-05','2026-05-24','2026-06-06','2026-08-15',
        '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-09','2026-12-25'
      )
    )
),
weekday_candidates AS (
  SELECT date_str FROM (
    SELECT '2026-04-01' AS date_str UNION SELECT '2026-04-02' UNION SELECT '2026-04-03'
    UNION SELECT '2026-04-06' UNION SELECT '2026-04-07' UNION SELECT '2026-04-08'
    UNION SELECT '2026-04-09' UNION SELECT '2026-04-10' UNION SELECT '2026-04-13'
    UNION SELECT '2026-04-14' UNION SELECT '2026-04-15' UNION SELECT '2026-04-16'
    UNION SELECT '2026-04-17' UNION SELECT '2026-04-20' UNION SELECT '2026-04-21'
    UNION SELECT '2026-04-22' UNION SELECT '2026-04-23' UNION SELECT '2026-04-24'
    UNION SELECT '2026-04-27' UNION SELECT '2026-04-28' UNION SELECT '2026-04-29'
    UNION SELECT '2026-04-30' UNION SELECT '2026-05-04' UNION SELECT '2026-05-06'
    UNION SELECT '2026-05-07' UNION SELECT '2026-05-08' UNION SELECT '2026-05-11'
    UNION SELECT '2026-05-12'
  )
)
SELECT 
  wc.date_str AS missing_date,
  COUNT(*) AS missing_staking_count,
  SUM(he.qpd) AS sum_qkey
FROM holiday_entrants he
CROSS JOIN weekday_candidates wc
WHERE wc.date_str > he.kst_start_date
  AND wc.date_str <= '2026-05-12'
  AND NOT EXISTS (
    SELECT 1 FROM daily_rewards dr
    WHERE dr.staking_id = he.staking_id AND dr.reward_date = wc.date_str
  )
GROUP BY wc.date_str
ORDER BY wc.date_str ASC;
