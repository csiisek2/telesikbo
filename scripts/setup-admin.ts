import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdmin() {
  const adminTelegramId = parseInt(process.env.ADMIN_TELEGRAM_ID || '5773319399');

  console.log(`🔍 Searching for user with Telegram ID: ${adminTelegramId}`);

  const user = await prisma.user.findUnique({
    where: { telegramId: adminTelegramId },
  });

  if (!user) {
    console.log('❌ User not found. Please use /start command in the bot first.');
    return;
  }

  if (user.isAdmin) {
    console.log('✅ User is already admin');
    console.log(`   Username: ${user.username || 'N/A'}`);
    console.log(`   Telegram ID: ${user.telegramId}`);
    return;
  }

  await prisma.user.update({
    where: { telegramId: adminTelegramId },
    data: { isAdmin: true },
  });

  console.log('✅ Admin permission set successfully');
  console.log(`   Username: ${user.username || 'N/A'}`);
  console.log(`   Telegram ID: ${user.telegramId}`);
  console.log(`   isAdmin: true`);
}

setupAdmin()
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
