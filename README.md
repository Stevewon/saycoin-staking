# SAYCOIN STAKING

모바일 웹 기반 코인 스테이킹 플랫폼

## 📱 프로젝트 개요

**SAYCOIN STAKING**은 사용자가 코인을 위탁하고 보상을 받을 수 있는 모바일 최적화 웹 애플리케이션입니다.

### 주요 기능

✅ **회원가입 및 로그인**
- 이메일 기반 회원가입 (gmail.com, naver.com)
- 전화번호 입력 (010-XXXX-XXXX 형식)
- 지갑주소 등록 (BNB 기반 이더리움 호환)
- 비밀번호 확인 (이중 검증)
- 아이디 찾기 / 비밀번호 찾기
- 안전한 로그인 시스템

✅ **스테이킹 시스템**
- 6개월 또는 12개월 스테이킹 옵션
- 1,000만 이상 디폴트, 100만 단위로 위탁 가능
- 관리자 승인 후 3% 보상 지급 (QTA:QX = 1:1 비율)
- 예시: 1천만개 위탁 시 → QTA 30만개 + QX 30만개 (승인 후 지급)
- 실시간 보상 미리보기
- 스테이킹 상태 표시 (승인대기/진행중/거절됨/완료)

✅ **관리자 시스템**
- 관리자 로그인 페이지 (/admin)
- 관리자 대시보드 (통계 카드, 승인 관리)
- 승인 대기 목록 (사용자 정보, 위탁 수량, 보상 정보)
- 스테이킹 승인/거절 기능
- 전체 스테이킹 내역 조회
- 사용자 관리 (잔액 확인)

✅ **일일 USDT 보상**
- 활성 스테이킹 사용자 전원에게 매일 USDT 지급
- 1일 1만원 상당 (약 $7.5 USDT) 자동 지급
- BNB 기반 테더 (USDT-BEP20)

✅ **잔액 관리**
- 실시간 QTA, QX, USDT 잔액 확인
- 스테이킹 내역 조회
- 거래 히스토리 추적

## 🌐 URL

**개발 서버**: https://3000-ikf3n4yvqen398qs19qei-cbeee0f9.sandbox.novita.ai

**사용자 페이지**:
- `/` - 메인 페이지 (로그인/회원가입)
- `/dashboard` - 사용자 대시보드

**관리자 페이지**:
- `/admin` - 관리자 로그인 (ID: admin, PW: admin1234)
- `/admin/dashboard` - 관리자 대시보드

**API 엔드포인트**:

