import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@/libs/prisma/client';
import { Pool } from 'pg';
import { pathToFileURL } from 'node:url';

type CategorySeedRow = {
  id: number;
  category_title: string;
  category_notes: string | null;
  category_status: string;
  parent_id: number | null;
};

// Exported from the current production-equivalent category table on 2026-03-13.
const experienceCategoryRows: CategorySeedRow[] = [
  {
    id: 1,
    category_title: 'Create & Connect',
    category_notes: null,
    category_status: 'active',
    parent_id: null,
  },
  {
    id: 2,
    category_title: 'Make & Take',
    category_notes: null,
    category_status: 'inactive',
    parent_id: 1,
  },
  {
    id: 13,
    category_title: 'Tasting Experiences',
    category_notes: null,
    category_status: 'active',
    parent_id: 1,
  },
  {
    id: 14,
    category_title: 'Big Group Energy',
    category_notes: null,
    category_status: 'active',
    parent_id: 1,
  },
  {
    id: 15,
    category_title: 'Trivia & Games',
    category_notes: null,
    category_status: 'active',
    parent_id: 1,
  },
];

async function upsertCategoryRow(
  prisma: PrismaClient,
  row: CategorySeedRow
): Promise<void> {
  const data: Prisma.CategoryUncheckedCreateInput = {
    id: row.id,
    category_title: row.category_title,
    category_notes: row.category_notes,
    category_status: row.category_status,
    parent_id: row.parent_id,
  };

  await prisma.category.upsert({
    where: { id: row.id },
    update: {
      category_title: row.category_title,
      category_notes: row.category_notes,
      category_status: row.category_status,
      parent_id: row.parent_id,
    },
    create: data,
  });
}

export async function seedExperienceCategories(
  prisma: PrismaClient
): Promise<void> {
  for (const row of experienceCategoryRows) {
    await upsertCategoryRow(prisma, row);
    console.log(
      `${row.parent_id === null ? 'Created/updated root' : 'Created/updated child'} category: ${row.category_title}`
    );
  }

  const maxId = Math.max(...experienceCategoryRows.map(row => row.id));
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"category"', 'id'), ${maxId}, true)`
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed experience categories.');
  }

  const adapter = new PrismaPg(
    new Pool({
      connectionString,
      max: 1,
    })
  );
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Seeding experience categories...');
    await seedExperienceCategories(prisma);
    console.log('✅ Experience categories seeded');
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    console.error('❌ Error seeding experience categories:', error);
    process.exit(1);
  });
}
