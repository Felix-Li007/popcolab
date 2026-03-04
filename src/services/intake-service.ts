import 'server-only';

import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import type {
  IntakeDimensionOption,
  IntakeForm,
  IntakeFormFormState,
  IntakeFormStatus,
  IntakeQuestionOption,
} from '@/types/intake-form-type';

type IntakeFormRow = {
  id: number;
  form_name: string;
  form_desc: string | null;
  form_status: number;
  form_type: string;
  created_by: number;
  created_by_user_name: string | null;
  created_by_email: string | null;
  question_ids: number[] | null;
  question_count: number | string | bigint;
  dimension_ids: number[] | null;
  dimension_count: number | string | bigint;
  created_at: Date | string;
  updated_at: Date | string;
};

type IntakeQuestionRow = {
  id: number;
  question_text: string;
  dimension_ids: number[] | null;
};

type IntakeDimensionRow = {
  id: number;
  index_name: string;
  index_key: string | null;
  category_name: string;
};

type CreateIntakeFormInput = {
  name: string;
  description: string;
  formType: string;
  status: IntakeFormStatus;
  questionIds: number[];
  dimensionIds: number[];
};

const INTAKE_FORM_STATUS_SET = new Set([0, 1]);
const INTAKE_FORM_NAME_MAX_LENGTH = 50;
const INTAKE_FORM_DESCRIPTION_MAX_LENGTH = 255;
const INTAKE_FORM_TYPE_MAX_LENGTH = 20;

function toNumber(value: number | string | bigint): number {
  return Number(value);
}

function toNullableTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeQuestionIds(questionIds: number[]): number[] {
  return Array.from(
    new Set(
      questionIds.filter(id => Number.isInteger(id) && id > 0).map(Number)
    )
  );
}

function normalizeDimensionIds(dimensionIds: number[]): number[] {
  return Array.from(
    new Set(
      dimensionIds.filter(id => Number.isInteger(id) && id > 0).map(Number)
    )
  );
}

async function resolveCreatorIdForCreate(
  tx: Prisma.TransactionClient
): Promise<number> {
  const fallbackUser = await tx.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (!fallbackUser) {
    throw new Error('Cannot create intake form: no users found.');
  }

  return fallbackUser.id;
}

function mapCreatedByUserName(row: IntakeFormRow): string {
  const byUserName = row.created_by_user_name?.trim();
  if (byUserName) return byUserName;

  const byEmail = row.created_by_email?.trim();
  if (byEmail) return byEmail.split('@')[0] || byEmail;

  return `user_${row.created_by}`;
}

