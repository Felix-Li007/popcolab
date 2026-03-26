import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/libs/prisma/client';
import { seedDimensions } from './seeds/dimension.seed';
import { seedExperienceCategories } from './seeds/experience-categories.seed';
import { seedTemporaryExperienceImages } from './seeds/experience-images.seed';
import { seedExperiencesFromWorkbook } from './seeds/experiences.seed';
import { seedPersonalities } from './seeds/personalities.seed';
import { seedProviders } from './seeds/provider.seed';
import {
  seedQuestionDimensionMappings,
  seedQuestions,
} from './seeds/questions.seed';
import { seedRequests } from './seeds/request.seed';
import { getSeedSchemaState } from './seeds/schema-state';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  const schemaState = await getSeedSchemaState(prisma);

  await seedPersonalities(prisma);
  await seedProviders(prisma);
  await seedExperienceCategories(prisma);

  const questionIdByOrder = await seedQuestions(prisma, schemaState);
  const dimensionIdByKey = await seedDimensions(prisma);

  await seedQuestionDimensionMappings(
    prisma,
    questionIdByOrder,
    dimensionIdByKey
  );
  await seedExperiencesFromWorkbook(prisma);
  await seedTemporaryExperienceImages(prisma);
  await seedRequests(prisma);

  console.log('✅ Core seed data created');
  console.log('🎉 Seed completed!');
}

main()
  .catch(error => {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
