import { prisma } from '@/libs/prisma-client';
import type { UserAnswer } from '@/types/response-type';
import type { Personality } from '@/types/personality-type';
import { mapPersonalityRow } from '@/services/personality-service';

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
    return sum + (o.option_score !== null ? Number(o.option_score) : 0);
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
    weight: r.weight_rate !== null ? Number(r.weight_rate) : 1,
  }));
}

async function matchPersonality(
  totalScore: number
): Promise<Personality | null> {
  const rows = await prisma.personalityType.findMany({
    where: { status: 'active' },
    orderBy: { score_threshold: 'asc' },
  });
  if (rows.length === 0) return null;

  let matched = rows[0];
  for (const row of rows) {
    if (totalScore >= row.score_threshold) matched = row;
  }
  return mapPersonalityRow(matched);
}

// ─── Main Submit ──────────────────────────────────────────────────────────────

export async function submitResponse(
  userId: number,
  answers: UserAnswer[]
): Promise<{ personalityKey: string; personality: Personality | null }> {
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

  // 4. Total score
  const totalScore = Array.from(dimensionScoreMap.values()).reduce(
    (a, b) => a + b,
    0
  );

  // 5. Match personality
  const personality = await matchPersonality(totalScore);
  const personalityKey = personality?.type ?? 'UNKNOWN';

  // 6. Build vector JSON (max 500 chars — keep it compact)
  const vectorObj: Record<string, number> = { total: Math.round(totalScore) };
  dimensionScoreMap.forEach((score, dimId) => {
    vectorObj[`d${dimId}`] = Math.round(score);
  });
  const vectorJson = JSON.stringify(vectorObj);

  // 7. Persist in a single transaction
  const now = new Date();

  await prisma.$transaction(async tx => {
    const response = await tx.response.create({
      data: {
        user_id: userId,
        completed_at: now,
        answers: {
          create: scored.map(item => ({
            question_id: item.answer.questionId,
            raw_value: item.rawValue,
            numeric_value: item.numericValue,
          })),
        },
      },
    });

    if (dimensionScoreMap.size > 0) {
      await tx.responseScore.createMany({
        data: Array.from(dimensionScoreMap.entries()).map(([dimId, score]) => ({
          response_id: response.id,
          dimension_id: dimId,
          original_score: Math.round(score),
          normalized_score: Math.round(score),
          updated_at: now,
        })),
      });
    }

    await tx.userVector.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        response_id: response.id,
        vector_json: vectorJson,
        vector_type: personalityKey,
        updated_at: now,
      },
      update: {
        response_id: response.id,
        vector_json: vectorJson,
        vector_type: personalityKey,
        updated_at: now,
      },
    });
  });

  return { personalityKey, personality };
}

// ─── Result Fetch ─────────────────────────────────────────────────────────────

export async function getTestResult(userId: number): Promise<{
  personality: Personality;
  totalScore: number;
} | null> {
  const vector = await prisma.userVector.findUnique({
    where: { user_id: userId },
  });
  if (!vector) return null;

  const parsed = JSON.parse(vector.vector_json) as Record<string, number>;
  const totalScore = parsed.total ?? 0;

  const row = await prisma.personalityType.findFirst({
    where: { personality_key: vector.vector_type },
  });
  if (!row) return null;

  return { personality: mapPersonalityRow(row), totalScore };
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

  const personality = await matchPersonality(totalScore);
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
  const rows = await prisma.personalityType.findMany({
    where: { status: 'active' },
    orderBy: { score_threshold: 'desc' },
  });
  if (rows.length === 0) return [];

  // Qualified personalities first (highest threshold first), then unqualified
  const sorted = [...rows].sort((a, b) => {
    const aQ = totalScore >= a.score_threshold;
    const bQ = totalScore >= b.score_threshold;
    if (aQ !== bQ) return aQ ? -1 : 1;
    return b.score_threshold - a.score_threshold;
  });

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
