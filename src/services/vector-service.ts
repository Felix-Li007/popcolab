import type { Experience, ExperienceDimension } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { DIMENSION_DATA_TYPES } from '@/types/dimension-type';

const COMPLETED_PROCESS_STATUS = 'COMPLETED' as const;

export interface FeatureVector {
  baseFeatures: number[];
  dimensionFeatures: number[];
  fullVector: number[];
}

export interface UserPreferenceVector {
  categoryScores: Record<string, number>;
  providerScores: Record<string, number>;
  durationDistribution: Record<string, number>;
  dimensionWeights: Record<string, number>;
  vector: number[];
}

/**
 * Extract feature vector with detailed dimension info
 * This version provides more accurate dimension feature extraction
 * by considering dimension data types and their actual values
 *
 * Requires ExperienceDimension to include dimension_index with:
 * - data_type: 'scale' | 'numeric' | 'multi-select' | etc.
 * - scale_min, scale_max: for scale/numeric types
 * - expected_value: dimension-specific value (can be number or semicolon-separated values)
 */
export interface ExtendedExperienceDimension extends ExperienceDimension {
  dimension_index?: {
    data_type: string;
    scale_min?: number | null;
    scale_max?: number | null;
  };
}

export type ExperienceWithDimensions = Experience & {
  experience_dimensions?: ExtendedExperienceDimension[];
};

function normalizeDimensionValue(
  experienceDimension: ExtendedExperienceDimension
): number {
  const dimension = experienceDimension.dimension_index;

  if (!dimension) {
    return 0;
  }

  const expectedValue = experienceDimension.expected_value || '0';

  if (
    dimension.data_type === DIMENSION_DATA_TYPES.SCALE ||
    dimension.data_type === DIMENSION_DATA_TYPES.NUMERIC
  ) {
    const numValue = parseInt(expectedValue, 10);
    const min = dimension.scale_min || 0;
    const max = dimension.scale_max || 10;
    return max === min ? 0.5 : (numValue - min) / (max - min);
  }

  const selectedCount = expectedValue.split(';').filter(Boolean).length;
  return Math.min(selectedCount / 5, 1);
}

