# 🚀 QUANTARIUM STAKING 수동 배포 가이드

> **현재 API 토큰으로는 자동 배포가 불가능합니다. Cloudflare 대시보드를 통해 수동으로 배포해야 합니다.**

---

## 📋 배포 전 체크리스트

- ✅ 전체 소스코드 준비 완료
- ✅ 프로덕션 빌드 완료 (`dist/` 폴더)
- ✅ 데이터베이스 마이그레이션 파일 준비
- ✅ 시드 데이터 준비
- ✅ Cloudflare API 토큰 확보

---

## 🎯 배포 단계

### **Step 1: Cloudflare 대시보드 접속**

1. https://dash.cloudflare.com 접속
2. 로그인
3. 좌측 메뉴에서 **Workers & Pages** 클릭

---

### **Step 2: D1 데이터베이스 생성**

#### 2-1. D1 데이터베이스 페이지 접근
1. 좌측 메뉴: **Workers & Pages** > **D1 SQL Database**
2. 우측 상단: **Create database** 버튼 클릭

#### 2-2. 데이터베이스 생성
- **Database name**: `quantarium-staking-production`
- **Location**: Alpha (또는 가장 가까운 리전)
- **Create** 버튼 클릭

#### 2-3. Database ID 복사
- 생성된 데이터베이스 클릭
- **Database ID** 복사 (예: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- 📝 메모장에 임시 저장

---

### **Step 3: 데이터베이스 마이그레이션 적용**

#### 3-1. 로컬 터미널에서 실행
```bash
# 배포 패키지 다운로드 및 압축 해제 (이미 완료된 경우 생략)
cd /home/user/webapp

# API 토큰 설정
export CLOUDFLARE_API_TOKEN="ee_h0-2_opM5161J8IpGKA1dYF9z_eaibix6vyju"

# wrangler.jsonc에 Database ID 업데이트 (아래 Step 4에서 수행)
```

#### 3-2. Cloudflare 대시보드에서 SQL 직접 실행
API 토큰 권한 문제로 wrangler CLI가 작동하지 않으므로, **대시보드에서 직접 SQL을 실행**해야 합니다:

1. D1 데이터베이스 페이지: `quantarium-staking-production` 클릭
2. **Console** 탭 클릭
3. 아래 SQL 스크립트를 **순서대로** 실행:

**마이그레이션 0001 - users 테이블:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  qta_balance INTEGER DEFAULT 0,
  qx_balance INTEGER DEFAULT 0,
  usdt_balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
```

**마이그레이션 0002 - staking 테이블:**
```sql
CREATE TABLE IF NOT EXISTS staking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  period_months INTEGER NOT NULL,
  qta_reward INTEGER DEFAULT 0,
  qx_reward INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_staking_user_id ON staking(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_status ON staking(status);
CREATE INDEX IF NOT EXISTS idx_staking_dates ON staking(start_date, end_date);
```

**마이그레이션 0003 - daily_rewards 테이블:**
```sql
CREATE TABLE IF NOT EXISTS daily_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  staking_id INTEGER NOT NULL,
  usdt_amount REAL NOT NULL,
  reward_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (staking_id) REFERENCES staking(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_staking_id ON daily_rewards(staking_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_date ON daily_rewards(reward_date);
```

**마이그레이션 0004 - transactions 테이블:**
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  coin_type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
```

**마이그레이션 0005 - withdrawals 테이블:**
```sql
CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  coin_type TEXT NOT NULL,
  amount REAL NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
```

#### 3-3. 테스트 데이터 삽입 (선택 사항)
```sql
-- 테스트 사용자 추가
INSERT OR IGNORE INTO users (email, password, name, phone, wallet_address, qta_balance, qx_balance, usdt_balance)
VALUES 
  ('test@example.com', 'password123', '테스트유저', '01012345678', '0x1234567890123456789012345678901234567890', 300000, 300000, 15),
  ('admin@quantarium.com', 'admin1234', '관리자', '01087654321', '0xABCDEF1234567890123456789012345678901234', 0, 0, 0);

-- 테스트 스테이킹 데이터 추가
INSERT OR IGNORE INTO staking (user_id, amount, period_months, qta_reward, qx_reward, start_date, end_date, status)
VALUES 
  (1, 10000000, 6, 300000, 300000, date('now'), date('now', '+6 months'), 'active');
```

---

### **Step 4: wrangler.jsonc 업데이트**

1. `/home/user/webapp/wrangler.jsonc` 파일 열기
2. `database_id` 부분을 Step 2에서 복사한 Database ID로 변경:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "quantarium-staking",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "quantarium-staking-production",
      "database_id": "여기에-Database-ID-입력"
    }
  ]
}
```

---

### **Step 5: Cloudflare Pages 프로젝트 생성**

#### 5-1. Pages 프로젝트 생성
1. 좌측 메뉴: **Workers & Pages**
2. 우측 상단: **Create application** 버튼 클릭
3. **Pages** 탭 선택
4. **Upload assets** 선택 (Direct Upload)

#### 5-2. 프로젝트 설정
- **Project name**: `quantarium-staking`
- **Production branch**: `main` (GitHub 연동 시)

#### 5-3. dist 폴더 업로드
- **Upload** 버튼 클릭
- `/home/user/webapp/dist/` 폴더의 모든 파일 업로드
  - `_worker.js`
  - `_routes.json`
  - 기타 정적 파일

---

### **Step 6: D1 바인딩 설정**

#### 6-1. Pages 프로젝트 설정
1. 생성된 `quantarium-staking` 프로젝트 클릭
2. 상단 탭: **Settings** 클릭
3. 좌측 메뉴: **Functions** 클릭

#### 6-2. D1 Database Bindings 추가
1. **D1 database bindings** 섹션 찾기
2. **Add binding** 버튼 클릭
3. 설정:
   - **Variable name**: `DB`
   - **D1 database**: `quantarium-staking-production` 선택
4. **Save** 버튼 클릭

#### 6-3. 환경 변수 설정 (선택 사항)
- **Settings** > **Environment variables**
- 필요한 경우 추가 환경 변수 설정

---

### **Step 7: 배포 확인 및 테스트**

#### 7-1. 프로덕션 URL 확인
- **Deployments** 탭에서 최신 배포 확인
- 프로덕션 URL: `https://quantarium-staking.pages.dev`

#### 7-2. 기능 테스트
1. **사용자 페이지**: https://quantarium-staking.pages.dev
   - ✅ 회원가입 테스트
   - ✅ 로그인 테스트
   - ✅ 스테이킹 신청 테스트
   - ✅ 잔액 확인
   - ✅ 프로필 설정
   - ✅ 코인 출금 신청

2. **관리자 페이지**: https://quantarium-staking.pages.dev/admin
   - ✅ 관리자 로그인 (ID: `admin` / PW: `admin1234`)
   - ✅ 스테이킹 승인/거절
   - ✅ 사용자 관리
   - ✅ 통계 확인

3. **API 엔드포인트 테스트**:
```bash
# 회원가입 API
curl -X POST https://quantarium-staking.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"test1234","name":"테스트2","phone":"01011112222","walletAddress":"0x2222222222222222222222222222222222222222"}'

# 로그인 API
curl -X POST https://quantarium-staking.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🔒 배포 후 보안 작업

### **1. 관리자 비밀번호 변경**
- 현재: `admin` / `admin1234`
- `/home/user/webapp/src/index.tsx` 파일에서 관리자 인증 로직 수정 필요

### **2. 회사 지갑주소 업데이트**
- 현재 테스트 주소: `0xa929D03edbBD468b7bD4A9da8D7098015B417Abe`
- 실제 회사 지갑주소로 변경 필요

### **3. API 토큰 권한 업데이트**
현재 토큰에 다음 권한 추가 필요:
- `Account` - `Cloudflare Pages` - `Edit`
- `Account` - `D1` - `Edit`
- `User` - `User Details` - `Read`

**권한 업데이트 방법:**
1. https://dash.cloudflare.com/profile/api-tokens 접속
2. 현재 토큰 편집
3. 위 권한 추가
4. 저장

---

## 📊 배포 상태

- ✅ **소스코드**: 완료
- ✅ **빌드**: 완료
- ✅ **마이그레이션**: 준비 완료 (수동 실행 필요)
- ⏳ **D1 데이터베이스**: 대시보드에서 생성 필요
- ⏳ **Pages 프로젝트**: 대시보드에서 생성 및 업로드 필요
- ⏳ **D1 바인딩**: 대시보드에서 설정 필요

---

## 🆘 트러블슈팅

### **문제 1: 로그인 실패**
- D1 바인딩이 올바르게 설정되었는지 확인
- 데이터베이스 마이그레이션이 모두 실행되었는지 확인
- 테스트 데이터가 삽입되었는지 확인

### **문제 2: API 에러**
- 브라우저 개발자 도구(F12) → Console 탭에서 에러 확인
- Pages 프로젝트 → Functions → Logs에서 서버 로그 확인

### **문제 3: 스테이킹 신청 실패**
- 입금 확인 기능은 BSCscan API 키가 필요합니다
- 현재는 수동으로 관리자가 승인해야 합니다

---

## 📞 지원

- **Cloudflare 문서**: https://developers.cloudflare.com/pages
- **D1 문서**: https://developers.cloudflare.com/d1
- **배포 패키지**: https://www.genspark.ai/api/files/s/RcsK1o8H

---

## 🎉 완료!

위 단계를 모두 완료하면 **QUANTARIUM STAKING 플랫폼**이 정상적으로 운영됩니다!

**프로덕션 URL**: https://quantarium-staking.pages.dev
**관리자 페이지**: https://quantarium-staking.pages.dev/admin

축하합니다! 🚀
