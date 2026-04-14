'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/libs/prisma-client';
import { getCurrentDbUserId } from '@/services/clerk-service';
import { enqueueExperienceCreatedNotifications } from '@/services/notification-service';
import {
  getPopularExperiences,
  getRecommendedExperiences,
} from '@/services/recommend-service';
import type {
  ExperienceFormState,
  ExperienceStatus,
} from '@/types/experience-type';
import type {
  DashboardExperienceCardData,
  DashboardExperiencesResponse,
} from '@/types/experience-dashboard-type';
import {
  createExperience,
  deleteExperience,
  getExperienceById,
  updateExperience,
  validateExperienceFields,
} from '@/services/experience-service';
import {
  getNullableTrimmedFormString,
  getTrimmedFormEntryString,
  getTrimmedFormString,
} from '@/utils/form-data';

const ADMIN_PATHS = ['/admin', '/admin/experiences'];

function revalidateAdminPaths() {
  ADMIN_PATHS.forEach(path => revalidatePath(path));
}

function mapDashboardExperience(exp: {
  id: number;
  experience_title: string;
  experience_status: ExperienceStatus;
  popularity_index: number;
  provider_id: number;
  lead_type: string;
  delivery_methods: string;
  capacity_max: number;
  duration_min: number;
  duration_max: number;
  created_at: Date;
  category: { category_title: string } | null;
  experience_images: Array<{
    image_url: string;
    image_alt: string | null;
    image_notes: string | null;
    is_cover: boolean;
  }>;
  provider: {
    provider_label: string;
    provider_type: string;
  };
  experience_pricing: {
    starting_price: unknown;
    adding_price: unknown;
    starting_hour: number | null;
    pricing_model: string | null;
    pricing_notes: string | null;
  } | null;
}): DashboardExperienceCardData {
  return {
    id: exp.id,
    experienceTitle: exp.experience_title,
    categoryTitle: exp.category?.category_title ?? 'No category',
    experienceStatus: exp.experience_status,
    providerLabel: exp.provider?.provider_label ?? 'Unknown',
    providerType: exp.provider?.provider_type ?? 'UNKNOWN',
    popularityIndex: exp.popularity_index,
    leadType: exp.lead_type,
    deliveryMethods: exp.delivery_methods,
    capacityMax: exp.capacity_max,
    pricing: {
      startingPrice: exp.experience_pricing
        ? Number(exp.experience_pricing.starting_price)
        : null,
      addingPrice: exp.experience_pricing
        ? Number(exp.experience_pricing.adding_price)
        : null,
      startingHour: exp.experience_pricing?.starting_hour ?? null,
      pricingModel: exp.experience_pricing?.pricing_model ?? null,
      pricingNotes: exp.experience_pricing?.pricing_notes ?? null,
    },
    durationMin: exp.duration_min,
    durationMax: exp.duration_max,
    images: exp.experience_images.map(image => ({
      imageUrl: image.image_url,
      imageAlt: image.image_alt,
      imageNotes: image.image_notes,
      isCover: image.is_cover,
    })),
    imageUrl: exp.experience_images[0]?.image_url ?? undefined,
    imageAlt: exp.experience_images[0]?.image_alt ?? undefined,
    imageNotes: exp.experience_images[0]?.image_notes ?? undefined,
    createdAt: exp.created_at.toISOString(),
  };
}