*인증 API*
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/find-id` - 아이디 찾기
- `POST /api/auth/find-password` - 비밀번호 찾기

*사용자 API*
- `GET /api/user/:userId` - 사용자 정보
- `GET /api/transactions/:userId` - 거래 내역

*스테이킹 API*
- `POST /api/staking/create` - 스테이킹 신청 (pending 상태 생성)
- `GET /api/staking/list/:userId` - 스테이킹 목록

*관리자 API*
- `GET /api/admin/staking/pending` - 승인 대기 목록
- `GET /api/admin/staking/all` - 전체 스테이킹 목록
- `POST /api/admin/staking/approve/:stakingId` - 스테이킹 승인 (코인 지급)
- `POST /api/admin/staking/reject/:stakingId` - 스테이킹 거절
- `GET /api/admin/users` - 전체 사용자 목록

*일일 보상 API*
- `POST /api/rewards/daily` - 일일 보상 지급 (관리자)
- `GET /api/rewards/history/:userId` - 보상 내역

## 💾 데이터 구조

### 사용자 (users)
```
- id: 사용자 ID
- email: 이메일 (gmail.com, naver.com)
- password: 비밀번호
- name: 이름
- phone: 전화번호 (010-XXXX-XXXX)
- wallet_address: 지갑주소 (BNB 기반 이더리움 형식)
- qta_balance: 양자내성 암호화폐 코인 QTA 잔액
- qx_balance: 양자내성 코인거래소 QX 잔액
- usdt_balance: USDT 잔액
```

### 스테이킹 (staking)
```
- id: 스테이킹 ID
- user_id: 사용자 ID
- amount: 위탁 수량 (1,000만 이상, 100만 단위)
- period_months: 기간 (6 또는 12개월)
- qta_reward: QTA 보상 (3%)
- qx_reward: QX 보상 (3%)
- start_date: 시작일
- end_date: 종료일
- status: 상태 (pending/active/rejected/completed)
```

### 일일 보상 (daily_rewards)
```
- id: 보상 ID
- user_id: 사용자 ID
- staking_id: 스테이킹 ID
- usdt_amount: USDT 금액 (7.5)
- reward_date: 지급일
```

### 거래 내역 (transactions)
```
- id: 거래 ID
- user_id: 사용자 ID
- type: 거래 유형 (staking_reward, daily_usdt, withdrawal)
- coin_type: 코인 종류 (QTA, QX, USDT)
- amount: 금액
- description: 설명
```

## 🗄️ 스토리지 서비스

**Cloudflare D1 Database** - SQLite 기반 전역 분산 데이터베이스
- 사용자 정보
- 스테이킹 기록
- 보상 내역
- 거래 히스토리

## 🚀 사용 방법

### 1. 회원가입
1. 메인 페이지에서 "회원가입" 클릭
2. 이름, 이메일 (아이디 입력, gmail.com 기본 선택), 전화번호 (010-XXXX-XXXX) 입력
3. 비밀번호 입력 및 확인
4. BNB 기반 지갑주소 입력 (0x로 시작하는 42자)
5. 회원가입 완료

### 2. 로그인
1. 이메일과 비밀번호로 로그인
2. 대시보드로 자동 이동

### 3. 스테이킹 신청
1. 대시보드에서 위탁 수량 입력 (1,000만 이상, 100만 단위)
2. 실시간 보상 미리보기 확인 (QTA + QX)
3. 기간 선택 (6개월 또는 12개월)
4. "스테이킹 신청" 클릭
5. 상태: 승인대기 → 관리자 승인 대기

### 4. 관리자 승인 프로세스
1. 관리자가 `/admin` 페이지로 로그인 (ID: admin, PW: admin1234)
2. 승인 대기 목록에서 신청 내역 확인
3. 승인 버튼 클릭 → 사용자에게 QTA + QX 코인 즉시 지급
4. 또는 거절 버튼 클릭 → 상태 '거절됨'으로 변경

### 5. 보상 확인
- 상단 카드에서 실시간 잔액 확인
- 하단에서 스테이킹 내역 및 상태 확인
- 매일 USDT 보상 자동 지급 (활성 스테이킹 시)

## 🛠️ 기술 스택

**Backend**:
- Hono (Fast web framework)
- Cloudflare Workers (Edge runtime)
- Cloudflare D1 (SQLite database)
- TypeScript

**Frontend**:
- Vanilla JavaScript
- Tailwind CSS
- Font Awesome Icons
- Axios (HTTP client)

**Deployment**:
- Cloudflare Pages

## 📊 현재 완료된 기능

✅ 회원가입/로그인 시스템  
✅ 이메일 도메인 선택 (gmail.com, naver.com)  
✅ 전화번호 입력 (010-XXXX-XXXX 3필드)  
✅ 아이디 찾기 / 비밀번호 찾기  
✅ 지갑주소 등록 및 검증 (BNB 기반)  
✅ 비밀번호 이중 확인  
✅ 스테이킹 신청 (6/12개월, 1,000만 이상, 100만 단위)  
✅ 실시간 보상 미리보기 (QTA:QX 3%씩)  
✅ 관리자 승인 시스템 (승인/거절)  
✅ 관리자 대시보드 (통계, 목록 관리)  
✅ 스테이킹 상태 표시 (승인대기/진행중/거절됨/완료)  
✅ 일일 USDT 보상 시스템  
✅ 실시간 잔액 표시 (QTA, QX, USDT)  
✅ 지갑주소 표시 (대시보드)  
✅ 스테이킹 내역 조회  
✅ 거래 내역 추적  
✅ 모바일 반응형 UI  

## 🔜 추천 다음 단계

1. **비밀번호 암호화** - bcrypt를 사용한 안전한 비밀번호 저장
2. **JWT 인증** - 세션 관리를 위한 JWT 토큰 구현
3. **관리자 인증 강화** - 데이터베이스 기반 관리자 계정 관리
4. **출금 기능** - 코인 출금 시스템 추가
5. **이메일 알림** - 스테이킹 승인/거절 알림, 일일 보상 알림
6. **실시간 환율** - 외부 API 연동으로 실시간 USDT-KRW 환율 적용
7. **스테이킹 해지** - 중도 해지 기능 (패널티 적용)
8. **추천 시스템** - 친구 추천으로 추가 보상
9. **알림 시스템** - 관리자에게 새 신청 알림

## 📦 배포 상태

**플랫폼**: Cloudflare Pages  
**프로젝트 이름**: saycoin-staking  
**프로덕션 URL**: https://saycoin-staking.pages.dev  
**마지막 업데이트**: 2026-01-22

### 배포 방법

**간편 배포 (스크립트 사용)**:
```bash
cd /home/user/webapp
./deploy.sh
```

**수동 배포**:
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name saycoin-staking
```

**상세 가이드**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 참조

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션 (로컬)
npm run db:migrate:local

# 시드 데이터 입력 (선택사항)
npm run db:seed

# 개발 서버 시작
npm run build
pm2 start ecosystem.config.cjs

# 테스트
curl http://localhost:3000
```

## 🗄️ 프로덕션 데이터베이스

**데이터베이스**: Cloudflare D1 (saycoin-staking-production)

**마이그레이션 적용**:
```bash
# 프로덕션 마이그레이션
npx wrangler d1 migrations apply saycoin-staking-production --remote

# 로컬 마이그레이션
npx wrangler d1 migrations apply saycoin-staking-production --local
```

**데이터베이스 관리**:
```bash
# 프로덕션 DB 쿼리
npx wrangler d1 execute saycoin-staking-production --remote --command="SELECT COUNT(*) FROM users"

# 로컬 DB 쿼리
npx wrangler d1 execute saycoin-staking-production --local --command="SELECT COUNT(*) FROM users"

# 데이터베이스 리셋 (로컬만)
npm run db:reset
```

## 📝 API 예제

### 회원가입
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","email":"hong@example.com","password":"1234","walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"}'
```

### 스테이킹 생성
```bash
curl -X POST http://localhost:3000/api/staking/create \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"amount":10000000,"periodMonths":6}'
# 응답: {"success":true,"message":"스테이킹 신청이 완료되었습니다. 관리자 승인 후 코인이 지급됩니다."}
```

### 관리자: 승인 대기 목록 조회
```bash
curl http://localhost:3000/api/admin/staking/pending
```

### 관리자: 스테이킹 승인 (코인 지급)
```bash
curl -X POST http://localhost:3000/api/admin/staking/approve/1
# 응답: {"success":true,"message":"스테이킹이 승인되었습니다. 코인이 지급되었습니다."}
```

### 관리자: 스테이킹 거절
```bash
curl -X POST http://localhost:3000/api/admin/staking/reject/1
# 응답: {"success":true,"message":"스테이킹이 거절되었습니다."}
```

### 일일 보상 지급 (관리자)
```bash
curl -X POST http://localhost:3000/api/rewards/daily
```

---

**Made with ❤️ using Hono + Cloudflare**
