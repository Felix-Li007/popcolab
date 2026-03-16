import { prisma } from '@/libs/prisma-client';
import type { DimensionOption } from '@/types/dimension-type';
import type {
  Experience,
  ExperienceDimensionValue,
  ExperienceFormState,
} from '@/types/experience-type';

type UpsertExperienceInput = {
  providerId: number;
  categoryId: number;
  experienceTitle: string;
  popularityIndex: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  leadType: string;
  deliveryMethods: string;
  dietaryConsiderations: string | null;
  takeItem: number | null;
  travelFlying: number | null;
  dimensionValues: Array<{
    dimensionId: number;
    expectedValue: string;
  }>;
};

type ExperienceRow = Awaited<
  ReturnType<typeof prisma.experience.findMany>
>[number];

type ExperienceWithRelations = ExperienceRow & {
  provider: {
    provider_label: string;
    provider_type: string;
  };
  category: {
    category_title: string;
  };
  experience_dimensions: Array<{
    dimension_id: number;
    expected_value: string | null;
    dimension_index: {
      index_key: string | null;
      index_name: string;
      data_type: string;
      scale_min: number | null;
      scale_max: number | null;
      category: {
        category_name: string;
      };
    };
  }>;
  _count: {
    experience_dimensions: number;
    proposals: number;
    experience_calendars: number;
  };
};

async function getOptionsByDimensionId(): Promise<
  Map<number, DimensionOption[]>
> {
  const rows = await prisma.dimensionOption.findMany({
    orderBy: [{ dimension_id: 'asc' }, { id: 'asc' }],
  });

  const map = new Map<number, DimensionOption[]>();
  for (const row of rows) {
    const current = map.get(row.dimension_id) ?? [];
    current.push({
      id: row.id,
      label: row.option_label,
      value: row.option_value,
    });
    map.set(row.dimension_id, current);
  }

  return map;
}

