import { prisma } from '@/libs/prisma-client';
import type {
  QuestionType,
  QuestionOption,
  DimensionIndex,
  Question,
} from '@/types/question-type';

export type {
  IntakeForm,
  QuestionType,
  QuestionOption as QuestionOptionData,
  QuestionDimension as QuestionDimensionData,
  DimensionIndex as DimensionIndexData,
  Question as QuestionData,
  QuestionFormState,
} from '@/types/question-type';

type CreateQuestionInput = {
  text: string;
  description: string;
  type: QuestionType;
  orderIndex: number | null;
  options: QuestionOption[];
  dimensions: { dimensionId: number; weight: number | null }[];
};

// ─── Mapping ─────────────────────────────────────────────────────────────────

type QuestionRow = Awaited<ReturnType<typeof prisma.question.findMany>>[number];
type QuestionDimensionRow = Awaited<
  ReturnType<typeof prisma.questionDimension.findMany>
>[number];

type DimensionRow = Awaited<
  ReturnType<typeof prisma.dimensionIndex.findMany>
>[number];

export function mapQuestionRow(
  q: QuestionRow & {
    question_options: {
      id: number;
      option_label: string;
      option_value: string | null;
      option_score: unknown;
    }[];
  },
  dimensions: Question['dimensions']
): Question {
  return {
    id: q.id,
    formName: q.form_name as Question['formName'],
    type: q.question_type as Question['type'],
    text: q.question_text,
    description: q.question_desc,
    orderIndex: q.order_index,
    options: q.question_options.map(o => ({
      id: o.id,
      label: o.option_label,
      value: o.option_value ?? '',
      score: o.option_score == null ? null : Number(o.option_score),
    })),
    dimensions,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

export function mapDimensionRow(
  d: DimensionRow & {
    category: { category_name: string };
    dimension_options?: {
      id: number;
      option_label: string;
      option_value: string;
    }[];
  }
): DimensionIndex {
  return {
    id: d.id,
    indexKey: d.index_key,
    indexName: d.index_name,
    categoryId: d.category_id,
    categoryName: d.category.category_name,
    dataType: d.data_type,
    hardFilter: d.hard_filter,
    scaleMin: d.scale_min,
    scaleMax: d.scale_max,
    options: (d.dimension_options ?? []).map(option => ({
      id: option.id,
      label: option.option_label,
      value: option.option_value,
    })),
  };
}

async function loadQuestionDimensions(
  questionIds: number[]
): Promise<Map<number, Question['dimensions']>> {
  if (questionIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.questionDimension.findMany({
    where: { question_id: { in: questionIds } },
    include: {
      dimension: {
        include: { category: true },
      },
    },
    orderBy: [{ question_id: 'asc' }, { id: 'asc' }],
  });

  const dimensionsByQuestionId = new Map<number, Question['dimensions']>();

  for (const row of rows as (QuestionDimensionRow & {
    dimension: {
      index_name: string;
      index_key: string | null;
      category: { category_name: string };
    };
  })[]) {
    const dimensions = dimensionsByQuestionId.get(row.question_id) ?? [];
    dimensions.push({
      id: row.id,
      dimensionId: row.dimension_id,
      dimensionName: row.dimension.index_name,
      categoryName: row.dimension.category.category_name,
      indexKey: row.dimension.index_key,
      weight: row.weight_rate == null ? null : Number(row.weight_rate),
    });
    dimensionsByQuestionId.set(row.question_id, dimensions);
  }

  return dimensionsByQuestionId;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getQuestions(): Promise<Question[]> {
  const rows = await prisma.question.findMany({
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
    include: {
      question_options: { orderBy: { id: 'asc' } },
    },
  });
  const dimensionsByQuestionId = await loadQuestionDimensions(
    rows.map(row => row.id)
  );
  return rows.map(row =>
    mapQuestionRow(row, dimensionsByQuestionId.get(row.id) ?? [])
  );
}

export async function getAvailableDimensions(): Promise<DimensionIndex[]> {
  const rows = await prisma.dimensionIndex.findMany({
    orderBy: [{ category_id: 'asc' }, { id: 'asc' }],
    include: {
      category: true,
      dimension_options: { orderBy: { id: 'asc' } },
    },
  });
  return rows.map(mapDimensionRow);
}

export async function getDashboardQuestions(take = 4): Promise<Question[]> {
  const rows = await prisma.question.findMany({
    take,
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
    include: {
      question_options: { orderBy: { id: 'asc' } },
    },
  });
  const dimensionsByQuestionId = await loadQuestionDimensions(
    rows.map(row => row.id)
  );
  return rows.map(row =>
    mapQuestionRow(row, dimensionsByQuestionId.get(row.id) ?? [])
  );
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createQuestion(
  input: CreateQuestionInput
): Promise<void> {
  const dimensions = input.dimensions.slice(0, 1);

  await prisma.$transaction(async tx => {
    const question = await tx.question.create({
      data: {
        question_text: input.text,
        question_desc: input.description,
        question_type: input.type,
        order_index: input.orderIndex,
        question_options: {
          create: input.options.map(o => ({
            option_label: o.label,
            option_value: o.value,
            option_score: o.score ?? null,
          })),
        },
      },
    });

    if (dimensions.length > 0) {
      await tx.questionDimension.createMany({
        data: dimensions.map(d => ({
          question_id: question.id,
          dimension_id: d.dimensionId,
          weight_rate: d.weight ?? null,
        })),
      });
    }
  });
}

export async function updateQuestion(
  id: number,
  input: CreateQuestionInput
): Promise<void> {
  const dimensions = input.dimensions.slice(0, 1);

  await prisma.$transaction(async tx => {
    await tx.question.update({
      where: { id },
      data: {
        question_text: input.text,
        question_desc: input.description,
        question_type: input.type,
        order_index: input.orderIndex,
        question_options: {
          deleteMany: {},
          create: input.options.map(o => ({
            option_label: o.label,
            option_value: o.value,
            option_score: o.score ?? null,
          })),
        },
      },
    });

    await tx.questionDimension.deleteMany({
      where: { question_id: id },
    });

    if (dimensions.length > 0) {
      await tx.questionDimension.createMany({
        data: dimensions.map(d => ({
          question_id: id,
          dimension_id: d.dimensionId,
          weight_rate: d.weight ?? null,
        })),
      });
    }
  });
}

export async function deleteQuestion(id: number): Promise<void> {
  await prisma.$transaction([
    prisma.questionDimension.deleteMany({ where: { question_id: id } }),
    prisma.questionOption.deleteMany({ where: { question_id: id } }),
    prisma.answer.deleteMany({ where: { question_id: id } }),
    prisma.question.delete({ where: { id } }),
  ]);
}
