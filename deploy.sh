#!/bin/bash

# QUANTARIUM STAKING 배포 스크립트
# 이 스크립트는 Cloudflare Pages에 프로젝트를 배포합니다

echo "🚀 QUANTARIUM STAKING 배포 시작..."
echo ""

# 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 1. 포트 정리
echo "📦 1단계: 포트 정리..."
fuser -k 3000/tcp 2>/dev/null || true
echo "✅ 포트 정리 완료"
echo ""

# 2. 의존성 확인
echo "📦 2단계: 의존성 확인..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules 없음. npm install 실행..."
    npm install
fi
echo "✅ 의존성 확인 완료"
echo ""

# 3. 빌드
echo "🔨 3단계: 프로덕션 빌드..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패!"
    exit 1
fi
echo "✅ 빌드 완료"
echo ""

# 4. wrangler.jsonc 확인
echo "📝 4단계: wrangler.jsonc 확인..."
if grep -q "your-database-id" wrangler.jsonc; then
    echo "⚠️  경고: wrangler.jsonc에 Database ID가 설정되지 않았습니다!"
    echo ""
    echo "다음 단계를 수행하세요:"
    echo "1. Cloudflare 대시보드에서 D1 데이터베이스 생성"
    echo "2. Database ID 복사"
    echo "3. wrangler.jsonc 파일에서 'your-database-id'를 실제 ID로 변경"
    echo ""
    read -p "계속하시겠습니까? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo "✅ 설정 확인 완료"
echo ""

# 5. 배포
echo "🚀 5단계: Cloudflare Pages 배포..."
echo ""
echo "프로젝트 이름: quantarium-staking"
echo "배포 디렉토리: dist/"
echo ""

npx wrangler pages deploy dist --project-name quantarium-staking

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 배포 완료!"
    echo ""
    echo "📊 배포 확인:"
    echo "- 프로덕션 URL: https://quantarium-staking.pages.dev"
    echo "- 관리자 페이지: https://quantarium-staking.pages.dev/admin"
    echo ""
    echo "🔧 다음 단계:"
    echo "1. Cloudflare Pages 대시보드에서 D1 바인딩 설정"
    echo "   - Settings → Functions → D1 database bindings"
    echo "   - Variable name: DB"
    echo "   - D1 database: quantarium-staking-production"
    echo ""
    echo "2. 프로덕션 데이터베이스 마이그레이션:"
    echo "   npx wrangler d1 migrations apply quantarium-staking-production --remote"
    echo ""
    echo "3. 배포된 사이트 테스트"
    echo ""
else
    echo ""
    echo "❌ 배포 실패!"
    echo ""
    echo "문제 해결:"
    echo "1. Cloudflare API 토큰 권한 확인"
    echo "2. 프로젝트가 Cloudflare에 생성되어 있는지 확인"
    echo "3. DEPLOYMENT_GUIDE.md 참조"
    exit 1
fi
