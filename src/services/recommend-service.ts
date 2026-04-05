import { prisma } from '@/libs/prisma-client';
import type {
  Experience,
  ExperienceDimension,
  Prisma,
  UserExperience,
} from '@/libs/prisma/client';
import { ConstraintMode } from '@/libs/prisma/client';
import * as preferenceService from '@/services/preference-service';
import { logger } from '@/utils/logging-util';
import {
  calculateCosineSimilarity,
  createExperienceVector,
  extractPreferenceVector,
  calculateMultiFactorSimilarity as computeExperienceSimilarity,
  buildRequestVector as createRequestVector,
  resolveSharedRequestExperienceDimensionIds,
  normalizePreferenceValue,
  parseDimensionValues,
} from './vector-service';

const SIMILARITY_WEIGHT = 0.85;
const POPULARITY_WEIGHT = 0.15;
const COMPLETED_PROCESS_STATUS = 'COMPLETED' as const;
const DEFAULT_RECOMMENDATION_REASON = 'Recommended based on your interests';
const VERY_SIMILAR_RECOMMENDATION_REASON =
  'Very similar to experiences you like';
const SIMILAR_RECOMMENDATION_REASON = 'Similar to experiences you like';
const POPULAR_RECOMMENDATION_REASON = 'Popular experience';
const POPULAR_EXPERIENCES_REASON = 'Popular experience';
const SIMILAR_EXPERIENCE_REASON = 'Similar experience';

export interface RecommendedResult {
  experience: Experience;
  score: number;
  reason: string;
  recommendationSource: 'popular' | 'history' | 'request';
  breakdown?: {
    baseScore?: number;
    objectiveBoost?: number;
    debriefBoost?: number;
    opennessBoost?: number;
    popularityScore?: number;
  };
}

type RecommendationSource = RecommendedResult['recommendationSource'];

type RequestWithPreferences = Prisma.RequestGetPayload<{
  include: {
    request_preferences: { include: { dimension_index: true } };
  };
}>;

type ExperienceWithDimensions = Prisma.ExperienceGetPayload<{
  include: {
    experience_dimensions: { include: { dimension_index: true } };
  };
}>;

/**
 * Compute fractional overlap between two sets.
 * Returns fraction of items in `boostSet` that appear in `expSet`.
 */
export function computeOverlap(
  boostSet: Set<string>,
  experienceSet: Set<string>
): number {
  if (!boostSet || boostSet.size === 0) return 0;
  let count = 0;
  for (const b of boostSet) if (experienceSet.has(b)) count++;
  return count / boostSet.size;
}

/**
 * Apply HARD constraint filtering for a request over a list of experiences.
 * Returns the filtered array of experiences that satisfy all hard constraints.
 */
function applyHardFilter(
  request: RequestWithPreferences | null,
  experiences: ExperienceWithDimensions[]
): ExperienceWithDimensions[] {
  if (!request || request.constraint_mode !== ConstraintMode.HARD) {
    return experiences;
  }

  const requestPreferences = request.request_preferences || [];
  const hardKeys = new Set([
    'accessibility',
    'alcohol',
    'quiet',
    'policy_constraints_hard',
  ]);

  return experiences.filter(experience => {
    // 1) delivery_method
    if (request.delivery_method) {
      const experienceMethods = parseDimensionValues(
        experience.delivery_methods || ''
      );
      if (!experienceMethods.includes(request.delivery_method)) return false;
    }

    // 2) duration
    if (request.duration_max) {
      const averageDuration =
        (experience.duration_min + experience.duration_max) / 2;
      if (averageDuration > request.duration_max) return false;
    }

    // 3) capacity
    const capacityLimit = request.capacity_max ?? null;
    if (
      capacityLimit !== null &&
      capacityLimit !== undefined &&
      capacityLimit >= 0
    ) {
      if (experience.capacity_max < capacityLimit) return false;
    }

    // 4) hard dimension matches
    for (const requestPreference of requestPreferences) {
      const dimensionIndex = requestPreference.dimension_index;
      if (!dimensionIndex) continue;
      if (!hardKeys.has(String(dimensionIndex.index_key))) continue;

      const requestValue = normalizePreferenceValue(
        requestPreference.desired_value,
        dimensionIndex
      );

      const experienceDimension = (experience.experience_dimensions || []).find(
        dimension => dimension.dimension_id === dimensionIndex.id
      );
      if (!experienceDimension) return false;

      const experienceValue = normalizePreferenceValue(
        experienceDimension.expected_value,
        experienceDimension.dimension_index
      );
      if (experienceValue < requestValue) return false;
    }

    return true;
  });
}

