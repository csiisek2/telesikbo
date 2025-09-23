import { CommandContext, Context } from 'grammy';
import { getAllUsers, addPoints, removePoints } from '../../services/admin.service';
import { getUser } from '../../services/user.service';

export async function usersCommand(ctx: CommandContext<Context>) {
  try {
    const admin = await getUser(ctx.from!.id);

    if (!admin?.isAdmin) {
      await ctx.reply('❌ 관리자 권한이 없습니다.');
      return;
    }

    const users = await getAllUsers();

    if (users.length === 0) {
      await ctx.reply('등록된 회원이 없습니다.');
      return;
    }

    let message = '👥 전체 회원 목록\n\n';
    message += `총 ${users.length}명\n\n`;

    users.forEach((user, index) => {
      const vipBadge = user.isVIP ? '⭐' : '';
      const adminBadge = user.isAdmin ? '🔑' : '';
      message += `${index + 1}. ${vipBadge}${adminBadge} ID: ${user.telegramId}\n`;
      message += `   닉네임: ${user.username || '없음'}\n`;
      message += `   포인트: ${user.points}P\n`;
      message += `   가입: ${user.createdAt.toLocaleDateString()}\n\n`;
    });

    await ctx.reply(message);
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}`);
  }
}

export async function givePointsCommand(ctx: CommandContext<Context>) {
  try {
    const admin = await getUser(ctx.from!.id);

    if (!admin?.isAdmin) {
      await ctx.reply('❌ 관리자 권한이 없습니다.');
      return;
    }

    const args = ctx.match?.trim().split(' ');

    if (!args || args.length < 2) {
      await ctx.reply('사용법: /give <유저ID> <포인트>\n예: /give 123456789 1000');
      return;
    }

    const telegramId = parseInt(args[0]);
    const points = parseInt(args[1]);

    if (isNaN(telegramId) || isNaN(points)) {
      await ctx.reply('❌ 올바른 숫자를 입력해주세요.');
      return;
    }

    const user = await addPoints(telegramId, points);

    await ctx.reply(
      `✅ 포인트 지급 완료\n\n` +
        `회원: ${user.username || user.telegramId}\n` +
        `지급: ${points}P\n` +
        `현재 잔액: ${user.points}P`
    );
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}`);
  }
}

export async function takePointsCommand(ctx: CommandContext<Context>) {
  try {
    const admin = await getUser(ctx.from!.id);

    if (!admin?.isAdmin) {
      await ctx.reply('❌ 관리자 권한이 없습니다.');
      return;
    }

    const args = ctx.match?.trim().split(' ');

    if (!args || args.length < 2) {
      await ctx.reply('사용법: /take <유저ID> <포인트>\n예: /take 123456789 500');
      return;
    }

    const telegramId = parseInt(args[0]);
    const points = parseInt(args[1]);

    if (isNaN(telegramId) || isNaN(points)) {
      await ctx.reply('❌ 올바른 숫자를 입력해주세요.');
      return;
    }

    const user = await removePoints(telegramId, points);

    await ctx.reply(
      `✅ 포인트 회수 완료\n\n` +
        `회원: ${user.username || user.telegramId}\n` +
        `회수: ${points}P\n` +
        `현재 잔액: ${user.points}P`
    );
  } catch (error: any) {
    await ctx.reply(`❌ ${error.message}`);
  }
}