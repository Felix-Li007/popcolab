import { prisma } from '@/libs/prisma-client';
import type { UserAnswer } from '@/types/response-type';
import type { Personality } from '@/types/personality-type';
import { mapPersonalityRow } from '@/services/personality-service';
import { getPersonalityLocalTimestamp } from '@/utils/personality-time';

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

async function computeNumericValue(
  answer: UserAnswer
): Promise<{ rawValue: number | null; numericValue: number | null }> {
  if (answer.questionType === 'scale') {
    const v = answer.scaleValue ?? 0;
    return { rawValue: v, numericValue: v };
  }

  if (answer.questionType === 'text_input') {
    return { rawValue: null, numericValue: null };
  }

  // single_choice or multi_choice: sum option_score values
  if (answer.selectedOptionIds.length === 0) {
    return { rawValue: null, numericValue: null };
  }

  const options = await prisma.questionOption.findMany({
    where: { id: { in: answer.selectedOptionIds } },
    select: { option_score: true },
  });

  const total = options.reduce((sum, o) => {
    return sum + Number(o.option_score ?? 0);
  }, 0);

  return {
    rawValue: answer.selectedOptionIds[0] ?? null,
    numericValue: Math.round(total),
  };
}

async function getDimensionMappings(
  questionIds: number[]
): Promise<{ questionId: number; dimensionId: number; weight: number }[]> {
  const rows = await prisma.questionDimension.findMany({
    where: { question_id: { in: questionIds } },
    select: { question_id: true, dimension_id: true, weight_rate: true },
  });
  return rows.map(r => ({
    questionId: r.question_id,
    dimensionId: r.dimension_id,
    weight: Number(r.weight_rate ?? 1),
  }));
}

async function getSelectedOptions(optionIds: number[]): Promise<
  Map<
    number,
    {
      id: number;
      option_value: string | null;
      option_label: string;
    }
  >
