# 🚨 RESTORE POINT — 2026-05-21 솔밧 바텀업 정산 작업 백업

## 📌 작업 시점
- **백업 일시**: 2026-05-21
- **현재 작업**: 솔밧(user_id=44) 바텀업 정산 완료 + cap 정책 정립 대기 중

## 🌳 Git 상태
- **branch**: `genspark_ai_developer`
- **HEAD commit**: `91ae242` (Merge with saycoin-staking-platform)
- **마지막 PR**: #24 (fix-solbat-paid-5-6) MERGED via afa344b
- **remote**: https://github.com/Stevewon/saycoin-staking
- **last deploy run**: 26201460483 (success, 2026-05-21T02:16:06Z)

## ✅ 완료된 작업 (이번 세션)
1. **PR #21, #22**: fix-l12-createdat-by-user — 영구룰 #정규시각 정정 (11+70 tx)
2. **PR #23**: solbat-bottomup-backfill — 12건 missing INSERT (+2,550 QKEY, balance 35,250→37,800)
3. **PR #24**: fix-solbat-paid-5-6 — 9 rr + 1 dr DELETE, 1 rr INSERT (net -3,300, balance 37,800→34,500)
4. **5/21 cron 자동 실행** (run 26197512054): 5/20 발생분 → 5/21 paid, 솔밧 +3,750 (정상)

## 📊 현재 솔밧 상태
- **balance**: 38,250 QKEY (PR #24 EXEC 후 + 5/21 daily 3,750 = 38,250)
- **5/21 paid**: B 750 + L1 1,050 + L2 1,950 = 3,750 QKEY ✅ 영구룰 일치
- **5/6~5/21 paid 총합**: 11 paid_dates × 3,750 = 41,250 QKEY 누적

## 🚨 미해결 이슈
### 1. cap 정책 정립 필요 (사장님 결재 대기)
- **현재 코드 모순**:
  - `isUserCapped` (cron line 4914): user 전체 stake×2×150 vs daily+ref_reward (L0 제외)
  - `staking-list` enrich (line 44811): staking 1건당 amount×2×150 vs daily+ref_reward+**L0포함**
- **빅뱅공 케이스**:
  - paid_total(L0 포함) = 344,250 / cap_target(staking당) = 300,000 → staking-list는 capped 표시
  - paid_total(L0 제외) = 74,250 / cap_target(user전체) = 600,000 → cron은 미도달로 5/21 1,500 지급

### 2. 결재 필요 항목 (5개)
1. cap 단위: A) user 단위 / B) staking 단위
2. paid_total 포함 type: daily_qkey, referral_reward, direct_referral(L0), staking_reward
3. cap target 배수: ×2(200%) ✅
4. cap 도달 시 본인 daily 차단 ✅ + L1/L2 수령 차단? + 하부가 capped에게 줄 매칭 처리?
5. staking.status='capped' 자동 표시 정책

## 📂 주요 파일 (수정된 곳)
- `src/index.tsx` (총 ~69,000+ 줄)
  - L4914: `isUserCapped()` — cron의 cap 체크 함수
  - L4940-5028: 200% cap 사전 + 부분 지급 로직
  - L5100-5208: L1/L2 매칭 시 cap 체크
  - L44811: `staking-list` enrich (cap 표시 — **버그 있음**)
  - L68181~68900: 신규 진단/정정 endpoints (PR #21~#24)

## 🔗 핵심 API endpoints (이번 세션 추가)
| endpoint | PR | 용도 |
|---|---|---|
| `/api/diag/fix-l12-createdat-by-user` | #21,#22 | 정규시각 정정 |
| `/api/diag/solbat-bottomup-backfill` | #23 | 솔밧 누락 INSERT |
| `/api/diag/fix-solbat-paid-5-6` | #24 | 솔밧 5/6 정정 |
| `/api/diag/daily-by-paid-date` | 기존 | paid_date별 전체 회원 집계 |
| `/api/diag/staking-list` | 기존 | active staking 조회 (cap 표시 버그 있음) |
| `/api/diag/audit-user-referral-detail` | 기존 | 사용자 매칭 상세 |
| `/api/diag/user-detail` | 기존 | 사용자 종합 |

## 🔑 영구룰 (PERMANENT_RULES.md 참조)
- #정규시각 (L230-275): created_at = paid_date 전일 UTC 23:00 (KST 08:00)
- #스테이킹별독립 (L279-305): (user, staking_id, reward_date) 독립
- #지급항목 (L308-397): L0/daily/L1/L2
- #익일처리 (L385-432): 평일 발생 → 다음 평일 paid
- #바텀업정산 (L436-453): 하부부터 위로
- #중복지급금지 (L457-489): EXISTS 가드 + db.batch
- **❌ 미정립: #cap200정책** ← 이번에 정립 필요

## 🎯 다음 시작 시 첫 작업
사장님께 cap 정책 5개 항목 답변 받기 → PERMANENT_RULES.md 에 #cap200정책 추가 → cron + staking-list 정합화 → 빅뱅공 등 위반자 검출 및 정정.
