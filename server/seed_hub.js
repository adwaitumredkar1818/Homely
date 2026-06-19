const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length === 0) {
    console.log('No users found to host events. Please register a user first.');
    return;
  }

  const hostId = users[0].id;

  // Clear existing to avoid duplicates if desired, or just add
  await prisma.event.createMany({
    data: [
      {
        title: 'Homely Meetup: Chai & Code',
        description: 'Casual networking for tech students. Bring your laptop!',
        location: 'Ground Floor Lounge',
        date: new Date(Date.now() + 86400000), // tomorrow
        category: 'STUDY',
        capacity: 20,
        hostId
      },
      {
        title: 'Intra-Hostel FIFA Tournament',
        description: 'Winner gets a week of free mess special coupons!',
        location: 'Games Room, Block B',
        date: new Date(Date.now() + 172800000), // day after
        category: 'SPORTS',
        capacity: 16,
        hostId
      }
    ]
  });

  await prisma.notice.createMany({
    data: [
      {
        content: 'New high-speed Wi-Fi router installed in Block A common area.',
        type: 'UPDATE',
        authorId: hostId
      },
      {
        content: 'Reminder: Water supply will be limited tomorrow between 10 AM - 12 PM for tank cleaning.',
        type: 'ALERT',
        authorId: hostId
      }
    ]
  });

  console.log('Hub seed data created successfully.');
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
