import { prisma } from '@/libs/prisma-client';
import type {
  QuestionType,
  QuestionOption,
  QuestionDimension,
  DimensionIndex,
  Question,
  QuestionFormState,
} from '@/types/question-type';

export type {
  QuestionType,
  QuestionOption as QuestionOptionData,
  QuestionDimension as QuestionDimensionData,
  DimensionIndex as DimensionIndexData,
  Question as QuestionData,
  QuestionFormState,
};

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

type DimensionRow = Awaited<
  ReturnType<typeof prisma.dimensionIndex.findMany>
>[number];

export function mapQuestionRow(
  q: QuestionRow & {
    options: {
      id: number;
      option_label: string;
      option_value: string | null;
      option_score: unknown;
    }[];
    dimensions: {
      id: number;
      dimension_id: number;
      weight_rate: unknown;
      dimension: {
        index_name: string;
        index_key: string | null;
        category: { category_name: string };
      };
    }[];
  }
): Question {
  return {
    id: q.id,
    type: q.question_type as Question['type'],
    text: q.question_text,
    description: q.question_desc,
    orderIndex: q.order_index,
    options: q.options.map(o => ({
      id: o.id,
      label: o.option_label,
      value: o.option_value ?? '',
      score: o.option_score !== null ? Number(o.option_score) : null,
    })),
    dimensions: q.dimensions.map(d => ({
      id: d.id,
      dimensionId: d.dimension_id,
      dimensionName: d.dimension.index_name,
      categoryName: d.dimension.category.category_name,
      indexKey: d.dimension.index_key,
      weight: d.weight_rate !== null ? Number(d.weight_rate) : null,
    })),
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

export function mapDimensionRow(
  d: DimensionRow & { category: { category_name: string } }
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
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getQuestions(): Promise<Question[]> {
  const rows = await prisma.question.findMany({
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
    include: {
      options: { orderBy: { id: 'asc' } },
      dimensions: {
        include: { dimension: { include: { category: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });
  return rows.map(mapQuestionRow);
}

export async function getAvailableDimensions(): Promise<DimensionIndex[]> {
  const rows = await prisma.dimensionIndex.findMany({
    orderBy: [{ category_id: 'asc' }, { id: 'asc' }],
    include: { category: true },
  });
  return rows.map(mapDimensionRow);
}

export async function getDashboardQuestions(take = 4): Promise<Question[]> {
  const rows = await prisma.question.findMany({
    take,
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
    include: {
      options: { orderBy: { id: 'asc' } },
      dimensions: {
        include: { dimension: { include: { category: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });
  return rows.map(mapQuestionRow);
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createQuestion(
  input: CreateQuestionInput
): Promise<void> {
  await prisma.question.create({
    data: {
      question_text: input.text,
      question_desc: input.description,
      question_type: input.type,
      order_index: input.orderIndex,
      options: {
        create: input.options.map(o => ({
          option_label: o.label,
          option_value: o.value,
          option_score: o.score ?? null,
        })),
      },
      dimensions: {
        create: input.dimensions.map(d => ({
          dimension_id: d.dimensionId,
          weight_rate: d.weight ?? null,
        })),
      },
    },
  });
}

export async function updateQuestion(
  id: number,
  input: CreateQuestionInput
): Promise<void> {
  await prisma.question.update({
    where: { id },
    data: {
      question_text: input.text,
      question_desc: input.description,
      question_type: input.type,
      order_index: input.orderIndex,
      options: {
        deleteMany: {},
        create: input.options.map(o => ({
          option_label: o.label,
          option_value: o.value,
          option_score: o.score ?? null,
        })),
      },
      dimensions: {
        deleteMany: {},
        create: input.dimensions.map(d => ({
          dimension_id: d.dimensionId,
          weight_rate: d.weight ?? null,
        })),
      },
    },
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
