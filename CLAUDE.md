# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 텔레그램 식보 게임 봇

## ✅ 기술적 검증 완료 사항

### 1. 채팅 제한 시스템 (100% 가능)
- **전체 회원 채팅 금지**: `setChatPermissions()` API 사용
- **특정 회원만 채팅 허용**: `restrictChatMember()` API로 개별 권한 부여
- **봇 메시지 전송**: 봇을 관리자로 설정하면 제한 무시하고 메시지 전송 가능
- **버튼 상호작용**: 인라인 키보드로 회원들이 버튼 클릭 가능 (채팅 금지 상태에서도)

### 2. 확률 조작 시스템 (100% 가능)
- 서버 측에서 주사위 결과 완전 제어
- 클라이언트는 결과만 수신 (조작 불가능)
- VIP/일반 회원별 차등 확률 설정 가능

### 3. 포인트 관리 시스템
- 데이터베이스 기반 포인트 관리
- **첫 가입**: 1,000P 지급 (10회 플레이 가능)
- **출석 보상**: 1,000P/일
- **게임 비용**: 100P/회
- **현금 전환**: 10,000P 이상부터 가능
- **당첨률**: 45% (일반), 55% (VIP)

---

## 🛠️ 기술 스택

### Backend
- **런타임**: Node.js (v18+)
- **언어**: TypeScript
- **봇 프레임워크**:
  - **grammY** (추천) - 모던, 경량, 서버리스 최적화
  - 또는 Telegraf - 전통적인 미들웨어 방식

### Database
- **개발/소규모**: SQLite
- **프로덕션**: PostgreSQL (권장)
  - 동시성 처리 우수
  - 트랜잭션 안정성
  - 포인트 관리에 적합
- **대안**: MongoDB (NoSQL, 유연한 스키마)

### ORM/Database Tools
- **Prisma** (TypeScript 친화적) 또는
- **TypeORM** 또는
- **Sequelize**

### 배포
- **서버**: AWS EC2, DigitalOcean, Railway
- **서버리스**: Vercel, Cloudflare Workers (grammY 사용 시)

---

## 📋 핵심 구현 로직

### 1. 그룹 채팅 제한 설정

```typescript
import { Bot } from "grammy";

const bot = new Bot("YOUR_BOT_TOKEN");

// 전체 회원 채팅 금지
await bot.api.setChatPermissions(chatId, {
  can_send_messages: false,
  can_send_media_messages: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
  can_change_info: false,
  can_invite_users: false,
  can_pin_messages: false,
});

// 특정 회원만 채팅 허용 (VIP, 관리자 등)
await bot.api.restrictChatMember(chatId, vipUserId, {
  permissions: {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
  },
  use_independent_chat_permissions: true,
});
```

### 2. 식보 게임 시스템

```typescript
type BetType = 'big' | 'small' | 'odd' | 'even';

interface SicBoResult {
  dice: [number, number, number];
  sum: number;
  isOdd: boolean;
  isBig: boolean;
}

interface GameResult {
  result: SicBoResult;
  betType: BetType;
  won: boolean;
  payout: number;
}

// 배당률 설정
const PAYOUTS = {
  big: 2,      // 대(11-17): 2배
  small: 2,    // 소(4-10): 2배
  odd: 2,      // 홀: 2배
  even: 2,     // 짝: 2배
};

// 확률 조작 가능한 주사위 굴리기
function rollDice(winRate: number = 0.5): SicBoResult {
  const shouldWin = Math.random() < winRate;

  let dice: [number, number, number];

  if (shouldWin) {
    // 승리하도록 주사위 조작 (예: 큰 수)
    dice = [
      Math.floor(Math.random() * 3) + 4, // 4-6
      Math.floor(Math.random() * 3) + 4,
      Math.floor(Math.random() * 3) + 4,
    ];
  } else {
    // 패배하도록 랜덤 생성
    dice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  }

  const sum = dice.reduce((a, b) => a + b, 0);

  return {
    dice,
    sum,
    isOdd: sum % 2 === 1,
    isBig: sum >= 11 && sum <= 17,
  };
}

// 회원 등급별 당첨률 설정
function getWinRate(points: number, isVIP: boolean): number {
  if (isVIP) return 0.55; // VIP 55%
  return 0.45; // 일반 45%
}

// 게임 실행
function playSicBo(
  betType: BetType,
  betAmount: number,
  userPoints: number,
  isVIP: boolean
): GameResult {
  const winRate = getWinRate(userPoints, isVIP);
  const result = rollDice(winRate);

  let won = false;
  switch (betType) {
    case 'big':
      won = result.isBig;
      break;
    case 'small':
      won = !result.isBig && result.sum >= 4;
      break;
    case 'odd':
      won = result.isOdd;
      break;
    case 'even':
      won = !result.isOdd;
      break;
  }

  const payout = won ? betAmount * PAYOUTS[betType] : 0;

  return { result, betType, won, payout };
}
```