/**
 * Compute objective alignment boost between a request and an experience.
 * Returns a value in [0, 0.2] (already capped).
 */
async function computeObjectiveBoost(
  requestId: number | null,
  experience: Experience & { experience_dimensions?: ExperienceDimension[] },
  userIds: number[] = []
): Promise<number> {
  // Use shared parser from vector-service: `parseDimensionValues(raw?, dimension?)`

  // Query request_preferences for objective-related entries
  const requestObjectives = new Set<string>();
  const requestPlayTypes = new Set<string>();

  if (requestId) {
    // Only query the request preferences for the objective_support dimension
    const requestPreference = await prisma.requestPreference.findFirst({
      where: {
        request_id: requestId,
        dimension_index: { index_key: 'objective_support' },
      },
      include: { dimension_index: true },
    });

    if (requestPreference) {
      const dimensionValues = parseDimensionValues(
        requestPreference.desired_value
      );
      if (dimensionValues && dimensionValues.length > 0) {
        dimensionValues.forEach(dimensionValue =>
          requestObjectives.add(dimensionValue)
        );
      }
    }
  }

  // Read play types from invited users' preferences (user_preference table)
  if (userIds && userIds.length > 0) {
    const userPreferences = await prisma.userPreference.findMany({
      where: {
        user_id: { in: userIds },
        dimension_index: { index_key: 'play_types' },
      },
      include: { dimension_index: true },
    });
    for (const userPreference of userPreferences) {
      const dimensionValues = parseDimensionValues(
        userPreference.desired_value
      );
      dimensionValues.forEach(dimensionValue =>
        requestPlayTypes.add(dimensionValue)
      );
    }
  }
  // Query experience_dimension for objective info
  const experienceObjectives = new Set<string>();
  const experiencePlayTypes = new Set<string>();

  // Query experience_dimension for objective_support and play_types entries
  const experienceDimensions = await prisma.experienceDimension.findMany({
    where: {
      experience_id: experience.id,
      dimension_index: {
        index_key: { in: ['objective_support', 'play_types'] },
      },
    },
    include: { dimension_index: true },
  });

  for (const experienceDimension of experienceDimensions) {
    const dimensionKeys = String(
      experienceDimension.dimension_index?.index_key || ''
    ).toLowerCase();
    const dimensionValues = parseDimensionValues(
      experienceDimension.expected_value
    );
    if (dimensionKeys.includes('objective_support'))
      dimensionValues.forEach(dimensionValue =>
        experienceObjectives.add(dimensionValue)
      );
    if (dimensionKeys.includes('play_types'))
      dimensionValues.forEach(dimensionValue =>
        experiencePlayTypes.add(dimensionValue)
      );
  }

  const objectiveOverlap = computeOverlap(
    requestObjectives,
    experienceObjectives
  );
  const playTypeOverlap = computeOverlap(requestPlayTypes, experiencePlayTypes);

  const objective_boost = objectiveOverlap + playTypeOverlap;
  return Math.min(objective_boost, 0.2);
}

/**
 * Compute debrief boost from experience dimensions.
 * Default penalty is -0.05; promote to +0.10 if max `debrief_level` >= 3.
 */
function computeDebriefBoost(experience: ExperienceWithDimensions): number {
  let debriefBoost = -0.05;
  const debriefDims = (experience.experience_dimensions || []).filter(
    ed =>
      String(ed.dimension_index?.index_key || '').toLowerCase() ===
      'debrief_level'
  );

  if (debriefDims.length === 0) {
    return debriefBoost;
  }

  let maxDl: number | null = null;
  for (const ed of debriefDims) {
    const vals = parseDimensionValues(ed.expected_value);
    for (const v of vals) {
      const n = Number.parseInt(v, 10);
      if (!Number.isNaN(n)) {
        if (maxDl === null || n > maxDl) maxDl = n;
      }
    }
  }

  if (maxDl !== null && maxDl >= 3) {
    debriefBoost = 0.1;
  }

  return debriefBoost;
}

