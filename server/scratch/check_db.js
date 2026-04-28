const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, email: true }
  });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  const rooms = await prisma.room.findMany({
    select: { id: true, title: true, hostId: true }
  });
  console.log('\n--- Rooms ---');
  console.log(JSON.stringify(rooms, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
