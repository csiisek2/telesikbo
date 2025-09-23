# Railway 배포 가이드

## 1. Railway 회원가입 및 프로젝트 생성

1. **Railway 가입**: https://railway.app 접속 → GitHub 계정으로 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. 이 저장소 선택

## 2. 환경변수 설정

Railway 대시보드에서 **Variables** 탭 클릭 후 아래 환경변수 추가:

```
BOT_TOKEN=your_bot_token_here
ADMIN_TELEGRAM_ID=your_telegram_id_here
DATABASE_URL=file:./prisma/dev.db

SIGNUP_BONUS=1000
ATTENDANCE_REWARD=1000
GAME_COST=100
WITHDRAW_MIN=10000

NORMAL_WIN_RATE=0.45
VIP_WIN_RATE=0.55
```

**중요**:
- `BOT_TOKEN`: BotFather에서 발급받은 토큰
- `ADMIN_TELEGRAM_ID`: 본인의 텔레그램 ID (숫자)
- `DATABASE_URL`: SQLite 사용 시 `file:./prisma/dev.db` 그대로 사용

## 3. 배포 확인

1. Railway가 자동으로 빌드 시작
2. **Deployments** 탭에서 로그 확인
3. `🤖 Bot started successfully!` 메시지 확인되면 성공

## 4. 데이터베이스 마이그레이션 (최초 1회)

Railway 대시보드 → **Settings** → **Deploy Trigger** → **Redeploy**

또는 로컬에서:
```bash
npm run db:migrate
git add prisma/
git commit -m "Add database migration"
git push
```

## 5. 배포 후 테스트

텔레그램 앱에서 봇에게 `/start` 전송하여 정상 작동 확인

## 6. 로그 확인

Railway 대시보드 → **Deployments** → 최신 배포 클릭 → 로그 실시간 확인

## 7. PostgreSQL 사용 (선택사항 - 프로덕션 권장)

SQLite 대신 PostgreSQL 사용 시:

1. Railway 대시보드 → **New** → **Database** → **PostgreSQL**
2. DB 생성 후 `DATABASE_URL` 자동 생성됨
3. `prisma/schema.prisma` 파일 수정:
   ```prisma
   datasource db {
     provider = "postgresql"  // sqlite에서 변경
     url      = env("DATABASE_URL")
   }
   ```
4. 재배포

## 문제 해결

### 봇이 응답하지 않을 때
1. Railway 로그에서 에러 확인
2. 환경변수 올바르게 설정되었는지 확인
3. BOT_TOKEN이 유효한지 확인

### 데이터베이스 에러
1. Prisma generate 실행: `npm run db:generate`
2. 마이그레이션 실행: `npm run db:migrate`

### 배포 실패
1. `npm run build` 로컬에서 테스트
2. TypeScript 에러 수정 후 재배포