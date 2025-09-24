import { Bot } from 'grammy';
import { config } from './config/env';
import { startCommand } from './bot/commands/start';
import { attendanceHandler } from './bot/handlers/attendance';
import { playSicBoHandler, selectAmountHandler, betHandler } from './bot/handlers/game';
import { myInfoHandler } from './bot/handlers/info';
import {
  convertToCouponHandler,
  myCouponsCommand,
  adminCouponsCommand,
  adminUseCouponCommand,
} from './bot/handlers/coupon';
import { myCouponsButtonHandler, requestCouponUseHandler } from './bot/handlers/coupons-button';
import { usersCommand, givePointsCommand, takePointsCommand } from './bot/commands/admin';

const bot = new Bot(config.botToken);

bot.command('start', startCommand);
bot.command('coupon', myCouponsCommand);
bot.command('coupons', adminCouponsCommand);
bot.command('use', adminUseCouponCommand);
bot.command('users', usersCommand);
bot.command('give', givePointsCommand);
bot.command('take', takePointsCommand);

bot.callbackQuery('attendance', attendanceHandler);
bot.callbackQuery('play_sicbo', playSicBoHandler);
bot.callbackQuery('my_info', myInfoHandler);
bot.callbackQuery('convert_coupon', convertToCouponHandler);
bot.callbackQuery('my_coupons', myCouponsButtonHandler);
bot.callbackQuery('request_coupon_use', requestCouponUseHandler);
bot.callbackQuery('admin_refresh_coupons', async (ctx) => {
  await ctx.answerCallbackQuery();
  await adminCouponsCommand(ctx as any);
});
bot.callbackQuery(/amount_(\d+)/, selectAmountHandler);
bot.callbackQuery(/bet_(big|small|odd|even)_(\d+)/, betHandler);

bot.callbackQuery('back_to_menu', async (ctx) => {
  await ctx.answerCallbackQuery();
  await startCommand(ctx as any);
});

bot.catch((err) => {
  const error = err.error as any;
  if (error?.description?.includes('query is too old')) {
    console.log('⚠️  Skipping old callback query');
    return;
  }
  console.error('Error:', err);
});

async function startBot() {
  await bot.api.deleteWebhook({ drop_pending_updates: true });
  console.log('🧹 Cleared webhook and pending updates');

  bot.start({
    drop_pending_updates: true,
    onStart: async () => {
      console.log('🤖 Bot started successfully!');
      console.log('📋 Commands:');
      console.log('  /start - 시작하기');
      console.log('  /쿠폰 - 내 쿠폰 조회');
      console.log('  /관리자쿠폰 - 전체 쿠폰 조회 (관리자)');
      console.log('  /사용 <코드> - 쿠폰 사용 처리 (관리자)');

      await bot.api.setMyCommands([
        { command: 'start', description: '시작하기' },
        { command: 'coupon', description: '내 쿠폰 조회' },
      ], { scope: { type: 'all_private_chats' } });

      if (config.adminTelegramId && !isNaN(config.adminTelegramId)) {
        await bot.api.setMyCommands([
          { command: 'start', description: '시작하기' },
          { command: 'coupon', description: '내 쿠폰 조회' },
          { command: 'users', description: '회원 목록 (관리자)' },
          { command: 'coupons', description: '전체 쿠폰 조회 (관리자)' },
          { command: 'use', description: '쿠폰 사용 처리 (관리자)' },
          { command: 'give', description: '포인트 지급 (관리자)' },
          { command: 'take', description: '포인트 회수 (관리자)' },
        ], { scope: { type: 'chat', chat_id: String(config.adminTelegramId) } });
      }

      console.log('✅ Bot commands configured');
    },
  });
}

startBot();

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());