function mapIntakeFormRow(row: IntakeFormRow): IntakeForm {
  const questionIds = Array.isArray(row.question_ids) ? row.question_ids : [];

  return {
    id: row.id,
    name: row.form_name,
    description: row.form_desc ?? '',
    formType: row.form_type,
    status: row.form_status as IntakeFormStatus,
    createdBy: row.created_by,
    createdByUserName: mapCreatedByUserName(row),
    questionIds,
    questionCount: toNumber(row.question_count),
    dimensionIds: Array.isArray(row.dimension_ids) ? row.dimension_ids : [],
    dimensionCount: toNumber(row.dimension_count),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function validateIntakeFormFields(fields: {
  name: string;
  description: string;
  formType: string;
  status: number;
  questionIds: number[];
  dimensionIds?: number[];
}): IntakeFormFormState['errors'] {
  const errors: IntakeFormFormState['errors'] = {};
  const normalizedName = fields.name.trim();
  const normalizedDescription = fields.description.trim();
  const normalizedType = fields.formType.trim();
  const normalizedQuestionIds = normalizeQuestionIds(fields.questionIds);

  if (!normalizedName) {
    errors.name = 'Form name is required.';
  } else if (normalizedName.length > INTAKE_FORM_NAME_MAX_LENGTH) {
    errors.name = `Form name must be ${INTAKE_FORM_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (normalizedDescription.length > INTAKE_FORM_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${INTAKE_FORM_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (!normalizedType) {
    errors.formType = 'Form type is required.';
  } else if (normalizedType.length > INTAKE_FORM_TYPE_MAX_LENGTH) {
    errors.formType = `Form type must be ${INTAKE_FORM_TYPE_MAX_LENGTH} characters or fewer.`;
  }

  if (!INTAKE_FORM_STATUS_SET.has(fields.status)) {
    errors.status = 'Status must be 0 (draft) or 1 (active).';
  }

  if (normalizedQuestionIds.length === 0) {
    errors.questions = 'Select at least one question.';
  }

  return errors;
}

export async function getIntakeForms(): Promise<IntakeForm[]> {
  try {
    const rows = await prisma.$queryRaw<IntakeFormRow[]>(Prisma.sql`
      SELECT
        f.id,
        f.form_name,
        f.form_desc,
        f.form_status,
        f.form_type,
        f.created_by,
        u.user_name AS created_by_user_name,
        u.email AS created_by_email,
        COALESCE(
          (
            SELECT ARRAY_AGG(fq.question_id ORDER BY fq.question_id)
            FROM "form_question" fq
            WHERE fq.form_id = f.id
          ),
          ARRAY[]::INTEGER[]
        ) AS question_ids,
        COALESCE(
          (
            SELECT COUNT(*)::int
            FROM "form_question" fq
            WHERE fq.form_id = f.id
          ),
          0
        )::int AS question_count,
        COALESCE(
          (
            SELECT ARRAY_AGG(fd.dimension_id ORDER BY fd.dimension_id)
            FROM "form_dimension" fd
            WHERE fd.form_id = f.id
          ),
          ARRAY[]::INTEGER[]
        ) AS dimension_ids,
        COALESCE(
          (
            SELECT COUNT(*)::int
            FROM "form_dimension" fd
            WHERE fd.form_id = f.id
          ),
          0
        )::int AS dimension_count,
        f.created_at,
        f.updated_at
      FROM "intake_form" f
      LEFT JOIN "user" u ON u.id = f.created_by
      ORDER BY f.updated_at DESC, f.id DESC
    `);
    return rows.map(mapIntakeFormRow);
  } catch {
    return [];
  }
}

export async function getIntakeQuestionOptions(): Promise<
  IntakeQuestionOption[]
> {
  try {
    const rows = await prisma.$queryRaw<IntakeQuestionRow[]>(Prisma.sql`
      SELECT
        q.id,
        q.question_text,
        COALESCE(
          (
            SELECT ARRAY_AGG(qd.dimension_id ORDER BY qd.dimension_id)
            FROM "question_dimension" qd
            WHERE qd.question_id = q.id
          ),
          ARRAY[]::INTEGER[]
        ) AS dimension_ids
      FROM "question" q
      ORDER BY q.order_index ASC NULLS LAST, q.id ASC
    `);

    return rows.map(row => ({
      id: row.id,
      text: row.question_text,
      dimensionIds: Array.isArray(row.dimension_ids) ? row.dimension_ids : [],
    }));
  } catch {
    return [];
  }
}

export async function getIntakeDimensionOptions(): Promise<
  IntakeDimensionOption[]
> {
  try {
    const rows = await prisma.$queryRaw<IntakeDimensionRow[]>(Prisma.sql`
      SELECT
        d.id,
        d.index_name,
        d.index_key,
        c.category_name
      FROM "dimension_index" d
      INNER JOIN "dimension_category" c ON c.id = d.category_id
      ORDER BY c.category_name ASC, d.index_name ASC, d.id ASC
    `);

    return rows.map(row => ({
      id: row.id,
      indexName: row.index_name,
      indexKey: row.index_key,
      categoryName: row.category_name,
    }));
  } catch {
    return [];
  }
}

export async function createIntakeForm(
  input: CreateIntakeFormInput
): Promise<void> {
  const questionIds = normalizeQuestionIds(input.questionIds);
  const dimensionIds = normalizeDimensionIds(input.dimensionIds);

  await prisma.$transaction(async tx => {
    const resolvedCreatedBy = await resolveCreatorIdForCreate(tx);
    const inserted = await tx.$queryRaw<{ id: number }[]>(Prisma.sql`
      INSERT INTO "intake_form" (
        "form_name",
        "form_desc",
        "form_status",
        "form_type",
        "created_by",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${input.name},
        ${toNullableTrimmed(input.description)},
        ${input.status},
        ${input.formType},
        ${resolvedCreatedBy},
        NOW(),
        NOW()
      )
      RETURNING "id"
    `);

    const formId = inserted[0]?.id;
    if (!formId) return;

    if (questionIds.length > 0) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "form_question" (
          "form_id",
          "question_id",
          "created_at",
          "updated_at"
        )
        SELECT
          ${formId},
          qid,
          NOW(),
          NOW()
        FROM UNNEST(ARRAY[${Prisma.join(questionIds)}]::INTEGER[]) AS qid
      `);
    }

    if (dimensionIds.length > 0) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "form_dimension" (
          "form_id",
          "dimension_id",
          "created_at",
          "updated_at"
        )
        SELECT
          ${formId},
          did,
          NOW(),
          NOW()
        FROM UNNEST(ARRAY[${Prisma.join(dimensionIds)}]::INTEGER[]) AS did
      `);
    }
  });
}

export async function updateIntakeForm(
  id: number,
  input: CreateIntakeFormInput
): Promise<void> {
  const questionIds = normalizeQuestionIds(input.questionIds);
  const dimensionIds = normalizeDimensionIds(input.dimensionIds);

  await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      UPDATE "intake_form"
      SET
        "form_name" = ${input.name},
        "form_desc" = ${toNullableTrimmed(input.description)},
        "form_status" = ${input.status},
        "form_type" = ${input.formType},
        "updated_at" = NOW()
      WHERE "id" = ${id}
    `;

    await tx.$executeRaw`
      DELETE FROM "form_question"
      WHERE "form_id" = ${id}
    `;

    await tx.$executeRaw`
      DELETE FROM "form_dimension"
      WHERE "form_id" = ${id}
    `;

    if (questionIds.length > 0) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "form_question" (
          "form_id",
          "question_id",
          "created_at",
          "updated_at"
        )
        SELECT
          ${id},
          qid,
          NOW(),
          NOW()
        FROM UNNEST(ARRAY[${Prisma.join(questionIds)}]::INTEGER[]) AS qid
      `);
    }

    if (dimensionIds.length > 0) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "form_dimension" (
          "form_id",
          "dimension_id",
          "created_at",
          "updated_at"
        )
        SELECT
          ${id},
          did,
          NOW(),
          NOW()
        FROM UNNEST(ARRAY[${Prisma.join(dimensionIds)}]::INTEGER[]) AS did
      `);
    }
  });
}

export async function deleteIntakeForm(id: number): Promise<void> {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`
      DELETE FROM "form_question"
      WHERE "form_id" = ${id}
    `;
    await tx.$executeRaw`
      DELETE FROM "form_dimension"
      WHERE "form_id" = ${id}
    `;
    await tx.$executeRaw`
      DELETE FROM "intake_form"
      WHERE "id" = ${id}
    `;
  });
}
