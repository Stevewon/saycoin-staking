# 🛠️ daily-rewards.yml 변경 가이드 (사장님 직접 처리)

**작성일**: 2026-05-19
**사유**: 영구룰 #정규시각 KST 15:15 → **KST 08:00** 통일 (사장님 명령)
**현재 schedule**: `0 22 * * *` (UTC 22:00 = KST 07:00) ❌
**변경 후 schedule**: `0 23 * * *` (UTC 23:00 = **KST 08:00 정확**) ✅

---

## 📍 변경 위치

GitHub Web 에서 직접 수정:

👉 **https://github.com/Stevewon/saycoin-staking/edit/saycoin-staking-platform/.github/workflows/daily-rewards.yml**

또는: `saycoin-staking` 저장소 → `Code` → `.github/workflows/daily-rewards.yml` → 연필 아이콘(✏️) 클릭

---

## ✏️ 변경 내용 (정확히 3줄)

### 변경 전 (현재 상태)
```yaml
name: Daily QKEY Rewards (KST 07:00)

on:
  schedule:
    # KST 07:00 = UTC 22:00 (매일)
    - cron: "0 22 * * *"

  workflow_dispatch:
```

### 변경 후 (목표 상태)
```yaml
name: Daily QKEY Rewards (KST 08:00)

on:
  schedule:
    # KST 08:00 = UTC 23:00 (매일) — 영구룰 #정규시각 (2026-05-19 사장님 명령)
    - cron: "0 23 * * *"

  workflow_dispatch:
```

### 차이점 (3 lines)
| 라인 | Before | After |
|---|---|---|
| 1 | `name: Daily QKEY Rewards (KST 07:00)` | `name: Daily QKEY Rewards (KST 08:00)` |
| 5 | `    # KST 07:00 = UTC 22:00 (매일)` | `    # KST 08:00 = UTC 23:00 (매일) — 영구룰 #정규시각 (2026-05-19 사장님 명령)` |
| 6 | `    - cron: "0 22 * * *"` | `    - cron: "0 23 * * *"` |

---

## 📝 Commit Message (사장님이 작성)

```
chore(cron): change daily-rewards schedule from KST 07:00 to KST 08:00

- 영구룰 #정규시각 (2026-05-19 사장님 명령) 반영
- UTC 22:00 → UTC 23:00 (KST 07:00 → KST 08:00)
- 서버측 09:00 게이트 + UI 정비는 별도 commit 으로 처리 완료
```

(ASCII + 한글만 사용, em-dash `—` 사용 안 함 — 영구룰 #GitHub빌드강제 준수)

---

## ✅ 변경 후 확인 사항

1. GitHub Actions tab → "Daily QKEY Rewards (KST 08:00)" 표시되는지 확인
2. 다음날 KST 08:00 ~ 08:15 경 자동 트리거 확인
3. `daily_cron_lock` 테이블에 `source='cron_auto', locked_at=KST 08:0X` 박혔는지 확인

---

## ⚠️ 만약 사장님이 이 변경을 미루고 싶으시면

**임시 차단 방법** (즉시 다음날 cron 정지):
- https://github.com/Stevewon/saycoin-staking/actions/workflows/daily-rewards.yml
- 우측 상단 `⋯` → **Disable workflow**
- → 다음날 KST 07:00 cron 안 돔
- → 사장님이 KST 09:00 이후 어드민 긴급 버튼 으로 수동 실행

이 방법은 cron 자체를 정지하므로 영구룰 #정규시각 자동화는 못 되지만, 사장님 직접 통제는 100% 됩니다.

---

**작성자**: AI assistant
**최종 결정자**: 사장님
