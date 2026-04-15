# 🚀 QUANTARIUM STAKING 빠른 배포 가이드

---

## 📦 배포 패키지 다운로드

**최신 배포 패키지**: https://www.genspark.ai/api/files/s/MBGfml2c

**패키지 내용**:
- ✅ 전체 소스코드
- ✅ 프로덕션 빌드 (`dist/` 폴더)
- ✅ 데이터베이스 마이그레이션 파일
- ✅ 상세 배포 가이드 3종
- ✅ 배포 체크리스트

---

## ⚡ 5분 빠른 배포 (3단계)

### **Step 1: D1 데이터베이스 생성 (2분)**

1. https://dash.cloudflare.com 접속 → 로그인
2. **Workers & Pages** > **D1 SQL Database** 클릭
3. **Create database** 클릭
4. Database name: `quantarium-staking-production` 입력
5. **Create** 클릭
6. **Database ID** 복사 (예: `xxxx-xxxx-xxxx-xxxx`)

### **Step 2: 데이터베이스 초기화 (1분)**

1. 생성된 데이터베이스 클릭
2. **Console** 탭 클릭
3. **`migrations/ALL_MIGRATIONS.sql`** 파일 내용 전체 복사
4. Console에 붙여넣기 후 **Execute** 클릭
5. ✅ 5개 테이블 + 테스트 데이터 자동 생성 완료

### **Step 3: Cloudflare Pages 배포 (2분)**

1. **Workers & Pages** > **Create application** 클릭
2. **Pages** 탭 > **Upload assets** 선택
3. Project name: `quantarium-staking` 입력
4. **`dist/`** 폴더의 모든 파일 업로드 (드래그 앤 드롭)
5. **Deploy site** 클릭
6. **Settings** > **Functions** > **D1 database bindings**
   - Variable name: `DB`
   - D1 database: `quantarium-staking-production` 선택
   - **Save** 클릭

---

## 🎉 배포 완료!

**프로덕션 URL**: https://quantarium-staking.pages.dev

**관리자 페이지**: https://quantarium-staking.pages.dev/admin
- ID: `admin`
- PW: `admin1234`

**테스트 계정**: 
- Email: `test@example.com`
- Password: `password123`

---

## ✅ 배포 확인

1. ✅ 사용자 페이지 접속: https://quantarium-staking.pages.dev
2. ✅ 회원가입 테스트
3. ✅ 로그인 테스트
4. ✅ 스테이킹 신청 테스트
5. ✅ 관리자 페이지 접속: /admin
6. ✅ 스테이킹 승인 테스트

---

## 📚 상세 문서

| 문서 | 설명 |
|------|------|
| **MANUAL_DEPLOYMENT.md** | 수동 배포 상세 가이드 (트러블슈팅 포함) |
| **DEPLOYMENT_CHECKLIST.md** | 배포 체크리스트 (단계별 확인) |
| **DEPLOYMENT_GUIDE.md** | 자동 배포 가이드 (CLI 사용) |
| **README.md** | 프로젝트 전체 개요 |

---

## 🔒 배포 후 필수 작업

### 1. 관리자 비밀번호 변경
현재: `admin` / `admin1234` → **즉시 변경 필요**

### 2. 회사 지갑주소 변경
현재: `0xa929D03edbBD468b7bD4A9da8D7098015B417Abe` (테스트용)
→ **실제 회사 지갑으로 변경 필요**

### 3. 일일 USDT 보상 크론잡 설정
- Cloudflare Workers 크론 트리거 설정
- 매일 오전 9시(KST) 자동 실행

---

## 🆘 문제 발생 시

### 로그인 안 됨
- D1 바인딩이 설정되었는지 확인
- 마이그레이션이 실행되었는지 확인

### API 에러
- F12 → Console 탭에서 에러 확인
- Pages 프로젝트 → Functions → Logs 확인

### 데이터베이스 에러
- D1 Console에서 테이블 확인:
```sql
SELECT name FROM sqlite_master WHERE type='table';
SELECT COUNT(*) FROM users;
```

---

## 📞 지원

- **Cloudflare Pages 문서**: https://developers.cloudflare.com/pages
- **Cloudflare D1 문서**: https://developers.cloudflare.com/d1
- **배포 패키지**: https://www.genspark.ai/api/files/s/MBGfml2c

---

## 🎊 축하합니다!

**QUANTARIUM STAKING** 플랫폼이 정상적으로 배포되었습니다!

이제 실제 서비스를 시작할 수 있습니다! 🚀

**프로덕션 URL**: https://quantarium-staking.pages.dev

---

Made with ❤️ using Hono + Cloudflare Workers/Pages
