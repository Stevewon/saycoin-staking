# QUANTARIUM STAKING - 프로젝트 정보

## 📦 최신 백업 파일

**백업 URL**: https://www.genspark.ai/api/files/s/0EqPNHCA  
**백업 날짜**: 2026-01-28  
**파일명**: `quantarium-staking-production-final.tar.gz`  
**크기**: 1.6 MB  

---

## 🌐 배포 정보

### 프로덕션 URL
- **메인**: https://staking.quantarium.net/
- **관리자**: https://staking.quantarium.net/admin
- **백업**: https://quantarium-staking-prod.pages.dev

### Cloudflare Pages 프로젝트
- **프로젝트명**: `quantarium-staking-prod`
- **계정 ID**: `37814a078a2d8ab3c20f85ec0640950b`
- **Production branch**: `quantarium-staking-platform`

### GitHub 저장소
- **저장소**: https://github.com/Stevewon/quantarium-staking
- **브랜치**: `quantarium-staking-platform`
- **계정**: Stevewon

---

## 🗄️ 데이터베이스

### Cloudflare D1 Database
- **이름**: `quantarium-staking-production`
- **Database ID**: `5a3ba471-4bba-413f-9af9-b6c94ef102d7`
- **바인딩**: `DB`

### 테이블 구조
1. **users** - 사용자 정보 (이메일, 비밀번호, 지갑주소, 잔액)
2. **staking** - 스테이킹 내역 (위탁량, 기간, 보상, 상태)
3. **daily_rewards** - 일일 USDT 보상 내역
4. **transactions** - 거래 내역
5. **withdrawals** - 출금 내역

---

## 🔐 관리자 정보

- **로그인 URL**: https://staking.quantarium.net/admin
- **아이디**: `admin`
- **비밀번호**: `admin1234`

⚠️ **보안**: 프로덕션에서는 반드시 비밀번호를 변경하세요!

---

## 🎯 주요 기능

### 사용자 기능
- ✅ 회원가입 (이메일, 전화번호, 지갑주소 입력)
- ✅ 로그인/로그아웃
- ✅ 아이디 찾기 / 비밀번호 찾기
- ✅ 스테이킹 신청 (6/12개월, 1천만 이상)
- ✅ 실시간 보상 미리보기 (QTA 3% + QX 3%)
- ✅ 잔액 조회 (QTA, QX, USDT)
- ✅ 스테이킹 내역 조회

### 관리자 기능
- ✅ 관리자 대시보드 (통계)
- ✅ 스테이킹 승인/거절
- ✅ 승인 시 자동 코인 지급 (QTA + QX)
- ✅ 전체 사용자 목록 조회
- ✅ 전체 스테이킹 내역 조회
- ✅ 일일 USDT 보상 지급 (수동)

### 보상 시스템
- **스테이킹 보상**: QTA 3% + QX 3% (1:1 비율)
- **일일 USDT**: 활성 스테이킹 사용자에게 $7.5 자동 지급
- **지급 방식**: 관리자 승인 후 즉시 지급

---

## 🛠️ 기술 스택

### Backend
- **프레임워크**: Hono v4.11.5
- **런타임**: Cloudflare Workers
- **언어**: TypeScript
- **데이터베이스**: Cloudflare D1 (SQLite)

### Frontend
- **언어**: Vanilla JavaScript
- **스타일링**: Tailwind CSS (CDN)
- **아이콘**: Font Awesome
- **HTTP**: Axios

### 배포
- **플랫폼**: Cloudflare Pages
- **CI/CD**: GitHub 자동 배포
- **빌드**: Vite
- **패키지 관리자**: npm

---

## 📂 프로젝트 구조

```
webapp/
├── src/
│   ├── index.tsx              # Hono 메인 애플리케이션
│   └── renderer.tsx           # SSR 렌더러
├── public/
│   ├── static/
│   │   ├── quantarium-logo.png  # 로고 이미지
│   │   └── style.css         # 커스텀 CSS
│   └── quantarium-logo.png      # 루트 로고
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_wallet_address.sql
│   ├── 0003_add_phone.sql
│   ├── 0004_allow_multiple_daily_rewards.sql
│   ├── 0005_create_withdrawals.sql
│   └── ALL_MIGRATIONS.sql    # 전체 마이그레이션
├── dist/                      # 빌드 출력 (자동 생성)
├── wrangler.jsonc            # Cloudflare 설정
├── package.json              # 의존성 및 스크립트
├── vite.config.ts            # Vite 빌드 설정
├── tsconfig.json             # TypeScript 설정
├── ecosystem.config.cjs      # PM2 설정 (로컬 개발)
├── seed.sql                  # 테스트 데이터
└── README.md                 # 프로젝트 문서
```

---

## 🚀 수정 작업 시작 방법

### 방법 1: 백업 파일로 복구 (새 환경)

1. **백업 파일 다운로드**:
   ```
   https://www.genspark.ai/api/files/s/0EqPNHCA
   ```

2. **압축 해제**:
   ```bash
   cd /home/user
   tar -xzf quantarium-staking-production-final.tar.gz
   cd webapp
   ```

3. **의존성 설치**:
   ```bash
   npm install
   ```

