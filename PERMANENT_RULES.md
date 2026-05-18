# 📜 PERMANENT RULES — 영구 정책 (위반 시 사고)

**최종 업데이트**: 2026-05-18 (★ 영구룰 #GitHub빌드강제 추가 — 사장님 직접 명령)
**위반 시**: 즉시 작업 중단 → 사장님께 보고
**이 파일은 사장님과의 약속이며, 모든 정산/마이그레이션/픽스 작업에서 반드시 준수해야 합니다.**

---

## 🛠️ 영구룰 #GitHub빌드강제 (MOST CRITICAL — 빌드/배포 사전조건)

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
| 이전 다수 | 클라이언트 inline JS SyntaxError | 백틱 안 이스케이프 시퀀스 깨짐 | (CRITICAL_RULES.md 참조) |

---

**이 파일은 사장님이 명시적으로 수정하기 전까지 절대 변경되지 않습니다.**
**모든 정산/픽스/마이그레이션 작업 시작 전에 이 파일을 다시 읽고 영구룰을 확인하세요.**
