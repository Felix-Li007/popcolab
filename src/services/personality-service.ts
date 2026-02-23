import { prisma } from '@/libs/prisma-client';
import type {
  Personality,
  PersonalityFormState,
} from '@/types/personality-type';

export type { Personality as PersonalityType, PersonalityFormState };

type CreatePersonalityInput = {
  type: string;
  name: string;
  description: string;
  emoji: string;
  stars: number;
  status: string;
  accentColor: string;
  threshold: number;
};

type UpdatePersonalityInput = Omit<CreatePersonalityInput, 'type'>;

// ─── Mapping ─────────────────────────────────────────────────────────────────

type PersonalityRow = NonNullable<
  Awaited<ReturnType<typeof prisma.personalityType.findFirst>>
>;

export function mapPersonalityRow(row: PersonalityRow): Personality {
  return {
    id: row.id,
    type: row.personality_key,
    name: row.personality_name,
    description: row.personality_desc ?? '',
    emoji: row.emoji ?? '',
    stars: row.stars,
    status: row.status as 'active' | 'draft',
    accentColor: row.accent_color ?? undefined,
    threshold: row.score_threshold,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validatePersonalityFields(fields: {
  name: string;
  type?: string;
  description: string;
  threshold: number;
}): PersonalityFormState['errors'] {
  const errors: PersonalityFormState['errors'] = {};

  if (!fields.name) errors.name = 'Name is required';
  else if (fields.name.length > 50)
    errors.name = 'Name must be 50 characters or less';

  if (fields.type !== undefined) {
    if (!fields.type) errors.type = 'Tag / Type is required';
    else if (fields.type.length > 50)
      errors.type = 'Tag must be 50 characters or less';
    else if (!/^[A-Z0-9_]+$/.test(fields.type))
      errors.type =
        'Tag must only contain uppercase letters, numbers or underscores';
  }

  if (!fields.description) errors.description = 'Description is required';
  else if (fields.description.length > 255)
    errors.description = 'Description must be 255 characters or less';

  if (isNaN(fields.threshold) || fields.threshold < 0)
    errors.threshold = 'Threshold must be a non-negative number';

  return errors;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPersonalities(): Promise<Personality[]> {
  const rows = await prisma.personalityType.findMany({
    orderBy: { id: 'asc' },
  });
  return rows.map(mapPersonalityRow);
}

export async function getDashboardPersonalities(
  take = 4
): Promise<Personality[]> {
  const rows = await prisma.personalityType.findMany({
    orderBy: { id: 'asc' },
    take,
  });
  return rows.map(mapPersonalityRow);
}

export async function getPersonalitySummary(): Promise<{
  count: number;
  activeCount: number;
}> {
  const [count, activeCount] = await Promise.all([
    prisma.personalityType.count(),
    prisma.personalityType.count({ where: { status: 'active' } }),
  ]);
  return { count, activeCount };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createPersonality(
  input: CreatePersonalityInput
): Promise<void> {
  await prisma.personalityType.create({
    data: {
      personality_key: input.type,
      personality_name: input.name,
      personality_desc: input.description,
      emoji: input.emoji,
      stars: input.stars,
      status: input.status,
      accent_color: input.accentColor,
      score_threshold: input.threshold,
    },
  });
}

export async function updatePersonality(
  id: number,
  input: UpdatePersonalityInput
): Promise<void> {
  await prisma.personalityType.update({
    where: { id },
    data: {
      personality_name: input.name,
      personality_desc: input.description,
      emoji: input.emoji,
      stars: input.stars,
      status: input.status,
      accent_color: input.accentColor,
      score_threshold: input.threshold,
    },
  });
}

export async function deletePersonality(id: number): Promise<void> {
  await prisma.personalityType.delete({ where: { id } });
}