4. **로컬 개발 서버 시작**:
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   ```

### 방법 2: GitHub에서 클론 (기존 저장소)

1. **GitHub 인증 설정**:
   - AI Developer에서 #github 탭에서 인증 완료

2. **저장소 클론**:
   ```bash
   cd /home/user
   git clone https://github.com/Stevewon/quantarium-staking.git webapp
   cd webapp
   git checkout quantarium-staking-platform
   ```

3. **의존성 설치**:
   ```bash
   npm install
   ```

4. **로컬 개발 서버 시작**:
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   ```

### 방법 3: 기존 세션 재사용

이미 작업하던 세션이라면:
```bash
cd /home/user/webapp
git pull origin quantarium-staking-platform
npm install
npm run build
pm2 restart webapp
```

---

## 📝 코드 수정 후 배포

### 1. 로컬에서 테스트
```bash
cd /home/user/webapp

# 포트 정리
fuser -k 3000/tcp 2>/dev/null || true

# 빌드
npm run build

# 로컬 서버 시작
pm2 restart webapp

# 테스트
curl http://localhost:3000
```

### 2. GitHub에 푸시
```bash
cd /home/user/webapp

git add .
git commit -m "설명: 수정 내용"
git push origin quantarium-staking-platform
```

### 3. 자동 배포 확인
- GitHub 푸시 → Cloudflare Pages 자동 빌드 → 자동 배포
- 배포 상태: https://dash.cloudflare.com → Workers & Pages → quantarium-staking-prod → Deployments

---

## 🔧 주요 파일 설명

### `src/index.tsx`
- Hono 애플리케이션 메인 파일
- API 라우트 정의 (/api/*)
- HTML 페이지 렌더링
- D1 데이터베이스 연결

### `wrangler.jsonc`
- Cloudflare Pages 설정
- D1 데이터베이스 바인딩
- 호환성 설정

### `package.json`
- npm 스크립트 정의
- 의존성 목록
- 빌드/배포 명령어

### `migrations/`
- D1 데이터베이스 스키마
- 마이그레이션 파일들
- `ALL_MIGRATIONS.sql`: 전체 스키마 통합 파일

---

## 🐛 문제 해결

### 로컬 서버가 시작되지 않을 때
```bash
# 포트 확인 및 정리
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all

# 재시작
npm run build
pm2 start ecosystem.config.cjs
```

### D1 데이터베이스 연결 오류
```bash
# 로컬 마이그레이션 재적용
npx wrangler d1 migrations apply quantarium-staking-production --local

# 프로덕션 마이그레이션 확인
npx wrangler d1 migrations apply quantarium-staking-production --remote
```

### GitHub 푸시 실패
```bash
# 인증 재설정
# AI Developer #github 탭에서 재인증

# 강제 푸시 (주의!)
git push -f origin quantarium-staking-platform
```

### Cloudflare 배포 실패
1. Cloudflare Dashboard → Workers & Pages → quantarium-staking-prod
2. Deployments 탭 → 실패한 배포 클릭
3. "View build logs" 에서 오류 확인
4. Settings → Functions → D1 database bindings 확인

---

## 📊 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/find-id` - 아이디 찾기
- `POST /api/auth/find-password` - 비밀번호 찾기

### 사용자 API
- `GET /api/user/:userId` - 사용자 정보 조회
- `GET /api/transactions/:userId` - 거래 내역 조회

### 스테이킹 API
- `POST /api/staking/create` - 스테이킹 신청
- `GET /api/staking/list/:userId` - 스테이킹 목록

### 관리자 API
- `GET /api/admin/staking/pending` - 승인 대기 목록
- `GET /api/admin/staking/all` - 전체 스테이킹 목록
- `POST /api/admin/staking/approve/:stakingId` - 스테이킹 승인
- `POST /api/admin/staking/reject/:stakingId` - 스테이킹 거절
- `GET /api/admin/users` - 전체 사용자 목록

### 보상 API
- `POST /api/rewards/daily` - 일일 보상 지급 (관리자)
- `GET /api/rewards/history/:userId` - 보상 내역

---

## 🔐 보안 체크리스트

- [ ] 관리자 비밀번호 변경 (기본값: admin1234)
- [ ] 환경 변수로 민감 정보 관리
- [ ] HTTPS 강제 적용 (Cloudflare 자동)
- [ ] SQL Injection 방지 (Prepared Statements 사용 중)
- [ ] XSS 방지 (입력 검증 추가 권장)
- [ ] CSRF 토큰 추가 권장

---

## 📈 향후 개선 사항

1. **비밀번호 암호화** - bcrypt 사용
2. **JWT 인증** - 세션 관리 개선
3. **이메일 알림** - 승인/거절 알림
4. **출금 기능** - 코인 출금 시스템
5. **크론잡** - 일일 보상 자동화
6. **실시간 환율** - USDT-KRW 환율 API 연동
7. **2FA 인증** - 보안 강화
8. **추천 시스템** - 레퍼럴 보상

---

## 📞 지원 정보

### Cloudflare Dashboard
- URL: https://dash.cloudflare.com
- Account ID: 37814a078a2d8ab3c20f85ec0640950b

### GitHub
- 저장소: https://github.com/Stevewon/quantarium-staking
- 계정: Stevewon

### 문서
- Cloudflare Pages: https://developers.cloudflare.com/pages
- Cloudflare D1: https://developers.cloudflare.com/d1
- Hono: https://hono.dev

---

**마지막 업데이트**: 2026-01-28  
**프로젝트 상태**: ✅ 프로덕션 배포 완료  
**배포 URL**: https://staking.quantarium.net/
