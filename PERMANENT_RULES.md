# 📜 PERMANENT RULES — 영구 정책 (위반 시 사고)

**최종 업데이트**: 2026-05-20 (★ 영구룰 #보충TX_created_at = 해당reward_date_고정 — 사장님 직접 명령 / 정분(84) 사례)
**위반 시**: 즉시 작업 중단 → 사장님께 보고
**이 파일은 사장님과의 약속이며, 모든 정산/마이그레이션/픽스 작업에서 반드시 준수해야 합니다.**

---

## 🔴 영구룰 #보충TX_created_at (2026-05-20 신규 — 사장님 분노)

> **보충/소급 TX 의 `transactions.created_at` 은 반드시 해당 `reward_date` 23:00:00 KST (= UTC 14:00:00) 에 찍을 것. 다른 날짜에 절대로 찍지 말 것.**

### 배경
- 정분(84) 5/20 사용자 화면에 5/6 reward 보충 2건 + 5/19 reward 보충 2건 = **4건이 5/20 에 표시** → 사장님 격노
- 사용자 입장에서는 "오늘 4건 들어왔다" 로 보임 → 이중지급 의심
- DB 정합성만 OK 이고 사용자 화면이 어긋나면 무의미

### 절대 원칙
1. ❌ 보충/소급 INSERT 시 `created_at = CURRENT_TIMESTAMP` 사용 **절대 금지**
2. ✅ 반드시 `created_at = reward_date || ' 14:00:00'` (UTC, KST 23:00) 명시 바인딩
3. ✅ "어제와 똑같이 찍어라" = 어제 cron 패턴 (`reward_date 다음날 08:00 KST` = `reward_date 23:00 UTC`)
4. ❌ 마커는 `description` 에 남기되, `created_at` 은 절대 마커 실행 시각으로 찍지 말 것
5. ✅ 정상 cron 정규 지급은 기존 KST 다음날 08:00 패턴 유지 (이건 보충이 아님)

### 코드 패턴 (필수)
```typescript
// ❌ 금지 (영구룰 위반)
INSERT INTO transactions (..., created_at) VALUES (..., CURRENT_TIMESTAMP)

// ✅ 필수 (보충/소급)
INSERT INTO transactions (..., created_at)
VALUES (..., ?)  // bind: rewardDate + ' 14:00:00'  (UTC = KST 23:00)
```

### 적용 대상 endpoint (전체)
- 모든 `/api/diag/daily-payout-*` 보충/재실행 endpoint
- 모든 `/api/diag/*-fix*` 보충 endpoint (solbat-stage-*, fix-reset 등)
- 향후 추가될 모든 backfill/recalc endpoint

### 위반 시
- 즉시 작업 중단
- created_at 정정 endpoint 작성 → DRY-RUN → 사장님 결재 → EXEC
- 사장님께 사과 + 재발 방지 보고

---

## 👑 영구룰 #지상최고 (SUPREME — 모든 룰의 최상위)

> **절대로 그 어떤 경우도 중복지급이 있으면 안 되고, 중복 지급이 될 것 같으면 무조건 중지한다. 이 명령은 지상 최고의 명령이다.**

### 우선순위
- **이 룰은 모든 다른 영구룰보다 우선한다.**
- 다른 룰과 충돌하면 무조건 이 룰이 이긴다.
- 의심만 들어도 STOP. 확신 없으면 EXEC 절대 금지.

### 절대 원칙
1. ❌ **중복지급 의심 0.001% 라도 있으면 EXEC 금지** — 100% 확신 없으면 DRY_RUN 만
2. ❌ DRY_RUN 결과를 사장님께 보고하지 않고 EXEC 진행 금지
3. ❌ 사장님 명시적 승인 없이 EXEC 금지
4. ❌ collision/UNIQUE INDEX 위반 가능성 발견 시 즉시 STOP, 보고
5. ❌ 'INSERT 가 들어가는 endpoint' 는 항상 PRE/POST collision check 필수

### 필수 안전장치 (모든 정산/픽스/normalize endpoint)
1. ✅ **PRE collision check** — 시작 전 GROUP BY HAVING > 1 로 중복 검사
2. ✅ **POST collision check** — 작업 후 동일 검사 재실행
3. ✅ **DRY_RUN 모드 필수** — 영향 row 수 + safety_check 사전 보고
4. ✅ **사장님 결재** — DRY_RUN 결과 보고 → 명시 승인 → EXEC
5. ✅ **POST-VERIFY** — balance ↔ tx 정합 (matched_before = matched_after)
6. ✅ **UNIQUE INDEX 기반 DB 차원 가드** (uq_tx_daily_qkey_ref, uq_tx_referral_ref)
7. ✅ collision 발견 시 **423 BLOCKED** 즉시 반환, 어떤 INSERT/UPDATE 도 실행 안 함

### 작업 종류별 안전 등급
| 작업 | 위험도 | 필수 절차 |
|---|:---:|---|
| INSERT (recalc/backfill) | 🔴 최고 | PRE + POST collision + DRY_RUN + 사장님 결재 + POST-VERIFY |
| UPDATE amount/balance | 🔴 최고 | 위와 동일 |
| UPDATE created_at only | 🟡 중 | DRY_RUN + 사장님 결재 + POST-VERIFY (collision 불가능하나 검증) |
| SELECT only (조회) | 🟢 낮음 | 자유 |
| DELETE | 🔴 최고 | 위와 동일 + 별도 백업 |

### DB 차원 영구 가드 (현재 적용 완료)
```sql
-- migrations/0015_add_tx_unique_indexes.sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_daily_qkey_ref
  ON transactions (user_id, ref_id)
  WHERE type = 'daily_qkey' AND ref_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_referral_ref
  ON transactions (user_id, ref_id)
  WHERE type = 'referral_reward' AND ref_id IS NOT NULL;
```
→ 코드 버그 발생해도 **DB 가 INSERT 거부**. 영구 가드.

**⚠️ 사장님 직접 인용 (2026-05-19, 본 룰 제정)**:
> "옵션 2로 가고 나머지는 하루하루 내가 영구룰로 조정을 거치는게 맞을듯해! **절대로 그 어떤경우도 중복지급이 있으면 안되고 중복 지급이 될것같으면 무조건 중지! 이 명령을 지상 최고의 명령으로 준수할것!**"

**위반 시 결과**: 그 즉시 시스템 신뢰 파괴. 사용자 자산 손실. 사장님 격노. 회복 불가능 가능.

**이 룰은 다른 모든 룰의 위에 있다. 다른 룰이 EXEC 를 권하더라도, 이 룰이 의심을 표하면 STOP 한다.**

---

## 👑 영구룰 #관리자보정정당 (2026-05-19 사장님 명령 1)

> **어드민(관리자)이 직접 처리한 모든 보정은, 그 어떤 영구룰이 있어도 사용자 내역 및 어드민 화면에 그대로 반영하고 적용한다.**

### 정의
- `transactions.type = 'admin_adjustment'` 으로 박힌 tx 는 **사장님 직접 의도** 로 간주
- 영구룰 #정규지급type 위반 type 으로 분류되지 않음 (정당한 운영 행위)
- **공식 영구 잔액 공식에서 admin_adjustment 는 합법 type 으로 포함**

### 확장 공식 (이전 공식 보강)
```
expected_qkey_balance =
    Σ(tx WHERE type IN ('daily_qkey', 'referral_reward', 'swap_in', 'swap_out', 'admin_adjustment') AND coin_type='QKEY')
  - Σ(withdrawals.amount WHERE coin_type='QKEY' AND status IN ('approved','completed','processing','pending'))
```

### 절대 원칙
1. ❌ `admin_adjustment` tx 는 어떤 정정/normalize 작업에서도 **절대 제거 / 변경 금지**
2. ❌ `admin_adjustment` 만큼 balance 를 다시 되돌리는 작업 금지 (사장님 의도 위반)
3. ✅ `admin_adjustment` 가 잔액에 영향을 미친 만큼 사용자 화면/어드민에 그대로 표시
4. ✅ 신규 `admin_adjustment` INSERT 시 반드시 description 에 사유 명시 + balance 동시 UPDATE 원자적

**사장님 직접 인용 (2026-05-19)**:
> "의도된것이고 어드민 즉 관리자에서 조치한것은 그대로 영구룰이 있어도 사용자내역및 어드민에 반영하고 적용 시킬것!"

**적용 사례**: u#9 진성의 2026-05-04 11:48 admin_adjustment -165,000 ("관리자 보정(직접판매 차감)") 은 정당한 사장님 의도. -334,500 음수는 사장님 직접 처리 결과이므로 보정 대상 아님.

---

## 👑 영구룰 #위반type가감 (2026-05-19 사장님 명령 2)

> **어드민 관리 차감(admin_adjustment) 이 아닌데 영구룰 위반 type 으로 잔액에 영향을 준 경우, 그 amount 만큼 가감 조치한다.**

### 위반 type 정의
| type | 분류 | 처리 |
|---|---|---|
| `daily_qkey` | ✅ 합법 | 보존 |
| `referral_reward` | ✅ 합법 | 보존 |
| `swap_in` / `swap_out` | ✅ 합법 | 보존 |
| `admin_adjustment` | ✅ 합법 (사장님 의도) | 보존 |
| **`direct_referral`** | ❌ 위반 (폐기된 옛 보상 type) | **가감 대상** |
| **`staking_reward`** | ❌ 위반 (폐기된 옛 보상 type) | **가감 대상** |
| **`shop_purchase`** | ❌ 위반 (영구룰에 미정의) | **가감 대상** |
| **`shop_refund`** | ❌ 위반 (영구룰에 미정의) | **가감 대상** |
| **`_exec_*_marker`** 등 메타 | ❌ 비-금전 marker | **가감 대상** (amount=0 이면 무영향) |

### 처리 절차
1. ✅ DRY-RUN: 가감 대상 tx 전수 산출 → 사장님 결재
2. ✅ EXEC: 위반 type tx 자체는 **보존** (감사 추적), 대신 `admin_adjustment` type 으로 **역상쇄 tx INSERT** + balance UPDATE 원자적
3. ✅ 역상쇄 tx description 명시: `"위반 type 가감: tx#XX (type) {date} amount=XX 차감"`
4. ❌ 위반 type tx 를 직접 DELETE / UPDATE 금지 (감사 추적 영구 보존)
5. ❌ 동일 위반 tx 에 대해 가감 2번 절대 금지 (이중차감) → UNIQUE INDEX 가드 필요

**사장님 직접 인용 (2026-05-19)**:
> "어드민 관리 차감이 아닌데 불구하고 영구룰 위반이면 가감 조치할것!"

---

## 👑 영구룰 #이중구조절대금지 (2026-05-19 사장님 명령 3)

> **출금신청이나 스왑 등으로 인한 QKEY 수량 감소 시, 사용자 내역 및 어드민에 정확히 반영한다. 이로 인한 이중 지급 또는 이중 차감은 절대 일어나서는 안 된다.**

### 핵심
- swap_out / withdrawal 처리는 다음 3가지가 **원자적 (atomic)** 으로 일어나야 함:
  1. `users.qkey_balance` UPDATE (-amount)
  2. `transactions` INSERT (type='swap_out' or withdrawal record)
  3. 관련 reference 행 (swap pair, withdrawal record) INSERT/UPDATE

### 절대 원칙
1. ❌ **balance UPDATE 없이 tx 만 INSERT 금지** (사용자 화면 잔액과 실제 ledger 불일치)
2. ❌ **tx INSERT 없이 balance UPDATE 금지** (감사 추적 불가)
3. ❌ **동일 swap/withdrawal 행에 대해 balance UPDATE 2번 금지** (이중차감)
4. ❌ **동일 swap/withdrawal 행에 대해 tx INSERT 2번 금지** (이중기록)
5. ✅ swap_out 처리 시 **PRE-CHECK**: `qkey_balance >= required_qkey` 검증 후 진행
6. ✅ withdrawal 처리 시 **PRE-CHECK**: `qkey_balance >= amount` 검증 후 진행
7. ✅ atomic 트랜잭션 (db.batch 또는 BEGIN/COMMIT) 필수
8. ✅ 실패 시 rollback (부분 적용 금지)

### 위반 발생 시 영향
- 사용자 화면 잔액 ≠ 실제 ledger → 신뢰 파괴
- 이중차감 → 사용자 자산 손실 → 회복 불가
- 이중지급 → 영구룰 #지상최고 위반

**사장님 직접 인용 (2026-05-19)**:
> "출금신청이나 스왑등으로 인해 쿠키의 수량감소시에도 사용자내역및 어드민에 정확히 반영할것. 이로인한 이중 지급 또는 이중차감은 절대 일어나서는 안됨"

---

## 🛠️ 영구룰 #GitHub빌드강제 (CRITICAL — 빌드/배포 사전조건)

> **빌드/배포는 반드시 GitHub Actions 를 통해 명시적으로 트리거하고, 워크플로 성공을 명시적으로 확인한 뒤에만 다음 단계로 진행한다.**

### 절대 금지
1. ❌ `git push` 후 "Cloudflare Pages 가 알아서 감지하겠지" 식으로 시간만 기다린 뒤 endpoint 호출
2. ❌ `gh run list` / `gh run view` 로 **빌드 success 여부를 확인하지 않은 채** 다음 단계 진행
3. ❌ HTTP 404 / 구버전 응답 받고도 "deploy 가 늦나" 하고 단순 재시도
4. ❌ commit message 에 emoji / 비-ASCII 특수문자 / em-dash(—) / 제어문자 등 **Cloudflare API 가 거부할 수 있는 문자** 사용
   - 사고 이력: `Invalid commit message, it must be a valid UTF-8 string. [code: 8000111]` → 빌드는 성공해도 Cloudflare 가 deploy 거부

### 필수 절차 (모든 endpoint 추가/수정 시)
1. ✅ **commit message 는 ASCII + 한글만, 특수문자 최소화** (em-dash `—` 금지, 대시는 ASCII `-` 사용)
2. ✅ `git push origin saycoin-staking-platform`
3. ✅ **즉시** `gh run list --workflow=deploy.yml --limit 1` 로 트리거 확인
4. ✅ **빌드 완료 대기**: `gh run watch <run-id>` 또는 폴링 (`completed success` 까지)
5. ✅ failure 면 `gh run view <run-id> --log-failed` 로 원인 확인 → 수정 후 재push
6. ✅ success 확인 후에만 endpoint 호출

### workflow_dispatch (명시적 재트리거)
- push 가 어떤 이유로 자동 트리거 안 됐거나, **이미 deploy 된 commit 을 재배포**하려면:
  ```bash
  gh workflow run deploy.yml --ref saycoin-staking-platform
  ```

### 백업 수단 (Actions 자체가 막혔을 때만)
- Cloudflare API 토큰이 secrets 에 있고, 로컬에서 직접 배포 필요할 때:
  ```bash
  cd /home/user/webapp && npm run build
  # CLOUDFLARE_API_TOKEN 환경변수 설정 후
  npx wrangler pages deploy dist --project-name=saycoin-staking --branch=saycoin-staking-platform --commit-dirty=true --commit-message="ascii only"
  ```
- 단, 사장님 환경에서는 GitHub Actions 가 정식 경로. 로컬 wrangler 는 fallback.

**⚠️ 사장님 직접 인용 (2026-05-18, 사고 직후 직접 명령)**:
> "깃허브로 빌드하라고 대체 몇번을 말하냐?!!!!!1 영구명령에 넣어!.md"

**위반 시 결과**: endpoint 404 → "왜 안 되지?" 재시도 루프 → 사장님 격노 + 시간 낭비

**이 룰은 모든 작업의 **사전 조건** 이다. 빌드/배포 확인 없이 endpoint 호출하면 그 순간이 사고다.**

---

## 🕒 영구룰 #정규시각 (CRITICAL — 사용자 거래내역 UX)

> **DR/RR/tx INSERT 시 created_at 은 반드시 paid_date 의 KST 08:00 (= UTC 23:00 of previous day) 정규 배당 시각으로 명시한다.**

### ⚠️ 2026-05-19 변경 사항
- **이전**: KST 15:15 (= UTC 06:15) — 폐기됨
- **현재**: **KST 08:00 (= UTC 23:00 of `paid_date - 1`)** ← 신규 기준
- 변경 사유: 사장님 명령 — 매일 아침 08시 정규 배당으로 통일
- 마이그레이션 완료: 2026-05-19 EXEC 로 5/7~5/19 paid_date 의 2,153 row 모두 KST 08:00 으로 보정 완료

### 절대 금지
1. ❌ `INSERT INTO transactions (...) VALUES (...)` 에서 created_at 컬럼 생략
   - → DB default `CURRENT_TIMESTAMP` 적용 → **EXEC 실행 시각** 박힘
   - → 사용자 거래내역 화면에 **오늘 EXEC 한 시각이 추천보너스 시각으로 표시** → 사장님 격노 사고
2. ❌ `created_at = CURRENT_TIMESTAMP` 명시
3. ❌ 어드민 백필/recalc 시 created_at 을 "지금 시각" 으로 두는 것
4. ❌ **KST 15:15 사용 금지** (2026-05-19 폐기)

### 필수 형식 (2026-05-19 기준)
```typescript
// KST 08:00 = UTC 23:00 of previous day
// 예: paid_date='2026-05-19' → created_at='2026-05-18 23:00:00' (UTC)
const dividendCreatedAtUtc = `${getPrevDateUtc(payoutDate)} 23:00:00`  // KST 08:00:00
const rrTxCreatedAtUtc     = `${getPrevDateUtc(payoutDate)} 23:00:01`  // RR tx 는 1초 늦게

// SQLite 에서는 datetime() 함수로 간편 작성 가능
// datetime('${paidDate} 23:00:00')  ← 표시상 paid_date 23:00 이지만 SQLite 가 UTC 로 저장
// 단 paid_date 와 1일 차이가 나므로 주의 — 권장 패턴은 위 prev-date 명시
INSERT INTO transactions    (..., created_at) VALUES (..., ?)
INSERT INTO daily_rewards   (..., created_at) VALUES (..., ?)
INSERT INTO referral_rewards (..., created_at) VALUES (..., ?)
```

### 적용 범위
- **모든 정산 endpoint** (정규 cron, manual emergency, recalc, backfill 등)
- **모든 어드민 INSERT** (created_at 명시 필수)

### 사고 이력
- **2026-05-18**: recalc-day-dividend EXEC 4번 (5/11~5/14 reward) 의 tx.created_at 이 5/18 KST 19:04/19:12/19:14/19:17 로 박힘 → 사용자 거래내역에 "추천보너스 다량 5/18 저녁" 으로 표시 → 사장님 격노 → 4건 모두 reverse (657건/936,375 QKEY)
- **2026-05-19**: KST 15:15 정책 폐기, KST 08:00 통일 결정. 기존 5/7~5/19 paid_date 의 2,153 row (DR 415 + RR 816 + tx 922) 모두 KST 08:00 으로 normalize EXEC 완료. balance ↔ tx 정합 63/63 유지.

**⚠️ 사장님 직접 인용 (2026-05-19, 변경 명령)**:
> "a 로 가고 매일 kst 08:00 시로 보정하고 13시 15분은 완전히 없앨것! **무조건 내 영구룰에 근거해서 매일 아침 08시에 배당을 할것!**"

---

## ⭐ 영구룰 #스테이킹별독립 (MOST CRITICAL — 다른 영구룰의 전제)

> **동일인이라도 스테이킹 금액이 같든 다르든, 같은 날짜든 다른 날짜든, 각 스테이킹은 완전히 별개로 취급한다.**

### 정확한 의미
- **스테이킹 = 정산 단위**
- user 가 active staking 2개를 보유 중이면 → 매일 **dr 2건이 정상** (스테이킹별로 1건씩)
- L1/L2 referral 도 마찬가지 — **referee 의 staking_id 별로 별개 row 가 정상**
- L0 (direct_referral) 도 staking 별 별개 (이미 staking_id 로 식별됨)

### 1건의 진짜 기준 (정정)
| 지급 종류 | 1건의 기준 |
|---|---|
| 직접매출 10% 쿠키 (L0) | **(referrer_id, referee_id, staking_id)** — 기존과 동일 |
| 본인 데일리 (daily_qkey) | **(user_id, staking_id, reward_date)** ← ★ staking_id 추가 |
| L1 20% (referral_reward L=1) | **(referrer_id, referee_id, referee_staking_id, reward_date)** ← ★ |
| L2 10% (referral_reward L=2) | **(referrer_id, referee_id, referee_staking_id, reward_date)** ← ★ |

### 중복 vs 정상 판별
- **정상**: 같은 (user_id, reward_date) 에 dr 여러 건 — 단, `distinct staking_id` 가 row 수와 같음
- **중복**: 같은 (user_id, staking_id, reward_date) 에 dr 2건 이상 → 영구룰 위반

**⚠️ 사장님 직접 인용 (2026-05-18)**:
> "동일인 이라도 스테이킹 금액이 같던 틀리던 같은 날짜던 다른 날짜던 완전 별개로 취급하라니깐!!!!"

**이 영구룰은 다른 모든 영구룰의 전제다. 다른 영구룰의 '1건 기준' 은 모두 이 룰에 따라 staking 별로 독립이다.**

---

## 🚨 영구룰 #지급항목 — 4종 지급 외 절대 금지

> **한 사용자가 시스템으로부터 받을 수 있는 금액은 다음 4종이 전부다. 이외 어떤 로직으로 받게 되는 경우가 있으면 안 된다.**

### 1️⃣ 직접매출 10% 쿠키 (direct_referral)

| 항목 | 값 |
|---|---|
| 트리거 | 내가 직접 추천한 사람이 신규 스테이킹 **승인(approve)** 될 때 |
| 수령자 | 그 스테이킹 사용자의 **직접 추천인 (referrer_id)** |
| **금액** | **`staking.amount × 0.10 × 150`** QKEY |
| `transactions.type` | `direct_referral` |
| `referral_rewards.level` | **`0`** |
| **1건의 기준** | `(referrer_id, referee_id, staking_id)` — 1 staking 승인 = 1건 |
| **하루 최대 건수** | **무제한** (그날 추천 진입자 수만큼) |
| 지급 시점 | **즉시** (휴일 무관) |
| `reward_date` / `paid_date` | 그날 KST = `date('now', '+9 hours')` |
| 정책 조건 (2026-05-01) | **추천인 본인이 active 스테이킹 보유 중일 때만 지급** (pending/만료 → 0 지급, referral_rewards 기록도 안 함) |

**계산 예시**:
| 신규 진입자 매출 | 직접추천수당 QKEY |
|---|---|
| 5 USD | 5 × 0.10 × 150 = **75** |
| 15 USD | 15 × 0.10 × 150 = **225** |
| 35 USD | 35 × 0.10 × 150 = **525** |
| 100 USD | 100 × 0.10 × 150 = **1,500** |

**⚠️ 사장님 직접 인용 (2026-05-18)**:
> "직접매출을 일으켜서 받는 10%의 쿠키는 10명이면 10건을 당일 다 받는거야! 건당 1회야!"

---

### 2️⃣ 본인 데일리 배당 (daily_qkey)

| 항목 | 값 |
|---|---|
| 트리거 | cron 매일 실행 |
| 수령자 | active 스테이킹 보유자 본인 |
| **금액** | **`staking.amount × daily_rate × 150`** QKEY |
| `daily_rewards.usdt_amount` | 위 금액 (legacy 컬럼명, 실제는 QKEY) |
| `transactions.type` | `daily_qkey` |
| **1건의 기준** | **`(user_id, staking_id, reward_date)`** ← ★ 영구룰 #스테이킹별독립 |
| **하루 최대 건수** | **active staking 개수만큼** (스테이킹별 1건씩) |
| 지급 시점 | 익일처리 (영구룰 #익일처리 참조) |

---

### 3️⃣ L1 배당의 20% (referral_reward, level=1)

| 항목 | 값 |
|---|---|
| 트리거 | cron 매일 실행 |
| 수령자 | 직접 추천한 사람들이 있는 사용자 |
| **금액** | **`referee 의 그날 그 staking 의 daily_qkey × 0.20`** (staking 별 독립 계산) |
| `transactions.type` | `referral_reward` |
| `referral_rewards.level` | **`1`** |
| **1건의 기준** | **`(referrer_id, referee_id, referee_staking_id, reward_date, level=1)`** ← ★ 영구룰 #스테이킹별독립 |
| **하루 최대 건수** | **referee 들의 active staking 총 개수만큼** (referee 의 staking 별 1건씩) |
| 지급 시점 | 익일처리 |

---

### 4️⃣ L2 배당의 10% (referral_reward, level=2)

| 항목 | 값 |
|---|---|
| 트리거 | cron 매일 실행 |
| 수령자 | L2 하위가 있는 사용자 (= 내가 추천한 사람이 추천한 사람) |
| **금액** | **`L2회원의 그날 그 staking 의 daily_qkey × 0.10`** (staking 별 독립 계산) |
| `transactions.type` | `referral_reward` |
| `referral_rewards.level` | **`2`** |
| **1건의 기준** | **`(referrer_id, referee_id, referee_staking_id, reward_date, level=2)`** ← ★ 영구룰 #스테이킹별독립 |
| **하루 최대 건수** | **L2 회원들의 active staking 총 개수만큼** |
| 지급 시점 | 익일처리 |

---

## 🔁 영구룰 #익일처리 (휴일 처리)

> **휴일(주말/공휴일)에 발생한 본인 daily_qkey 와 referral_reward 는 다음 영업일에 합산 지급한다.**

| 발생일 (reward_date) | 지급일 (paid_date) |
|---|---|
| 목요일 → | 금요일 |
| 금요일 → | 월요일 |
| 토요일 → | 월요일 |
| 일요일 → | 월요일 |
| 공휴일 → | 다음 영업일 |

⚠️ **#1 직접매출 10% 쿠키는 익일처리 적용 안 함** (매출 발생 즉시 지급, 휴일 무관).

### 🔴 D 명령 — 코드 영구 반영 (2026-05-19 사장님 명령)

**사장님 직접 인용**:
> "5월 7일확정분이 5월 8일에 찍혀야 하고 5월 8일 확정분이 11일날 표시가 되야한다 첫 평일임으로, 5월 15일꺼는 5월 18일로 찍혀야 하고 또 첫 평일이기 때문에 그게 내 영구정책이다! 이 룰에 맞게 수정하라! 맞는 날짜는 놔두고!"

#### 코드 위치 (src/index.tsx)
- **헬퍼 함수**: `nextBusinessDayKstStr(rewardDateStr)` (line ~4540 부근)
- **cron 본체**: line ~4973 `for (const accrualDate of accrualDates)` 루프 내 즉시 계산:
  ```typescript
  const accrualPaidDate = nextBusinessDayKstStr(accrualDate)
  const accrualDailyCreatedAtUtc = createdAtUtcForPaidDate(accrualPaidDate, 0)
  const accrualReferralCreatedAtUtc = createdAtUtcForPaidDate(accrualPaidDate, 1)
  ```
- **모든 INSERT (daily_rewards, transactions daily_qkey, referral_rewards L1/L2, transactions referral_reward)** 에서 `today` 대신 `accrualPaidDate` 사용

#### 위반 패턴 (사고 방지)
- ❌ `paid_date = today` (cron 실행일) — backfill 시 5/8 reward 도 5/12 paid 되는 위반
- ❌ `created_at` 을 cron 실행일 기준 단일 값으로 사용
- ✅ `paid_date = nextBusinessDayKstStr(accrualDate)` — 각 reward 별 독립 계산
- ✅ `created_at = createdAtUtcForPaidDate(accrualPaidDate)` — paid_date 의 KST 08:00

#### 검증 매트릭스 (2026-05-19 EXEC 결과)
```
평일 → 다음날:                        금/토/일 → 월요일:
5/7(목) → 5/8(금) ✅                  5/8(금) → 5/11(월) ✅
5/11(월) → 5/12(화) ✅                5/9(토) → 5/11(월) ✅
5/12(화) → 5/13(수) ✅                5/15(금) → 5/18(월) ✅
5/13(수) → 5/14(목) ✅                5/2(토) → 5/4(월) ✅
5/14(목) → 5/15(금) ✅                5/3(일) → 5/4(월) ✅
5/18(월) → 5/19(화) ✅                4/25(토) → 4/27(월) ✅
                                       4/26(일) → 4/27(월) ✅
                                       4/19(일) → 4/20(월) ✅
```
- daily_rewards 위반 0/18, referral_rewards 위반 0/24 (paid-vs-reward-matrix endpoint)

---

## 🧮 영구룰 #바텀업정산

> **당일 지급해야 할 사용자 전원을 두고, 가장 하부 (leaf) 부터 시작해 배당을 계산하고, 그 배당값을 바탕으로 바로 윗선을 차례로 정리하라**

### 정확한 절차
1. 그날 active staking 사용자 전원 확정
2. **STEP B**: 본인 daily_qkey 계산 (트리 무관, 모두 동시 가능)
3. **STEP D**: L1 = `SUM(직접추천인의 daily_qkey) × 0.20`
4. **STEP E**: L2 = `SUM(L1멤버의 daily_qkey) × 0.10`
5. 휴일이면 다음 영업일에 합산 지급 (#익일처리)

**왜 바텀업?**
- L1 보너스 = "내가 추천한 사람의 daily_qkey × 20%"
- 내 L1 보너스를 계산하려면 → **내 하부의 daily_qkey 가 먼저 확정되어 있어야 함**
- → 데이터 의존 순서가 **하부 → 위** 단방향

**⚠️ 사장님 직접 인용 (2026-05-18)**:
> "이 모든 문제를 해결하기 위해서는 바텀 업방식을 취하라고 누누히 지시했다! 당일 지급해야할 사용자 전원을 두고 가장 하부에서 바로 배당을 하고 그 배당을 바탕으로 바로 윗선을 정리해 가라!"

---

## 🚫 영구룰 #중복지급금지

> **어느 계정이든 중복지급이 될 것 같으면 무조건 멈추고 보고한다.**

### 절대 금지 패턴
1. ❌ **row 마다 SELECT EXISTS** 돌리는 구조 (Worker timeout + 중복 INSERT 사고 원인)
2. ❌ **사용자별 for-loop** 안에서 INSERT (timeout)
3. ❌ EXISTS 가드 완화 (사고 직접 원인)

### 필수 패턴
1. ✅ **UNIQUE INDEX 기반 DB 차원 중복 방지**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_unique_ref
   ON transactions(user_id, type, coin_type, ref_id)
   WHERE ref_id IS NOT NULL
   ```
2. ✅ **INSERT OR IGNORE + LEFT JOIN anti-join (set-based)**
   ```sql
   INSERT OR IGNORE INTO transactions (...)
   SELECT ... FROM source
   LEFT JOIN transactions t ON t.ref_id = '...' || source.id
   WHERE t.id IS NULL
   ```
3. ✅ **db.batch([stmt1, stmt2, stmt3])** — 2~5개 SQL statement 묶음
4. ✅ **`[REWARD_BATCH]` 표준 로그**

### 사고 대응
- 중복지급 가능성 보이면 → **즉시 EXEC 중단** → DRY_RUN 결과만 보고
- DRY_RUN 결과가 예상치와 다르면 → **EXEC 절대 금지** → 사장님 확인 대기

**⚠️ 사장님 직접 인용 (2026-05-18)**:
> "어느 계정이던 중복지급이 될것같으면 무조건 멈추고 보고하라"

---

## 🌏 영구룰 #KST타임존

> **모든 날짜/시간 계산은 KST (Asia/Seoul, UTC+9) 기준**

### SQL 패턴
```sql
date('now', '+9 hours')                          -- 오늘 KST 날짜
strftime('%Y-%m-%dT%H:%M:%S', created_at, '+9 hours')  -- KST ISO 8601 (Safari 호환)
```

### 저장 형식
- `transactions.created_at`: `'2026-05-14T03:05:55'` (T separator, KST 시각)
- `daily_rewards.reward_date`, `paid_date`: `'2026-05-14'` (KST 날짜)
- `referral_rewards.reward_date`, `paid_date`: `'2026-05-14'` (KST 날짜)

---

## 📋 ref_id 포맷 규칙 (1:1 매핑)

| `transactions.type` | `ref_id` 포맷 | 대응 테이블 |
|---|---|---|
| `daily_qkey` | `'dr_' || daily_rewards.id` | daily_rewards |
| `referral_reward` (level=1, 2) | `'rr_' || referral_rewards.id` | referral_rewards |
| `direct_referral` (level=0) | **숫자만** = `referral_rewards.id` (★ prefix 없음!) | referral_rewards |

⚠️ **level=0 (direct_referral) 만 ref_id 포맷이 다름** — prefix 없음. 새 코드 작성 시 반드시 확인.

---

## ⚙️ 운영 환경 정보

| 항목 | 값 |
|---|---|
| 도메인 | https://pqcpay.co.kr |
| Cloudflare Pages 프로젝트 | `saycoin-staking` |
| GitHub 자동 빌드 브랜치 | `saycoin-staking-platform` |
| D1 데이터베이스 | `quantarium-staking-production` (id: `5a3ba471-4bba-413f-9af9-b6c94ef102d7`) |
| Cloudflare Workers 제한 | **30초 timeout** (set-based SQL 필수) |
| ADMIN_PW | `Qta@2026!Sec#Admin` (URL encode: `Qta%402026%21Sec%23Admin`) |

---

## 🚨 사고 이력

| 일자 | 사고 | 원인 | 영구룰 |
|---|---|---|---|
| 2026-05-18 | fix-missing-tx 중복 INSERT 560건 / 1,759,845 QKEY | EXISTS-loop + ref_id 가드 완화 | #중복지급금지 |
| 2026-05-18 | scan-duplicate-dr-rr v1/v2 오진단 (484건 → 위반 분류 오류) | (user_id, reward_date) 기준으로 그룹화하여 staking 별 정상 row 를 위반으로 오분류 | #스테이킹별독립 |
| 2026-05-18 | recalc-day-dividend 2번 EXEC timeout → 5/18 KST 17:53/17:54 에 referral_reward tx 105건 / 50,700 QKEY 중복 INSERT | N+1 SELECT + 30s Worker timeout 후에도 사용자별 loop 가 계속 실행됨. 첫 EXEC timeout 후 두번째 EXEC 보냄. | #중복지급금지 #스테이킹별독립 |
| 2026-05-18 | 빌드 deploy 실패 인지 못하고 endpoint 404 후 재시도 루프 | `git push` 자동 감지 의존. GitHub Actions 빌드 status 명시 확인 안 함. Cloudflare API 가 commit message 거부 (Invalid UTF-8) 인 줄도 모름. | #GitHub빌드강제 |
| 2026-05-18 | recalc-day-dividend EXEC 의 tx.created_at 이 EXEC 실행 시각 (5/18 19:04/19:12/19:14/19:17 KST) 으로 INSERT 됨 → 사용자 거래내역 UX 가 5/18 추천보너스 다량으로 표시 → 사장님 격노 ("또 중복지급한 상태니!") → reverse 657건/936,375 QKEY EXEC | INSERT INTO transactions 에 created_at 명시 안 함 → DB default CURRENT_TIMESTAMP 적용 → EXEC 시각이 박힘. 사용자 화면은 tx.created_at +9h 보정으로 KST 표시. | #정규시각 #중복지급금지 |
| 2026-05-19 | GitHub Actions schedule (`0 22 * * *` = KST 07:00) 자동 cron 이 의도와 무관하게 실행됨 (5/19 KST 08:11-08:16 자동 처리). workflow 변경 차단 시도 했으나 GitHub App workflows permission 부족으로 push 거부. 결과적으로 5/18 reward → 5/19 paid 익일처리 자동 완료. | (1) cron 차단 코드가 commit 못 됨 (workflows scope 권한 없음). (2) 사장님이 매일 수동 emergency 버튼 사용을 원했으나 자동 cron 이 먼저 실행. (3) 사용자 데이터는 정상 — 익일처리 영구룰 충족. | #익일처리 |
| 2026-05-19 | 정규시각 영구룰 변경 (KST 15:15 → KST 08:00). 기존 1,064 tx 가 KST 08:00 아님 발견. 옵션 2 (정규 cron 결과만) 선택 → 5/7~5/19 9개 paid_date 의 2,153 row UPDATE 로 KST 08:00 통일 완료. PRE/POST collision check + POST-VERIFY 모두 통과 (63/63 matched 유지). | 정책 변경에 따른 데이터 정합 정렬. UPDATE only 라 중복 위험 0. 영구룰 #지상최고 가드 적용된 첫 작업. | #지상최고 #정규시각 |
| 이전 다수 | 클라이언트 inline JS SyntaxError | 백틱 안 이스케이프 시퀀스 깨짐 | (CRITICAL_RULES.md 참조) |

---

**이 파일은 사장님이 명시적으로 수정하기 전까지 절대 변경되지 않습니다.**
**모든 정산/픽스/마이그레이션 작업 시작 전에 이 파일을 다시 읽고 영구룰을 확인하세요.**

---

## 🔒 영구룰 #UNIQUE인덱스적용 (2026-05-19 EMERGENCY)

**배경**: 2026-05-19 KST 14시경 사장님이 모바일 화면에서 "05.20. 08:00" 표시 transaction 들을 발견.
DB 조사 결과 `daily_rewards`/`referral_rewards` 는 5/19 paid_date 로 1batch 만 있었으나,
`transactions` 테이블에서는 동일 `ref_id` 에 대해 **두 번 INSERT** 되어 있었음.

**원인**: cron v1 (created_at 명시) 과 v2 (DEFAULT CURRENT_TIMESTAMP) 코드 경로가 둘 다 존재하여
이론적으로 중복 INSERT 가능. 어플리케이션 레벨 EXISTS 가드만으로는 race condition 또는
re-entry 시 차단 실패 가능.

**조치**:
1. `/api/diag/emerg-batch-purge` 로 5/20 표시 tx 171건 삭제, 53명 잔액 238,725 QKEY 차감
2. `/api/diag/apply-tx-unique-index?exec=true` 로 DB UNIQUE INDEX 2개 적용:
   - `uq_tx_daily_qkey_ref` : (user_id, ref_id) WHERE type='daily_qkey'
   - `uq_tx_referral_ref`   : (user_id, ref_id) WHERE type='referral_reward'

**효과**: 이후 어떤 경로로든 동일 `(user_id, type, ref_id)` 조합의 tx 두 번째 INSERT 는
D1 SQLite 가 SQL 레벨에서 `UNIQUE constraint failed` 로 즉시 차단.

**영구룰**:
- 이 UNIQUE INDEX 2개는 절대 DROP 하지 않는다.
- 새 cron / 백필 / 보정 코드 작성 시 반드시 ref_id 를 명시한다 (NULL ref_id 는 인덱스 검사 제외).

---

## 🔒 영구룰 #cap200정책 (2026-05-21 신규 — 사장님 직접 정의)

**배경**: 빅뱅공(user_id=42) audit 중 cap 로직이 코드 2곳에서 불일치 발견.
사장님이 직접 cap 정책의 모든 조항을 명시하여 영구 확정.

### 1️⃣ CAP % 계산 공식

```
산정기준 (100%) = staking.amount × 150       ← 진입 시점 가상 산정 QKEY
cap_target (200%) = staking.amount × 300     ← CAPPED 도달점 (= 산정기준 × 2)

cap_pct = paid_total ÷ (staking.amount × 150) × 100
       = paid_total ÷ 산정기준 × 100
```

**예시**: $1,000 staking
- 산정기준 = 150,000 QKEY (100%)
- cap_target = 300,000 QKEY (200% = CAPPED)
- paid 150,000 받음 → 100%
- paid 300,000 받음 → 200% (CAPPED, 더 이상 INSERT 금지)

### 2️⃣ ★ Staking별 완전 독립 (영구룰 #스테이킹별독립 적용)

- 같은 user_id라도 **staking_id 마다 cap_pct 별개 계산**
- 같은 계정에 5/3 $1,000 + 5/6 $1,000 진입 시 → 2개 staking 별도 cap 적용
- paid_total은 **FIFO (진입날짜 ASC)** 로 staking에 분배
- 한 staking이 CAPPED 되어도 다른 staking은 계속 진행

### 3️⃣ paid_total 분자 = 4종 (per-staking 기준)

```
✅ INCLUDED (cap 계산에 포함):
  - daily_qkey         (본인 B)
  - referral_reward L1
  - referral_reward L2
  - direct_referral    (L0 즉시쿠키)

❌ EXCLUDED (cap 계산에서 제외):
  - staking_reward     (welcome bonus)
  - admin_adjustment
  - swap
  - withdrawal
```

### 4️⃣ INSERT 정책 (Case A/B/C)

| Case | 조건 | 처리 |
|------|------|------|
| **A** | paid + new < cap_target | ✅ INSERT 허용 (정상) |
| **B** | paid + new ≥ cap_target (처음 초과) | ✅ **그 1회만** INSERT 허용 + staking.status='capped' |
| **C** | paid ≥ cap_target (이미 capped) | ❌ INSERT **절대 금지** |

→ 결과적으로 paid_total은 cap_target을 **딱 1회만 살짝 초과** 할 수 있음 (Case B)

### 5️⃣ 출금 한도 ↔ paid_total 분리

- transactions의 `paid_total`은 Case B로 cap_target을 살짝 초과 표시 가능
- 그러나 **출금 한도 = cap_target (영구 고정)**
- 사용자가 출금 가능한 최대 QKEY = `staking.amount × 300` (per-staking)
- 초과 표시된 부분은 출금 불가 (한도 기준 cap_target)

### 6️⃣ (referrer, referee, staking_id) 3-tuple 독립

- L1/L2 matching은 **receiver 의 staking_id 단위로 cap 체크**
- staking#N이 capped → 그 staking에 들어가는 L1/L2 matching만 중단
- 같은 user의 다른 staking#M은 계속 L1/L2 matching 진행
- ★ **FIFO reflow (사장님 직접 정의 2026-05-22)**: 매칭이 들어왔을 때
  receiver의 staking#N이 capped면, 그 매칭은 **소멸하지 않고** receiver의
  **다른 capped 안 된 staking으로 FIFO(진입일 ASC) 순서로 흘러 들어감**.
  - 매칭 금액은 sender staking 기준 (downline 진입금액 비례 분할 X)
  - 빅뱅공 예시: #45 capped + #77 active 일 때, 솔밧→빅뱅공 L1 매칭은
    전액 #77로 들어감 ("하부 배당은 1천달러 기준 아니고 그대로 다 받음")
- ★ **sender capped 시 자동 차단**: capped staking에서 본인 daily가 0이면
  그 staking이 trigger하는 L1/L2 매칭도 자동으로 0 (계산식상 자동)
  - 빅뱅공 예시: #45 본인 daily=0 → #45 → 큰빛 L1=0, #45 → top9900 L2=0

### 7️⃣ Admin 대시보드 표시 규칙

- **회원수당 탭** 에서 **staking별 행 분리**로 표시 (영구룰 #스테이킹별독립 적용)
- CAP % 컬럼 색상 (200% scale):
  - `0~100%`   🔘 회색 (안전)
  - `100~160%` 🟡 노랑 (절반 넘음)
  - `160~199%` 🟠 주황 (CAP 근접)
  - `200%+`    🔴 빨강 CAPPED

### 8️⃣ 위반 감지 / 검증

- `/api/diag/cap200-audit-all` (예정) — 모든 staking에 대해 cap_pct 계산
- 200% 초과 staking 발견 시 → 즉시 사장님 보고 + 정정 작업
- 신규 cron / INSERT 코드 작성 시 반드시 본 영구룰 준수 확인

---

## 영구룰 #pagination-stable (2026-05-22 사장님 직접 정의)

cron 의 `/api/rewards/daily` batch 페이지네이션은 다음 규칙을 따른다:

1. **활성 staking SELECT 시 status 안정 집합**: `WHERE status IN ('active','capped','completed')`
   - ❌ 절대 `status = 'active'` 만 쓰지 말 것 (OFFSET 시프트 사고 원인)
2. **OFFSET 기반 페이지네이션 유지** (workflow 변경 불필요)
3. **capped 처리는 인앱 pre-check 만**: SQL 결과 집합은 batch 호출 사이에 변하지 않아야 함
4. **L5189 등의 `UPDATE staking SET status='capped' WHERE id=? AND status='active'`** 는
   idempotent — 이미 capped인 행에는 무영향
5. **cappedSkipCount 카운터 증가 허용** — 이미 capped된 staking 도 매일 pre-check까지 도달하지만
   잔액/INSERT 영향은 0건 (단순 카운터 증가만)

### 사고 기록 (2026-05-22 cron)
- 빅뱅(uid=42) staking#45가 batch#1 (offset=0) 에서 cap pre-check로 status='capped' UPDATE 됨
- 이로 인해 batch#2 (offset=10) 시 active 집합이 58→57로 줄어들어
  staking#47 (qt1234 uid=50) 이 OFFSET 시프트로 **건너뛰어짐** (silent skip)
- 누락분: qt1234 daily 750 + solbat L1 150 + bigbang L2 75
- 보정: `/api/admin/rewards/manual-adjust` 로 3건 manual_insert (5/22 처리완료)
- 영구 패치: 본 영구룰 #pagination-stable 시행 — SQL `status IN ('active','capped','completed')`

---

## 영구룰 #공휴일-대체공휴일 (2026-05-22 사장님 직접 정의)

### 사장님 직접 인용 (2026-05-22)
> "대한민국의 5월 26일은 부처님 오신날의 대체 공휴일이라고 한다! 휴일로 지정하고 27일이 첫 평일이라고 한다. 지급은 27일날 처음 해야 한다. 토 일 월은 전부 휴일이니 데일리 배당도 발생하면 안되고 오직 직접매출분만 지급해야 한다."
> (※ 캘린더 재확인 후 사장님 정정: "26일 지급이 맞음! 화요일 미안" — 5/24(일) 부처님오신날 → 5/25(월) 대체공휴일 → 5/26(화) 첫 평일 = 지급일)

### 핵심 원칙
1. **대한민국 인사처 고시 대체공휴일은 무조건 휴일 처리** — `src/index.tsx::getKoreanHolidays()` 의 해당 연도 배열에 추가 의무
2. **공휴일이 토/일과 겹치면 대체공휴일 자동 확인** — 신정·삼일절·어린이날·부처님오신날·현충일·광복절·개천절·한글날·성탄절 중 토/일 겹침 발생 시 인사처 공식 고시 확인 후 코드에 즉시 반영
3. **휴일 cron 동작 = 룰 B** (이미 영구화됨, src/index.tsx L4914):
   - `isKoreanBusinessDay(todayKst).isBusinessDay === false` 면 cron 본체 skip
   - 일일배당(daily_qkey) + 추천수당(referral_reward L1/L2) **0건 발생**
   - **직판수당(direct_referral L0) 은 staking-approve 시점에 즉시 INSERT** — cron 무관, 휴일에도 발생 즉시 지급 (사장님 영구명령)
4. **다음 첫 평일 cron 에서 일괄 백필** — `getStakingAccrualDatesKst()` 가 staking 별로 누락된 영업일 reward_date 를 모두 채움

### 2026년 5월 적용 사례
| 날짜 | 요일 | 처리 |
|------|------|------|
| 5/22 (금) | 평일 | 정상 cron — reward_date=5/21 분 지급 (백필 3건 manual_insert 포함) |
| 5/23 (토) | 휴일 | cron skip, daily 발생 0건, 직판매출만 즉시 지급 |
| 5/24 (일) | 부처님오신날 | cron skip, 동일 |
| 5/25 (월) | **부처님오신날 대체공휴일** | cron skip, 동일 |
| 5/26 (화) | **첫 평일 = 일괄 지급일** | reward_date=5/22 (직전 영업일) 분만 지급 (토·일·월은 영업일이 아니므로 reward_date 후보 자체에서 제외) |

### 코드 변경 이력
- `src/index.tsx::getKoreanHolidays(2026)` 배열에 `'2026-05-25'` 추가 (부처님오신날 대체공휴일)
- 향후 발생 가능한 대체공휴일 후보 주석 표시:
  - 2026-03-01 (일) → 3/2 (월) 대체공휴일 (※ 인사처 고시 확인 필요)
  - 2026-08-15 (토) → 8/17 (월) 대체공휴일 (※ 인사처 고시 확인 필요)
  - 2026-10-03 (토) → 10/5 (월) 대체공휴일 (※ 인사처 고시 확인 필요)

### 사고 예방 의무
**매년 12월 말 ~ 1월 초 다음해 인사처 공휴일 고시 발표 시 즉시 `getKoreanHolidays()` 배열 갱신.** 누락 시 휴일에 cron 이 돌아 잘못된 reward_date 행이 생성되어 영구 누적 오염 발생 가능.

---

## 영구룰 #Phase3-QX부활 (2026-05-22 사장님 직접 정의)

### 사장님 직접 인용 (2026-05-22, lis7238 승인대기 화면 캡처)
> "5월 6일 이후에는 $1,000 기준당 신규로 스테이킹 진입할때 qta 75,000개 qx 10,000개 총 2종이 사용자 메인내역에 찍혀야 하는데 현재 qx 코인이 찍히지 않음"

### 정책 변천사
| Phase | 적용기간 | QTA | QX | QKEY 즉시지급 |
|-------|---------|-----|-----|---------|
| Phase1 | ~ 2026-05-10 | 75,000 | 10,000 | 5,000 |
| Phase2 | 2026-05-11 ~ 2026-05-21 | 75,000 | 0 | 0 |
| **Phase3** | **2026-05-22 ~ 영구** | **75,000** | **10,000** | **0** |

### 핵심 원칙
1. **Phase3 (5/22~) 신규 진입자는 $1,000당 QTA 75,000 + QX 10,000 자동 지급** (`/api/staking/create` 시점에 staking 행에 저장)
2. **QKEY 즉시지급은 Phase2 이후 영구 0** (일일배당 QKEY 와 분리, 사장님 별도 명령 없는 한 변경 금지)
3. **회사 지급분(QTA/QX) 은 qta_initial/qx_initial 격리** → 출금 불가 보호 자산 (영구정책 2026-05-14)
4. **승인 시점에 staking.qx_reward 컬럼 값을 그대로 잔액에 합산** — Phase3 이전에 INSERT 된 row 는 qx_reward=0 으로 박혀 있어 보정 필요

### 보정 API (5/22 이후 진입자 중 QX 누락분)
**`POST /api/admin/rewards/qx-phase3-supplement`**
- body: `{ fromDate?, toDate?, stakingId?, dryRun? }`
- 단일 보정: `stakingId` 지정 → 해당 staking 만 QX 보정
- 범위 보정: 기본 `fromDate='2026-05-22', toDate=오늘 KST` → 범위 내 qx_reward=0 인 staking 전수 보정
- 중복방지: `transactions(qx_phase3_supplement)` 에 staking_id 매핑 이미 있으면 skip
- active staking: 잔액 즉시 +, pending staking: staking 행만 정정 (승인 시 자동 지급)

### 코드 변경 이력
- `src/index.tsx::/api/staking/create` 의 `qxReward` 계산 로직에 `isPhase3` 분기 추가
- `src/index.tsx::/api/admin/rewards/qx-phase3-supplement` 신규 endpoint 추가

---

## 영구룰 #어드민-잔액수정-3종 (2026-05-22 사장님 직접 정의)

### 사장님 직접 인용 (2026-05-22)
> "어드민에서 qta, qx코인도 잔액수정이 가능하게 해주세요."

### 핵심 원칙
1. **어드민 잔액수정 API 가 QKEY/QTA/QX 3종 모두 지원**
2. **body 에 `coin: 'QKEY' | 'QTA' | 'QX'` 파라미터 추가** — 미지정 시 QKEY (하위호환)
3. **음수 잔액 방지 가드** — `newBal < 0` 이면 HTTP 400 거절 (실수로 보호 자산 깎는 사고 차단)
4. **transactions.coin_type 컬럼에 코인 종류 동적 기록** — 사용자/어드민 화면 동일 노출
5. **사유(reason) 필수** — 기존 룰 유지 (구체적 사유 없이는 변경 불가)

### API 사용법
**`POST /api/admin/users/adjust-balance`**
```json
{
  "userId": 50,
  "amount": 10000,
  "mode": "delta",          // "delta"=가산/차감 | "set"=직접설정
  "coin": "QX",             // "QKEY" (기본) | "QTA" | "QX"
  "reason": "5/22 신규룰 QX 누락분 보정"
}
```

응답:
```json
{
  "success": true,
  "userId": 50, "coin": "QX",
  "previousBalance": 0, "newBalance": 10000,
  "delta": 10000, "direction": "increase",
  "txId": 11000,
  "description": "[어드민 수정] ▲증액 +10,000 QX (이전 0 → 이후 10,000) | 사유: ..."
}
```

### 코드 변경 이력
- `src/index.tsx::/api/admin/users/adjust-balance` 에 COIN_MAP 도입 + balanceCol 동적 처리 + 음수 가드 + transactions.coin_type 동적 기록

---

**이 영구룰은 사장님 직접 정의 (2026-05-21, 2026-05-22 추가) — 절대 변경/삭제 금지.**
