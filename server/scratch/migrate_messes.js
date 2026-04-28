const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting mess migration...');
  const rooms = await prisma.room.findMany();
  
  for (const room of rooms) {
    let messesData = [];
    try {
      messesData = JSON.parse(room.messes || '[]');
    } catch (e) {
      console.error(`Failed to parse messes for room ${room.id}`);
      continue;
    }

    if (!Array.isArray(messesData)) continue;

    for (const m of messesData) {
      // Find or Create mess globally? 
      // For now, let's create a standalone mess for each entry to preserve the specific coordinates/data
      // In a real app we might deduplicate, but here each room's "nearby mess" has specific geodata.
      
      const newMess = await prisma.mess.create({
        data: {
          name: m.name || m,
          lat: m.lat || room.lat + 0.001,
          lng: m.lng || room.lng + 0.001,
          location: room.location,
          description: `Serving nearby hostels like ${room.title}`,
          price: 3000,
          type: "BOTH",
          hostId: room.hostId,
          rooms: {
            connect: { id: room.id }
          }
        }
      });
      console.log(`Migrated mess "${newMess.name}" for room ${room.id}`);
    }
  }
  console.log('Migration complete.');
}

migrate()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
