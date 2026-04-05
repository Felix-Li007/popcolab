import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ConstraintMode,
  FormName,
  InviteStatus,
  PrismaClient,
  ProposalStatus,
  RequestStatus,
  type Prisma,
} from '@/libs/prisma/client';
import { Pool } from 'pg';

type RequestPreferenceSeed = {
  dimensionKey: string;
  desiredScore: number;
};

type RequestSeed = {
  objective_category: string;
  request_status: RequestStatus;
  budget_min: string;
  budget_max: string;
  delivery_method: string;
  duration_max: number;
  participant_count: number;
  capacity_max: number;
  constraint_mode: ConstraintMode;
  preferred_in_days: number;
  notes_for_admin: string;
  expires_in_hours: number;
  preferences: RequestPreferenceSeed[];
  invited_users: Array<{
    user_name: string;
    user_email: string;
    invited_status: InviteStatus;
    expires_in_hours: number;
    respond_in_hours?: number;
  }>;
  proposals: Array<{
    experience_titles: string[];
    target_experience_count?: number;
    proposal_status: ProposalStatus;
    objective_alignment: string;
    base_score: string;
    risk_adjustment: string;
    rationale_desc: string;
  }>;
};

const requestSeedRows: RequestSeed[] = [
  {
    objective_category: 'Team Bonding',
    request_status: RequestStatus.OPENED,
    budget_min: '1000',
    budget_max: '2500',
    delivery_method: 'onsite',
    duration_max: 90,
    participant_count: 18,
    capacity_max: 24,
    constraint_mode: ConstraintMode.SOFT,
    preferred_in_days: 14,
    notes_for_admin: 'Team prefers a workshop format with a short debrief.',
    expires_in_hours: 72,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 4 },
      { dimensionKey: 'team_readiness', desiredScore: 3 },
      { dimensionKey: 'debrief_importance', desiredScore: 4 },
    ],
    invited_users: [
      {
        user_name: 'Mia Wong',
        user_email: 'mia.wong+request1@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 48,
        respond_in_hours: 6,
      },
      {
        user_name: 'Liam Chen',
        user_email: 'liam.chen+request1@popcolab.test',
        invited_status: InviteStatus.pending,
        expires_in_hours: 48,
      },
      {
        user_name: 'Nora Patel',
        user_email: 'nora.patel+request1@popcolab.test',
        invited_status: InviteStatus.rejected,
        expires_in_hours: 48,
        respond_in_hours: 10,
      },
    ],
    proposals: [
      {
        experience_titles: [
          'Pop CoLab Imagination Station',
          'Pop Trivia (Pub Trivia)',
          'Board & Online Interactive Gaming Experience',
          'Team Building Through Wellness Drumming',
        ],
        target_experience_count: 5,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment:
          'Strong match for collaborative creativity outcomes',
        base_score: '82',
        risk_adjustment: '4',
        rationale_desc:
          'Balanced activity level and facilitation for mixed team readiness',
      },
    ],
  },
  {
    objective_category: 'Team Building',
    request_status: RequestStatus.PENDING,
    budget_min: '500',
    budget_max: '1500',
    delivery_method: 'virtual',
    duration_max: 60,
    participant_count: 10,
    capacity_max: 16,
    constraint_mode: ConstraintMode.HARD,
    preferred_in_days: 7,
    notes_for_admin: 'Needs remote-friendly options and strict budget control.',
    expires_in_hours: 48,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 3 },
      { dimensionKey: 'team_readiness', desiredScore: 4 },
      { dimensionKey: 'debrief_importance', desiredScore: 2 },
    ],
    invited_users: [
      {
        user_name: 'Eva Garcia',
        user_email: 'eva.garcia+request2@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 36,
        respond_in_hours: 4,
      },
      {
        user_name: 'Noah Kim',
        user_email: 'noah.kim+request2@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 36,
        respond_in_hours: 8,
      },
    ],
    proposals: [
      {
        experience_titles: ['Pop Trivia (Pub Trivia)'],
        proposal_status: ProposalStatus.ACCEPTED,
        objective_alignment:
          'Good fit for distributed teams and lighter social intensity',
        base_score: '88',
        risk_adjustment: '2',
        rationale_desc:
          'Virtual-compatible and aligns with team engagement objective',
      },
      {
        experience_titles: ['Board & Online Interactive Gaming Experience'],
        proposal_status: ProposalStatus.REJECTED,
        objective_alignment: 'Secondary fit with optional competition elements',
        base_score: '76',
        risk_adjustment: '6',
        rationale_desc:
          'Alternative option with higher cognitive load for some members',
      },
    ],
  },
  {
    objective_category: 'Team Development',
    request_status: RequestStatus.CLOSED,
    budget_min: '2500',
    budget_max: '5000',
    delivery_method: 'hybrid',
    duration_max: 120,
    participant_count: 32,
    capacity_max: 40,
    constraint_mode: ConstraintMode.SOFT,
    preferred_in_days: 30,
    notes_for_admin:
      'Large cross-functional cohort; prioritize accessibility and pacing.',
    expires_in_hours: -24,
    preferences: [
      { dimensionKey: 'psych_safety', desiredScore: 5 },
      { dimensionKey: 'team_readiness', desiredScore: 5 },
      { dimensionKey: 'debrief_importance', desiredScore: 5 },
    ],
    invited_users: [
      {
        user_name: 'Ava Singh',
        user_email: 'ava.singh+request3@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 24,
        respond_in_hours: 3,
      },
      {
        user_name: 'Ethan Brown',
        user_email: 'ethan.brown+request3@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 24,
        respond_in_hours: 5,
      },
      {
        user_name: 'Sophia Lee',
        user_email: 'sophia.lee+request3@popcolab.test',
        invited_status: InviteStatus.accepted,
        expires_in_hours: 24,
        respond_in_hours: 7,
      },
    ],
    proposals: [
      {
        experience_titles: ['Team Building Through Wellness Drumming'],
        proposal_status: ProposalStatus.ACCEPTED,
        objective_alignment:
          'Excellent alignment with large-group cohesion objective',
        base_score: '93',
        risk_adjustment: '3',
        rationale_desc:
          'Scales well for capacity and supports energizing shared rhythm',
      },
    ],
  },
];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function resolveRequestSeedUserId(
  prisma: PrismaClient
): Promise<number | null> {
  const preferredIdRaw = process.env.REQUEST_SEED_USER_ID?.trim();
  if (preferredIdRaw) {
    const preferredId = Number.parseInt(preferredIdRaw, 10);
    if (Number.isInteger(preferredId) && preferredId > 0) {
      return preferredId;
    }

    throw new Error(
      `Invalid REQUEST_SEED_USER_ID=${preferredIdRaw}. Expected a positive integer.`
    );
  }

  const preferredEmail = process.env.REQUEST_SEED_USER_EMAIL?.trim();
  if (preferredEmail) {
    const user = await prisma.user.findUnique({
      where: { email: preferredEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error(
        `No user found for REQUEST_SEED_USER_EMAIL=${preferredEmail}`
      );
    }

    return user.id;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, email: true },
  });

  if (!firstUser) {
    console.warn(
      '⚠️  Skipping request seed because no users exist. Set REQUEST_SEED_USER_ID or REQUEST_SEED_USER_EMAIL after a user is available.'
    );
    return null;
  }

  console.log(`Using request seed user ${firstUser.email} (#${firstUser.id})`);
  return firstUser.id;
}

