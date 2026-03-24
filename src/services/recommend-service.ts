import { prisma } from '@/libs/prisma-client';
import type {
  Experience,
  ExperienceDimension,
  UserExperience,
} from '@/libs/prisma/client';
import {
  calculateCosineSimilarity,
  createExperienceVector,
  extractPreferenceVector,
  calculateMultiFactorSimilarity as computeExperienceSimilarity,
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

export interface RecommendationResult {
  experience: Experience;
  score: number;
  reason: string;
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
): Promise<RecommendationResult[]> {
  // Load the user's history first. If there is no history, fall back to
  // popular experiences as a cold-start strategy.
  const historicalExperiences = await getHistoricalExperiences(userId);

  // Cold start: no history means we do not have enough signal to build a
  // preference vector, so return the popular list instead.
  if (historicalExperiences.length === 0) {
    return getPopularExperiences(limit);
  }

  // Load all candidate experiences. They will be filtered and ranked below.
  const allExperiences = await prisma.experience.findMany({
    include: { experience_dimensions: true },
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

  // Build a preference vector from the user's history.
  const userPreferenceVector = await extractPreferenceVector(userId);

  // Score each candidate experience using similarity plus popularity.
  const scoredExperiences: Array<{
    experience: Experience;
    score: number;
    reason: string;
  }> = [];

  for (const experience of candidateExperiences) {
    // Convert the candidate experience into the same feature space as the
    // user preference vector.
    const experienceVector = createExperienceVector(experience);

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
    });
  }

  // Sort by score in descending order and return only the requested page.
  return scoredExperiences.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Cold start: return popular experiences.
 */
export async function getPopularExperiences(
  limit: number = 10
): Promise<RecommendationResult[]> {
  const experiences = await prisma.experience.findMany({
    orderBy: [{ popularity_index: 'desc' }, { created_at: 'desc' }],
    take: limit,
    include: { experience_dimensions: true },
  });

  return experiences.map(exp => ({
    experience: exp,
    score: Math.min(Math.log(exp.popularity_index + 1) / 10, 1),
    reason: POPULAR_EXPERIENCES_REASON,
  }));
}

/**
 * Get experiences similar to a specific experience.
 */
export async function getSimilarExperiences(
  experienceId: number,
  limit: number = 5,
  excludeSelf: boolean = true
): Promise<RecommendationResult[]> {
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
