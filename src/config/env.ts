import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  databaseUrl: process.env.DATABASE_URL!,
  adminTelegramId: parseInt(process.env.ADMIN_TELEGRAM_ID || '0'),

  game: {
    signupBonus: parseInt(process.env.SIGNUP_BONUS || '1000'),
    attendanceReward: parseInt(process.env.ATTENDANCE_REWARD || '200'),
    gameCost: parseInt(process.env.GAME_COST || '100'),
    maxBet: parseInt(process.env.MAX_BET || '1000'),
    maxPoints: parseInt(process.env.MAX_POINTS || '20000'),
    withdrawMin: parseInt(process.env.WITHDRAW_MIN || '10000'),
  },

  winRates: {
    normal: parseFloat(process.env.NORMAL_WIN_RATE || '0.45'),
    vip: parseFloat(process.env.VIP_WIN_RATE || '0.55'),
  },
};

if (!config.botToken) {
  throw new Error('BOT_TOKEN is not defined in .env');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in .env');
}