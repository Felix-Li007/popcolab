import 'dotenv/config';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@/libs/prisma/client';
import { seedExperienceCategories } from './experience-categories.seed';
import {
  EXPERIENCE_DIMENSION_COLUMN_TO_KEY,
  EXPERIENCE_DIMENSION_KEYS,
} from './experience-dimension-keys';
import { seedProviders } from './provider.seed';

type ExperienceImportRow = {
  experience_id: string;
  experience_title: string;
  category_name: string;
  provider_name: string;
  provider_type: string;
  lead_type: string;
  capacity_max: string | number | null;
  delivery_methods: string;
  duration_min: string | number | null;
  duration_max: string | number | null;
  popularity_index: string | number | null;
  take_item: string | number | null;
  travel_flying: string | null;
  dietary_considerations: string | null;
  play_natures: string | null;
  person_joker: string | number | null;
  person_kinesthete: string | number | null;
  person_explorer: string | number | null;
  person_competitor: string | number | null;
  person_director: string | number | null;
  person_collector: string | number | null;
  person_creator_artist: string | number | null;
  person_storyteller: string | number | null;
  top1: string | null;
  top2: string | null;
  top3: string | null;
  top4: string | null;
  top5: string | null;
  top6: string | null;
  play_types: string | null;
  objectives_supported: string | null;
  neurodivergent_inclusive: string | number | null;
  neurotypical_general: string | number | null;
  energy_lelve: string | number | null;
  activity_level: string | number | null;
  noise_level: string | number | null;
  cognitive_load: string | number | null;
  social_intensity: string | number | null;
  competition_level: string | number | null;
  spotlight_level: string | number | null;
  messiness_level: string | number | null;
  creative_confidence: string | number | null;
};

type DimensionEntry = {
  key: string;
  expectedValue: string;
};

const EMBEDDED_EXPERIENCE_ROWS_GZIP_BASE64 =
  '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';

function normalizeDelimitedValue(value: string): string {
  return value
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .join(';');
}

function normalizeCategoryName(value: string): string {
  return value
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
    .at(-1) as string;
}

function normalizeOptionalString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const next = String(value).trim();
  return next.length > 0 ? next : null;
}

function normalizeIntegerFlag(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const text = normalizeOptionalString(value)?.toLowerCase();
  if (!text) return null;
  if (text.startsWith('yes')) return 1;
  if (text.startsWith('maybe')) return 1;
  if (text.startsWith('depends')) return 1;
  if (text.startsWith('no')) return 0;
  if (text.startsWith('n/a')) return 0;
  return null;
}

function normalizeIntegerValue(
  value: string | number | null | undefined,
  fallback = 0
) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const text = normalizeOptionalString(value);
  if (!text) return fallback;

  const normalized = text.replace(/,/g, '');
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function buildDimensionEntries(row: ExperienceImportRow): DimensionEntry[] {
  const entries: DimensionEntry[] = [];

  for (const [column, key] of Object.entries(
    EXPERIENCE_DIMENSION_COLUMN_TO_KEY
  )) {
    const raw = row[column as keyof ExperienceImportRow];
    const normalized = normalizeOptionalString(raw);
    if (!normalized) continue;

    entries.push({
      key,
      expectedValue:
        column === 'play_natures' ||
        column === 'play_types' ||
        column === 'objectives_supported' ||
        column === 'delivery_methods'
          ? normalizeDelimitedValue(normalized)
          : normalized,
    });
  }

  return entries;
}

function loadEmbeddedExperienceRows(): ExperienceImportRow[] {
  return JSON.parse(
    gunzipSync(
      Buffer.from(EMBEDDED_EXPERIENCE_ROWS_GZIP_BASE64, 'base64')
    ).toString('utf8')
  ) as ExperienceImportRow[];
}

async function resolveCreatedByUserId(prisma: PrismaClient): Promise<number> {
  const preferredIdRaw = process.env.EXPERIENCE_CREATED_BY_ID?.trim();
  if (preferredIdRaw) {
    const preferredId = Number.parseInt(preferredIdRaw, 10);
    if (Number.isInteger(preferredId) && preferredId >= 0) {
      return preferredId;
    }

    throw new Error(
      `Invalid EXPERIENCE_CREATED_BY_ID=${preferredIdRaw}. Expected a non-negative integer.`
    );
  }

  const preferredEmail = process.env.EXPERIENCE_CREATED_BY_EMAIL?.trim();

  if (preferredEmail) {
    const user = await prisma.user.findUnique({
      where: { email: preferredEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error(
        `No user found for EXPERIENCE_CREATED_BY_EMAIL=${preferredEmail}`
      );
    }

    return user.id;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, email: true },
  });

  if (!firstUser) {
    console.warn(
      'No users found. Falling back to created_by=0 for seeded experiences.'
    );
    return 0;
  }

  console.log(`Using created_by user ${firstUser.email} (#${firstUser.id})`);
  return firstUser.id;
}