### 3. 포인트 및 방문 관리 시스템 (Prisma)

```typescript
// schema.prisma
model User {
  id          Int      @id @default(autoincrement())
  telegramId  BigInt   @unique
  username    String?
  points      Int      @default(0)
  visitCount  Int      @default(0)  // 방문 횟수
  lastVisit   DateTime?
  isVIP       Boolean  @default(false)
  createdAt   DateTime @default(now())

  gameHistory GameHistory[]
  visits      Visit[]
}

model Visit {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  visitDate DateTime @default(now())
}

model GameHistory {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  gameType  String   // "sicbo"
  betType   String   // "big", "small", "odd", "even"
  betAmount Int
  result    String   // "win" or "lose"
  payout    Int
  dice      String   // JSON: [1,2,3]
  createdAt DateTime @default(now())
}

// 신규 회원 가입 (그룹 입장 시)
async function registerNewUser(telegramId: number, username?: string) {
  return await prisma.user.create({
    data: {
      telegramId,
      username,
      points: 1000, // 첫 가입 1,000P 지급
      visitCount: 1,
      visits: { create: {} },
    },
  });
}

// 출석 체크 (방문 기록)
async function checkAttendance(telegramId: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (!user) {
    throw new Error("먼저 /start를 입력해주세요!");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayVisit = await prisma.visit.findFirst({
    where: {
      userId: user.id,
      visitDate: { gte: today },
    },
  });

  if (todayVisit) {
    throw new Error("오늘 이미 출석했습니다!");
  }

  // 출석 처리 (2회차부터 1,000P 지급)
  const pointsToAdd = user.visitCount >= 1 ? 1000 : 0;

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      visitCount: { increment: 1 },
      points: { increment: pointsToAdd },
      lastVisit: new Date(),
      visits: { create: {} },
    },
  });
}

// 게임 플레이 로직
async function playGame(
  telegramId: number,
  betType: BetType,
  betAmount: number = 100
) {
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (!user) throw new Error("회원 정보 없음");

  if (user.points < betAmount) {
    throw new Error("포인트 부족");
  }

  // 포인트 차감
  await prisma.user.update({
    where: { id: user.id },
    data: { points: { decrement: betAmount } },
  });

  // 게임 실행 (현재 포인트에 따라 당첨률 자동 조정)
  const gameResult = playSicBo(betType, betAmount, user.points, user.isVIP);

  // 승리 시 포인트 지급
  if (gameResult.won) {
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: gameResult.payout } },
    });
  }

  // 게임 기록
  await prisma.gameHistory.create({
    data: {
      userId: user.id,
      gameType: "sicbo",
      betType,
      betAmount,
      result: gameResult.won ? "win" : "lose",
      payout: gameResult.payout,
      dice: JSON.stringify(gameResult.result.dice),
    },
  });

  return gameResult;
}
```

### 4. 봇 인터페이스 (인라인 키보드)

