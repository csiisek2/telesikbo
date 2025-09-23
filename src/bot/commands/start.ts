import { CommandContext, Context } from 'grammy';
import { registerNewUser, getUser } from '../../services/user.service';
import { config } from '../../config/env';
import { getWinRate } from '../../game/sicbo';

export async function startCommand(ctx: CommandContext<Context>) {
  try {
    const telegramId = ctx.from!.id;
    console.log(`👤 User ID: ${telegramId}, Username: @${ctx.from!.username}`);

    let user = await getUser(telegramId);

  if (!user) {
    user = await registerNewUser(telegramId, ctx.from!.username);
    await ctx.reply(
      `🎉 환영합니다!\n\n` +
        `신규 가입 보너스 ${config.game.signupBonus}P 지급!\n` +
        `지금 바로 게임을 즐겨보세요!\n\n` +
        `📌 이용 안내\n` +
        `• 최대 보유 포인트: ${config.game.maxPoints}P\n` +
        `• ${config.game.maxPoints}P 달성 시 쿠폰 전환 후 게임 가능\n` +
        `• 출석체크 시 ${config.game.attendanceReward}P 지급\n` +
        `• ${config.game.withdrawMin}P 이상부터 쿠폰 전환 버튼이 생깁니다\n` +
        `• 쿠폰 사용 시 쿠폰번호 캡쳐 후 010-2472-2232로 문자 주시면 할인 예약 도와드리겠습니다`
    );
  }

  const canConvert = user.points >= config.game.withdrawMin;

  await ctx.reply(
    `🎲 식보 게임\n\n` +
      `보유 포인트: ${user.points}P / ${config.game.maxPoints}P\n` +
      `등급: ${user.isVIP ? '⭐ VIP' : '일반'}\n\n` +
      `📌 이용 안내\n` +
      `• 최대 보유 포인트: ${config.game.maxPoints}P\n` +
      `• ${config.game.maxPoints}P 달성 시 쿠폰 전환 후 게임 가능\n` +
      `• 출석체크 시 ${config.game.attendanceReward}P 지급\n` +
      `• ${config.game.withdrawMin}P 이상부터 쿠폰 전환 버튼이 생깁니다\n` +
      `• 쿠폰 사용 시 쿠폰번호 캡쳐 후 010-2472-2232로 문자 주시면 할인 예약 도와드리겠습니다`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 게임 하기', callback_data: 'play_sicbo' }],
          [
            { text: '✅ 출석체크', callback_data: 'attendance' },
            { text: '🎫 쿠폰함', callback_data: 'my_coupons' }
          ],
          [{ text: '💰 내 정보', callback_data: 'my_info' }],
          ...(canConvert ? [[{ text: '💵 쿠폰 전환', callback_data: 'convert_coupon' }]] : []),
        ],
      },
    }
  );
  } catch (error) {
    console.error('❌ Error in startCommand:', error);
    await ctx.reply('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}