export function createExperienceVector(
  experience: ExperienceWithDimensions
): number[] {
  const vector: number[] = [];

  // Normalize core experience attributes into a compact base feature block.
  // The scaling here is intentionally simple and consistent with the reference
  // implementation, so all experiences are projected into the same range.
  vector.push(experience.category_id / 100);
  vector.push(experience.provider_id / 100);
  vector.push(Math.min(experience.popularity_index / 100, 1));

  // Use the average of the minimum and maximum duration as the representative
  // duration value, then normalize it to keep the feature numerically stable.
  const avgDuration = (experience.duration_min + experience.duration_max) / 2;
  vector.push(Math.min(avgDuration / 100, 1));

  // Capacity is also normalized so large values do not dominate the vector.
  vector.push(Math.min(experience.capacity_max / 100, 1));

  // Append one dimension feature per related experience_dimension row.
  // If the dimension metadata is missing, fall back to 0 for that slot.
  for (const experienceDimension of experience.experience_dimensions || []) {
    vector.push(normalizeDimensionValue(experienceDimension));
  }

  // Apply L2 normalization so cosine similarity becomes a stable comparison.
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Build a user preference vector directly from a user ID.
 *
 * This function uses the user's historical experiences as input and aggregates
 * them into a single preference representation.
 *
 * Process:
 * 1. Load the user's most recent experiences together with their dimensions.
 * 2. Convert each experience into a vector with `createExperienceVector`.
 * 3. Average all vectors so recurring patterns get reinforced.
 * 4. Apply L2 normalization to keep the final vector suitable for cosine similarity.
 */
export async function extractPreferenceVector(
  userId: number
): Promise<number[]> {
  // Load the user's experience history in descending time order so the most
  // recent experiences are processed first.
  const userExperiences = await prisma.userExperience.findMany({
    where: {
      user_id: userId,
      process_status: COMPLETED_PROCESS_STATUS,
    },
    include: {
      experience: {
        include: {
          experience_dimensions: {
            include: {
              dimension_index: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  // Return an empty vector for cold-start users with no history.
  if (userExperiences.length === 0) {
    return [];
  }

  // Convert each historical experience into a normalized vector.
  // Null checks are kept here because `userExperiences` may contain rows
  // without a loaded `experience` relation in edge cases.
  const vectors = await Promise.all(
    userExperiences
      .filter(userExperience => userExperience.experience)
      .map(userExperience => createExperienceVector(userExperience.experience))
  );

  // If no usable vectors were produced, preserve the empty result.
  if (vectors.length === 0) {
    return [];
  }

  // Find the widest vector so we can average vectors of the same logical
  // feature space without losing trailing dimension slots.
  const maxLen = Math.max(...vectors.map(v => v.length));
  const avgVector = new Array(maxLen).fill(0);

  // Sum each position across all vectors, then divide by the number of
  // vectors to get the mean preference profile.
  for (const vector of vectors) {
    for (let i = 0; i < vector.length; i++) {
      avgVector[i] += vector[i];
    }
  }

  // Convert the averaged vector into a unit vector so magnitude does not
  // influence similarity scoring.
  const userVector = avgVector.map(value => value / vectors.length);
  const magnitude = Math.sqrt(userVector.reduce((sum, v) => sum + v * v, 0));

  return magnitude > 0 ? userVector.map(v => v / magnitude) : userVector;
}

/**
 * L2 norm normalize vector
 */
export function l2Normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Calculate cosine similarity of two vectors
 * Return range: [-1, 1], usually normalized to [0, 1]
 */
export function calculateCosineSimilarity(
  vector1: number[],
  vector2: number[]
): number {
  if (vector1.length !== vector2.length) {
    throw new Error('Vector length mismatch');
  }

  const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);

  // Since the vector is already L2 normalized, the denominator should be 1
  // But for robustness, we still calculate
  const magnitude1 = Math.sqrt(
    vector1.reduce((sum, val) => sum + val * val, 0)
  );
  const magnitude2 = Math.sqrt(
    vector2.reduce((sum, val) => sum + val * val, 0)
  );

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  const similarity = dotProduct / (magnitude1 * magnitude2);

  // Convert similarity from [-1, 1] to [0, 1]
  return (similarity + 1) / 2;
}

function calculateDurationSimilarity(
  exp1: ExperienceWithDimensions,
  exp2: ExperienceWithDimensions
): number {
  const avgDuration1 = (exp1.duration_min + exp1.duration_max) / 2;
  const avgDuration2 = (exp2.duration_min + exp2.duration_max) / 2;
  const durationDiff = Math.abs(avgDuration1 - avgDuration2);
  const maxDuration = Math.max(avgDuration1, avgDuration2);

  return maxDuration > 0 ? Math.max(0, 1 - durationDiff / maxDuration) : 0;
}

function calculateDimensionSimilarity(
  exp1: ExperienceWithDimensions,
  exp2: ExperienceWithDimensions
): number {
  if (!exp1.experience_dimensions || !exp2.experience_dimensions) {
    return 0;
  }

  const exp2DimensionValueMap = new Map(
    exp2.experience_dimensions.map(dimension => [
      dimension.dimension_id,
      normalizeDimensionValue(dimension),
    ])
  );

  let matchedDimensionCount = 0;
  let similaritySum = 0;

  for (const dimension of exp1.experience_dimensions) {
    const exp2Value = exp2DimensionValueMap.get(dimension.dimension_id);

    if (exp2Value === undefined) {
      continue;
    }

    const exp1Value = normalizeDimensionValue(dimension);
    similaritySum += 1 - Math.abs(exp1Value - exp2Value);
    matchedDimensionCount += 1;
  }

  return matchedDimensionCount > 0 ? similaritySum / matchedDimensionCount : 0;
}

/**
 * Recommend experiences based on user preference vector
 * Calculates similarity between user's preference vector and each experience
 *
 * @param userPreferenceVector - User's aggregated preference vector from historical experiences
 * @param candidateExperiences - Pool of candidate experiences to recommend from
 * @param allDimensionIds - List of all available dimension IDs for feature extraction
 * @returns Array of recommendations with similarity scores, sorted by score (descending)
 */
export interface RecommendationResult {
  experienceId: number;
  experience: ExperienceWithDimensions;
  similarityScore: number;
}

export function recommendExperiencesByUser(
  preferenceVector: UserPreferenceVector,
  candidateExperiences: Array<ExperienceWithDimensions>
): RecommendationResult[] {
  const recommendations: RecommendationResult[] = [];

  // Calculate similarity between user preference and each candidate experience
  candidateExperiences.forEach(experience => {
    // Extract feature vector from the candidate experience
    const experienceVector = createExperienceVector(experience);

    // Calculate cosine similarity between user preference and experience
    const similarityScore = calculateCosineSimilarity(
      preferenceVector.vector,
      experienceVector
    );

    recommendations.push({
      experienceId: experience.id,
      experience,
      similarityScore,
    });
  });

  // Sort by similarity score in descending order
  recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

  return recommendations;
}

/**
 * Calculate similarity between experiences (multi-factor)
 * Weights: Category 35% + Provider 20% + Duration 20% + Dimension 25%
 *
 * Note: This function is kept for reference but the primary recommendation approach
 * is based on user preference vectors instead of experience-to-experience comparison
 */
export function calculateMultiFactorSimilarity(
  exp1: ExperienceWithDimensions,
  exp2: ExperienceWithDimensions
): number {
  const weights = {
    category: 0.35,
    provider: 0.2,
    duration: 0.2,
    dimensions: 0.25,
  };

  const categoryMatch = exp1.category_id === exp2.category_id ? 1 : 0;
  const providerMatch = exp1.provider_id === exp2.provider_id ? 1 : 0;
  const durationSimilarity = calculateDurationSimilarity(exp1, exp2);
  const dimensionSimilarity = calculateDimensionSimilarity(exp1, exp2);

  return (
    categoryMatch * weights.category +
    providerMatch * weights.provider +
    durationSimilarity * weights.duration +
    dimensionSimilarity * weights.dimensions
  );
}