function getNumericDimensionValue(
  experience: ExperienceWithDimensions,
  indexKey: string
): number | null {
  const normalizedKey = indexKey.toLowerCase();
  const experienceDimension = (experience.experience_dimensions || []).find(
    dimension =>
      String(dimension.dimension_index?.index_key || '').toLowerCase() ===
      normalizedKey
  );

  if (!experienceDimension) return null;

  const numeric = Number.parseFloat(
    String(experienceDimension.expected_value ?? '')
  );
  return Number.isNaN(numeric) ? null : numeric;
}

function hasAnyDimensionToken(
  experience: ExperienceWithDimensions,
  indexKeys: string[],
  targetTokens: string[]
): boolean {
  const keySet = new Set(indexKeys.map(key => key.toLowerCase()));
  const tokenSet = new Set(targetTokens.map(token => token.toLowerCase()));
  for (const dimension of experience.experience_dimensions || []) {
    const key = String(
      dimension.dimension_index?.index_key || ''
    ).toLowerCase();
    if (!keySet.has(key)) continue;
    const values = parseDimensionValues(dimension.expected_value);
    if (values.some(value => tokenSet.has(value))) {
      return true;
    }
  }
  return false;
}

async function getTeamOpenness(userIds: number[]): Promise<number | null> {
  if (!userIds || userIds.length === 0) return null;

  const opennessKeys = 'openness_level';

  const userPreferences = await prisma.userPreference.findMany({
    where: {
      user_id: { in: userIds },
      dimension_index: { index_key: opennessKeys },
    },
    include: { dimension_index: true },
  });

  const opennessValues: number[] = [];
  for (const userPreference of userPreferences) {
    const dimensionValues = parseDimensionValues(userPreference.desired_value);
    for (const dimensionValue of dimensionValues) {
      const numeric = Number.parseInt(dimensionValue, 10);
      if (!Number.isNaN(numeric)) {
        opennessValues.push(numeric);
      }
    }
  }

  if (opennessValues.length === 0) {
    return null;
  }

  return (
    opennessValues.reduce((sum, value) => sum + value, 0) /
    opennessValues.length
  );
}

async function computeOpennessBoost(
  userIds: number[],
  experience: ExperienceWithDimensions
): Promise<number> {
  const teamOpenness = await getTeamOpenness(userIds);
  if (teamOpenness === null) return 0;

  const competitionLevel = getNumericDimensionValue(
    experience,
    'competition_level'
  );
  const cognitiveLoad = getNumericDimensionValue(experience, 'cognitive_load');
  const spotlightLevel = getNumericDimensionValue(
    experience,
    'spotlight_level'
  );
  const socialIntensity = getNumericDimensionValue(
    experience,
    'social_intensity'
  );
  const energyLevel = getNumericDimensionValue(experience, 'energy_level');

  const isLowRisk =
    (competitionLevel === null || competitionLevel <= 2) &&
    (cognitiveLoad === null || cognitiveLoad <= 2) &&
    (socialIntensity === null || socialIntensity <= 2) &&
    (spotlightLevel === null || spotlightLevel <= 2);

  const hasHighEnergy = energyLevel !== null && energyLevel >= 4;

  // Low openness (1-2): prefer low-risk experiences.
  if (teamOpenness <= 2) {
    return isLowRisk ? 0.1 : -0.1;
  }

  // High openness (4-5): prefer novelty/high-energy experiences.
  if (teamOpenness >= 4) {
    return hasHighEnergy ? 0.1 : -0.1;
  }

  return 0;
}

/**
 * Build human-readable request recommendation reasons.
 */
