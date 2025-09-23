import { CallbackQueryContext, Context } from 'grammy';
import { getUserCoupons } from '../../services/coupon.service';
import { config } from '../../config/env';

export async function myCouponsButtonHandler(ctx: CallbackQueryContext<Context>) {
  try {
    const coupons = await getUserCoupons(ctx.from.id);

    if (coupons.length === 0) {
      await ctx.answerCallbackQuery({
        text: '보유한 쿠폰이 없습니다',
        show_alert: true,
      });
      return;
    }

    const activeCoupons = coupons.filter((c) => c.status === 'active');
    const usedCoupons = coupons.filter((c) => c.status === 'used');

    let message = '🎫 내 쿠폰 내역\n\n';

    if (activeCoupons.length > 0) {
      message += '✅ 사용 가능 쿠폰:\n';
      activeCoupons.forEach((c) => {
        message += `• \`${c.code}\` - ${c.value}P\n`;
      });
      message += '\n';
    }

    if (usedCoupons.length > 0) {
      message += '❌ 사용 완료:\n';
      usedCoupons.forEach((c) => {
        message += `• \`${c.code}\` - ${c.value}P (${c.usedAt?.toLocaleDateString()})\n`;
      });
    }

    const buttons = [];
    if (activeCoupons.length > 0) {
      buttons.push([{ text: '💳 쿠폰 사용 요청', callback_data: 'request_coupon_use' }]);
    }
    buttons.push([{ text: '« 뒤로가기', callback_data: 'back_to_menu' }]);

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch (error: any) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
}

export async function requestCouponUseHandler(ctx: CallbackQueryContext<Context>) {
  try {
    const coupons = await getUserCoupons(ctx.from.id);
    const activeCoupons = coupons.filter((c) => c.status === 'active');

    if (activeCoupons.length === 0) {
      await ctx.answerCallbackQuery({
        text: '사용 가능한 쿠폰이 없습니다',
        show_alert: true,
      });
      return;
    }

    const username = ctx.from.first_name || ctx.from.username || '익명';
    const userId = ctx.from.id;

    let couponList = '';
    activeCoupons.forEach((c) => {
      couponList += `• ${c.code} (${c.value}P)\n`;
    });

    const adminMessage =
      `🔔 쿠폰 사용 요청\n\n` +
      `👤 회원: ${username} (ID: ${userId})\n\n` +
      `💳 보유 쿠폰:\n${couponList}\n` +
      `관리자님, 쿠폰 사용 처리를 부탁드립니다.`;

    await ctx.api.sendMessage(config.adminTelegramId, adminMessage);

    await ctx.answerCallbackQuery({
      text: '✅ 관리자에게 쿠폰 사용 요청을 전송했습니다',
      show_alert: true,
    });

    await ctx.editMessageText(
      `📤 쿠폰 사용 요청 완료\n\n관리자가 확인 후 처리해드립니다.\n잠시만 기다려주세요!`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: '« 뒤로가기', callback_data: 'back_to_menu' }]],
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