import type { PrismaClient } from '@/libs/prisma/client';
import type { QuestionIdByOrder } from './questions.seed';
import type { SeedSchemaState } from './schema-state';

type IntakeFormSeed = {
  form_name: string;
  form_desc: string | null;
  form_status: 0 | 1;
  form_type: string;
  created_by_email: string;
  question_order_indexes: number[];
  dimension_index_keys: string[];
};

type SeedIntakeFormsInput = Pick<
  SeedSchemaState,
  'hasIntakeFormTable' | 'hasFormQuestionTable' | 'hasFormDimensionTable'
> & {
  userIdByEmail: Map<string, number>;
  questionIdByOrder: QuestionIdByOrder;
  dimensionIdByKey: Map<string, number>;
};

const intakeForms: IntakeFormSeed[] = [
  {
    form_name: 'Corporate Onboarding Intake',
    form_desc: 'Baseline form for new team members joining a corporate cohort.',
    form_status: 1,
    form_type: 'onboarding',
    created_by_email: 'ava.hughes@northstar.io',
    question_order_indexes: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ],
    dimension_index_keys: [
      'social_intensity',
      'personality_director',
      'personality_creator_artist',
    ],
  },
  {
    form_name: 'Facilitator Discovery Form',
    form_desc: 'Used by facilitators to identify participant play tendencies.',
    form_status: 1,
    form_type: 'discovery',
    created_by_email: 'sophia.reed@helix.ai',
    question_order_indexes: [3, 4, 6, 9, 12],
    dimension_index_keys: [
      'personality_joker',
      'spotlight_level',
      'personality_explorer',
    ],
  },
  {
    form_name: 'Workshop Pilot Draft',
    form_desc: 'Draft intake for pilot workshop validation.',
    form_status: 0,
    form_type: 'pilot',
    created_by_email: 'liam.brown@verve.studio',
    question_order_indexes: [2, 7, 10],
    dimension_index_keys: ['competition_level', 'cognitive_load'],
  },
  {
    form_name: 'Leadership Deep Dive Intake',
    form_desc:
      'Focused intake for leadership behaviours, delegation, and alignment.',
    form_status: 1,
    form_type: 'leadership',
    created_by_email: 'ava.hughes@northstar.io',
    question_order_indexes: [1, 5, 8, 13, 14, 17],
    dimension_index_keys: [
      'personality_director',
      'social_intensity',
      'spotlight_level',
    ],
  },
  {
    form_name: 'Remote Team Fit Scan',
    form_desc:
      'Screens distributed teams for communication rhythm and facilitation fit.',
    form_status: 1,
    form_type: 'remote',
    created_by_email: 'sophia.reed@helix.ai',
    question_order_indexes: [2, 6, 9, 15, 16, 18],
    dimension_index_keys: [
      'social_intensity',
      'personality_explorer',
      'personality_collector',
    ],
  },
  {
    form_name: 'Culture Sprint Intake',
    form_desc:
      'Short-form intake for high-tempo workshops and culture sprint sessions.',
    form_status: 0,
    form_type: 'sprint',
    created_by_email: 'liam.brown@verve.studio',
    question_order_indexes: [3, 4, 7, 10, 19, 20],
    dimension_index_keys: [
      'personality_joker',
      'competition_level',
      'personality_creator_artist',
      'cognitive_load',
    ],
  },
];

export async function seedIntakeForms(
  prisma: PrismaClient,
  input: SeedIntakeFormsInput
): Promise<void> {
  if (
    !input.hasIntakeFormTable ||
    !input.hasFormQuestionTable ||
    !input.hasFormDimensionTable
  ) {
    console.warn(
      '⚠️  Skipping intake_form seeds because intake_form/form_question/form_dimension table does not exist yet.'
    );
    return;
  }

  for (const formSeed of intakeForms) {
    const createdById = input.userIdByEmail.get(formSeed.created_by_email);
    if (!createdById) {
      console.warn(
        `⚠️  No user ${formSeed.created_by_email} found for intake form ${formSeed.form_name}`
      );
      continue;
    }

    const insertedRows = await prisma.$queryRaw<{ id: number }[]>`
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
        ${formSeed.form_name},
        ${formSeed.form_desc},
        ${formSeed.form_status},
        ${formSeed.form_type},
        ${createdById},
        NOW(),
        NOW()
      )
      RETURNING "id"
    `;

    const formId = insertedRows[0]?.id;
    if (!formId) {
      console.warn(`⚠️  Failed to create intake form: ${formSeed.form_name}`);
      continue;
    }

    const questionIds = Array.from(
      new Set(
        formSeed.question_order_indexes
          .map(order => input.questionIdByOrder.get(order))
          .filter((id): id is number => typeof id === 'number')
      )
    );
    const dimensionIds = Array.from(
      new Set(
        formSeed.dimension_index_keys
          .map(indexKey => input.dimensionIdByKey.get(indexKey))
          .filter((id): id is number => typeof id === 'number')
      )
    );

    for (const questionId of questionIds) {
      await prisma.$executeRaw`
        INSERT INTO "form_question" (
          "form_id",
          "question_id",
          "created_at",
          "updated_at"
        )
        VALUES (${formId}, ${questionId}, NOW(), NOW())
      `;
    }

    for (const dimensionId of dimensionIds) {
      await prisma.$executeRaw`
        INSERT INTO "form_dimension" (
          "form_id",
          "dimension_id",
          "created_at",
          "updated_at"
        )
        VALUES (${formId}, ${dimensionId}, NOW(), NOW())
      `;
    }

    console.log(
      `✅ Created intake form: ${formSeed.form_name} (${questionIds.length} question link(s), ${dimensionIds.length} dimension link(s))`
    );
  }
}
