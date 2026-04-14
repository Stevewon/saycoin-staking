# 🎉 QUANTARIUM STAKING - 프로덕션 배포 최종 가이드

## ✅ 준비 완료!

모든 코드와 빌드가 완료되었습니다!

---

## 📦 배포 패키지 다운로드

**다운로드 URL**: https://www.genspark.ai/api/files/s/RcsK1o8H

이 패키지에는 다음이 포함되어 있습니다:
- ✅ 전체 소스 코드
- ✅ 빌드된 dist 폴더
- ✅ 데이터베이스 마이그레이션 파일 (5개)
- ✅ 시드 데이터
- ✅ 배포 스크립트
- ✅ 상세 가이드 문서

---

## 🚀 배포 방법 (2가지 옵션)

### 옵션 1: Cloudflare 대시보드에서 수동 배포 (추천)

#### Step 1: D1 데이터베이스 생성
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **D1 SQL Database** 클릭
3. **Create database** 클릭
4. Database name: `quantarium-staking-production`
5. **Create** 클릭
6. **Database ID** 복사 (예: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### Step 2: 프로젝트 다운로드 및 설정
```bash
# 배포 패키지 다운로드 (위 URL에서)
# 압축 해제
tar -xzf quantarium-staking-production-ready.tar.gz
cd webapp

# wrangler.jsonc 파일 열기
nano wrangler.jsonc

# database_id를 복사한 ID로 변경:
"database_id": "여기에-복사한-Database-ID-입력"
```

#### Step 3: 데이터베이스 마이그레이션
```bash
cd webapp
npx wrangler d1 migrations apply quantarium-staking-production --remote
```

#### Step 4: Cloudflare Pages 프로젝트 생성
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **Create application** 클릭
3. **Pages** 탭 선택
4. **Upload assets** 선택
5. Project name: `quantarium-staking`
6. Production branch: `main`
7. **Create project** 클릭

#### Step 5: 배포
```bash
cd webapp
npx wrangler pages deploy dist --project-name quantarium-staking
```

또는 대시보드에서:
1. Cloudflare Pages 프로젝트 페이지
2. **Upload assets** 클릭
3. `dist` 폴더 전체를 드래그 앤 드롭

#### Step 6: D1 바인딩 설정 ⚠️ 중요!
1. Cloudflare Pages 프로젝트 페이지
2. **Settings** → **Functions** 탭
3. **D1 database bindings** 섹션
4. **Add binding** 클릭
5. Variable name: `DB`
6. D1 database: `quantarium-staking-production` 선택
7. **Save** 클릭

#### Step 7: 배포 확인
- 프로덕션 URL: `https://quantarium-staking.pages.dev`
- 관리자 페이지: `https://quantarium-staking.pages.dev/admin`

---

### 옵션 2: API 토큰 권한 업데이트 후 자동 배포

#### API 토큰 권한 추가
1. https://dash.cloudflare.com/profile/api-tokens 접속
2. 현재 사용 중인 토큰 **Edit** 클릭
3. 다음 권한 추가:
   - ✅ **Account - Cloudflare Pages - Edit**
   - ✅ **Account - D1 - Edit**
   - ✅ **Account - Workers Scripts - Edit**
4. **Save** 클릭

#### 자동 배포 실행
```bash
cd webapp
./deploy.sh
```

---

## 🧪 배포 후 테스트

### 1. 회원가입 테스트
- URL: https://quantarium-staking.pages.dev
- 회원가입 진행
- 로그인 확인

### 2. 스테이킹 신청
- 위탁 수량 입력 (예: 10,000,000)
- 기간 선택 (6개월 또는 12개월)
- 신청 완료

### 3. 관리자 승인
- URL: https://quantarium-staking.pages.dev/admin
- ID: `admin` / PW: `admin1234`
- 승인 대기 목록 확인
- 스테이킹 승인

### 4. 보상 확인
- 사용자 대시보드에서 QTA/QX 잔액 확인
- 일일 USDT 보상 확인

---

## ⚠️ 배포 후 필수 작업

### 1. 관리자 비밀번호 변경 (보안 중요!)
현재 관리자 계정이 하드코딩되어 있습니다:
- ID: `admin`
- PW: `admin1234`

**변경 방법**:
1. `src/index.tsx` 파일 열기
2. 약 1680번 줄 근처에서 `admin1234` 검색
3. 비밀번호 변경
4. 재빌드 및 재배포

### 2. 회사 지갑주소 변경
현재 테스트 지갑주소:
- `0xa929D03edbBD468b7bD4A9da8D7098015B417Abe`

**변경 방법**:
1. `src/index.tsx` 파일 열기
2. 위 주소 검색
3. 실제 회사 지갑주소로 변경
4. 재빌드 및 재배포

### 3. 정기 백업 설정
- D1 데이터베이스 정기 백업
- 트랜잭션 로그 모니터링
- 에러 로그 확인

---

## 📊 주요 URL

### 프로덕션
- **메인**: https://quantarium-staking.pages.dev
- **관리자**: https://quantarium-staking.pages.dev/admin

### Cloudflare 대시보드
- **Pages**: https://dash.cloudflare.com → Workers & Pages
- **D1 Database**: https://dash.cloudflare.com → Workers & Pages → D1
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens

---

## 🆘 문제 해결

### "Database not found" 오류
✅ **해결**: D1 바인딩 설정 확인
- Settings → Functions → D1 database bindings
- Variable name: `DB`
- Database: `quantarium-staking-production`

### 정적 파일 404 오류
✅ **해결**: dist 폴더 재배포
```bash
npm run build
npx wrangler pages deploy dist --project-name quantarium-staking
```

### 마이그레이션 실패
✅ **해결**: 마이그레이션 재적용
```bash
npx wrangler d1 migrations apply quantarium-staking-production --remote
```

---

## 📞 추가 지원

**문서**:
- Cloudflare Pages: https://developers.cloudflare.com/pages
- D1 Database: https://developers.cloudflare.com/d1
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler

**로그 확인**:
- Cloudflare 대시보드 → Pages → Deployments → 로그 확인

---

## 🎉 축하합니다!

QUANTARIUM STAKING 플랫폼 배포가 완료되었습니다!
위 단계를 따라 진행하시면 실제 서비스를 시작하실 수 있습니다.

**성공적인 런칭을 기원합니다!** 🚀
