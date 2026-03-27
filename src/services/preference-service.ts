import { ProcessStatus, type UserPreference } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { extractPreferenceVector } from '@/services/vector-service';

const COMPLETED_PROCESS_STATUS = ProcessStatus.COMPLETED;
const DEFAULT_SOURCE_WINDOW = 50;

type CompletedExperienceRow = {
  experience: {
    category_id: number;
    provider_id: number;
    duration_min: number;
    duration_max: number;
    experience_dimensions: Array<{
      dimension_id: number;
    }>;
  };
};

type PreferenceSnapshot = {
  category_score: Record<string, number>;
  provider_score: Record<string, number>;
  duration_range: Record<string, number>;
  dimension_weight: Record<string, number>;
  vector_embed: number[];
  source_window: number;
};

function normalizeCountMap(
  counts: Map<string, number>
): Record<string, number> {
  const total = Array.from(counts.values()).reduce(
    (sum, value) => sum + value,
    0
  );

  if (total === 0) {
    return {};
  }

  return Object.fromEntries(
    Array.from(counts.entries()).map(([key, count]) => [key, count / total])
  );
}

function bucketDuration(durationMinutes: number): string {
  if (durationMinutes < 60) return 'under_1h';
  if (durationMinutes < 120) return '1_2h';
  if (durationMinutes < 240) return '2_4h';
  return '4h_plus';
}

function buildPreferenceSnapshot(
  completedExperiences: CompletedExperienceRow[],
  vectorEmbed: number[]
): PreferenceSnapshot {
  const categoryCounts = new Map<string, number>();
  const providerCounts = new Map<string, number>();
  const durationCounts = new Map<string, number>();
  const dimensionCounts = new Map<string, number>();

  for (const row of completedExperiences) {
    const experience = row.experience;
    const avgDuration = (experience.duration_min + experience.duration_max) / 2;

    categoryCounts.set(
      String(experience.category_id),
      (categoryCounts.get(String(experience.category_id)) ?? 0) + 1
    );
    providerCounts.set(
      String(experience.provider_id),
      (providerCounts.get(String(experience.provider_id)) ?? 0) + 1
    );
    durationCounts.set(
      bucketDuration(avgDuration),
      (durationCounts.get(bucketDuration(avgDuration)) ?? 0) + 1
    );

    for (const dimension of experience.experience_dimensions) {
      const key = String(dimension.dimension_id);
      dimensionCounts.set(key, (dimensionCounts.get(key) ?? 0) + 1);
    }
  }

  return {
    category_score: normalizeCountMap(categoryCounts),
    provider_score: normalizeCountMap(providerCounts),
    duration_range: normalizeCountMap(durationCounts),
    dimension_weight: normalizeCountMap(dimensionCounts),
    vector_embed: vectorEmbed,
    source_window: completedExperiences.length,
  };
}

async function loadCompletedExperiences(
  userId: number,
  limit = DEFAULT_SOURCE_WINDOW
): Promise<CompletedExperienceRow[]> {
  return prisma.userExperience.findMany({
    where: {
      user_id: userId,
      process_status: COMPLETED_PROCESS_STATUS,
    },
    include: {
      experience: {
        select: {
          category_id: true,
          provider_id: true,
          duration_min: true,
          duration_max: true,
          experience_dimensions: {
            select: {
              dimension_id: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

export async function calcualateUserPreference(
  userId: number,
  limit = DEFAULT_SOURCE_WINDOW
): Promise<UserPreference | null> {
  const completedExperiences = await loadCompletedExperiences(userId, limit);

  if (completedExperiences.length === 0) {
    return null;
  }

  const vectorEmbed = await extractPreferenceVector(userId);
  const snapshot = buildPreferenceSnapshot(completedExperiences, vectorEmbed);

  const latestPreference = await prisma.userPreference.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  });

  if (latestPreference) {
    return prisma.userPreference.update({
      where: { id: latestPreference.id },
      data: snapshot,
    });
  }

  return prisma.userPreference.create({
    data: {
      user_id: userId,
      ...snapshot,
    },
  });
}

export async function getLatestUserPreferenceVector(
  userId: number
): Promise<number[] | null> {
  const latestPreference = await prisma.userPreference.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { vector_embed: true },
  });

  if (!latestPreference) {
    return null;
  }

  if (!Array.isArray(latestPreference.vector_embed)) {
    return null;
  }

  const vector = latestPreference.vector_embed
    .map(value => Number(value))
    .filter(value => Number.isFinite(value));

  return vector.length > 0 ? vector : null;
}

export async function refreshUserPreference(experienceId: number): Promise<{
  experienceId: number;
  userId: number;
  userPreferenceId: number | null;
  sourceWindow: number | null;
}> {
  const userExperience = await prisma.userExperience.findUnique({
    where: { id: experienceId },
    select: {
      user_id: true,
      process_status: true,
    },
  });

  if (!userExperience) {
    throw new Error(`User experience ${experienceId} not found.`);
  }

  if (userExperience.process_status !== COMPLETED_PROCESS_STATUS) {
    return {
      experienceId: experienceId,
      userId: userExperience.user_id,
      userPreferenceId: null,
      sourceWindow: null,
    };
  }

  const preference = await calcualateUserPreference(userExperience.user_id);

  return {
    experienceId: experienceId,
    userId: userExperience.user_id,
    userPreferenceId: preference?.id ?? null,
    sourceWindow: preference?.source_window ?? null,
  };
}
