import { CallbackQueryContext, Context } from 'grammy';
import { checkAttendance } from '../../services/user.service';
import { config } from '../../config/env';

export async function attendanceHandler(ctx: CallbackQueryContext<Context>) {
  try {
    const user = await checkAttendance(ctx.from.id);
    const pointsAdded = user.visitCount > 1 ? config.game.attendanceReward : 0;

    await ctx.answerCallbackQuery({
      text: pointsAdded > 0 ? `✅ 출석 완료! ${pointsAdded}P 지급` : '✅ 출석 완료!',
    });

    await ctx.editMessageText(
      `✅ 출석 성공!\n\n` +
        `방문 횟수: ${user.visitCount}회\n` +
        `보유 포인트: ${user.points}P\n\n` +
        `${pointsAdded > 0 ? `+${pointsAdded}P 지급` : '첫 가입 보너스는 이미 지급되었습니다'}`
    );
  } catch (error: any) {
    await ctx.answerCallbackQuery({
      text: error.message,
      show_alert: true,
    });
  }
}