import { prisma } from '../config/database';
import { config } from '../config/env';

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function convertPointsToCoupon(telegramId: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    throw new Error('회원 정보 없음');
  }

  if (user.points < config.game.withdrawMin) {
    throw new Error(`${config.game.withdrawMin}P 이상부터 쿠폰 전환 가능합니다`);
  }

  const couponCode = generateCouponCode();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { points: { decrement: config.game.withdrawMin } },
    }),
    prisma.coupon.create({
      data: {
        userId: user.id,
        code: couponCode,
        value: config.game.withdrawMin,
        status: 'active',
      },
    }),
  ]);

  return { code: couponCode, value: config.game.withdrawMin };
}

export async function getUserCoupons(telegramId: number) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      coupons: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new Error('회원 정보 없음');
  }

  return user.coupons;
}

export async function getAllCoupons() {
  return await prisma.coupon.findMany({
    include: {
      user: {
        select: {
          telegramId: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function useCoupon(couponCode: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode },
  });

  if (!coupon) {
    throw new Error('존재하지 않는 쿠폰입니다');
  }

  if (coupon.status === 'used') {
    throw new Error('이미 사용된 쿠폰입니다');
  }

  return await prisma.coupon.update({
    where: { code: couponCode },
    data: {
      status: 'used',
      usedAt: new Date(),
    },
  });
}