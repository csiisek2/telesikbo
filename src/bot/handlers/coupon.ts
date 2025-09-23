import { CallbackQueryContext, CommandContext, Context } from 'grammy';
import {
  convertPointsToCoupon,
  getUserCoupons,
  getAllCoupons,
  useCoupon,
} from '../../services/coupon.service';
import { getUser } from '../../services/user.service';

export async function convertToCouponHandler(ctx: CallbackQueryContext<Context>) {
  try {
    const result = await convertPointsToCoupon(ctx.from.id);

    await ctx.answerCallbackQuery({
      text: '✅ 쿠폰 발급 완료!',
    });

    await ctx.editMessageText(
      `🎫 쿠폰 발급 완료!\n\n` +
        `쿠폰 코드: \`${result.code}\`\n` +
        `쿠폰 금액: ${result.value}P\n\n` +
        `쿠폰은 /쿠폰 명령어로 확인할 수 있습니다.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
}

export async function myCouponsCommand(ctx: CommandContext<Context>) {
  try {
    const coupons = await getUserCoupons(ctx.from!.id);

    if (coupons.length === 0) {
      await ctx.reply('보유한 쿠폰이 없습니다.');
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

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    await ctx.reply(error.message);
  }
}

export async function adminCouponsCommand(ctx: CommandContext<Context>) {
  try {
    const user = await getUser(ctx.from!.id);

    if (!user?.isAdmin) {
      await ctx.reply('❌ 관리자 권한이 없습니다.');
      return;
    }

    const coupons = await getAllCoupons();

    if (coupons.length === 0) {
      await ctx.reply('발급된 쿠폰이 없습니다.');
      return;
    }

    let message = '🎫 전체 쿠폰 내역\n\n';

    const activeCoupons = coupons.filter((c) => c.status === 'active');
    const usedCoupons = coupons.filter((c) => c.status === 'used');

    message += `✅ 사용 가능: ${activeCoupons.length}개\n`;
    message += `❌ 사용 완료: ${usedCoupons.length}개\n\n`;

    message += '최근 쿠폰 목록:\n';
    coupons.slice(0, 10).forEach((c) => {
      const status = c.status === 'active' ? '✅' : '❌';
      message += `${status} \`${c.code}\` - @${c.user.username || c.user.telegramId} (${c.value}P)\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🔄 새로고침', callback_data: 'admin_refresh_coupons' }]],
      },
    });
  } catch (error: any) {
    await ctx.reply(error.message);
  }
}

export async function adminUseCouponCommand(ctx: CommandContext<Context>) {
  try {
    const user = await getUser(ctx.from!.id);

    if (!user?.isAdmin) {
      await ctx.reply('❌ 관리자 권한이 없습니다.');
      return;
    }

    const couponCode = ctx.match?.trim();

    if (!couponCode) {
      await ctx.reply('사용법: /사용 <쿠폰코드>\n예: /사용 ABC12345');
      return;
    }

    const coupon = await useCoupon(couponCode);

    await ctx.reply(
      `✅ 쿠폰 사용 처리 완료\n\n` +
        `쿠폰 코드: \`${coupon.code}\`\n` +
        `금액: ${coupon.value}P\n` +
        `처리 시간: ${coupon.usedAt?.toLocaleString()}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}`);
  }
}