async function assertExperienceRelations(
  providerId: number,
  categoryId: number,
  dimensionValues: Array<{
    dimensionId: number;
    expectedValue: string;
  }>
): Promise<void> {
  const dimensionIds = Array.from(
    new Set(
      dimensionValues
        .map(value => value.dimensionId)
        .filter(id => Number.isInteger(id) && id > 0)
    )
  );

  const [provider, category, dimensionRows] = await Promise.all([
    prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true },
    }),
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    }),
    dimensionIds.length > 0
      ? prisma.dimensionIndex.findMany({
          where: { id: { in: dimensionIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!provider) {
    throw new Error('Selected provider no longer exists.');
  }

  if (!category) {
    throw new Error('Selected category no longer exists.');
  }

  if (dimensionIds.length !== dimensionRows.length) {
    throw new Error('One or more selected dimensions no longer exist.');
  }
}

function mapExperienceRow(
  row: ExperienceWithRelations,
  dimensionOptionsById: Map<number, DimensionOption[]>
): Experience {
  const dimensionValues: ExperienceDimensionValue[] = row.experience_dimensions
    .map(value => ({
      dimensionId: value.dimension_id,
      indexKey: value.dimension_index.index_key,
      indexName: value.dimension_index.index_name,
      categoryName: value.dimension_index.category.category_name,
      dataType: value.dimension_index.data_type,
      scaleMin: value.dimension_index.scale_min,
      scaleMax: value.dimension_index.scale_max,
      options: dimensionOptionsById.get(value.dimension_id) ?? [],
      expectedValue: value.expected_value,
    }))
    .sort((a, b) => {
      const categoryDiff = a.categoryName.localeCompare(b.categoryName);
      if (categoryDiff !== 0) return categoryDiff;
      return a.indexName.localeCompare(b.indexName);
    });

  return {
    id: row.id,
    providerId: row.provider_id,
    providerLabel: row.provider.provider_label,
    providerType: row.provider.provider_type,
    categoryId: row.category_id,
    categoryTitle: row.category.category_title,
    experienceTitle: row.experience_title,
    popularityIndex: row.popularity_index,
    durationMin: row.duration_min,
    durationMax: row.duration_max,
    capacityMax: row.capacity_max,
    leadType: row.lead_type,
    deliveryMethods: row.delivery_methods,
    dietaryConsiderations: row.dietary_considerations,
    takeItem: row.take_item,
    travelFlying: row.travel_flying,
    createdBy: row.created_by,
    dimensionCount: row._count.experience_dimensions,
    proposalCount: row._count.proposals,
    calendarCount: row._count.experience_calendars,
    dimensionValues,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateExperienceFields(fields: {
  experienceTitle: string;
  providerId: number;
  categoryId: number;
  popularityIndex: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  leadType: string;
  deliveryMethods: string;
  dietaryConsiderations: string | null;
  takeItem: number | null;
  travelFlying: number | null;
  dimensionValues: Array<{
    dimensionId: number;
    expectedValue: string;
  }>;
}): ExperienceFormState['errors'] {
  const errors: ExperienceFormState['errors'] = {};

  if (!fields.experienceTitle) {
    errors.experienceTitle = 'Experience title is required';
  } else if (fields.experienceTitle.length > 100) {
    errors.experienceTitle = 'Experience title must be 100 characters or less';
  }

  if (!Number.isInteger(fields.providerId) || fields.providerId <= 0) {
    errors.providerId = 'Please select a provider';
  }

  if (!Number.isInteger(fields.categoryId) || fields.categoryId <= 0) {
    errors.categoryId = 'Please select a category';
  }

  if (!Number.isInteger(fields.popularityIndex) || fields.popularityIndex < 0) {
    errors.popularityIndex = 'Popularity index must be a non-negative integer';
  }

  if (!Number.isInteger(fields.durationMin) || fields.durationMin < 0) {
    errors.durationMin = 'Minimum duration must be a non-negative integer';
  }

  if (!Number.isInteger(fields.durationMax) || fields.durationMax < 0) {
    errors.durationMax = 'Maximum duration must be a non-negative integer';
  } else if (fields.durationMax < fields.durationMin) {
    errors.durationMax =
      'Maximum duration must be greater than or equal to minimum duration';
  }

  if (!Number.isInteger(fields.capacityMax) || fields.capacityMax < 0) {
    errors.capacityMax = 'Capacity must be a non-negative integer';
  }

  if (!fields.leadType) {
    errors.leadType = 'Lead type is required';
  } else if (fields.leadType.length > 50) {
    errors.leadType = 'Lead type must be 50 characters or less';
  }

  if (!fields.deliveryMethods) {
    errors.deliveryMethods = 'Delivery methods are required';
  } else if (fields.deliveryMethods.length > 255) {
    errors.deliveryMethods = 'Delivery methods must be 255 characters or less';
  }

  if ((fields.dietaryConsiderations ?? '').length > 255) {
    errors.dietaryConsiderations =
      'Dietary considerations must be 255 characters or less';
  }

  if (fields.takeItem !== null && !Number.isInteger(fields.takeItem)) {
    errors.takeItem = 'Take item must be blank, 0, or 1';
  }

  if (fields.travelFlying !== null && !Number.isInteger(fields.travelFlying)) {
    errors.travelFlying = 'Travel flying must be blank, 0, or 1';
  }

  if (fields.dimensionValues.some(value => value.expectedValue.length > 255)) {
    errors.dimensions = 'Dimension values must be 255 characters or less';
  }

  return errors;
}

async function getDefaultCreatedById(): Promise<number> {
  const user = await prisma.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      'No users available. Create at least one user before adding experiences.'
    );
  }

  return user.id;
}

async function replaceExperienceDimensions(
  experienceId: number,
  values: Array<{ dimensionId: number; expectedValue: string }>
) {
  await prisma.experienceDimension.deleteMany({
    where: { experience_id: experienceId },
  });

  if (values.length === 0) return;

  await prisma.experienceDimension.createMany({
    data: values.map(value => ({
      experience_id: experienceId,
      dimension_id: value.dimensionId,
      expected_value: value.expectedValue,
    })),
  });
}

export async function getExperiences(): Promise<Experience[]> {
  const [dimensionOptionsById, rows] = await Promise.all([
    getOptionsByDimensionId(),
    prisma.experience.findMany({
      include: {
        provider: {
          select: {
            provider_label: true,
            provider_type: true,
          },
        },
        category: {
          select: {
            category_title: true,
          },
        },
        experience_dimensions: {
          include: {
            dimension_index: {
              include: {
                category: {
                  select: {
                    category_name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            experience_dimensions: true,
            proposals: true,
            experience_calendars: true,
          },
        },
      },
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    }),
  ]);

  return rows.map(row => mapExperienceRow(row, dimensionOptionsById));
}

export async function createExperience(
  input: UpsertExperienceInput
): Promise<void> {
  await assertExperienceRelations(
    input.providerId,
    input.categoryId,
    input.dimensionValues
  );

  const createdBy = await getDefaultCreatedById();
  const experience = await prisma.experience.create({
    data: {
      provider_id: input.providerId,
      category_id: input.categoryId,
      experience_title: input.experienceTitle,
      popularity_index: input.popularityIndex,
      duration_min: input.durationMin,
      duration_max: input.durationMax,
      capacity_max: input.capacityMax,
      lead_type: input.leadType,
      delivery_methods: input.deliveryMethods,
      dietary_considerations: input.dietaryConsiderations,
      take_item: input.takeItem,
      travel_flying: input.travelFlying,
      created_by: createdBy,
    },
    select: {
      id: true,
    },
  });

  await replaceExperienceDimensions(experience.id, input.dimensionValues);
}

export async function updateExperience(
  id: number,
  input: UpsertExperienceInput
): Promise<void> {
  const existing = await prisma.experience.findUnique({
    where: { id },
    select: { id: true, created_by: true },
  });

  if (!existing) {
    throw new Error('Experience no longer exists.');
  }

  await assertExperienceRelations(
    input.providerId,
    input.categoryId,
    input.dimensionValues
  );

  await prisma.experience.update({
    where: { id },
    data: {
      provider_id: input.providerId,
      category_id: input.categoryId,
      experience_title: input.experienceTitle,
      popularity_index: input.popularityIndex,
      duration_min: input.durationMin,
      duration_max: input.durationMax,
      capacity_max: input.capacityMax,
      lead_type: input.leadType,
      delivery_methods: input.deliveryMethods,
      dietary_considerations: input.dietaryConsiderations,
      take_item: input.takeItem,
      travel_flying: input.travelFlying,
      created_by: existing.created_by,
    },
  });

  await replaceExperienceDimensions(id, input.dimensionValues);
}

export async function deleteExperience(id: number): Promise<void> {
  const experience = await prisma.experience.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          proposals: true,
        },
      },
    },
  });

  if (!experience) return;

  if (experience._count.proposals > 0) {
    throw new Error(
      'This experience is linked to proposals and cannot be deleted.'
    );
  }

  await prisma.$transaction([
    prisma.experienceDimension.deleteMany({
      where: { experience_id: id },
    }),
    prisma.experienceCalendar.deleteMany({
      where: { experience_id: id },
    }),
    prisma.experience.delete({
      where: { id },
    }),
  ]);
}