export async function seedExperiencesFromWorkbook(
  prisma: PrismaClient
): Promise<void> {
  const rows = loadEmbeddedExperienceRows();

  await seedProviders(prisma);
  await seedExperienceCategories(prisma);

  const createdById = await resolveCreatedByUserId(prisma);

  const providerRows = await prisma.provider.findMany({
    select: {
      id: true,
      provider_type: true,
    },
  });
  const categoryRows = await prisma.category.findMany({
    select: {
      id: true,
      category_title: true,
    },
  });
  const dimensionRows = await prisma.dimensionIndex.findMany({
    where: {
      index_key: {
        in: EXPERIENCE_DIMENSION_KEYS,
      },
    },
    select: {
      id: true,
      index_key: true,
    },
  });

  const providerIdByType = new Map(
    providerRows.map(row => [row.provider_type, row.id])
  );
  const categoryIdByTitle = new Map(
    categoryRows.map(row => [row.category_title, row.id])
  );
  const dimensionIdByKey = new Map(
    dimensionRows
      .filter(
        (
          row
        ): row is {
          id: number;
          index_key: string;
        } => Boolean(row.index_key)
      )
      .map(row => [row.index_key, row.id])
  );

  const missingDimensionKeys = Array.from(
    new Set(EXPERIENCE_DIMENSION_KEYS)
  ).filter(key => !dimensionIdByKey.has(key));

  if (missingDimensionKeys.length > 0) {
    throw new Error(
      `Missing dimension indexes for keys: ${missingDimensionKeys.join(', ')}`
    );
  }

  for (const row of rows) {
    const providerId = providerIdByType.get(row.provider_type);
    if (!providerId) {
      throw new Error(
        `Missing provider for type ${row.provider_type} (${row.experience_title})`
      );
    }

    const normalizedCategoryName = normalizeCategoryName(row.category_name);
    const categoryId = categoryIdByTitle.get(normalizedCategoryName);
    if (!categoryId) {
      throw new Error(
        `Missing category "${normalizedCategoryName}" for ${row.experience_title}`
      );
    }

    const experienceData = {
      provider_id: providerId,
      category_id: categoryId,
      experience_title: row.experience_title.trim(),
      experience_status: 'active' as const,
      popularity_index: normalizeIntegerValue(row.popularity_index),
      duration_min: normalizeIntegerValue(row.duration_min),
      duration_max: normalizeIntegerValue(row.duration_max),
      capacity_max: normalizeIntegerValue(row.capacity_max),
      lead_type: row.lead_type.trim(),
      delivery_methods: normalizeDelimitedValue(row.delivery_methods),
      dietary_considerations: normalizeOptionalString(
        row.dietary_considerations
      ),
      take_item: normalizeIntegerFlag(row.take_item),
      travel_flying: normalizeIntegerFlag(row.travel_flying),
      created_by: createdById,
    };

    const existing = await prisma.experience.findFirst({
      where: {
        experience_title: experienceData.experience_title,
        provider_id: providerId,
      },
      select: {
        id: true,
      },
    });

    const experience = existing
      ? await prisma.experience.update({
          where: { id: existing.id },
          data: experienceData,
          select: { id: true },
        })
      : await prisma.experience.create({
          data: experienceData,
          select: { id: true },
        });

    const dimensionEntries = buildDimensionEntries(row)
      .map(entry => ({
        experience_id: experience.id,
        dimension_id: dimensionIdByKey.get(entry.key) as number,
        expected_value: entry.expectedValue,
      }))
      .filter(entry => entry.expected_value.length > 0);

    await prisma.experienceDimension.deleteMany({
      where: {
        experience_id: experience.id,
      },
    });

    if (dimensionEntries.length > 0) {
      await prisma.experienceDimension.createMany({
        data: dimensionEntries,
      });
    }

    console.log(
      `${existing ? 'Updated' : 'Created'} experience: ${experienceData.experience_title}`
    );
  }

  console.log(`Processed ${rows.length} embedded experience rows`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed experiences.');
  }

  const adapter = new PrismaPg(
    new Pool({
      connectionString,
      max: 1,
    })
  );
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Seeding embedded experiences...');
    await seedExperiencesFromWorkbook(prisma);
    console.log('✅ Experiences seeded');
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    console.error('❌ Error seeding experiences:', error);
    process.exit(1);
  });
}
