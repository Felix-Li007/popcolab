const getCurrentDbUserIdMock = jest.fn();
const getRecommendedExperiencesMock = jest.fn();
const getPopularExperiencesMock = jest.fn();
const getSimilarExperiencesMock = jest.fn();
const getRecommendationInsightsMock = jest.fn();

async function loadRecommendActions() {
  jest.resetModules();

  jest.doMock('@/services/clerk-service', () => ({
    getCurrentDbUserId: getCurrentDbUserIdMock,
  }));

  jest.doMock('@/services/recommend-service', () => ({
    getRecommendedExperiences: getRecommendedExperiencesMock,
    getPopularExperiences: getPopularExperiencesMock,
    getSimilarExperiences: getSimilarExperiencesMock,
    getRecommendationInsights: getRecommendationInsightsMock,
  }));

  return import('@/actions/recommend-actions');
}

describe('recommend-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getCurrentDbUserIdMock.mockResolvedValue(42);

    getRecommendedExperiencesMock.mockResolvedValue([
      {
        experience: { id: 1 },
        score: 0.9,
        reason: 'Recommended based on your interests',
      },
    ]);
    getPopularExperiencesMock.mockResolvedValue([
      {
        experience: { id: 2 },
        score: 0.8,
        reason: 'Popular experience',
      },
    ]);
    getSimilarExperiencesMock.mockResolvedValue([
      {
        experience: { id: 3 },
        score: 0.7,
        reason: 'Similar experience',
      },
    ]);
    getRecommendationInsightsMock.mockResolvedValue({
      totalRecommendations: 1,
      averageScore: 0.5,
      topCategories: ['1'],
      topProviders: ['2'],
      recommendationTrends:
        'The user is interested in multiple categories, including 1, 2',
    });
  });

  test('getExperienceRecommendationsAction returns an error when the user is not signed in', async () => {
    getCurrentDbUserIdMock.mockResolvedValueOnce(null);

    const { getExperienceRecommendationsAction } = await loadRecommendActions();

    await expect(getExperienceRecommendationsAction()).resolves.toEqual({
      success: false,
      error: 'User is not signed in',
    });

    expect(getRecommendedExperiencesMock).not.toHaveBeenCalled();
  });

  test('getExperienceRecommendationsAction passes a numeric user id to the service', async () => {
    const { getExperienceRecommendationsAction } = await loadRecommendActions();

    await expect(getExperienceRecommendationsAction(5, false)).resolves.toEqual(
      {
        success: true,
        data: [
          {
            experience: { id: 1 },
            score: 0.9,
            reason: 'Recommended based on your interests',
          },
        ],
      }
    );

    expect(getRecommendedExperiencesMock).toHaveBeenCalledWith(42, 5, false);
  });

  test('getSimilarExperiencesAction converts the experience id to a number', async () => {
    const { getSimilarExperiencesAction } = await loadRecommendActions();

    await expect(getSimilarExperiencesAction('99', 3)).resolves.toEqual({
      success: true,
      data: [
        {
          experience: { id: 3 },
          score: 0.7,
          reason: 'Similar experience',
        },
      ],
    });

    expect(getSimilarExperiencesMock).toHaveBeenCalledWith(99, 3);
  });

  test('getRecommendationInsightsAction converts the current user id to a number', async () => {
    const { getRecommendationInsightsAction } = await loadRecommendActions();

    await expect(getRecommendationInsightsAction()).resolves.toEqual({
      success: true,
      data: {
        totalRecommendations: 1,
        averageScore: 0.5,
        topCategories: ['1'],
        topProviders: ['2'],
        recommendationTrends:
          'The user is interested in multiple categories, including 1, 2',
      },
    });

    expect(getRecommendationInsightsMock).toHaveBeenCalledWith(42);
  });
});
