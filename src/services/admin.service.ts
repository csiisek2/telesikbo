import { prisma } from '../config/database';

export async function addPoints(telegramId: number, points: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('회원을 찾을 수 없습니다');
  }

  return await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: points } },
  });
}

export async function removePoints(telegramId: number, points: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('회원을 찾을 수 없습니다');
  }

  if (user.points < points) {
    throw new Error('회수할 포인트가 부족합니다');
  }

  return await prisma.user.update({
    where: { id: user.id },
    data: { points: { decrement: points } },
  });
}

export async function setVIP(telegramId: number, isVIP: boolean) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('회원을 찾을 수 없습니다');
  }

  return await prisma.user.update({
    where: { id: user.id },
    data: { isVIP },
  });
}

export async function getUserByTelegramId(telegramId: number) {
  return await prisma.user.findUnique({
    where: { telegramId },
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}