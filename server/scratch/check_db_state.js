const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const rooms = await prisma.room.count();
    const users = await prisma.user.count();
    const images = await prisma.image.count();
    console.log('Room Count:', rooms);
    console.log('User Count:', users);
    console.log('Image Count:', images);
    
    if (rooms > 0) {
      const firstRoom = await prisma.room.findFirst({ include: { images: true } });
      console.log('First Room:', JSON.stringify(firstRoom, null, 2));
    }
  } catch (e) {
    console.error('Check failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
