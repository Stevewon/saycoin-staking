# ✅ SAYCOIN STAKING 배포 체크리스트

## 📋 배포 전 준비사항

### 1️⃣ Cloudflare 대시보드 접속
- [ ] https://dash.cloudflare.com 접속 및 로그인
- [ ] Workers & Pages 메뉴 확인

### 2️⃣ D1 데이터베이스 생성
- [ ] Workers & Pages > D1 SQL Database 접속
- [ ] Create database 클릭
- [ ] Database name: `saycoin-staking-production` 입력
- [ ] Database ID 복사 및 저장
- [ ] 예: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3️⃣ 데이터베이스 마이그레이션 (SQL 콘솔에서 실행)
- [ ] D1 데이터베이스 > Console 탭 접속
- [ ] 마이그레이션 0001 실행 (users 테이블)
- [ ] 마이그레이션 0002 실행 (staking 테이블)
- [ ] 마이그레이션 0003 실행 (daily_rewards 테이블)
- [ ] 마이그레이션 0004 실행 (transactions 테이블)
- [ ] 마이그레이션 0005 실행 (withdrawals 테이블)
- [ ] 테스트 데이터 삽입 (선택 사항)

### 4️⃣ Cloudflare Pages 프로젝트 생성
- [ ] Workers & Pages > Create application 클릭
- [ ] Pages 탭 > Upload assets 선택
- [ ] Project name: `saycoin-staking` 입력
- [ ] dist 폴더의 모든 파일 업로드
  - [ ] `_worker.js`
  - [ ] `_routes.json`
  - [ ] `saycoin-logo.png`
  - [ ] `static/` 폴더

### 5️⃣ D1 바인딩 설정
- [ ] saycoin-staking 프로젝트 > Settings > Functions 접속
- [ ] D1 database bindings > Add binding 클릭
- [ ] Variable name: `DB` 입력
- [ ] D1 database: `saycoin-staking-production` 선택
- [ ] Save 클릭

---

## 🧪 배포 후 테스트

### 사용자 페이지 테스트
- [ ] https://saycoin-staking.pages.dev 접속
- [ ] 회원가입 기능 테스트
- [ ] 로그인 기능 테스트
- [ ] 대시보드 표시 확인
- [ ] 스테이킹 신청 테스트
- [ ] 프로필 설정 테스트
- [ ] 모바일 반응형 확인

### 관리자 페이지 테스트
- [ ] https://saycoin-staking.pages.dev/admin 접속
- [ ] 관리자 로그인 (admin / admin1234)
- [ ] 대시보드 통계 확인
- [ ] 스테이킹 승인 기능 테스트
- [ ] 사용자 목록 조회

---

## 🔒 보안 설정 (배포 후 필수)

### 관리자 계정 보안
- [ ] 관리자 비밀번호 변경 (현재: admin1234)
- [ ] 관리자 이메일 설정

### 회사 정보 업데이트
- [ ] 회사 지갑주소 변경
- [ ] 현재: `0xa929D03edbBD468b7bD4A9da8D7098015B417Abe`
- [ ] 실제 회사 지갑으로 변경

### API 토큰 권한 업데이트
- [ ] https://dash.cloudflare.com/profile/api-tokens 접속
- [ ] 현재 토큰 편집
- [ ] 권한 추가:
  - [ ] Account - Cloudflare Pages - Edit
  - [ ] Account - D1 - Edit
  - [ ] User - User Details - Read
- [ ] 저장

---

## 📊 최종 확인

### URL 확인
- [ ] 프로덕션 URL: https://saycoin-staking.pages.dev
- [ ] 관리자 URL: https://saycoin-staking.pages.dev/admin

### 기능 확인
- [ ] 회원가입/로그인 정상 작동
- [ ] 스테이킹 신청 정상 작동
- [ ] 관리자 승인 정상 작동
- [ ] 잔액 표시 정상 작동
- [ ] 코인 출금 신청 정상 작동
- [ ] 모바일 최적화 확인

### 성능 확인
- [ ] 페이지 로딩 속도 확인
- [ ] API 응답 속도 확인
- [ ] 데이터베이스 쿼리 성능 확인

---

## 📞 문제 발생 시

### 로그 확인
1. Cloudflare 대시보드 > saycoin-staking 프로젝트
2. Functions > Logs 탭
3. 에러 메시지 확인

### 브라우저 디버깅
1. F12 (개발자 도구)
2. Console 탭에서 에러 확인
3. Network 탭에서 API 요청 확인

### 데이터베이스 확인
1. D1 데이터베이스 > Console 탭
2. SQL 쿼리 실행하여 데이터 확인
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM staking;
```

---

## 🎉 배포 완료!

모든 체크리스트를 완료하면 **SAYCOIN STAKING** 플랫폼이 정상적으로 운영됩니다!

**프로덕션 URL**: https://saycoin-staking.pages.dev

**관리자 로그인**:
- ID: `admin`
- PW: `admin1234` (배포 후 즉시 변경)

**테스트 계정**:
- Email: `test@example.com`
- Password: `password123`

---

## 📚 참고 문서

- [MANUAL_DEPLOYMENT.md](MANUAL_DEPLOYMENT.md) - 상세 배포 가이드
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 자동 배포 가이드
- [README.md](README.md) - 프로젝트 개요
- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1)

축하합니다! 🚀
