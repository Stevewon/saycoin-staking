# 🚨 긴급 복구 가이드

## 📦 백업 파일 정보

**다운로드 URL**: https://www.genspark.ai/api/files/s/0EqPNHCA

이 파일 하나면 전체 프로젝트를 복구할 수 있습니다!

---

## ⚡ 빠른 복구 (5분 완료)

### 1단계: 백업 파일 업로드
AI Developer 세션에 위 백업 파일을 업로드하세요.

### 2단계: 압축 해제 및 설치
```bash
cd /home/user
tar -xzf quantarium-staking-production-final.tar.gz
cd webapp
npm install
```

### 3단계: 로컬 개발 서버 시작
```bash
npm run build
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs
```

### 4단계: 확인
```bash
curl http://localhost:3000
```

**완료!** ✅

---

## 🔄 수정 작업 시작할 때

### AI에게 이렇게 말하세요:

```
이 백업 파일로 QUANTARIUM 프로젝트를 복구해줘:
https://www.genspark.ai/api/files/s/0EqPNHCA

그리고 PROJECT_INFO.md 파일을 읽어줘.
```

AI가 자동으로:
1. 백업 파일 다운로드
2. 압축 해제
3. 프로젝트 구조 파악
4. 필요한 설정 확인

---

## 📝 주요 정보 요약

### URL
- **프로덕션**: https://staking.quantarium.net/
- **관리자**: https://staking.quantarium.net/admin

### 관리자 계정
- **ID**: admin
- **PW**: admin1234

### GitHub
- **저장소**: https://github.com/Stevewon/quantarium-staking
- **브랜치**: quantarium-staking-platform

### Cloudflare Pages
- **프로젝트**: quantarium-staking-prod
- **Dashboard**: https://dash.cloudflare.com

### Database
- **이름**: quantarium-staking-production
- **ID**: 5a3ba471-4bba-413f-9af9-b6c94ef102d7

---

## 🎯 자주 하는 작업

### 기능 추가/수정
```bash
cd /home/user/webapp
# src/index.tsx 파일 수정
npm run build
pm2 restart webapp
# 테스트 후 GitHub 푸시
git add .
git commit -m "기능 추가: 설명"
git push origin quantarium-staking-platform
```

### 디자인 변경
```bash
cd /home/user/webapp
# public/static/style.css 수정
# 또는 src/index.tsx의 HTML 수정
npm run build
pm2 restart webapp
```

### 데이터베이스 스키마 변경
```bash
cd /home/user/webapp
# migrations/ 폴더에 새 마이그레이션 파일 생성
npx wrangler d1 migrations apply quantarium-staking-production --local
# 테스트 후 프로덕션 적용
npx wrangler d1 migrations apply quantarium-staking-production --remote
```

---

## 🆘 문제 발생 시

### 서버가 안 켜질 때
```bash
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all
npm run build
pm2 start ecosystem.config.cjs
```

### GitHub 푸시 안될 때
```bash
# AI Developer #github 탭에서 재인증
git push origin quantarium-staking-platform
```

### 데이터베이스 오류
```bash
# 로컬 DB 초기화
rm -rf .wrangler/state/v3/d1
npx wrangler d1 migrations apply quantarium-staking-production --local
```

---

## 📞 중요 링크

- **백업 파일**: https://www.genspark.ai/api/files/s/0EqPNHCA
- **프로덕션**: https://staking.quantarium.net/
- **GitHub**: https://github.com/Stevewon/quantarium-staking
- **Cloudflare**: https://dash.cloudflare.com

---

**이 파일을 저장해두세요!** 📌
