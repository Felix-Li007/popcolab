import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/libs/prisma/client';
import { seedDimensions } from './seeds/dimension.seed';
import { seedIntakeForms } from './seeds/intake-forms.seed';
import { seedPersonalities } from './seeds/personalities.seed';
import {
  seedQuestionDimensionMappings,
  seedQuestions,
} from './seeds/questions.seed';
import { getSeedSchemaState } from './seeds/schema-state';
import { seedUsersAndTeams } from './seeds/users.seed';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  const schemaState = await getSeedSchemaState(prisma);

  await seedPersonalities(prisma);

  const questionIdByOrder = await seedQuestions(prisma, schemaState);
  const dimensionIdByKey = await seedDimensions(prisma);

  await seedQuestionDimensionMappings(
    prisma,
    questionIdByOrder,
    dimensionIdByKey
  );

  const { userIdByEmail, userCount, teamCount } = await seedUsersAndTeams(
    prisma,
    {
      hasUserStatusColumn: schemaState.hasUserStatusColumn,
      dimensionIdByKey,
    }
  );

  await seedIntakeForms(prisma, {
    ...schemaState,
    userIdByEmail,
    questionIdByOrder,
    dimensionIdByKey,
  });

  console.log(
    `✅ Created ${userCount} users, ${teamCount} teams, and related records`
  );
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