function buildRecommendedReasons(
  baseScore: number,
  objectiveBoost: number,
  debriefBoost: number,
  opennessBoost: number
): string[] {
  const reasons: string[] = [];
  if (baseScore > 0.8) reasons.push('Very similar to request preferences');
  else if (baseScore > 0.6) reasons.push('Similar to request preferences');
  if (objectiveBoost > 0.05) reasons.push('Aligns with request objectives');
  if (opennessBoost > 0)
    reasons.push('Aligned with group openness preferences');
  if (debriefBoost > 0) reasons.push('Has debrief/report');
  if (reasons.length === 0) reasons.push(DEFAULT_RECOMMENDATION_REASON);
  return reasons;
}

/**
 * Load the user's experience history.
 *
 * The history is used as the behavioral signal for personalized ranking.
 */
async function getHistoricalExperiences(userId: number): Promise<
  (UserExperience & {
    experience: Experience & { experience_dimensions: ExperienceDimension[] };
  })[]
> {
  return prisma.userExperience.findMany({
    where: {
      user_id: userId,
      process_status: COMPLETED_PROCESS_STATUS,
    },
    include: {
      experience: {
        include: {
          experience_dimensions: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Get personalized experience recommendations for a user.
 *
 * The ranking combines two signals:
 * - similarity to the user's historical preference vector
 * - normalized popularity of the candidate experience
 */
export async function getRecommendedExperiences(
  userId: number,
  limit: number = 10,
  excludeExperienced: boolean = true
): Promise<RecommendedResult[]> {
  logger.info(
    { userId, limit, excludeExperienced },
    '[recommend-service] getRecommendedExperiences started'
  );

  // Load the user's history first. If there is no history, fall back to
  // popular experiences as a cold-start strategy.
  const historicalExperiences = await getHistoricalExperiences(userId);
  logger.debug(
    { userId, historicalCount: historicalExperiences.length },
    '[recommend-service] history loaded'
  );

  // Cold start: no history means we do not have enough signal to build a
  // preference vector, so return the popular list instead.
  if (historicalExperiences.length === 0) {
    logger.info(
      { userId, limit },
      '[recommend-service] cold start fallback to popular experiences'
    );
    return getPopularExperiences(limit);
  }

  // Load all candidate experiences. They will be filtered and ranked below.
  // Include dimension_index so createExperienceVector can normalize dimension
  // features accurately (without it, normalizeDimensionValue returns 0 for
  // every dimension and similarity scoring ignores dimension signals entirely).
  const allExperiences = await prisma.experience.findMany({
    include: {
      experience_dimensions: {
        include: { dimension_index: true },
      },
    },
  });

  // Optionally remove experiences the user has already interacted with so
  // the result list focuses on new recommendations.
  let candidateExperiences = allExperiences;
  if (excludeExperienced) {
    const experiencedRows = await prisma.userExperience.findMany({
      where: { user_id: userId },
      select: { experience_id: true },
    });
    const experiencedIds = new Set(
      experiencedRows.map(experience => experience.experience_id)
    );
    candidateExperiences = allExperiences.filter(
      experience => !experiencedIds.has(experience.id)
    );
  }
  logger.debug(
    {
      userId,
      candidateCount: candidateExperiences.length,
      excludedCount: allExperiences.length - candidateExperiences.length,
    },
    '[recommend-service] candidate experiences prepared'
  );

  // Build a preference vector from the user's history.
  // Support either named export `getHistoryPreferenceVector` or the older
  // `getLatestUserPreferenceVector` used in tests/mocks. Prefer the
  // canonical `getHistoryPreferenceVector` when available.

  const getHistoryPrefFn =
    preferenceService.getHistoryPreferenceVector ??
    preferenceService.calcualateHistoryPreference ??
    (async () => null);

  const persistedPreferenceVector = await getHistoryPrefFn(userId);
  const userPreferenceVector =
    persistedPreferenceVector ?? (await extractPreferenceVector(userId));

  logger.debug(
    {
      userId,
      preferenceSource: persistedPreferenceVector ? 'persisted' : 'extracted',
      preferenceVectorLength: userPreferenceVector.length,
    },
    '[recommend-service] preference vector ready'
  );

  if (userPreferenceVector.length === 0) {
    logger.info(
      { userId, limit },
      '[recommend-service] empty preference vector fallback to popular experiences'
    );
    return getPopularExperiences(limit);
  }

  // Score each candidate experience using similarity plus popularity.
  const scoredExperiences: Array<{
    experience: Experience;
    score: number;
    reason: string;
    recommendationSource: RecommendationSource;
  }> = [];

  for (const experience of candidateExperiences) {
    // Convert the candidate experience into the same feature space as the
    // user preference vector.
    const experienceVector = await createExperienceVector(experience);

    // Cosine similarity measures how close the candidate is to the user's
    // learned preference profile.
    const similarityScore = calculateCosineSimilarity(
      userPreferenceVector,
      experienceVector
    );

    // Normalize popularity into the 0-1 range so it can be combined with
    // similarity without dominating the final score.
    const popularityIndex = experience.popularity_index
      ? Math.log(experience.popularity_index + 1) / 10
      : 0;
    const popularityScore = Math.min(popularityIndex, 1);

    // Final score: 85% similarity + 15% popularity.
    // These weights are intentionally centralized in constants so they can
    // be tuned in one place later.
    const finalScore =
      similarityScore * SIMILARITY_WEIGHT + popularityScore * POPULARITY_WEIGHT;

    // Build a short explanation for the UI or debug output.
    let reason = DEFAULT_RECOMMENDATION_REASON;
    if (similarityScore > 0.8) reason = VERY_SIMILAR_RECOMMENDATION_REASON;
    else if (similarityScore > 0.6) reason = SIMILAR_RECOMMENDATION_REASON;
    else if (popularityScore > 0.7) reason = POPULAR_RECOMMENDATION_REASON;

    scoredExperiences.push({
      experience: experience,
      score: finalScore,
      reason,
      recommendationSource: 'history',
    });
  }

  // Sort by score in descending order and return only the requested page.
  const rankedExperiences = scoredExperiences
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  logger.info(
    {
      userId,
      limit,
      topMatches: rankedExperiences.map(item => ({
        experienceId: item.experience.id,
        experienceTitle: item.experience.experience_title,
        score: Number(item.score.toFixed(4)),
        reason: item.reason,
      })),
    },
    '[recommend-service] getRecommendedExperiences completed'
  );

  return rankedExperiences;
}

/**
 * Cold start: return popular experiences.
 */
export async function getPopularExperiences(
  limit: number = 10
): Promise<RecommendedResult[]> {
  const experiences = await prisma.experience.findMany({
    orderBy: [{ popularity_index: 'desc' }, { created_at: 'desc' }],
    take: limit,
    include: { experience_dimensions: true },
  });

  return experiences.map(exp => ({
    experience: exp,
    score: Math.min(Math.log(exp.popularity_index + 1) / 10, 1),
    reason: POPULAR_EXPERIENCES_REASON,
    recommendationSource: 'popular',
  }));
}

/**
 * Get experiences similar to a specific experience.
 */
export async function getSimilarExperiences(
  experienceId: number,
  limit: number = 5,
  excludeSelf: boolean = true
): Promise<RecommendedResult[]> {
  const targetExperience = await prisma.experience.findUnique({
    where: { id: Number(experienceId) },
    include: {
      experience_dimensions: {
        include: { dimension_index: true },
      },
    },
  });

  if (!targetExperience) {
    return [];
  }

  const allExperiences = await prisma.experience.findMany({
    include: {
      experience_dimensions: {
        include: { dimension_index: true },
      },
    },
  });

  let candidateExperiences = allExperiences;
  if (excludeSelf) {
    // Exclude the target itself so it never appears in its own similarity list.
    candidateExperiences = allExperiences.filter(
      experience => experience.id !== Number(experienceId)
    );
  }

  const scoredExperiences = candidateExperiences
    .map(experience => {
      // Reuse the multi-factor experience-to-experience similarity score.
      const similarity = computeExperienceSimilarity(
        targetExperience,
        experience
      );
      return {
        experience: experience,
        score: similarity,
        reason: SIMILAR_EXPERIENCE_REASON,
        recommendationSource: 'history' as const,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredExperiences;
}

/**
 * Get recommendation insights for the current user.
 *
 * Returns a lightweight summary of the user's historical preference pattern.
 */
export async function getRecommendationInsights(userId: number): Promise<{
  totalRecommendations: number;
  averageScore: number;
  topCategories: string[];
  topProviders: string[];
  recommendationTrends: string;
}> {
  const userHistory = await getHistoricalExperiences(userId);

  if (userHistory.length === 0) {
    return {
      totalRecommendations: 0,
      averageScore: 0,
      topCategories: [],
      topProviders: [],
      recommendationTrends:
        'New user - recommendations are based on popular experiences',
    };
  }

  // Aggregate the category and provider distribution from history.
  const categoryMap = new Map<string, number>();
  const providerMap = new Map<string, number>();

  userHistory.forEach(uh => {
    if (uh.experience?.category_id) {
      categoryMap.set(
        String(uh.experience.category_id),
        (categoryMap.get(String(uh.experience.category_id)) || 0) + 1
      );
    }
    if (uh.experience?.provider_id) {
      providerMap.set(
        String(uh.experience.provider_id),
        (providerMap.get(String(uh.experience.provider_id)) || 0) + 1
      );
    }
  });

  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);

  const topProviders = Array.from(providerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);

  return {
    totalRecommendations: userHistory.length,
    averageScore:
      userHistory.reduce(
        (sum, uh) =>
          sum + Math.log((uh.experience?.popularity_index || 0) + 1) / 10,
        0
      ) / userHistory.length,
    topCategories,
    topProviders,
    // This string is intended for a quick human-readable summary in the UI.
    recommendationTrends:
      topCategories.length === 0
        ? 'The user is interested in multiple categories'
        : `The user is interested in multiple categories, including ${topCategories.join(', ')}`,
  };
}

/**
 * Recommend experiences for a given `requestId` using the request's
 * explicit preferences and the invited users' aggregated personalities.
 */
export async function getRequestExperiences(
  requestId: number,
  userIds: number[] = [],
  limit: number = 10
): Promise<RecommendedResult[]> {
  // Load the request (if any) including its explicit preferences so we can
  // apply HARD constraint filtering before scoring.
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      request_preferences: { include: { dimension_index: true } },
    },
  });

  // Load candidate experiences with dimension info
  const allExperiences = await prisma.experience.findMany({
    include: {
      experience_dimensions: {
        include: { dimension_index: true },
      },
    },
  });

  // If request exists and is HARD, pre-filter experiences that violate
  // explicit hard constraints.
  const candidateExperiences = applyHardFilter(request, allExperiences);
  const recommendedResults: RecommendedResult[] = [];

  for (const experience of candidateExperiences) {
    const vectorDimensionIds =
      await resolveSharedRequestExperienceDimensionIds(experience);
    if (vectorDimensionIds.length === 0) {
      continue;
    }

    const requestVector = await createRequestVector(
      requestId,
      userIds,
      vectorDimensionIds
    );

    const experienceVector = await createExperienceVector(
      experience,
      vectorDimensionIds
    );
    const baseScore = calculateCosineSimilarity(
      requestVector,
      experienceVector
    );
    const objectiveBoost = await computeObjectiveBoost(
      request?.id ?? null,
      experience,
      userIds
    );

    // Final score is based on base similarity + objective boost (and debrief).
    let finalScore = baseScore + (objectiveBoost ?? 0) * 0.2;

    const debriefBoost = computeDebriefBoost(experience);
    const opennessBoost = await computeOpennessBoost(userIds, experience);

    finalScore = finalScore + debriefBoost + opennessBoost;

    const reasons = buildRecommendedReasons(
      baseScore,
      objectiveBoost ?? 0,
      debriefBoost,
      opennessBoost
    );

    recommendedResults.push({
      experience,
      score: finalScore,
      reason: reasons[0],
      recommendationSource: 'request',
      breakdown: {
        baseScore,
        objectiveBoost,
        debriefBoost,
        opennessBoost,
      },
    });
  }

  return recommendedResults.sort((a, b) => b.score - a.score).slice(0, limit);
}
