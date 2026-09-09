# 데일리 cron 리포트 정책 (사장님 명령 2026-06-22)

## 배경 — 왜 만들었나
- 사장님 명령: **"무조건 클론이 돌면 보고를 해줘! 매일 오전에 돌리고 나서!"**
- 2026-06-19 사고: GitHub Actions cron 워크플로우가 배치 1건 실패 시 `process.exit(1)`로
  전체 루프를 중단 → 뒤쪽 배치(staking_id 큰 신규회원) 12건 데일리 누락.
- 재발 방지(워크플로우 resilient 수정, 커밋 c8ea1aa)와 함께, **매일 cron이 돌고 난 뒤
  누락 여부를 자동 점검·보고**하는 화면을 만들어 사장님이 언제든 확인 가능하게 함.

## 무엇을 보는가 (D안 — 관리자 페이지 리포트)
- 접속: **https://pqcpay.co.kr/admin** 로그인 → 상단 **"데일리 cron 리포트 (자동 누락 점검)"** 카드
- 페이지 진입 시 자동 점검 + "새로고침" 버튼으로 재점검
- 최근 **10영업일**(기본)에 대해 다음을 자동 대조:
  - **지급대상**: `status='active'` staking 중 해당 영업일에 진행 중(start≤d≤end)
  - **실지급**: `daily_rewards.reward_date = d` 의 고유 staking 수
  - **누락**: 지급대상인데 daily_rewards 없는 active staking → 회원 이메일·staking_id·금액 표시
  - **cron 완료시각**: `daily_cron_lock.last_finished_at`

## 영구룰 준수 (오판 방지)
- **토/일·공휴일 자동 제외**: 영업일이 아니면 점검 대상에서 빠짐 (영구룰 #공휴일).
  → 휴일에 "0건"이어도 누락으로 보지 않음.
- **capped 제외**: 200% cap 도달로 정상 중단된 staking 은 active 가 아니므로 누락에서 자동 제외 (영구룰 #cap200).
- **읽기전용**: 리포트는 절대 INSERT/UPDATE 하지 않음. 조회만.

## 화면 표시
- 상단 배너:
  - 누락 0건 → 🟢 **"최근 N영업일 누락 0건 — 전원 정상 지급 ✅"**
  - 누락 발견 → 🔴 **"⚠️ 누락 총 N건 발견! 즉시 보정 필요"** + 누락 회원 명단
- 표: 평일별 `지급대상 | 실지급 | 상태(✅/🔴) | cron 완료시각`

## 누락 발견 시 보정 절차 (영구룰)
1. 누락 명단 확인 (리포트 화면 또는 API)
2. dry-run 확인: `GET /api/admin/daily-preview?targetDate=<오늘(첫 평일)>` (읽기전용)
3. 백필 실행: `POST /api/rewards/daily-v2?key=ADMIN_PW&targetDate=<오늘>&confirm=GO`
   - 서버측 EXISTS 가드로 **중복지급 없음** (영구룰 #중복지급금지)
   - paid_date 는 nextBusinessDay 자동 적용 (영구룰 #익일처리)
4. 직판수당(level=0) 누락 시 별도 백필 (referral_rewards + transactions direct_referral + qkey_balance)
5. 보정 후 리포트 새로고침으로 누락 0건 재확인

## 관련 엔드포인트
| 엔드포인트 | 용도 | 인증 |
|---|---|---|
| `GET /api/admin/rewards/cron-report?days=N` | 누락 자동 점검 리포트 (읽기전용) | Bearer admin |
| `GET /api/admin/rewards/cron-lock-status` | 오늘 cron 처리 여부 | Bearer admin |
| `GET /api/admin/daily-preview?targetDate=...` | 백필 dry-run (읽기전용) | Bearer admin |
| `POST /api/rewards/daily-v2?...&confirm=GO` | 백필 실행 (EXISTS 가드) | key=ADMIN_PW |

## 재발 방지 워크플로우 (커밋 c8ea1aa)
- 파일: `.github/workflows/daily-rewards.yml`
- 배치당 최대 3회 재시도(backoff 2/4/6초)
- 재시도 실패해도 즉시 종료 금지 → offset 전진하여 다음 배치 계속 (신규회원 누락 방지)
- 모든 배치 처리 후 실패 offset 있으면 그때만 알림용 비정상 종료
- MAX_ITER 50→100 상향

## 한계 / 주의
- AI(어시스턴트)는 24시간 상주 서버가 아니므로 새벽 자동 push 알림은 불가.
  → 본 D안은 **사장님이 관리자 페이지에서 언제든 확인**하는 방식.
  → 폰 push 알림이 필요하면 추후 텔레그램 봇(B안) 추가 가능.
- 커스텀 도메인(pqcpay.co.kr)은 **Production 브랜치 = `saycoin-staking-platform`** 을 따라감.
  배포 시 반드시 `--branch saycoin-staking-platform` 사용 (main 은 Preview 로 빠짐).
