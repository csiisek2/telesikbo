# 🎲 텔레그램 식보 게임 봇

회원 관리 및 식보 게임 시스템을 갖춘 텔레그램 봇입니다.

## ✨ 주요 기능

- 🎮 식보 게임 (대/소/홀/짝)
- 💰 포인트 시스템 (가입 1,000P, 출석 1,000P)
- 🎯 당첨률 조정 (일반 45%, VIP 55%)
- 📊 최대 배팅 제한 (1,000P)
- 💵 현금 전환 (10,000P 이상)
- 🚫 그룹 채팅 제한 (봇 명령만 가능)

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
BOT_TOKEN=your_bot_token_from_botfather
DATABASE_URL=postgresql://user:password@localhost:5432/telesikbo
```

### 3. 봇 토큰 발급

1. [@BotFather](https://t.me/botfather)에게 `/newbot` 전송
2. 봇 이름과 username 설정
3. 받은 토큰을 `.env`에 설정

### 4. 데이터베이스 설정

PostgreSQL 실행 후:

```bash
npm run db:migrate
npm run db:generate
```

### 5. 봇 실행

```bash
npm run dev
```

## 📋 게임 규칙

### 포인트 시스템
- 첫 가입: 1,000P
- 출석체크: 1,000P/일 (2회차부터)
- 게임 비용: 100P~1,000P/회
- 현금 전환: 10,000P 이상

### 식보 게임
- 배팅 옵션: 대/소/홀/짝 (2배 배당)
- 당첨률: 일반 45%, VIP 55%
- 최대 배팅: 1,000P

## 🔐 그룹 채팅 제한 설정

1. 봇을 **슈퍼그룹**에 추가
2. 봇을 **관리자**로 승격
3. 필요한 권한 활성화:
   - ✅ `can_restrict_members`
   - ✅ `can_delete_messages`

4. 봇 코드에서 권한 설정:

```typescript
await bot.api.setChatPermissions(chatId, {
  can_send_messages: false,
  // 기타 권한 모두 false
});
```

## 📁 프로젝트 구조

```
telesikbo/
├── src/
│   ├── bot/
│   │   ├── commands/
│   │   │   └── start.ts
│   │   └── handlers/
│   │       ├── attendance.ts
│   │       ├── game.ts
│   │       └── info.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── game/
│   │   └── sicbo.ts
│   ├── services/
│   │   ├── game.service.ts
│   │   └── user.service.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
└── tsconfig.json
```

## 🛠️ 사용 가능한 명령어

```bash
npm run dev        # 개발 모드 실행
npm run build      # 빌드
npm run start      # 프로덕션 실행
npm run db:migrate # DB 마이그레이션
npm run db:studio  # Prisma Studio 실행
```

## 📚 참고 자료

- [grammY 문서](https://grammy.dev/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Prisma 문서](https://www.prisma.io/docs)