function parseIntegerField(value: FormDataEntryValue | null): number | null {
  const text = getTrimmedFormEntryString(value);
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseExperienceForm(formData: FormData) {
  const dimensionKeys = Array.from(new Set(Array.from(formData.keys())))
    .filter(key => key.startsWith('dimension_'))
    .sort(undefined);

  const dimensionValues = dimensionKeys
    .map(key => {
      const dimensionId = Number.parseInt(key.replace('dimension_', ''), 10);
      const expectedValue = formData
        .getAll(key)
        .map(getTrimmedFormEntryString)
        .filter(Boolean)
        .join(';');

      return {
        dimensionId,
        expectedValue,
      };
    })
    .filter(
      value => Number.isInteger(value.dimensionId) && value.dimensionId > 0
    );

  return {
    experienceTitle: getTrimmedFormString(formData, 'experienceTitle'),
    experienceStatus: (getTrimmedFormString(formData, 'experienceStatus') ||
      'active') as ExperienceStatus,
    providerId: parseIntegerField(formData.get('providerId')) ?? 0,
    categoryId: parseIntegerField(formData.get('categoryId')) ?? 0,
    durationMin: parseIntegerField(formData.get('durationMin')) ?? -1,
    durationMax: parseIntegerField(formData.get('durationMax')) ?? -1,
    capacityMax: parseIntegerField(formData.get('capacityMax')) ?? -1,
    startingPrice: parseIntegerField(formData.get('startingPrice')) ?? -1,
    addingPrice: parseIntegerField(formData.get('addingPrice')) ?? -1,
    startingHour: parseIntegerField(formData.get('startingHour')),
    pricingModel: getNullableTrimmedFormString(formData, 'pricingModel'),
    pricingNotes: getNullableTrimmedFormString(formData, 'pricingNotes'),
    leadType: getTrimmedFormString(formData, 'leadType'),
    deliveryMethods: getTrimmedFormString(formData, 'deliveryMethods'),
    dietaryConsiderations: getNullableTrimmedFormString(
      formData,
      'dietaryConsiderations'
    ),
    takeItem: parseIntegerField(formData.get('takeItem')),
    travelFlying: parseIntegerField(formData.get('travelFlying')),
    dimensionValues,
  };
}

function mapExperienceError(error: unknown): ExperienceFormState['errors'] {
  if (error instanceof Error) return { _form: error.message };
  return { _form: 'Unexpected error. Please try again.' };
}

export async function createExperienceAction(
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  const parsed = parseExperienceForm(formData);
  const errors = validateExperienceFields(parsed);
  if (Object.values(errors).some(error => error !== undefined))
    return { errors };

  try {
    const experienceId = await createExperience(parsed);
    revalidateAdminPaths();
    const experience = await prisma.experience.findUnique({
      where: { id: experienceId },
      select: { id: true, experience_title: true, category_id: true },
    });
    if (experience) {
      const category = await prisma.category.findUnique({
        where: { id: experience.category_id },
        select: { category_title: true },
      });
      await enqueueExperienceCreatedNotifications({
        experienceId: experience.id,
        experienceTitle: experience.experience_title,
        experienceCategory: category?.category_title || '',
      });
    }
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapExperienceError(error) };
  }
}

export async function updateExperienceAction(
  id: number,
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  const parsed = parseExperienceForm(formData);
  const errors = validateExperienceFields(parsed);
  if (Object.values(errors).some(error => error !== undefined))
    return { errors };

  try {
    await updateExperience(id, parsed);
    revalidateAdminPaths();
    return { errors: {}, success: true };
  } catch (error) {
    return { errors: mapExperienceError(error) };
  }
}

export async function deleteExperienceAction(id: number): Promise<void> {
  await deleteExperience(id);
  revalidateAdminPaths();
}

export async function getDashboardExperiencesAction(): Promise<DashboardExperiencesResponse> {
  const userId = await getCurrentDbUserId();

  const [allExperiences, recommendedResult] = await Promise.all([
    prisma.experience.findMany({
      where: {
        provider_id: 1,
      },
      include: {
        category: true,
        provider: true,
        experience_images: {
          orderBy: [{ is_cover: 'desc' }, { created_at: 'asc' }],
        },
        experience_pricing: true,
      },
      orderBy: {
        id: 'desc',
      },
    }),
    userId
      ? getRecommendedExperiences(userId, 5, true)
      : getPopularExperiences(5),
  ]);

  const formattedExperiences = allExperiences.map(mapDashboardExperience);
  const recommendedIds = recommendedResult.map(result => result.experience.id);
  const recommendedScoreById = new Map(
    recommendedResult.map(result => [result.experience.id, result.score])
  );
  const recommendedExperienceRows = recommendedIds.length
    ? await prisma.experience.findMany({
        where: {
          id: { in: recommendedIds },
        },
        include: {
          category: true,
          provider: true,
          experience_images: {
            orderBy: [{ is_cover: 'desc' }, { created_at: 'asc' }],
          },
          experience_pricing: true,
        },
        orderBy: {
          id: 'desc',
        },
      })
    : [];
  const recommendedExperienceMap = new Map(
    recommendedExperienceRows.map(experience => [
      experience.id,
      mapDashboardExperience(experience),
    ])
  );
  const recommendedExperiences = recommendedIds
    .map(id => {
      const experience = recommendedExperienceMap.get(id);
      if (!experience) return null;

      const recommendationScore = recommendedScoreById.get(id);
      const recommendationSource = recommendedResult.find(
        result => result.experience.id === id
      )?.recommendationSource;
      return recommendationScore === undefined
        ? experience
        : {
            ...experience,
            recommendationScore,
            recommendationSource,
          };
    })
    .filter(
      (experience): experience is DashboardExperienceCardData =>
        experience !== null
    );

  return {
    personality: null,
    experiences: recommendedExperiences,
    allExperiences: formattedExperiences,
  };
}

export async function getExperienceByIdAction(id: number) {
  return getExperienceById(id);
}
