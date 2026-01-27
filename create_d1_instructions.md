# CLI로 D1 데이터베이스 생성하기

## 문제: Cloudflare 대시보드에서 D1 메뉴가 안 보임

## 해결: Wrangler CLI 사용

### 1. 새로운 API 토큰 생성 (필수)

현재 토큰은 권한이 부족하므로 새 토큰을 만들어야 합니다.

1. https://dash.cloudflare.com/profile/api-tokens 접속
2. **Create Token** 클릭
3. **Custom token** 선택
4. 이름: `SAYCOIN-Deploy-Token`
5. 권한 추가:
   - `Account` - `D1` - `Edit`
   - `Account` - `Cloudflare Pages` - `Edit`
   - `User` - `User Details` - `Read`
6. **Continue to summary** → **Create Token**
7. 생성된 토큰 복사 (한 번만 표시됩니다!)

### 2. D1 데이터베이스 생성

터미널에서 실행:

```bash
export CLOUDFLARE_API_TOKEN="여기에-새로-생성한-토큰-붙여넣기"
cd /home/user/webapp
npx wrangler d1 create saycoin-staking-production
```

### 3. Database ID 복사

출력 결과에서 Database ID를 찾아 복사:

```
✅ Successfully created DB 'saycoin-staking-production'!

Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          ↑
       이것을 복사!
```

### 4. wrangler.jsonc 업데이트

```bash
# Database ID를 wrangler.jsonc에 입력
nano wrangler.jsonc
```

`database_id` 부분을 업데이트:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "saycoin-staking-production",
      "database_id": "여기에-Database-ID-입력"
    }
  ]
}
```

### 5. 마이그레이션 실행

```bash
export CLOUDFLARE_API_TOKEN="여기에-새로-생성한-토큰-붙여넣기"
cd /home/user/webapp
npx wrangler d1 execute saycoin-staking-production --remote --file=./migrations/ALL_MIGRATIONS.sql
```

### 6. 데이터 확인

```bash
npx wrangler d1 execute saycoin-staking-production --remote --command="SELECT COUNT(*) FROM users"
```

출력:
```
COUNT(*)
4
```

✅ 성공! 이제 Pages 배포를 진행하세요!

