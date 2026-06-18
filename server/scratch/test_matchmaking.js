const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMatchmaking() {
  try {
    // 1. Create/Update a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test_matcher@homely.com' },
      update: {
        bio: 'I am a morning person who loves quiet study sessions.',
        studyPreference: 'MORNING',
        socialPreference: 'INTROVERT',
        cleanlinessLevel: 5,
        isVegetarian: true,
        role: 'TENANT'
      },
      create: {
        email: 'test_matcher@homely.com',
        password: 'password123',
        name: 'Alex Matcher',
        bio: 'I am a morning person who loves quiet study sessions.',
        studyPreference: 'MORNING',
        socialPreference: 'INTROVERT',
        cleanlinessLevel: 5,
        isVegetarian: true,
        role: 'TENANT'
      }
    });

    console.log('--- Current User ---');
    console.log(testUser);

    // 2. Fetch others
    const others = await prisma.user.findMany({
      where: {
        id: { not: testUser.id },
        role: 'TENANT'
      }
    });

    console.log(`\n--- Found ${others.length} other tenants ---`);

    const matches = others.map(other => {
      let score = 0;
      if (testUser.studyPreference === other.studyPreference && testUser.studyPreference !== 'NEUTRAL') score += 30;
      else if (testUser.studyPreference === 'NEUTRAL' || other.studyPreference === 'NEUTRAL') score += 15;

      const cleanDiff = Math.abs((testUser.cleanlinessLevel || 3) - (other.cleanlinessLevel || 3));
      score += (5 - cleanDiff) * 6;

      if (testUser.socialPreference === other.socialPreference && testUser.socialPreference !== 'NEUTRAL') score += 20;
      else if (testUser.socialPreference === 'NEUTRAL' || other.socialPreference === 'NEUTRAL') score += 10;

      if (testUser.isSmoking === other.isSmoking) score += 10;
      if (testUser.isVegetarian === other.isVegetarian) score += 10;

      return {
        name: other.name,
        compatibility: Math.min(score, 100),
        study: other.studyPreference,
        clean: other.cleanlinessLevel,
        social: other.socialPreference
      };
    }).sort((a, b) => b.compatibility - a.compatibility);

    console.log('\n--- Top Matches ---');
    console.table(matches.slice(0, 5));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchmaking();
