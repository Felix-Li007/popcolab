'use server';

import {
  getRecommendedExperiences,
  getPopularExperiences,
  getSimilarExperiences,
  getRecommendationInsights,
  RecommendationResult,
} from '@/services/recommend-service';
import { getCurrentDbUserId } from '@/services/clerk-service';

export interface RecommendationResponse {
  success: boolean;
  data?: RecommendationResult[];
  error?: string;
}

export interface InsightsResponse {
  success: boolean;
  data?: {
    totalRecommendations: number;
    averageScore: number;
    topCategories: string[];
    topProviders: string[];
    recommendationTrends: string;
  };
  error?: string;
}

/**
 * Get personalized experience recommendations for the current user.
 */
export async function getExperienceRecommendationsAction(
  limit: number = 10,
  excludeExperienced: boolean = true
): Promise<RecommendationResponse> {
  try {
    const userId = await getCurrentDbUserId();

    if (!userId) {
      return {
        success: false,
        error: 'User is not signed in',
      };
    }

    const recommendations = await getRecommendedExperiences(
      userId,
      limit,
      excludeExperienced
    );

    return {
      success: true,
      data: recommendations,
    };
  } catch (error) {
    console.error('[getExperienceRecommendationsAction] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get experience recommendations',
    };
  }
}

/**
 * Get popular experiences for cold start or homepage display.
 */
export async function getPopularExperiencesAction(
  limit: number = 10
): Promise<RecommendationResponse> {
  try {
    const popularExperiences = await getPopularExperiences(limit);

    return {
      success: true,
      data: popularExperiences,
    };
  } catch (error) {
    console.error('[getPopularExperiencesAction] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get popular experiences',
    };
  }
}

/**
 * Get experiences similar to a specific experience.
 */
export async function getSimilarExperiencesAction(
  experienceId: string,
  limit: number = 5
): Promise<RecommendationResponse> {
  try {
    if (!experienceId) {
      return {
        success: false,
        error: 'Experience ID cannot be empty',
      };
    }

    // Convert the request parameter to the numeric database ID.
    const similarExperiences = await getSimilarExperiences(
      Number(experienceId),
      limit
    );

    return {
      success: true,
      data: similarExperiences,
    };
  } catch (error) {
    console.error('[getSimilarExperiencesAction] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get similar experiences',
    };
  }
}

/**
 * Get recommendation insights for the current user.
 */
export async function getRecommendationInsightsAction(): Promise<InsightsResponse> {
  try {
    const userId = await getCurrentDbUserId();

    if (!userId) {
      return {
        success: false,
        error: 'User is not signed in',
      };
    }

    const insights = await getRecommendationInsights(userId);

    return {
      success: true,
      data: insights,
    };
  } catch (error) {
    console.error('[getRecommendationInsightsAction] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get recommendation insights',
    };
  }
}
