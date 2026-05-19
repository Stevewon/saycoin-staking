# KST 08:00 정규 cron 가동 후 모니터링 가이드 (사장님 전용)

**최초 가동일**: 2026-05-20 KST 08:00
**검증 endpoint**: `/api/diag/cron-kst08-verify`
**보조 endpoint**: `/api/diag/cron-h-plan-monitor` (기존 C1~C8 검증)

---

## 🎯 빠른 명령어 (사장님이 그대로 복사해서 사용)

### ① 핵심 검증 (정규시각 + 락 + 카운트 + 중복 종합)

```bash
curl -s "https://pqcpay.co.kr/api/diag/cron-kst08-verify?key=Qta@2026!Sec#Admin" | jq .
```

**오늘이 아닌 다른 날짜 점검 (예: 5/20)**:
```bash
curl -s "https://pqcpay.co.kr/api/diag/cron-kst08-verify?key=Qta@2026!Sec#Admin&paid_date=2026-05-20" | jq .
```

### ② 영구룰 8가지 (C1~C8) 검증

```bash
curl -s "https://pqcpay.co.kr/api/diag/cron-h-plan-monitor?password=Qta@2026!Sec#Admin" | jq .
```

### ③ 둘 다 한 번에 (권장)

```bash
echo "=== KST 08:00 정규시각 검증 ===" && \
curl -s "https://pqcpay.co.kr/api/diag/cron-kst08-verify?key=Qta@2026!Sec#Admin" | jq '.verdict, .A_lock.verdict, .C_dr_time.verdict, .D_rr_time.verdict, .E_daily_tx_time.verdict, .F_rr_tx_time.verdict, .H_dup_check.verdict, .B_counts' && \
echo "=== H-plan 영구룰 8가지 검증 ===" && \
curl -s "https://pqcpay.co.kr/api/diag/cron-h-plan-monitor?password=Qta@2026!Sec#Admin" | jq '.summary, .all_passed'
```

---

## 🟢 정상 결과 (사장님이 봐야 할 것)

`cron-kst08-verify` 응답:

```json
{
  "ok": true,
  "paid_date": "2026-05-20",
  "verdict": "ALL_PASSED: KST 08:00 cron 영구룰 완전 준수",
  "all_passed": true,
  "A_lock": {
    "exists": true,
    "source": "cron_auto",
    "verdict": "PASS (cron_auto lock 존재)"
  },
  "C_dr_time": { "mismatch": 0, "verdict": "PASS" },
  "D_rr_time": { "mismatch": 0, "verdict": "PASS" },
  "E_daily_tx_time": { "mismatch": 0, "verdict": "PASS" },
  "F_rr_tx_time": { "mismatch": 0, "verdict": "PASS" },
  "G_tx_ledger_match": {
    "dr_vs_daily_tx": "PASS",
    "rr_vs_rr_tx": "PASS"
  },
  "H_dup_check": { "verdict": "PASS" }
}
```

→ **all_passed: true 가 핵심**. 이 한 줄이면 모든 게 정상.

---

## 🔴 비정상 결과 처리 (시나리오별)

### 시나리오 1: `A_lock.exists: false`

→ **GitHub Actions cron 자체가 실행되지 않음** (8시 +10분 지났는데도).

**조치**:
1. GitHub Actions 페이지에서 `daily-rewards.yml` 실행 이력 확인
2. 만약 실행 안 됐으면 KST 09:00 이후 어드민 페이지의 긴급 수동 버튼 사용

### 시나리오 2: `A_lock.source: "manual_admin"`

→ 누군가 8시 이전에 긴급 버튼을 눌렀음 (혹은 lock 이 manual 로 박혀 있었음).

**조치**: 영구룰 #지상최고 (이중지급 절대금지) 이미 발동되어 cron 차단됨. 데이터 확인 후 진행.

### 시나리오 3: `C_dr_time.verdict: "FAIL"` 또는 `E_daily_tx_time.verdict: "FAIL"`

→ **created_at 이 KST 08:00 이 아닌 다른 시각으로 박힘** (5/18 사고 패턴 재발 가능성).

`mismatch_sample` 의 `kst_at` 컬럼을 보면 실제 박힌 시각이 나옴.

**조치**: 즉시 어시스턴트에게 보고. mismatch 가 EXEC 시각 부근이면 코드 회귀, KST 08:00:XX 면 D1 timing 으로 분석.

### 시나리오 4: `G_tx_ledger_match.dr_vs_daily_tx: "FAIL"`

→ **DR 행 수 != daily_qkey tx 행 수** (한쪽이 누락됨). 잔액 불일치 발생 위험.

**조치**: 즉시 어시스턴트에게 보고. ledger reconciliation 필요.

### 시나리오 5: `H_dup_check.verdict: "FAIL"`

→ **이중지급 발생** (영구룰 #지상최고 위반 — 가장 심각).

**조치**: 즉시 모든 cron lock 후 어시스턴트에게 보고. DRY-RUN 으로 중복 행 식별 후 수동 정리.

---

## 📊 결과 빠른 해석표

| `all_passed` | `A_lock.exists` | 조치 |
|:---:|:---:|:---|
| `true` | `true` | ✅ 완벽. 추가 조치 불필요 |
| `false` | `true` | 🟡 일부 항목 FAIL — 어떤 verdict 가 FAIL 인지 확인 후 어시스턴트 보고 |
| `false` | `false` | 🔴 cron 미실행 — GitHub Actions 페이지 확인 → 9시 이후 긴급 버튼 |

---

## 🕘 시간대별 권장 행동

| 시각 (KST) | 권장 명령 |
|:---:|:---|
| 08:05 | `curl ... cron-kst08-verify` (cron 완료 직후 1차 검증) |
| 08:10 | 만약 `A_lock.exists: false` 면 GitHub Actions 페이지 확인 |
| 09:00 | 08시 cron 실패 시에만 어드민 페이지 긴급 버튼 (1회) |
| 09:05 | 긴급 버튼 사용했으면 다시 `cron-kst08-verify` 검증 |

---

## 🔒 영구룰 #지상최고 자동 보호 (이미 적용됨)

- 같은 paid_date 에 cron 2번 호출 → 2번째는 423 Locked (lock_date PRIMARY KEY)
- 8시 이전 수동 버튼 호출 → 423 Locked (KST 09:00 서버측 게이트)
- `fix-irregular-time-tx` 호출 → 410 Gone (deprecated)
- 모든 INSERT 의 created_at = KST 08:00 명시 (5/18 사고 패턴 차단)
