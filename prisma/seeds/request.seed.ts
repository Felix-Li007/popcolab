import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RequestStatus, type Prisma } from '@/libs/prisma/client';
import { Pool } from 'pg';

type RequestPreferenceSeed = {
  dimensionKey: string;
  desiredScore: number;
  weightRate: number;
};

type RequestSeed = {
  objective_category: string;
  request_status: RequestStatus;
  budget_min: string;
  budget_max: string;
  delivery_method: string;
  duration_max: number;
  expires_in_hours: number;
  preferences: RequestPreferenceSeed[];
};

const requestSeedRows: RequestSeed[] = [
  {
    objective_category: 'Team Bonding',
    request_status: RequestStatus.opened,
    budget_min: '1000',
    budget_max: '2500',
    delivery_method: 'onsite',
    duration_max: 90,
    expires_in_hours: 72,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 4, weightRate: 5 },
      { dimensionKey: 'team_readiness', desiredScore: 3, weightRate: 4 },
      { dimensionKey: 'debrief_importance', desiredScore: 4, weightRate: 3 },
    ],
  },
  {
    objective_category: 'Team Building',
    request_status: RequestStatus.pending,
    budget_min: '500',
    budget_max: '1500',
    delivery_method: 'virtual',
    duration_max: 60,
    expires_in_hours: 48,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 3, weightRate: 3 },
      { dimensionKey: 'team_readiness', desiredScore: 4, weightRate: 5 },
      { dimensionKey: 'debrief_importance', desiredScore: 2, weightRate: 2 },
    ],
  },
  {
    objective_category: 'Team Development',
    request_status: RequestStatus.closed,
    budget_min: '2500',
    budget_max: '5000',
    delivery_method: 'hybrid',
    duration_max: 120,
    expires_in_hours: -24,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 5, weightRate: 4 },
      { dimensionKey: 'team_readiness', desiredScore: 5, weightRate: 5 },
      { dimensionKey: 'debrief_importance', desiredScore: 5, weightRate: 4 },
    ],
  },
];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function resolveRequestSeedUserId(
  prisma: PrismaClient
): Promise<number | null> {
  const preferredIdRaw = process.env.REQUEST_SEED_USER_ID?.trim();
  if (preferredIdRaw) {
    const preferredId = Number.parseInt(preferredIdRaw, 10);
    if (Number.isInteger(preferredId) && preferredId > 0) {
      return preferredId;
    }

    throw new Error(
      `Invalid REQUEST_SEED_USER_ID=${preferredIdRaw}. Expected a positive integer.`
    );
  }

  const preferredEmail = process.env.REQUEST_SEED_USER_EMAIL?.trim();
  if (preferredEmail) {
    const user = await prisma.user.findUnique({
      where: { email: preferredEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error(
        `No user found for REQUEST_SEED_USER_EMAIL=${preferredEmail}`
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
      '⚠️  Skipping request seed because no users exist. Set REQUEST_SEED_USER_ID or REQUEST_SEED_USER_EMAIL after a user is available.'
    );
    return null;
  }

  console.log(`Using request seed user ${firstUser.email} (#${firstUser.id})`);
  return firstUser.id;
}

async function resolveDimensionIdByKey(
  prisma: PrismaClient,
  keys: string[]
): Promise<Map<string, number>> {
  const rows = await prisma.dimensionIndex.findMany({
    where: {
      index_key: {
        in: keys,
      },
    },
    select: {
      id: true,
      index_key: true,
    },
  });

  const idByKey = new Map<string, number>();
  for (const row of rows) {
    if (row.index_key) {
      idByKey.set(row.index_key, row.id);
    }
  }

  const missingKeys = keys.filter(key => !idByKey.has(key));
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing dimension indexes for request seed: ${missingKeys.join(', ')}`
    );
  }

  return idByKey;
}

async function upsertRequest(
  prisma: PrismaClient,
  userId: number,
  row: RequestSeed
): Promise<{ id: number }> {
  const requestData: Prisma.RequestUncheckedCreateInput = {
    user_id: userId,
    objective_category: row.objective_category,
    request_status: row.request_status,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    delivery_method: row.delivery_method,
    duration_max: row.duration_max,
    expired_at: addHours(new Date(), row.expires_in_hours),
  };

  const existing = await prisma.request.findFirst({
    where: {
      user_id: userId,
      objective_category: row.objective_category,
      request_status: row.request_status,
      budget_min: row.budget_min,
      budget_max: row.budget_max,
      delivery_method: row.delivery_method,
      duration_max: row.duration_max,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.request.update({
      where: { id: existing.id },
      data: requestData,
      select: { id: true },
    });
  }

  return prisma.request.create({
    data: requestData,
    select: { id: true },
  });
}

export async function seedRequests(prisma: PrismaClient): Promise<void> {
  const userId = await resolveRequestSeedUserId(prisma);
  if (!userId) return;

  const preferenceKeys = Array.from(
    new Set(
      requestSeedRows.flatMap(row =>
        row.preferences.map(preference => preference.dimensionKey)
      )
    )
  );
  const dimensionIdByKey = await resolveDimensionIdByKey(
    prisma,
    preferenceKeys
  );

  for (const row of requestSeedRows) {
    const request = await upsertRequest(prisma, userId, row);

    await prisma.requestPreference.deleteMany({
      where: { request_id: request.id },
    });

    if (row.preferences.length > 0) {
      await prisma.requestPreference.createMany({
        data: row.preferences.map(preference => ({
          request_id: request.id,
          dimension_id: dimensionIdByKey.get(preference.dimensionKey) as number,
          desired_score: preference.desiredScore,
          weight_rate: preference.weightRate,
        })),
      });
    }

    console.log(
      `Created/updated request: ${row.objective_category} (${row.delivery_method})`
    );
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed requests.');
  }

  const adapter = new PrismaPg(
    new Pool({
      connectionString,
      max: 1,
    })
  );
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Seeding requests...');
    await seedRequests(prisma);
    console.log('✅ Requests seeded');
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    console.error('❌ Error seeding requests:', error);
    process.exit(1);
  });
}
