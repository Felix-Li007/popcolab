import type {
  Experience,
  ExperienceDimension,
  FormName,
} from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { DIMENSION_DATA_TYPES } from '@/types/dimension-type';
import { FORM_NAME } from '@/types/question-type';

const COMPLETED_PROCESS_STATUS = 'COMPLETED' as const;

export interface FeatureVector {
  baseFeatures: number[];
  dimensionFeatures: number[];
  fullVector: number[];
}

export interface HistoryPreferenceVector {
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

let orderedDimensionIdsPromise: Promise<number[]> | null = null;

export async function getOrderedDimensionIds(
  formName?: FormName | null
): Promise<number[]> {
  // If no formName requested, use the cached global ordering
  if (!formName) {
    if (!orderedDimensionIdsPromise) {
      orderedDimensionIdsPromise = prisma.dimensionIndex
        .findMany({
          orderBy: { id: 'asc' },
          select: { id: true },
        })
        .then(rows => rows.map(row => row.id));
    }

    return orderedDimensionIdsPromise;
  }

  // For a specific form, fetch the applied dimensions in order from DimensionApply
  const applies = await prisma.dimensionApply.findMany({
    where: { form_name: formName },
    orderBy: { id: 'asc' },
    select: { dimension_id: true },
  });

  // Preserve order and dedupe
  const ids: number[] = [];
  for (const a of applies) {
    if (!ids.includes(a.dimension_id)) ids.push(a.dimension_id);
  }

  // If none found, fall back to global ordering
  if (ids.length === 0) {
    const global = await prisma.dimensionIndex.findMany({
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return global.map(r => r.id);
  }

  return ids;
}

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

export async function createExperienceVector(
  experience: ExperienceWithDimensions,
  dimensionIds?: number[] | null
): Promise<number[]> {
  // When dimensionIds is provided, build vector strictly on those ids.
  const finalOrderedDimensionIds =
    dimensionIds ?? (await getOrderedDimensionIds());

  const vector: number[] = [];

  if (!dimensionIds || dimensionIds.length === 0) {
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
  }

  const dimensionValueMap = new Map<number, number[]>();

  for (const experienceDimension of experience.experience_dimensions || []) {
    const current =
      dimensionValueMap.get(experienceDimension.dimension_id) ?? [];
    current.push(normalizeDimensionValue(experienceDimension));
    dimensionValueMap.set(experienceDimension.dimension_id, current);
  }

  // Append one slot per global dimension id so the vector lives in a stable
  // feature space across every experience.
  for (const dimensionId of finalOrderedDimensionIds) {
    const values = dimensionValueMap.get(dimensionId);
    if (!values || values.length === 0) {
      vector.push(0);
      continue;
    }

    const average =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    vector.push(average);
  }

  // Apply L2 normalization so cosine similarity becomes a stable comparison.
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Filter a list of ordered dimension ids to those that are applied to a
 * specific form. If filtering would remove all ids, return the original list
 * as a safe fallback.
 */
export async function filterDimensionIdsToForm(
  orderedIds: number[],
  formName: FormName
): Promise<number[]> {
  const targetIds = await getOrderedDimensionIds(formName);
  const set = new Set<number>(targetIds);
  const filtered = orderedIds.filter(id => set.has(id));
  return filtered.length === 0 ? orderedIds : filtered;
}

/**
 * Return a stable union of two ordered id lists: items from `a` first,
 * then items from `b` that are not in `a`, preserving `b`'s order.
 */
export function unionOrderedDimensionIds(a: number[], b: number[]): number[] {
  const set = new Set<number>(a);
  const out = [...a];
  for (const id of b) {
    if (!set.has(id)) {
      set.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Resolve the ordered dimension IDs that should be used by both
 * buildRequestVector and createExperienceVector for request matching.
 *
 * The result is the request/team comparable dimension space intersected with
 * dimensions actually present on one experience.
 */
export async function resolveSharedRequestExperienceDimensionIds(experience: {
  experience_dimensions?: Array<{ dimension_id?: number | null }>;
}): Promise<number[]> {
  const orderedRequestDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.REQUEST
  );
  const orderedMemberDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.MEMBER
  );
  const orderedAssessDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.ASSESS
  );

  const filteredAssessDimensionIds = await filterDimensionIdsToForm(
    orderedAssessDimensionIds,
    FORM_NAME.EXPERIENCE
  );
  const filteredMemberDimensionIds = await filterDimensionIdsToForm(
    orderedMemberDimensionIds,
    FORM_NAME.EXPERIENCE
  );
  const filteredRequestDimensionIds = await filterDimensionIdsToForm(
    orderedRequestDimensionIds,
    FORM_NAME.EXPERIENCE
  );

  const requestComparableDimensionIds = unionOrderedDimensionIds(
    filteredAssessDimensionIds,
    unionOrderedDimensionIds(
      filteredRequestDimensionIds,
      filteredMemberDimensionIds
    )
  );

  const experienceDimensionIdSet = new Set<number>();
  for (const dimension of experience.experience_dimensions || []) {
    if (dimension?.dimension_id) {
      experienceDimensionIdSet.add(dimension.dimension_id);
    }
  }

  return requestComparableDimensionIds.filter(dimensionId =>
    experienceDimensionIdSet.has(dimensionId)
  );
}

/**
 * Compute average preference value per-dimension for a list of invited users.
 * Returns a Map from dimension_id -> average normalized value.
 */
export async function computeTeamPreference(
  invitedUserIds: number[],
  dimensionIds: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (
    !invitedUserIds ||
    invitedUserIds.length === 0 ||
    dimensionIds.length === 0
  ) {
    for (const dimensionId of dimensionIds) result.set(dimensionId, 0);
    return result;
  }

  const userPreferences = await prisma.userPreference.findMany({
    where: {
      user_id: { in: invitedUserIds },
      dimension_id: { in: dimensionIds },
    },
    include: { dimension_index: true },
  });

  const sumAggregation = new Map<number, { sum: number; count: number }>();
  for (const userPreference of userPreferences) {
    if (!userPreference.dimension_id) continue;
    const normalizedValue = normalizePreferenceValue(
      userPreference.desired_value,
      userPreference.dimension_index ?? null
    );
    const currentAggregation = sumAggregation.get(
      userPreference.dimension_id
    ) ?? { sum: 0, count: 0 };
    currentAggregation.sum += normalizedValue;
    currentAggregation.count += 1;
    sumAggregation.set(userPreference.dimension_id, currentAggregation);
  }

  for (const dimensionId of dimensionIds) {
    const entry = sumAggregation.get(dimensionId);
    result.set(
      dimensionId,
      entry && entry.count > 0 ? entry.sum / entry.count : 0
    );
  }

  return result;
}

/**
 * Compute average preference value per-dimension for a list of invited users
 * using the `UserPersonality` table. This mirrors `computeTeamMap` but
 * reads the explicit personality snapshots rather than `user_preference`.
 */
export async function computeTeamPersonality(
  invitedUserIds: number[],
  dimensionIds: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (
    !invitedUserIds ||
    invitedUserIds.length === 0 ||
    dimensionIds.length === 0
  ) {
    for (const id of dimensionIds) result.set(id, 0);
    return result;
  }

  const prefs = await prisma.userPersonality.findMany({
    where: {
      user_id: { in: invitedUserIds },
      dimension_id: { in: dimensionIds },
    },
    include: { dimension_index: true },
  });

  const sums = new Map<number, { sum: number; count: number }>();
  for (const p of prefs) {
    if (!p.dimension_id) continue;
    const val = normalizePreferenceValue(
      p.desired_value,
      p.dimension_index ?? null
    );
    const cur = sums.get(p.dimension_id) ?? { sum: 0, count: 0 };
    cur.sum += val;
    cur.count += 1;
    sums.set(p.dimension_id, cur);
  }

  for (const id of dimensionIds) {
    const entry = sums.get(id);
    result.set(id, entry && entry.count > 0 ? entry.sum / entry.count : 0);
  }

  return result;
}

/**
 * Compute average request preference per-dimension for a given request.
 * Returns a Map from dimension_id -> average normalized value.
 */
export async function computeRequestPreference(
  requestId: number,
  dimensionIds: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (!requestId || dimensionIds.length === 0) {
    for (const id of dimensionIds) result.set(id, 0);
    return result;
  }

  const reqPrefs = await prisma.requestPreference.findMany({
    where: { request_id: requestId, dimension_id: { in: dimensionIds } },
    include: { dimension_index: true },
  });

  const agg = new Map<number, { sum: number; count: number }>();
  for (const rp of reqPrefs) {
    if (!rp.dimension_id) continue;
    const norm = normalizePreferenceValue(
      rp.desired_value,
      rp.dimension_index ?? null
    );
    const cur = agg.get(rp.dimension_id) ?? { sum: 0, count: 0 };
    cur.sum += norm;
    cur.count += 1;
    agg.set(rp.dimension_id, cur);
  }

  for (const id of dimensionIds) {
    const e = agg.get(id);
    result.set(id, e && e.count > 0 ? e.sum / e.count : 0);
  }

  return result;
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

  const orderedDimensionIds = await getOrderedDimensionIds();

  // Convert each historical experience into a normalized vector.
  // Null checks are kept here because `userExperiences` may contain rows
  // without a loaded `experience` relation in edge cases.
  const vectors = await Promise.all(
    userExperiences
      .filter(userExperience => userExperience.experience)
      .map(userExperience =>
        createExperienceVector(userExperience.experience, orderedDimensionIds)
      )
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
  preferenceVector: HistoryPreferenceVector,
  candidateExperiences: Array<ExperienceWithDimensions>
): Promise<RecommendationResult[]> {
  const recommendations: RecommendationResult[] = [];

  return getOrderedDimensionIds().then(async orderedDimensionIds => {
    // Calculate similarity between user preference and each candidate experience
    for (const experience of candidateExperiences) {
      // Extract feature vector from the candidate experience
      const experienceVector = await createExperienceVector(
        experience,
        orderedDimensionIds
      );

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
    }

    // Sort by similarity score in descending order
    recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

    return recommendations;
  });
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

/**
 * Build a request vector by combining explicit RequestPreference entries
 * and invited users' UserPreference-derived vectors.
 * - requestId: if provided, will load `request_preference` rows and base request fields
 * - invitedUserIds: list of invited users to aggregate preferences from
 * - weights: tuning for combining request vs team (defaults: request 0.6, team 0.4)
 */
/**
 * Normalize a stored preference value (string) according to a dimension definition
 */
function normalizePreferenceValue(
  desiredValue: string | null | undefined,
  dimension?: {
    data_type?: string;
    scale_min?: number | null;
    scale_max?: number | null;
  } | null
): number {
  if (!dimension || !desiredValue) return 0;

  if (
    dimension.data_type === DIMENSION_DATA_TYPES.SCALE ||
    dimension.data_type === DIMENSION_DATA_TYPES.NUMERIC
  ) {
    const num = parseFloat(String(desiredValue));
    const min = dimension.scale_min ?? 0;
    const max = dimension.scale_max ?? 10;
    if (isNaN(num)) return 0;
    return max === min
      ? 0.5
      : Math.max(0, Math.min(1, (num - min) / (max - min)));
  }

  const parts = String(desiredValue).split(';').filter(Boolean);
  return Math.min(parts.length / 5, 1);
}

export { normalizePreferenceValue };

/**
 * Parse a stored dimension value into a list of normalized tokens.
 * Behavior varies by dimension data_type:
 * - For SCALE / NUMERIC types: treat the entire raw value as a single token
 * - Otherwise: split on common separators and lowercase tokens
 */
export function parseDimensionValues(dimensionValue?: string | null): string[] {
  if (!dimensionValue) return [];

  return Array.from(
    new Set(
      String(dimensionValue)
        .split(/[\n,;|]+/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/**
 * Build a preference vector for a single user directly from `user_preference` rows.
 * Returns a full vector matching the experience vector layout: 5 base slots + ordered dimensions.
 */
export async function getUserPreferenceVector(
  userId: number
): Promise<number[]> {
  // Load user preferences with dimension info to allow proper normalization
  const userPreferences = await prisma.userPreference.findMany({
    where: { user_id: userId },
    include: { dimension_index: true },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  if (!userPreferences || userPreferences.length === 0) return [];

  const orderedMemberDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.MEMBER
  );

  // Filter MEMBER-ordered dimensions to include only those that are
  // applied to the EXPERIENCE form. This ensures user preference vectors
  // only contain dimensions that experiences also use.
  const filteredMemberDimensionIds = await filterDimensionIdsToForm(
    orderedMemberDimensionIds,
    FORM_NAME.EXPERIENCE
  );

  const aggregateSums = new Map<number, { sum: number; count: number }>();
  for (const userPreference of userPreferences) {
    // Skip preferences that do not have a dimension or whose dimension is not in the filtered list
    if (
      !userPreference.dimension_id ||
      !filteredMemberDimensionIds.includes(userPreference.dimension_id)
    )
      continue;
    const normalizedValue = normalizePreferenceValue(
      userPreference.desired_value,
      userPreference.dimension_index ?? null
    );
    const currentAggregate = aggregateSums.get(userPreference.dimension_id) ?? {
      sum: 0,
      count: 0,
    };
    currentAggregate.sum += normalizedValue;
    currentAggregate.count += 1;
    aggregateSums.set(userPreference.dimension_id, currentAggregate);
  }

  const vector: number[] = [];
  // base placeholders (category, provider, popularity, duration, capacity)
  //vector.push(0, 0, 0, 0, 0);

  for (const dimensionId of filteredMemberDimensionIds) {
    const entry = aggregateSums.get(dimensionId);
    if (!entry || entry.count === 0) {
      vector.push(0);
      continue;
    }
    vector.push(entry.sum / entry.count);
  }
  // Apply L2 normalization to the user preference vector so it can be meaningfully compared to experience vectors using cosine similarity.
  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

export async function buildRequestVector(
  requestId: number | null,
  userIds: number[] = [],
  // Optional: explicit dimension ids to use for the combined request vector.
  // When provided, these ids define the exact vector dimension slots.
  dimensionIds?: number[]
): Promise<number[]> {
  const orderedRequestDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.REQUEST
  );
  const orderedMemberDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.MEMBER
  );
  const orderedAssessDimensionIds = await getOrderedDimensionIds(
    FORM_NAME.ASSESS
  );
  const filteredAssessDimensionIds = await filterDimensionIdsToForm(
    orderedAssessDimensionIds,
    FORM_NAME.EXPERIENCE
  );
  const filteredMemberDimensionIds = await filterDimensionIdsToForm(
    orderedMemberDimensionIds,
    FORM_NAME.EXPERIENCE
  );

  const filteredRequestDimensionIds = await filterDimensionIdsToForm(
    orderedRequestDimensionIds,
    FORM_NAME.EXPERIENCE
  );

  // 1) Build team dimension slots by averaging per-user preference vectors
  const teamPreferences = await computeTeamPreference(
    userIds,
    filteredMemberDimensionIds
  );
  // 2) Build team personality slots by averaging per-user personality vectors
  const teamPersonalities = await computeTeamPersonality(
    userIds,
    filteredMemberDimensionIds
  );
  // 3) Build request dimension slots by averaging per-request preferences vectors
  const requestPreferences = requestId
    ? await computeRequestPreference(requestId, filteredRequestDimensionIds)
    : new Map<number, number>(filteredRequestDimensionIds.map(id => [id, 0]));

  // 4) Combine dimension ids from request, team preferences, and team personality
  const combinedDimensionIds = unionOrderedDimensionIds(
    filteredAssessDimensionIds,
    unionOrderedDimensionIds(
      filteredRequestDimensionIds,
      filteredMemberDimensionIds
    )
  );

  // If caller provides explicit dimension IDs, use them directly.
  const finalCombinedDimensionIds =
    dimensionIds && dimensionIds.length > 0
      ? dimensionIds
      : combinedDimensionIds;
  const hasExplicitDimensionIds =
    Array.isArray(dimensionIds) && dimensionIds.length > 0;

  const requestWeight = 0.4;
  const teamWeight = 0.6;
  const personalityWeight = 0.5; // portion of team weight allocated to personality vs preferences

  // 5) Build combined dimension values by weighted sum of request, team preferences, and team personality
  const combinedDimensionValue: number[] = [];
  for (const dimensionId of finalCombinedDimensionIds) {
    const teamPersonalityValue = teamPersonalities.get(dimensionId) ?? 0;
    const requestPreferenceValue = requestPreferences.get(dimensionId) ?? 0;
    const teamPreferenceValue = teamPreferences.get(dimensionId) ?? 0;
    combinedDimensionValue.push(
      requestWeight * requestPreferenceValue +
        teamWeight * teamPreferenceValue +
        personalityWeight * teamPersonalityValue
    );
  }

  // Keep same base-slot behavior as experience vectors.
  const base: number[] = hasExplicitDimensionIds ? [] : [0, 0, 0, 0, 0];
  const vector = [...base, ...combinedDimensionValue];

  return l2Normalize(vector);
}