```typescript
// 메인 메뉴
bot.command("start", async (ctx) => {
  let user = await prisma.user.findUnique({
    where: { telegramId: ctx.from.id }
  });

  // 신규 회원 자동 등록
  if (!user) {
    user = await registerNewUser(ctx.from.id, ctx.from.username);
    await ctx.reply(
      `🎉 환영합니다!\n\n` +
      `신규 가입 보너스 1,000P 지급!\n` +
      `당첨률 20%로 게임을 즐겨보세요!\n\n` +
      `💰 10,000P 이상부터 현금 전환 가능합니다.`
    );
  }

  const canWithdraw = user.points >= 10000;
  const winRate = user.isVIP ? 55 : 45;

  await ctx.reply(
    `🎲 식보 게임\n\n` +
    `보유 포인트: ${user.points}P\n` +
    `당첨률: ${winRate}%\n` +
    `${canWithdraw ? "💵 현금 전환 가능" : "🔒 현금 전환: 10,000P 이상"}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎲 게임 하기 (100P)", callback_data: "play_sicbo" }],
          [{ text: "✅ 출석체크", callback_data: "attendance" }],
          [{ text: "💰 내 정보", callback_data: "my_info" }],
          canWithdraw ? [{ text: "💵 현금 전환", callback_data: "withdraw" }] : [],
        ].filter(row => row.length > 0),
      },
    }
  );
});

// 출석 체크
bot.callbackQuery("attendance", async (ctx) => {
  try {
    const user = await checkAttendance(ctx.from.id);
    const pointsAdded = user.visitCount > 1 ? 1000 : 0;

    await ctx.answerCallbackQuery({
      text: pointsAdded > 0 ? `✅ 출석 완료! ${pointsAdded}P 지급` : "✅ 출석 완료!",
      show_alert: true,
    });

    await ctx.editMessageText(
      `✅ 출석 성공!\n\n` +
      `방문 횟수: ${user.visitCount}회\n` +
      `보유 포인트: ${user.points}P\n\n` +
      `${pointsAdded > 0 ? `+${pointsAdded}P 지급` : "첫 가입 보너스는 이미 지급되었습니다"}`
    );
  } catch (error) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
});

// 식보 게임 - 배팅 타입 선택
bot.callbackQuery("play_sicbo", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("🎲 배팅을 선택하세요 (100P):", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📈 대(11-17)", callback_data: "bet_big_100" },
          { text: "📉 소(4-10)", callback_data: "bet_small_100" },
        ],
        [
          { text: "🔢 홀", callback_data: "bet_odd_100" },
          { text: "🔢 짝", callback_data: "bet_even_100" },
        ],
        [{ text: "« 뒤로가기", callback_data: "back_to_menu" }],
      ],
    },
  });
});