async function resolveDimensionIdByKey(
  prisma: PrismaClient,
  keys: string[]
): Promise<Map<string, number>> {
  const rows = await prisma.dimensionIndex.findMany({
    where: {
      index_key: {
        in: keys,
      },
    },
    select: {
      id: true,
      index_key: true,
    },
  });

  const idByKey = new Map<string, number>();
  for (const row of rows) {
    if (row.index_key) {
      idByKey.set(row.index_key, row.id);
    }
  }

  const missingKeys = keys.filter(key => !idByKey.has(key));
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing dimension indexes for request seed: ${missingKeys.join(', ')}`
    );
  }

  return idByKey;
}

async function resolveRequestQuestionIdByDimensionKey(
  prisma: PrismaClient,
  dimensionIdByKey: Map<string, number>
): Promise<Map<string, number>> {
  const entries = Array.from(dimensionIdByKey.entries());
  const dimensionIds = entries.map(([, id]) => id);

  const questions = await prisma.question.findMany({
    where: {
      form_name: FormName.REQUEST,
      dimension_id: {
        in: dimensionIds,
      },
    },
    select: {
      id: true,
      dimension_id: true,
      order_index: true,
    },
    orderBy: [{ order_index: 'asc' }, { id: 'asc' }],
  });

  const firstQuestionIdByDimensionId = new Map<number, number>();
  for (const question of questions) {
    if (question.dimension_id === null) continue;
    if (!firstQuestionIdByDimensionId.has(question.dimension_id)) {
      firstQuestionIdByDimensionId.set(question.dimension_id, question.id);
    }
  }

  const questionIdByKey = new Map<string, number>();
  for (const [key, dimensionId] of entries) {
    const questionId = firstQuestionIdByDimensionId.get(dimensionId);
    if (!questionId) {
      throw new Error(
        `Missing REQUEST question for dimension key: ${key} (dimension_id=${dimensionId})`
      );
    }

    questionIdByKey.set(key, questionId);
  }

  return questionIdByKey;
}

async function upsertRequest(
  prisma: PrismaClient,
  userId: number,
  row: RequestSeed
): Promise<{ id: number }> {
  const requestData: Prisma.RequestUncheckedCreateInput = {
    user_id: userId,
    objective_category: row.objective_category,
    request_status: row.request_status,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    delivery_method: row.delivery_method,
    duration_max: row.duration_max,
    participant_count: row.participant_count,
    capacity_max: row.capacity_max,
    constraint_mode: row.constraint_mode,
    preferred_date: addDays(new Date(), row.preferred_in_days),
    notes_for_admin: row.notes_for_admin,
    expired_at: addHours(new Date(), row.expires_in_hours),
  };

  const existing = await prisma.request.findFirst({
    where: {
      user_id: userId,
      objective_category: row.objective_category,
      request_status: row.request_status,
      budget_min: row.budget_min,
      budget_max: row.budget_max,
      delivery_method: row.delivery_method,
      duration_max: row.duration_max,
      participant_count: row.participant_count,
      capacity_max: row.capacity_max,
      constraint_mode: row.constraint_mode,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.request.update({
      where: { id: existing.id },
      data: requestData,
      select: { id: true },
    });
  }

  return prisma.request.create({
    data: requestData,
    select: { id: true },
  });
}

async function resolveExperienceIdByTitle(
  prisma: PrismaClient,
  titles: string[]
): Promise<Map<string, number>> {
  const rows = await prisma.experience.findMany({
    where: {
      experience_title: {
        in: titles,
      },
    },
    select: {
      id: true,
      experience_title: true,
    },
  });

  const idByTitle = new Map<string, number>();
  for (const row of rows) {
    idByTitle.set(row.experience_title, row.id);
  }

  const missing = titles.filter(title => !idByTitle.has(title));
  if (missing.length > 0) {
    throw new Error(
      `Missing experiences for request proposal seed: ${missing.join(', ')}`
    );
  }

  return idByTitle;
}

function buildProposalExperienceTitles(params: {
  proposal: RequestSeed['proposals'][number];
  fallbackTitles: string[];
}): string[] {
  const deduped = Array.from(new Set(params.proposal.experience_titles));
  const targetCount = Math.max(1, params.proposal.target_experience_count ?? 5);

  if (deduped.length >= targetCount) {
    return deduped.slice(0, targetCount);
  }

  const merged = [...deduped];
  for (const title of params.fallbackTitles) {
    if (merged.includes(title)) continue;
    merged.push(title);
    if (merged.length >= targetCount) break;
  }

  return merged;
}

export async function seedRequests(prisma: PrismaClient): Promise<void> {
  const userId = await resolveRequestSeedUserId(prisma);
  if (!userId) return;

  const preferenceKeys = Array.from(
    new Set(
      requestSeedRows.flatMap(row =>
        row.preferences.map(preference => preference.dimensionKey)
      )
    )
  );
  const dimensionIdByKey = await resolveDimensionIdByKey(
    prisma,
    preferenceKeys
  );
  const requestQuestionIdByDimensionKey =
    await resolveRequestQuestionIdByDimensionKey(prisma, dimensionIdByKey);
  const proposalTitles = Array.from(
    new Set(
      requestSeedRows.flatMap(row =>
        row.proposals.flatMap(proposal => proposal.experience_titles)
      )
    )
  );
  const allExperiences = await prisma.experience.findMany({
    select: { id: true, experience_title: true },
    orderBy: [{ popularity_index: 'desc' }, { id: 'asc' }],
  });
  const experienceIdByTitle = new Map(
    allExperiences.map(row => [row.experience_title, row.id])
  );
  const missing = proposalTitles.filter(
    title => !experienceIdByTitle.has(title)
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing experiences for request proposal seed: ${missing.join(', ')}`
    );
  }
  const allExperienceTitles = allExperiences.map(row => row.experience_title);

  for (const row of requestSeedRows) {
    const request = await upsertRequest(prisma, userId, row);

    await prisma.requestPreference.deleteMany({
      where: { request_id: request.id },
    });

    if (row.preferences.length > 0) {
      await prisma.requestPreference.createMany({
        data: row.preferences.map(preference => ({
          request_id: request.id,
          dimension_id: dimensionIdByKey.get(preference.dimensionKey) as number,
          question_id: requestQuestionIdByDimensionKey.get(
            preference.dimensionKey
          ) as number,
          desired_value: String(preference.desiredScore),
        })),
      });
    }

    await prisma.invitedUser.deleteMany({ where: { request_id: request.id } });
    if (row.invited_users.length > 0) {
      await prisma.invitedUser.createMany({
        data: row.invited_users.map((invite, index) => ({
          request_id: request.id,
          invited_status: invite.invited_status,
          invited_token: `seed-request-${request.id}-invite-${index + 1}`,
          user_name: invite.user_name,
          user_email: invite.user_email,
          expired_at: addHours(new Date(), invite.expires_in_hours),
          respond_at:
            invite.respond_in_hours === undefined
              ? null
              : addHours(new Date(), invite.respond_in_hours),
        })),
      });
    }

    await prisma.proposal.deleteMany({ where: { request_id: request.id } });
    if (row.proposals.length > 0) {
      for (const proposal of row.proposals) {
        const proposalExperienceTitles = buildProposalExperienceTitles({
          proposal,
          fallbackTitles: allExperienceTitles,
        });

        if (proposalExperienceTitles.length === 0) {
          throw new Error(
            `No experiences could be resolved for request proposal seed: ${row.objective_category}`
          );
        }

        const createdProposal = await prisma.proposal.create({
          data: {
            request_id: request.id,
            proposal_status: proposal.proposal_status,
            objective_alignment: proposal.objective_alignment,
          },
          select: { id: true },
        });

        await prisma.proposalExperience.createMany({
          data: proposalExperienceTitles.map(experienceTitle => ({
            proposal_id: createdProposal.id,
            experience_id: experienceIdByTitle.get(experienceTitle) as number,
            base_score: proposal.base_score,
            risk_adjustment: proposal.risk_adjustment,
            rationale_desc: proposal.rationale_desc,
          })),
          skipDuplicates: true,
        });
      }
    }

    console.log(
      `Created/updated request: ${row.objective_category} (${row.delivery_method})`
    );
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed requests.');
  }

  const adapter = new PrismaPg(
    new Pool({
      connectionString,
      max: 1,
    })
  );
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Seeding requests...');
    await seedRequests(prisma);
    console.log('✅ Requests seeded');
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    console.error('❌ Error seeding requests:', error);
    process.exit(1);
  });
}
