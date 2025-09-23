import { prisma } from '../config/database';
import { config } from '../config/env';
import { playSicBo, BetType } from '../game/sicbo';

export async function playGame(
  telegramId: number,
  betType: BetType,
  betAmount: number
) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('회원 정보 없음');
  }

  if (betAmount > config.game.maxBet) {
    throw new Error(`최대 배팅 금액은 ${config.game.maxBet}P입니다`);
  }

  if (user.points < betAmount) {
    throw new Error('포인트 부족');
  }

  if (user.points >= config.game.maxPoints) {
    throw new Error(`최대 포인트 ${config.game.maxPoints}P 달성! 쿠폰 전환 후 게임 가능합니다.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { points: { decrement: betAmount } },
  });

  const gameResult = playSicBo(betType, betAmount, user.isVIP);

  if (gameResult.won) {
    const newPoints = user.points - betAmount + gameResult.payout;
    const finalPoints = Math.min(newPoints, config.game.maxPoints);
    const actualPayout = finalPoints - (user.points - betAmount);

    await prisma.user.update({
      where: { id: user.id },
      data: { points: finalPoints },
    });

    gameResult.payout = actualPayout;
  }

  await prisma.gameHistory.create({
    data: {
      userId: user.id,
      gameType: 'sicbo',
      betType,
      betAmount,
      result: gameResult.won ? 'win' : 'lose',
      payout: gameResult.payout,
      dice: JSON.stringify(gameResult.result.dice),
    },
  });

  return gameResult;
}