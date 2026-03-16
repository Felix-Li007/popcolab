import { prisma } from '@/libs/prisma-client';
import type { Provider, ProviderFormState } from '@/types/provider-type';

type UpsertProviderInput = {
  providerType: string;
  providerLabel: string;
  providerNotes: string | null;
  pricingNotes: string | null;
};

type ProviderRow = Awaited<ReturnType<typeof prisma.provider.findMany>>[number];

type ProviderWithCountRow = ProviderRow & {
  _count: {
    experiences: number;
  };
};

export function normalizeProviderType(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function mapProviderRow(row: ProviderWithCountRow): Provider {
  return {
    id: row.id,
    providerType: row.provider_type,
    providerLabel: row.provider_label,
    providerNotes: row.provider_notes,
    pricingNotes: row.pricing_notes,
    experienceCount: row._count.experiences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateProviderFields(fields: {
  providerType: string;
  providerLabel: string;
  providerNotes: string | null;
  pricingNotes: string | null;
}): ProviderFormState['errors'] {
  const errors: ProviderFormState['errors'] = {};

  if (!fields.providerType) {
    errors.providerType = 'Provider type is required';
  } else if (fields.providerType.length > 50) {
    errors.providerType = 'Provider type must be 50 characters or less';
  } else if (!/^[A-Z0-9_]+$/.test(fields.providerType)) {
    errors.providerType =
      'Provider type must contain only uppercase letters, numbers, or underscores';
  }

  if (!fields.providerLabel) {
    errors.providerLabel = 'Provider label is required';
  } else if (fields.providerLabel.length > 50) {
    errors.providerLabel = 'Provider label must be 50 characters or less';
  }

  if ((fields.providerNotes ?? '').length > 255) {
    errors.providerNotes = 'Provider notes must be 255 characters or less';
  }

  if ((fields.pricingNotes ?? '').length > 255) {
    errors.pricingNotes = 'Pricing notes must be 255 characters or less';
  }

  return errors;
}

async function assertProviderTypeAvailable(
  providerType: string,
  excludeId?: number
): Promise<void> {
  const existing = await prisma.provider.findFirst({
    where: {
      provider_type: providerType,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error('A provider with this type already exists.');
  }
}

export async function getProviders(): Promise<Provider[]> {
  const rows = await prisma.provider.findMany({
    include: {
      _count: {
        select: {
          experiences: true,
        },
      },
    },
    orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
  });

  return rows.map(mapProviderRow);
}

export async function createProvider(
  input: UpsertProviderInput
): Promise<void> {
  await assertProviderTypeAvailable(input.providerType);

  await prisma.provider.create({
    data: {
      provider_type: input.providerType,
      provider_label: input.providerLabel,
      provider_notes: input.providerNotes,
      pricing_notes: input.pricingNotes,
    },
  });
}

export async function updateProvider(
  id: number,
  input: UpsertProviderInput
): Promise<void> {
  await assertProviderTypeAvailable(input.providerType, id);

  await prisma.provider.update({
    where: { id },
    data: {
      provider_type: input.providerType,
      provider_label: input.providerLabel,
      provider_notes: input.providerNotes,
      pricing_notes: input.pricingNotes,
    },
  });
}

export async function deleteProvider(id: number): Promise<void> {
  const experienceCount = await prisma.experience.count({
    where: { provider_id: id },
  });

  if (experienceCount > 0) {
    throw new Error(
      'This provider is linked to experiences and cannot be deleted.'
    );
  }

  await prisma.provider.delete({
    where: { id },
  });
}
