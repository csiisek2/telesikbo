import { CallbackQueryContext, Context } from 'grammy';
import { getUser } from '../../services/user.service';
import { getWinRate } from '../../game/sicbo';
import { config } from '../../config/env';

export async function myInfoHandler(ctx: CallbackQueryContext<Context>) {
  const user = await getUser(ctx.from.id);

  if (!user) {
    await ctx.answerCallbackQuery({ text: '회원 정보를 찾을 수 없습니다.', show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💰 내 정보\n\n` +
      `👤 사용자: ${user.username || '익명'}\n` +
      `💵 보유 포인트: ${user.points}P\n` +
      `📅 방문 횟수: ${user.visitCount}회\n` +
      `⭐ 등급: ${user.isVIP ? 'VIP' : '일반'}\n\n` +
      `${user.points >= config.game.withdrawMin ? '🎫 쿠폰 전환 가능' : `🔒 ${config.game.withdrawMin}P 이상부터 쿠폰 전환 가능`}`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '« 뒤로가기', callback_data: 'back_to_menu' }]],
      },
    }
  );
}