# 🚀 SAYCOIN STAKING 프로덕션 배포 가이드

## 📋 배포 개요

이 가이드는 SAYCOIN STAKING 플랫폼을 Cloudflare Pages에 배포하는 전체 과정을 안내합니다.

---

## ⚠️ 현재 상황

API 토큰 권한 제한으로 인해 **Cloudflare 대시보드에서 직접 설정**이 필요합니다.

---

## 🎯 Step 1: Cloudflare D1 데이터베이스 생성

### 1-1. Cloudflare 대시보드 접속
1. https://dash.cloudflare.com 접속
2. 로그인

### 1-2. D1 데이터베이스 생성
1. 좌측 메뉴에서 **"Workers & Pages"** 클릭
2. 상단 탭에서 **"D1 SQL Database"** 선택
3. **"Create database"** 클릭
4. Database name: `saycoin-staking-production`
5. **"Create"** 클릭

### 1-3. Database ID 복사
- 생성된 데이터베이스 페이지에서 **Database ID** 복사
- 예: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## 🎯 Step 2: wrangler.jsonc 업데이트

### 2-1. Database ID 입력
로컬 프로젝트의 `wrangler.jsonc` 파일을 열고 Database ID를 입력:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "saycoin-staking",
  "compatibility_date": "2026-01-22",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "./dist",

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "saycoin-staking-production",
      "database_id": "여기에-복사한-Database-ID-입력"
    }
  ]
}
```

---

## 🎯 Step 3: 프로덕션 데이터베이스 마이그레이션

### 3-1. 마이그레이션 적용
로컬 터미널에서 실행:

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply saycoin-staking-production --remote
```

### 3-2. 시드 데이터 입력 (선택사항)
테스트 데이터가 필요한 경우:

```bash
cd /home/user/webapp
npx wrangler d1 execute saycoin-staking-production --remote --file=./seed.sql
```

---

## 🎯 Step 4: Cloudflare Pages 프로젝트 생성

### 4-1. Pages 프로젝트 생성
1. https://dash.cloudflare.com 접속
2. 좌측 메뉴에서 **"Workers & Pages"** 클릭
3. **"Create application"** 클릭
4. **"Pages"** 탭 선택
5. **"Upload assets"** 선택 (또는 GitHub 연결)

### 4-2. 프로젝트 설정
- **Project name**: `saycoin-staking`
- **Production branch**: `main`

---

## 🎯 Step 5: 프로덕션 빌드 & 배포

### 5-1. 로컬 빌드
```bash
cd /home/user/webapp
npm run build
```

### 5-2. Cloudflare Pages 배포
```bash
cd /home/user/webapp
npx wrangler pages deploy dist --project-name saycoin-staking
```

**또는 대시보드에서 직접 업로드:**
1. Cloudflare Pages 프로젝트 페이지에서
2. **"Upload assets"** 클릭
3. `dist` 폴더 전체를 드래그 앤 드롭

---

## 🎯 Step 6: D1 바인딩 설정

### 6-1. Pages 프로젝트에서 D1 연결
1. Cloudflare Pages 프로젝트 페이지
2. **"Settings"** → **"Functions"** 탭
3. **"D1 database bindings"** 섹션
4. **"Add binding"** 클릭
5. Variable name: `DB`
6. D1 database: `saycoin-staking-production` 선택
7. **"Save"** 클릭

---

## 🎯 Step 7: 환경 변수 설정 (선택사항)

현재 프로젝트는 환경 변수가 필요하지 않지만, 향후 추가 시:

1. Cloudflare Pages 프로젝트 페이지
2. **"Settings"** → **"Environment variables"**
3. **"Add variable"** 클릭
4. Production/Preview 환경 선택
5. 변수 이름과 값 입력
6. **"Save"** 클릭

---

## 🎯 Step 8: 배포 확인 및 테스트

### 8-1. 배포 URL 확인
- Cloudflare Pages 프로젝트 페이지에서 배포 URL 확인
- 예: `https://saycoin-staking.pages.dev`

### 8-2. 기능 테스트
1. **회원가입**: 새 계정 생성
2. **로그인**: 생성한 계정으로 로그인
3. **대시보드**: 잔액 및 스테이킹 확인
4. **스테이킹 신청**: 테스트 스테이킹 신청
5. **관리자 페이지**: `/admin` 접속 (admin/admin1234)
6. **스테이킹 승인**: 관리자에서 승인
7. **USDT 보상**: 일일 보상 테스트

---

## 🎯 Step 9: 커스텀 도메인 연결 (선택사항)

### 9-1. 도메인 추가
1. Cloudflare Pages 프로젝트 페이지
2. **"Custom domains"** 탭
3. **"Set up a custom domain"** 클릭
4. 도메인 입력 (예: `staking.saycoin.com`)
5. DNS 레코드 자동 설정

### 9-2. SSL 인증서
- Cloudflare가 자동으로 SSL 인증서 발급
- 보통 몇 분 내에 활성화

---

## 📊 주요 URL

### 프로덕션 환경
- **메인 페이지**: https://saycoin-staking.pages.dev
- **관리자 페이지**: https://saycoin-staking.pages.dev/admin
- **관리자 계정**: admin / admin1234

### Cloudflare 대시보드
- **Workers & Pages**: https://dash.cloudflare.com
- **D1 Databases**: https://dash.cloudflare.com → Workers & Pages → D1
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens

---

## 🔧 트러블슈팅

### 문제 1: "Database not found" 오류
**해결**: D1 바인딩 설정 확인
- Pages 프로젝트 Settings → Functions → D1 database bindings
- Variable name이 `DB`인지 확인

### 문제 2: 마이그레이션 실패
**해결**: 로컬에서 다시 적용
```bash
npx wrangler d1 migrations apply saycoin-staking-production --remote
```

### 문제 3: 정적 파일 404 오류
**해결**: 빌드 재실행 및 재배포
```bash
npm run build
npx wrangler pages deploy dist --project-name saycoin-staking
```

### 문제 4: API 토큰 권한 오류
**해결**: 필요한 권한 추가
1. https://dash.cloudflare.com/profile/api-tokens
2. 토큰 편집
3. 권한 추가:
   - Account - Cloudflare Pages - Edit
   - Account - D1 - Edit
   - Account - Workers Scripts - Edit

---

## 📝 체크리스트

배포 완료 확인:

- [ ] D1 데이터베이스 생성 완료
- [ ] wrangler.jsonc에 Database ID 입력
- [ ] 프로덕션 마이그레이션 적용
- [ ] Cloudflare Pages 프로젝트 생성
- [ ] dist 폴더 빌드
- [ ] Pages에 배포
- [ ] D1 바인딩 설정
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 스테이킹 신청 테스트
- [ ] 관리자 승인 테스트
- [ ] USDT 보상 테스트

---

## 🎉 배포 완료!

모든 단계가 완료되면 SAYCOIN STAKING 플랫폼이 프로덕션 환경에서 실행됩니다!

**다음 단계:**
1. 실제 운영 전 충분한 테스트
2. 관리자 비밀번호 변경 (보안)
3. 회사 지갑주소 업데이트 (실제 주소로)
4. 모니터링 설정
5. 백업 계획 수립

---

## 📞 지원

문제가 발생하면:
1. Cloudflare 문서: https://developers.cloudflare.com/pages
2. Wrangler 문서: https://developers.cloudflare.com/workers/wrangler
3. D1 문서: https://developers.cloudflare.com/d1