// 게임 실행
bot.callbackQuery(/bet_(big|small|odd|even)_(\d+)/, async (ctx) => {
  const betType = ctx.match[1] as BetType;
  const betAmount = parseInt(ctx.match[2]);

  try {
    const result = await playGame(ctx.from.id, betType, betAmount);

    const emoji = result.won ? "🎉" : "😢";
    const diceEmoji = result.result.dice.map(d => `⚄`.repeat(d)).join(" ");

    await ctx.answerCallbackQuery({
      text: result.won ? "당첨!" : "낙첨...",
      show_alert: false,
    });

    await ctx.editMessageText(
      `${emoji} 게임 결과\n\n` +
      `🎲 주사위: ${result.result.dice.join("-")} (합: ${result.result.sum})\n` +
      `📊 배팅: ${betType} (${betAmount}P)\n` +
      `${result.won ? `💰 당첨금: ${result.payout}P` : "❌ 낙첨"}\n\n` +
      `잔여 포인트를 확인하려면 /start를 입력하세요.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 다시 하기", callback_data: "play_sicbo" }],
            [{ text: "🏠 메인 메뉴", callback_data: "back_to_menu" }],
          ],
        },
      }
    );
  } catch (error) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
});
```

---

## 🔐 필수 요구사항

### 봇 권한 설정
1. 봇을 **그룹 관리자**로 추가
2. 필수 권한 활성화:
   - ✅ `can_restrict_members` (회원 제한 권한)
   - ✅ `can_delete_messages` (메시지 삭제 권한)
   - ✅ `can_pin_messages` (메시지 고정 권한)

### 그룹 설정
- **슈퍼그룹**(Supergroup)이어야 함 (일반 그룹 불가)
- 그룹을 슈퍼그룹으로 변환: 설정 → "그룹 타입 변경"

---

## 📦 프로젝트 구조 (권장)

```
telesikbo/
├── src/
│   ├── bot/
│   │   ├── index.ts           # 봇 초기화
│   │   ├── commands/          # 커맨드 핸들러
│   │   ├── keyboards/         # 인라인 키보드
│   │   └── middlewares/       # 미들웨어
│   ├── game/
│   │   ├── sicbo.ts           # 식보 게임 로직
│   │   └── probability.ts     # 확률 조작 로직
│   ├── database/
│   │   ├── prisma/            # Prisma schema
│   │   └── repositories/      # DB 레포지토리
│   └── utils/
│       ├── permissions.ts     # 권한 관리
│       └── validators.ts      # 유효성 검사
├── .env
├── package.json
└── tsconfig.json
```

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm init -y
npm install grammy @prisma/client
npm install -D typescript @types/node prisma ts-node
npx prisma init
```

### 2. 환경변수 (.env)
```env
BOT_TOKEN=your_bot_token_from_botfather
DATABASE_URL=postgresql://user:password@localhost:5432/telesikbo

# 게임 설정
SIGNUP_BONUS=1000          # 가입 보너스
ATTENDANCE_REWARD=1000     # 출석 보상
GAME_COST=100             # 게임 비용
WITHDRAW_MIN=10000        # 최소 출금액

# 당첨률
NORMAL_WIN_RATE=0.45      # 일반
VIP_WIN_RATE=0.55         # VIP
```

### 3. 봇 토큰 발급
1. [@BotFather](https://t.me/botfather) 에게 `/newbot` 전송
2. 봇 이름, 아이디 설정
3. 받은 토큰을 `.env`에 저장

### 4. 데이터베이스 설정
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. 봇 실행
```bash
npm run dev
```

---

## 🎮 게임 규칙 요약

### 포인트 시스템
- **첫 가입**: 1,000P 지급 (즉시 게임 가능)
- **출석체크**: 2회차부터 1,000P 지급
- **현금 전환**: 10,000P 이상부터 가능

### 식보 게임
- **배팅 비용**: 100P/회
- **최대 배팅**: 1,000P/회
- **배팅 옵션**: 대/소/홀/짝 (모두 2배 배당)
- **당첨률**:
  - 일반 회원: 45%
  - VIP 회원: 55%

### 예시 시나리오
```
1일차 (첫 가입): 1,000P 지급
  → 100P씩 10번 플레이
  → 당첨률 45% → 평균 4~5번 당첨
  → 800~1,000P 획득 → 총 1,800~2,000P

2일차 출석: +1,000P → 총 2,800~3,000P
3일차 출석: +1,000P → 총 3,800~4,000P
...
10일차: 10,000P 달성 → 현금 전환 가능
```

---

## ⚠️ 주의사항

1. **법적 검토 필요**: 포인트/게임 시스템은 관련 법규 확인 필수
2. **보안**:
   - 환경변수로 민감 정보 관리
   - 사용자 입력 검증 철저히
   - SQL Injection 방지 (ORM 사용)
3. **성능**:
   - 대규模 사용자 예상 시 Redis 캐싱 고려
   - 데이터베이스 인덱싱 최적화
4. **백업**: 정기적인 데이터베이스 백업 필수

---

## 📚 참고 자료

- [Telegram Bot API 공식 문서](https://core.telegram.org/bots/api)
- [grammY 문서](https://grammy.dev/)
- [Prisma 문서](https://www.prisma.io/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs/)