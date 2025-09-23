import { prisma } from '../config/database';
import { config } from '../config/env';

export async function registerNewUser(telegramId: number, username?: string) {
  return await prisma.user.create({
    data: {
      telegramId,
      username,
      points: config.game.signupBonus,
      visitCount: 1,
      visits: { create: {} },
    },
  });
}

export async function checkAttendance(telegramId: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('먼저 /start를 입력해주세요!');
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
    throw new Error('오늘 이미 출석했습니다!');
  }

  const pointsToAdd = user.visitCount >= 1 ? config.game.attendanceReward : 0;
  const newPoints = Math.min(user.points + pointsToAdd, config.game.maxPoints);

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      visitCount: { increment: 1 },
      points: newPoints,
      lastVisit: new Date(),
      visits: { create: {} },
    },
  });
}

export async function getUser(telegramId: number) {
  return await prisma.user.findUnique({
    where: { telegramId },
  });
}