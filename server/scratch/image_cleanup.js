const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up legacy images...');
  const result = await prisma.image.updateMany({
    where: {
      url: { contains: 'unsplash.com' }
    },
    data: {
      url: ''
    }
  });
  console.log(`Updated ${result.count} images to trigger local fallback.`);
}

cleanup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
