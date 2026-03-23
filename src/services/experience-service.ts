import { prisma } from '@/libs/prisma-client';
import type { DimensionOption } from '@/types/dimension-type';
import type {
  Experience,
  ExperienceDimensionValue,
  ExperienceFormState,
  ExperienceStatus,
} from '@/types/experience-type';

type UpsertExperienceInput = {
  providerId: number;
  categoryId: number;
  experienceTitle: string;
  experienceStatus: ExperienceStatus;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  startingPrice: number;
  addingPrice: number;
  startingHour: number | null;
  pricingModel: string | null;
  pricingNotes: string | null;
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

export type ExperiencePurchaseQuote = {
  experience: Experience;
  currency: 'CAD';
  requestedHours: number;
  includedHours: number | null;
  extraHours: number;
  baseAmountCad: number;
  extraAmountCad: number;
  totalAmountCad: number;
};

type ExperienceRow = Awaited<
  ReturnType<typeof prisma.experience.findMany>
>[number];

type ExperienceValidationFields = {
  experienceTitle: string;
  experienceStatus: ExperienceStatus;
  providerId: number;
  categoryId: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  startingPrice: number;
  addingPrice: number;
  startingHour: number | null;
  pricingModel: string | null;
  pricingNotes: string | null;
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

type ExperienceWithRelations = ExperienceRow & {
  provider: {
    provider_label: string;
    provider_type: string;
  };
  category: {
    category_title: string;
  };
  experience_pricing: {
    adding_price: { toString(): string };
    starting_price: { toString(): string };
    starting_hour: number | null;
    pricing_model: string | null;
    pricing_notes: string | null;
  } | null;
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
    experienceStatus: row.experience_status,
    popularityIndex: row.popularity_index,
    durationMin: row.duration_min,
    durationMax: row.duration_max,
    capacityMax: row.capacity_max,
    pricing: {
      startingPrice: row.experience_pricing
        ? Number(row.experience_pricing.starting_price.toString())
        : null,
      addingPrice: row.experience_pricing
        ? Number(row.experience_pricing.adding_price.toString())
        : null,
      startingHour: row.experience_pricing?.starting_hour ?? null,
      pricingModel: row.experience_pricing?.pricing_model ?? null,
      pricingNotes: row.experience_pricing?.pricing_notes ?? null,
    },
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

function getDefaultRequestedHours(experience: Experience): number {
  if (
    experience.pricing.startingHour !== null &&
    experience.pricing.startingHour > 0
  ) {
    return experience.pricing.startingHour;
  }

  return Math.max(1, Math.ceil(experience.durationMax / 60));
}

function isExperiencePurchasable(experience: Experience): boolean {
  return (
    experience.experienceStatus === 'active' &&
    experience.pricing.startingPrice !== null &&
    experience.pricing.startingPrice > 0 &&
    experience.pricing.addingPrice !== null &&
    experience.pricing.addingPrice >= 0
  );
}

export function buildExperiencePurchaseQuote(
  experience: Experience,
  requestedHours?: number | null
): ExperiencePurchaseQuote {
  if (!isExperiencePurchasable(experience)) {
    throw new Error('This experience is not available for checkout.');
  }

  const includedHours = experience.pricing.startingHour;
  const normalizedRequestedHours: number = Number.isInteger(requestedHours)
    ? Number(requestedHours)
    : getDefaultRequestedHours(experience);
  const minHours = includedHours ?? 1;
  const safeRequestedHours = Math.max(normalizedRequestedHours, minHours);
  const extraHours =
    includedHours === null
      ? 0
      : Math.max(0, safeRequestedHours - includedHours);
  const baseAmountCad = experience.pricing.startingPrice ?? 0;
  const extraAmountCad = extraHours * (experience.pricing.addingPrice ?? 0);
  const totalAmountCad = baseAmountCad + extraAmountCad;

  if (totalAmountCad <= 0) {
    throw new Error('This experience is not available for checkout.');
  }

  return {
    experience,
    currency: 'CAD',
    requestedHours: safeRequestedHours,
    includedHours,
    extraHours,
    baseAmountCad,
    extraAmountCad,
    totalAmountCad,
  };
}

function getExperienceTitleError(experienceTitle: string): string | undefined {
  if (!experienceTitle) {
    return 'Experience title is required';
  }

  if (experienceTitle.length > 100) {
    return 'Experience title must be 100 characters or less';
  }

  return undefined;
}

function getExperienceStatusError(
  experienceStatus: ExperienceStatus
): string | undefined {
  if (!['draft', 'inactive', 'active'].includes(experienceStatus)) {
    return 'Please select a valid status';
  }

  return undefined;
}

function getRequiredRelationError(
  value: number,
  emptyMessage: string
): string | undefined {
  if (!Number.isInteger(value) || value <= 0) {
    return emptyMessage;
  }

  return undefined;
}

function getDurationErrors(fields: ExperienceValidationFields) {
  const errors: Pick<
    ExperienceFormState['errors'],
    'durationMin' | 'durationMax'
  > = {};

  if (!Number.isInteger(fields.durationMin) || fields.durationMin < 0) {
    errors.durationMin = 'Minimum duration must be a non-negative integer';
  }

  if (!Number.isInteger(fields.durationMax) || fields.durationMax < 0) {
    errors.durationMax = 'Maximum duration must be a non-negative integer';
  } else if (fields.durationMax < fields.durationMin) {
    errors.durationMax =
      'Maximum duration must be greater than or equal to minimum duration';
  }

  return errors;
}

function getCapacityError(capacityMax: number): string | undefined {
  if (!Number.isInteger(capacityMax) || capacityMax < 0) {
    return 'Capacity must be a non-negative integer';
  }

  return undefined;
}

function getPricingErrors(fields: ExperienceValidationFields) {
  const errors: Pick<
    ExperienceFormState['errors'],
    | 'startingPrice'
    | 'addingPrice'
    | 'startingHour'
    | 'pricingModel'
    | 'pricingNotes'
  > = {};

  if (!Number.isInteger(fields.startingPrice) || fields.startingPrice <= 0) {
    errors.startingPrice = 'Starting price must be a positive integer';
  }

  if (!Number.isInteger(fields.addingPrice) || fields.addingPrice < 0) {
    errors.addingPrice = 'Adding price must be a non-negative integer';
  }

  if (fields.startingHour !== null && !Number.isInteger(fields.startingHour)) {
    errors.startingHour = 'Starting hour must be blank or a whole number';
  } else if (fields.startingHour !== null && fields.startingHour < 0) {
    errors.startingHour = 'Starting hour must be a non-negative integer';
  }

  if ((fields.pricingModel ?? '').length > 255) {
    errors.pricingModel = 'Pricing model must be 255 characters or less';
  }

  if ((fields.pricingNotes ?? '').length > 255) {
    errors.pricingNotes = 'Pricing notes must be 255 characters or less';
  }

  return errors;
}

function getLeadTypeError(leadType: string): string | undefined {
  if (!leadType) {
    return 'Lead type is required';
  }

  if (leadType.length > 50) {
    return 'Lead type must be 50 characters or less';
  }

  return undefined;
}

function getDeliveryMethodsError(deliveryMethods: string): string | undefined {
  if (!deliveryMethods) {
    return 'Delivery methods are required';
  }

  if (deliveryMethods.length > 255) {
    return 'Delivery methods must be 255 characters or less';
  }

  return undefined;
}

function getDietaryConsiderationsError(
  dietaryConsiderations: string | null
): string | undefined {
  if ((dietaryConsiderations ?? '').length > 255) {
    return 'Dietary considerations must be 255 characters or less';
  }

  return undefined;
}

function getBinaryFieldError(
  value: number | null,
  fieldLabel: string
): string | undefined {
  if (value !== null && !Number.isInteger(value)) {
    return `${fieldLabel} must be blank, 0, or 1`;
  }

  return undefined;
}

function getDimensionValuesError(
  dimensionValues: ExperienceValidationFields['dimensionValues']
): string | undefined {
  if (dimensionValues.some(value => value.expectedValue.length > 255)) {
    return 'Dimension values must be 255 characters or less';
  }

  return undefined;
}

export function validateExperienceFields(
  fields: ExperienceValidationFields
): ExperienceFormState['errors'] {
  return {
    experienceTitle: getExperienceTitleError(fields.experienceTitle),
    experienceStatus: getExperienceStatusError(fields.experienceStatus),
    providerId: getRequiredRelationError(
      fields.providerId,
      'Please select a provider'
    ),
    categoryId: getRequiredRelationError(
      fields.categoryId,
      'Please select a category'
    ),
    ...getDurationErrors(fields),
    capacityMax: getCapacityError(fields.capacityMax),
    ...getPricingErrors(fields),
    leadType: getLeadTypeError(fields.leadType),
    deliveryMethods: getDeliveryMethodsError(fields.deliveryMethods),
    dietaryConsiderations: getDietaryConsiderationsError(
      fields.dietaryConsiderations
    ),
    takeItem: getBinaryFieldError(fields.takeItem, 'Take item'),
    travelFlying: getBinaryFieldError(fields.travelFlying, 'Travel flying'),
    dimensions: getDimensionValuesError(fields.dimensionValues),
  };
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

type ExperienceWriteClient = Pick<
  typeof prisma,
  'experience' | 'experienceDimension' | 'experiencePricing'
>;

async function replaceExperienceDimensions(
  db: ExperienceWriteClient,
  experienceId: number,
  values: Array<{ dimensionId: number; expectedValue: string }>
) {
  await db.experienceDimension.deleteMany({
    where: { experience_id: experienceId },
  });

  if (values.length === 0) return;

  await db.experienceDimension.createMany({
    data: values.map(value => ({
      experience_id: experienceId,
      dimension_id: value.dimensionId,
      expected_value: value.expectedValue,
    })),
  });
}

async function upsertExperiencePricing(
  db: ExperienceWriteClient,
  experienceId: number,
  input: Pick<
    UpsertExperienceInput,
    | 'startingPrice'
    | 'addingPrice'
    | 'startingHour'
    | 'pricingModel'
    | 'pricingNotes'
  >
) {
  await db.experiencePricing.upsert({
    where: { experience_id: experienceId },
    create: {
      experience_id: experienceId,
      starting_price: input.startingPrice,
      adding_price: input.addingPrice,
      starting_hour: input.startingHour,
      pricing_model: input.pricingModel,
      pricing_notes: input.pricingNotes,
    },
    update: {
      starting_price: input.startingPrice,
      adding_price: input.addingPrice,
      starting_hour: input.startingHour,
      pricing_model: input.pricingModel,
      pricing_notes: input.pricingNotes,
    },
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
        experience_pricing: {
          select: {
            adding_price: true,
            starting_price: true,
            starting_hour: true,
            pricing_model: true,
            pricing_notes: true,
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

export async function getDashboardExperiences(
  limit = 5
): Promise<Experience[]> {
  const take = Number.isInteger(limit) && limit > 0 ? limit : 5;

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
        experience_pricing: {
          select: {
            adding_price: true,
            starting_price: true,
            starting_hour: true,
            pricing_model: true,
            pricing_notes: true,
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
      orderBy: [
        { popularity_index: 'desc' },
        { updated_at: 'desc' },
        { id: 'desc' },
      ],
      take,
    }),
  ]);

  return rows.map(row => mapExperienceRow(row, dimensionOptionsById));
}

export async function getPurchasableExperiences(): Promise<Experience[]> {
  const [dimensionOptionsById, rows] = await Promise.all([
    getOptionsByDimensionId(),
    prisma.experience.findMany({
      where: {
        experience_status: 'active',
        experience_pricing: { isNot: null },
      },
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
        experience_pricing: {
          select: {
            adding_price: true,
            starting_price: true,
            starting_hour: true,
            pricing_model: true,
            pricing_notes: true,
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
      orderBy: [
        { popularity_index: 'desc' },
        { updated_at: 'desc' },
        { id: 'desc' },
      ],
    }),
  ]);

  return rows
    .map(row => mapExperienceRow(row, dimensionOptionsById))
    .filter(isExperiencePurchasable);
}

export async function getPurchasableExperienceById(
  id: number
): Promise<Experience | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const [dimensionOptionsById, row] = await Promise.all([
    getOptionsByDimensionId(),
    prisma.experience.findUnique({
      where: { id },
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
        experience_pricing: {
          select: {
            adding_price: true,
            starting_price: true,
            starting_hour: true,
            pricing_model: true,
            pricing_notes: true,
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
    }),
  ]);

  if (!row) return null;

  const experience = mapExperienceRow(row, dimensionOptionsById);
  return isExperiencePurchasable(experience) ? experience : null;
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
  await prisma.$transaction(async tx => {
    const experience = await tx.experience.create({
      data: {
        provider_id: input.providerId,
        category_id: input.categoryId,
        experience_title: input.experienceTitle,
        experience_status: input.experienceStatus,
        popularity_index: 0,
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

    await replaceExperienceDimensions(tx, experience.id, input.dimensionValues);
    await upsertExperiencePricing(tx, experience.id, input);
  });
}

export async function updateExperience(
  id: number,
  input: UpsertExperienceInput
): Promise<void> {
  const existing = await prisma.experience.findUnique({
    where: { id },
    select: {
      id: true,
      created_by: true,
      popularity_index: true,
    },
  });

  if (!existing) {
    throw new Error('Experience no longer exists.');
  }

  await assertExperienceRelations(
    input.providerId,
    input.categoryId,
    input.dimensionValues
  );

  await prisma.$transaction(async tx => {
    await tx.experience.update({
      where: { id },
      data: {
        provider_id: input.providerId,
        category_id: input.categoryId,
        experience_title: input.experienceTitle,
        experience_status: input.experienceStatus,
        popularity_index: existing.popularity_index,
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

    await replaceExperienceDimensions(tx, id, input.dimensionValues);
    await upsertExperiencePricing(tx, id, input);
  });
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
