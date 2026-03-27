const prismaMock = {
  userExperience: {
    findMany: jest.fn(),
  },
  experience: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const createExperienceVectorMock = jest.fn();
const extractPreferenceVectorMock = jest.fn();
const getLatestUserPreferenceVectorMock = jest.fn();
const calculateMultiFactorSimilarityMock = jest.fn();

function calculateCosineSimilarity(
  vector1: number[],
  vector2: number[]
): number {
  if (vector1.length !== vector2.length) {
    throw new Error('Vector length mismatch');
  }

  const dotProduct = vector1.reduce(
    (sum, value, index) => sum + value * vector2[index],
    0
  );
  const magnitude1 = Math.sqrt(
    vector1.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitude2 = Math.sqrt(
    vector2.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return (dotProduct / (magnitude1 * magnitude2) + 1) / 2;
}

async function loadRecommendService() {
  jest.resetModules();

  jest.doMock('@/libs/prisma-client', () => ({
    prisma: prismaMock,
  }));

  jest.doMock('@/services/vector-service', () => ({
    calculateCosineSimilarity: calculateCosineSimilarity,
    createExperienceVector: createExperienceVectorMock,
    extractPreferenceVector: extractPreferenceVectorMock,
    calculateMultiFactorSimilarity: calculateMultiFactorSimilarityMock,
  }));

  jest.doMock('@/services/preference-service', () => ({
    getLatestUserPreferenceVector: getLatestUserPreferenceVectorMock,
  }));

  return import('@/services/recommend-service');
}

describe('recommend-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prismaMock.userExperience.findMany.mockResolvedValue([]);
    prismaMock.experience.findMany.mockResolvedValue([]);
    prismaMock.experience.findUnique.mockResolvedValue(null);

    extractPreferenceVectorMock.mockResolvedValue([1, 0]);
    getLatestUserPreferenceVectorMock.mockResolvedValue(null);
    createExperienceVectorMock.mockImplementation(
      (experience: { id: number }) => (experience.id === 2 ? [1, 0] : [0, 1])
    );
    calculateMultiFactorSimilarityMock.mockImplementation(
      (_target: { id: number }, experience: { id: number }) =>
        experience.id === 11 ? 0.9 : 0.4
    );
  });

  test('getRecommendedExperiences falls back to popular experiences when history is empty', async () => {
    prismaMock.userExperience.findMany.mockResolvedValueOnce([]);
    prismaMock.experience.findMany.mockResolvedValueOnce([
      {
        id: 1,
        popularity_index: 9,
        experience_dimensions: [],
      },
    ]);

    const { getRecommendedExperiences } = await loadRecommendService();

    await expect(getRecommendedExperiences(42, 5)).resolves.toEqual([
      {
        experience: {
          id: 1,
          popularity_index: 9,
          experience_dimensions: [],
        },
        score: Math.min(Math.log(10) / 10, 1),
        reason: 'Popular experience',
        recommendationSource: 'popular',
      },
    ]);

    expect(prismaMock.experience.findMany).toHaveBeenCalledWith({
      orderBy: [{ popularity_index: 'desc' }, { created_at: 'desc' }],
      take: 5,
      include: { experience_dimensions: true },
    });
  });

  test('getRecommendedExperiences ranks candidates by similarity and excludes already experienced items', async () => {
    prismaMock.userExperience.findMany.mockResolvedValueOnce([
      {
        experience_id: 1,
        experience: { id: 1 },
      },
    ]);
    prismaMock.userExperience.findMany.mockResolvedValueOnce([
      {
        experience_id: 1,
      },
    ]);

    prismaMock.experience.findMany.mockResolvedValueOnce([
      {
        id: 1,
        popularity_index: 0,
        experience_dimensions: [],
      },
      {
        id: 2,
        popularity_index: 0,
        experience_dimensions: [],
      },
      {
        id: 3,
        popularity_index: 0,
        experience_dimensions: [],
      },
    ]);

    const { getRecommendedExperiences } = await loadRecommendService();

    const results = await getRecommendedExperiences(42, 10, true);

    expect(extractPreferenceVectorMock).toHaveBeenCalledWith(42);
    expect(createExperienceVectorMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.userExperience.findMany).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      {
        experience: {
          id: 2,
          popularity_index: 0,
          experience_dimensions: [],
        },
        score: 0.85,
        reason: 'Very similar to experiences you like',
        recommendationSource: 'history',
      },
      {
        experience: {
          id: 3,
          popularity_index: 0,
          experience_dimensions: [],
        },
        score: 0.425,
        reason: 'Recommended based on your interests',
        recommendationSource: 'history',
      },
    ]);
  });

  test('getSimilarExperiences sorts by multi-factor similarity and excludes the target experience', async () => {
    prismaMock.experience.findUnique.mockResolvedValueOnce({
      id: 10,
      popularity_index: 1,
      experience_dimensions: [],
    });

    prismaMock.experience.findMany.mockResolvedValueOnce([
      {
        id: 10,
        popularity_index: 1,
        experience_dimensions: [],
      },
      {
        id: 11,
        popularity_index: 1,
        experience_dimensions: [],
      },
      {
        id: 12,
        popularity_index: 1,
        experience_dimensions: [],
      },
    ]);

    const { getSimilarExperiences } = await loadRecommendService();

    await expect(getSimilarExperiences(10, 5)).resolves.toEqual([
      {
        experience: {
          id: 11,
          popularity_index: 1,
          experience_dimensions: [],
        },
        score: 0.9,
        reason: 'Similar experience',
        recommendationSource: 'history',
      },
      {
        experience: {
          id: 12,
          popularity_index: 1,
          experience_dimensions: [],
        },
        score: 0.4,
        reason: 'Similar experience',
        recommendationSource: 'history',
      },
    ]);

    expect(calculateMultiFactorSimilarityMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.experience.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      include: {
        experience_dimensions: {
          include: { dimension_index: true },
        },
      },
    });
    expect(prismaMock.experience.findMany).toHaveBeenCalledWith({
      include: {
        experience_dimensions: {
          include: { dimension_index: true },
        },
      },
    });
  });

  test('getRecommendationInsights summarizes user history', async () => {
    prismaMock.userExperience.findMany.mockResolvedValueOnce([
      {
        experience_id: 1,
        experience: {
          category_id: 1,
          provider_id: 2,
          popularity_index: 9,
        },
      },
      {
        experience_id: 2,
        experience: {
          category_id: 1,
          provider_id: 3,
          popularity_index: 4,
        },
      },
      {
        experience_id: 3,
        experience: {
          category_id: 2,
          provider_id: 2,
          popularity_index: 0,
        },
      },
    ]);

    const { getRecommendationInsights } = await loadRecommendService();

    await expect(getRecommendationInsights(42)).resolves.toEqual({
      totalRecommendations: 3,
      averageScore: (Math.log(10) / 10 + Math.log(5) / 10 + 0) / 3,
      topCategories: ['1', '2'],
      topProviders: ['2', '3'],
      recommendationTrends:
        'The user is interested in multiple categories, including 1, 2',
    });
  });
});
