import { CallbackQueryContext, Context } from 'grammy';
import { playGame } from '../../services/game.service';
import { BetType } from '../../game/sicbo';
import { config } from '../../config/env';
import { getUser } from '../../services/user.service';

export async function playSicBoHandler(ctx: CallbackQueryContext<Context>) {
  const user = await getUser(ctx.from.id);

  if (!user) {
    await ctx.answerCallbackQuery({
      text: '먼저 /start를 입력해주세요!',
      show_alert: true,
    });
    return;
  }

  if (user.points >= config.game.maxPoints) {
    await ctx.answerCallbackQuery({
      text: `최대 포인트 ${config.game.maxPoints}P 달성! 쿠폰 전환 후 게임 가능합니다.`,
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`💰 배팅 금액을 선택하세요:`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '100P', callback_data: 'amount_100' },
          { text: '200P', callback_data: 'amount_200' },
          { text: '300P', callback_data: 'amount_300' },
          { text: '400P', callback_data: 'amount_400' },
          { text: '500P', callback_data: 'amount_500' },
        ],
        [
          { text: '600P', callback_data: 'amount_600' },
          { text: '700P', callback_data: 'amount_700' },
          { text: '800P', callback_data: 'amount_800' },
          { text: '900P', callback_data: 'amount_900' },
          { text: '1000P', callback_data: 'amount_1000' },
        ],
        [{ text: '« 뒤로가기', callback_data: 'back_to_menu' }],
      ],
    },
  });
}

export async function selectAmountHandler(ctx: CallbackQueryContext<Context>) {
  const match = ctx.match as RegExpMatchArray;
  const amount = parseInt(match[1]);

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`💰 ${amount}P 배팅\n\n🎲 배팅 타입을 선택하세요:`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📈 대(11-17)', callback_data: `bet_big_${amount}` },
          { text: '📉 소(4-10)', callback_data: `bet_small_${amount}` },
        ],
        [
          { text: '🔢 홀', callback_data: `bet_odd_${amount}` },
          { text: '🔢 짝', callback_data: `bet_even_${amount}` },
        ],
        [{ text: '« 뒤로가기', callback_data: 'play_sicbo' }],
      ],
    },
  });
}

const BET_TYPE_KOREAN: Record<BetType, string> = {
  big: '대',
  small: '소',
  odd: '홀',
  even: '짝',
};

export async function betHandler(ctx: CallbackQueryContext<Context>) {
  const match = ctx.match as RegExpMatchArray;
  const betType = match[1] as BetType;
  const betAmount = parseInt(match[2]);

  try {
    await ctx.answerCallbackQuery();

    const username = ctx.from.first_name || ctx.from.username || '익명';

    // 1단계: 배팅 접수
    await ctx.editMessageText(
      `🎲 배팅 접수!\n\n` +
        `👤 ${username}\n` +
        `배팅: ${BET_TYPE_KOREAN[betType]} (${betAmount}P)\n` +
        `주사위를 굴립니다...`
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2단계: 주사위 굴리는 중
    await ctx.editMessageText(
      `🎲 주사위 굴리는 중...\n\n` + `🎰🎰🎰\n\n` + `잠시만 기다려주세요!`
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3단계: 게임 실행
    const result = await playGame(ctx.from.id, betType, betAmount);

    // 4단계: 결과 공개 (주사위 하나씩)
    await ctx.editMessageText(
      `🎲 결과 공개!\n\n` + `주사위: ${result.result.dice[0]} - ? - ?\n\n` + `두근두근...`
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    await ctx.editMessageText(
      `🎲 결과 공개!\n\n` +
        `주사위: ${result.result.dice[0]} - ${result.result.dice[1]} - ?\n\n` +
        `마지막 주사위...!`
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    // 최종 잔액 조회
    const { getUser } = await import('../../services/user.service');
    const user = await getUser(ctx.from.id);
    const currentBalance = user?.points || 0;

    // 5단계: 최종 결과
    const emoji = result.won ? '🎉' : '😢';
    const resultText = result.won ? '🎊 축하합니다! 당첨!' : '😢 아쉽지만 낙첨...';

    await ctx.editMessageText(
      `${emoji} ${resultText}\n\n` +
        `👤 ${username}\n` +
        `🎲 주사위: ${result.result.dice.join(' - ')} (합: ${result.result.sum})\n` +
        `📊 배팅: ${BET_TYPE_KOREAN[betType]} (${betAmount}P)\n` +
        `${result.won ? `💰 당첨금: ${result.payout}P\n💵 잔액: ${currentBalance}P` : `❌ 낙첨\n💵 잔액: ${currentBalance}P`}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 다시 하기', callback_data: 'play_sicbo' }],
            [{ text: '🏠 메인 메뉴', callback_data: 'back_to_menu' }],
          ],
        },
      }
    );
  } catch (error: any) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
}