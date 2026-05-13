-- ★ G2-B (2026-05-13) — referral_rewards 테이블에 staking_id 컬럼 추가 (영구 인프라 개선)
--
--   배경:
--     - 기존 referral_rewards 는 (referrer_id, referee_id, level, original_amount) 만으로 row 식별
--     - referee 가 같은 amount × 같은 rate 의 staking 을 2개 이상 보유하면
--       두 staking 의 original_amount(self_daily) 가 동일하게 750 등으로 똑같이 나옴
--     - 이로 인해 "어느 staking 분 ledger 인지" 식별 불가 → cron 이 referee 의 첫 staking 만
--       매칭하면 두 번째 staking 분이 영구 누락
--     - 백필 가드 (assertNoExistingPayment Pattern C/A) 도 staking 별 구분 불가
--
--   G2-B 영구 해결:
--     - referral_rewards.staking_id 컬럼 추가 (NULL 허용)
--     - 기존 row 는 NULL (legacy — 어느 staking 분인지 모름)
--     - 신규 row 부터 INSERT 시 staking_id 명시 의무
--     - 헬퍼는 ledger.staking_id 가 NOT NULL 이면 정확 비교, NULL 이면 legacy 로 broad 처리
--
--   사용처:
--     - cron (/api/rewards/daily) referral_rewards INSERT 시 staking_id 함께 기록 (H plan)
--     - 백필 endpoint INSERT 시 staking_id 함께 기록
--     - 헬퍼 assertNoExistingPayment Pattern C: ledger.staking_id 가 명시되어 있고
--       호출자가 stakingId 옵션을 넘기면 정확 비교 → 다른 staking 분은 통과
--
--   영구 룰:
--     - #이중지급 절대 금지 — 같은 (referrer, referee, level, staking_id, date) row 는 영구 1건
--     - staking_id NULL legacy row 와 NOT NULL 신규 row 가 같은 (referrer, referee, level, date)
--       에 공존해도 정상 (legacy 가 어느 staking 분인지 모르는 상태에서 신규 정확 기록)
--     - cron 수정 후 (H plan) 부터는 모든 신규 row 가 NOT NULL 보장

ALTER TABLE referral_rewards ADD COLUMN staking_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_referral_rewards_staking_id ON referral_rewards(staking_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_composite ON referral_rewards(referrer_id, referee_id, level, staking_id, reward_date);