> {
  if (optionIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.questionOption.findMany({
    where: { id: { in: optionIds } },
    select: {
      id: true,
      option_value: true,
      option_label: true,
    },
  });

  return new Map(rows.map(row => [row.id, row]));
}

function buildUserPersonalitySnapshotRows(
  userId: number,
  answers: UserAnswer[],
  dimMappings: { questionId: number; dimensionId: number; weight: number }[],
  selectedOptions: Map<
    number,
    {
      id: number;
      option_value: string | null;
      option_label: string;
    }
  >,
  now: Date
): Array<{
  user_id: number;
  question_id: number;
  dimension_id: number;
  option_id: number | null;
  desired_value: string;
  created_at: Date;
  updated_at: Date;
}> {
  const rows: Array<{
    user_id: number;
    question_id: number;
    dimension_id: number;
    option_id: number | null;
    desired_value: string;
    created_at: Date;
    updated_at: Date;
  }> = [];

  for (const answer of answers) {
    const questionDimensions = dimMappings.filter(
      d => d.questionId === answer.questionId
    );

    if (questionDimensions.length === 0) {
      continue;
    }

    if (answer.questionType === 'scale' && answer.scaleValue !== null) {
      for (const dim of questionDimensions) {
        rows.push({
          user_id: userId,
          question_id: answer.questionId,
          dimension_id: dim.dimensionId,
          option_id: null,
          desired_value: String(answer.scaleValue),
          created_at: now,
          updated_at: now,
        });
      }
      continue;
    }

    if (answer.questionType === 'text_input') {
      const desiredValue = answer.textValue?.trim();
      if (!desiredValue) {
        continue;
      }

      for (const dim of questionDimensions) {
        rows.push({
          user_id: userId,
          question_id: answer.questionId,
          dimension_id: dim.dimensionId,
          option_id: null,
          desired_value: desiredValue,
          created_at: now,
          updated_at: now,
        });
      }
      continue;
    }

    for (const optionId of answer.selectedOptionIds) {
      const option = selectedOptions.get(optionId);
      if (!option) {
        continue;
      }

      const desiredValue =
        option.option_value?.trim() || option.option_label.trim();

      if (!desiredValue) {
        continue;
      }

      for (const dim of questionDimensions) {
        rows.push({
          user_id: userId,
          question_id: answer.questionId,
          dimension_id: dim.dimensionId,
          option_id: option.id,
          desired_value: desiredValue,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return rows;
}

// ─── Shared Personality Ranking ──────────────────────────────────────────────
// Single source of truth used by both submitResponse and computeAllPersonalityMatches.
// Returns personalities sorted: qualified (highest threshold first), then unqualified.
// sorted[0] is always the primary match.

type PersonalityRow = Awaited<
  ReturnType<typeof prisma.personalityType.findMany>
>[number];

async function rankPersonalities(
  totalScore: number
): Promise<PersonalityRow[]> {
  const rows = await prisma.personalityType.findMany({
    where: { status: 'active' },
  });
  return [...rows].sort((a, b) => {
    const aQ = totalScore >= a.score_threshold;
    const bQ = totalScore >= b.score_threshold;
    if (aQ !== bQ) return aQ ? -1 : 1;
    return b.score_threshold - a.score_threshold;
  });
}

// ─── Main Submit ──────────────────────────────────────────────────────────────

export async function submitResponse(
  userId: number,
  answers: UserAnswer[]
): Promise<{
  personalityKey: string;
  personality: Personality | null;
  totalScore: number;
}> {
  // 1. Compute scores
  const scored = await Promise.all(
    answers.map(async a => ({
      answer: a,
      ...(await computeNumericValue(a)),
    }))
  );

  // 2. Get dimension mappings
  const questionIds = answers.map(a => a.questionId);
  const dimMappings = await getDimensionMappings(questionIds);
  const selectedOptions = await getSelectedOptions(
    answers.flatMap(a => a.selectedOptionIds)
  );

  // 3. Calculate per-dimension scores
  const dimensionScoreMap = new Map<number, number>();
  for (const item of scored) {
    if (item.numericValue === null) continue;
    const dims = dimMappings.filter(
      d => d.questionId === item.answer.questionId
    );
    for (const dim of dims) {
      const current = dimensionScoreMap.get(dim.dimensionId) ?? 0;
      dimensionScoreMap.set(
        dim.dimensionId,
        current + item.numericValue * dim.weight
      );
    }
  }

  // 4. Total score — rounded integer so threshold comparisons are exact
  const totalScore = Math.round(
    Array.from(dimensionScoreMap.values()).reduce((a, b) => a + b, 0)
  );

  // 5. Rank personalities using the shared ranker — same logic as computeAllPersonalityMatches
  //    so the personality saved to DB is always the same one shown on the result page.
  const ranked = await rankPersonalities(totalScore);
  const primaryRow = ranked[0];
  const personality = primaryRow ? mapPersonalityRow(primaryRow) : null;
  const personalityKey = personality?.type ?? 'UNKNOWN';

  // 6. Build vector JSON (max 500 chars — keep it compact)
  const vectorObj: Record<string, number> = { total: totalScore };
  dimensionScoreMap.forEach((score, dimId) => {
    vectorObj[`d${dimId}`] = Math.round(score);
  });
  const vectorJson = JSON.stringify(vectorObj);

  // 7. Persist in a single transaction
  const now = getPersonalityLocalTimestamp();
  const userPersonalityRows = buildUserPersonalitySnapshotRows(
    userId,
    answers,
    dimMappings,
    selectedOptions,
    now
  );

  await prisma.$transaction(async tx => {
    await tx.userPersonality.deleteMany({
      where: { user_id: userId },
    });

    if (userPersonalityRows.length > 0) {
      await tx.userPersonality.createMany({
        data: userPersonalityRows,
      });
    }

    await tx.personalityProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        completed_at: now,
        vector_json: vectorJson,
        vector_type: personalityKey,
        updated_at: now,
      },
      update: {
        completed_at: now,
        vector_json: vectorJson,
        vector_type: personalityKey,
        updated_at: now,
      },
    });
  });

  return { personalityKey, personality, totalScore };
}

// ─── Result Fetch ─────────────────────────────────────────────────────────────

export async function getTestResult(userId: number): Promise<{
  personality: Personality;
  totalScore: number;
  completedAt: Date | null;
} | null> {
  const vector = await prisma.personalityProfile.findUnique({
    where: { user_id: userId },
  });
  if (!vector) return null;

  const parsed = JSON.parse(vector.vector_json) as Record<string, number>;
  const totalScore = parsed.total ?? 0;

  const row = await prisma.personalityType.findFirst({
    where: { personality_key: vector.vector_type },
  });
  if (!row) return null;

  return {
    personality: mapPersonalityRow(row),
    totalScore,
    completedAt: vector.completed_at,
  };
}

// ─── Anonymous Score Compute (no DB write) ───────────────────────────────────

export async function computeTestResult(answers: UserAnswer[]): Promise<{
  personalityKey: string;
  totalScore: number;
  personality: Personality | null;
}> {
  const scored = await Promise.all(
    answers.map(async a => ({
      answer: a,
      ...(await computeNumericValue(a)),
    }))
  );

  const questionIds = answers.map(a => a.questionId);
  const dimMappings = await getDimensionMappings(questionIds);

  const dimensionScoreMap = new Map<number, number>();
  for (const item of scored) {
    if (item.numericValue === null) continue;
    const dims = dimMappings.filter(
      d => d.questionId === item.answer.questionId
    );
    for (const dim of dims) {
      const current = dimensionScoreMap.get(dim.dimensionId) ?? 0;
      dimensionScoreMap.set(
        dim.dimensionId,
        current + item.numericValue * dim.weight
      );
    }
  }

  const totalScore = Math.round(
    Array.from(dimensionScoreMap.values()).reduce((a, b) => a + b, 0)
  );

  const ranked = await rankPersonalities(totalScore);
  const primaryRow = ranked[0];
  const personality = primaryRow ? mapPersonalityRow(primaryRow) : null;
  const personalityKey = personality?.type ?? 'UNKNOWN';

  return { personalityKey, totalScore, personality };
}

export async function getPersonalityByKey(
  key: string
): Promise<Personality | null> {
  const row = await prisma.personalityType.findFirst({
    where: { personality_key: key, status: 'active' },
  });
  if (!row) return null;
  return mapPersonalityRow(row);
}

// ─── All Personality Matches (for results display) ───────────────────────────

export async function computeAllPersonalityMatches(
  totalScore: number
): Promise<{ key: string; matchPercent: number }[]> {
  // Uses the shared ranker — identical sort to what submitResponse uses when saving,
  // so sorted[0] here always matches what was written to personalityProfile.vector_type.
  const sorted = await rankPersonalities(totalScore);
  if (sorted.length === 0) return [];

  const primaryThreshold = Math.max(1, sorted[0].score_threshold);
  const basePercent = Math.min(
    95,
    Math.max(40, Math.round((totalScore / primaryThreshold) * 95))
  );

  return sorted.map((row, i) => ({
    key: row.personality_key,
    matchPercent: Math.max(10, Math.round(basePercent * Math.pow(0.85, i))),
  }));
}
