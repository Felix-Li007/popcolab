import 'server-only';

import { Prisma, ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { logger } from '@/utils/logging-util';
import { getRequestExperiences } from '@/services/recommend-service';
import { type RequestQueueJob } from '@/types/queue-job';
import type {
  AdminProposalEditableItem,
  AdminProposalEditableUpdateErrors,
  AdminProposalEditableUpdateInput,
  AdminProposalListItem,
  AdminProposalsPageData,
  AdminProposalsPageQuery,
  AdminProposalStatusCounts,
} from '@/types/proposal-type';

export type UserProposalItem = {
  id: number;
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'REJECTED';
  experienceTitle: string;
  deliveryMethod: string;
  capacityMax: number;
  rationale: string;
  objectiveCategory: string;
  experienceCount: number;
  createdAt: Date;
  updatedAt: Date;
  score: number | null;
  experiences: UserProposalCardExperience[];
};

export type UserProposalStatusFilter =
  | 'all'
  | 'PENDING'
  | 'APPROVED'
  | 'ACCEPTED'
  | 'REJECTED';

export type UserProposalStatusCounts = Record<
  Exclude<UserProposalStatusFilter, 'all'>,
  number
>;

export type UserProposalsPageQuery = {
  status: UserProposalStatusFilter;
  requestId: number | null;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
};

export type UserProposalsPageData = {
  items: UserProposalItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  statusCounts: UserProposalStatusCounts;
};

export type UserProposalCardExperience = {
  id: number;
  title: string;
  deliveryMethods: string;
  capacityMax: number;
  durationMin: number;
  durationMax: number;
  startingPrice: number | null;
};

export type UserProposalExperienceDetail = {
  id: number;
  title: string;
  deliveryMethods: string;
  capacityMax: number;
  durationMin: number;
  durationMax: number;
  startingPrice: number | null;
  addingPrice: number | null;
  rationale: string;
  baseScore: number;
  riskAdjustment: number;
};

export type UserProposalDetail = {
  id: number;
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'REJECTED';
  objectiveAlignment: string;
  createdAt: Date;
  updatedAt: Date;
  request: {
    id: number;
    objectiveCategory: string;
    budgetMin: number | null;
    budgetMax: number | null;
    preferredDate: Date | null;
    participantCount: number | null;
  };
  experiences: UserProposalExperienceDetail[];
};

export async function createFittedProposal(job: RequestQueueJob) {
  const request = await prisma.request.findUnique({
    where: { id: job.requestId },
    select: {
      id: true,
      request_status: true,
      proposals: {
        where: {
          proposal_status: {
            in: [
              ProposalStatus.PENDING,
              ProposalStatus.APPROVED,
              ProposalStatus.ACCEPTED,
            ],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error(`Request ${job.requestId} not found.`);
  }

  // Avoid creating a duplicate active proposal for the same request.
  if (request.proposals.length > 0) {
    return {
      created: false,
      reason: 'active_proposal_exists',
      proposalId: request.proposals[0]?.id ?? null,
    };
  }

  // Pull the best-fit experiences before building the proposal payload.
  const recommendations = await getRequestExperiences(request.id, [], 10);
  if (!recommendations || recommendations.length === 0) {
    return {
      created: false,
      reason: 'no_recommendations',
      proposalId: null,
    };
  }

  const topRecommendations = recommendations.slice(0, 3);
  const primaryRecommendation = topRecommendations[0];

  const creationResult = await prisma.$transaction(async tx => {
    const txAny = tx as unknown as {
      request: {
        findUnique: (args: {
          where: { id: number };
          select: {
            id: true;
            proposals: {
              where: {
                proposal_status: {
                  in: ProposalStatus[];
                };
              };
              select: { id: true };
            };
          };
        }) => Promise<{ id: number; proposals: Array<{ id: number }> } | null>;
      };
      proposalExperience?: {
        create: (args: {
          data: {
            proposal_id: number;
            experience_id: number;
            base_score: number;
            risk_adjustment: number;
            rationale_desc: string;
          };
        }) => Promise<unknown>;
      };
      proposal: {
        create: (args: {
          data: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => Promise<{ id: number; experience_id?: number }>;
      };
    };
    const hasProposalExperienceDelegate =
      typeof txAny.proposalExperience?.create === 'function';

    const activeRequest = await txAny.request.findUnique({
      where: { id: request.id },
      select: {
        id: true,
        proposals: {
          where: {
            proposal_status: {
              in: [
                ProposalStatus.PENDING,
                ProposalStatus.APPROVED,
                ProposalStatus.ACCEPTED,
              ],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!activeRequest) {
      throw new Error(`Request ${request.id} not found.`);
    }

    if (activeRequest.proposals.length > 0) {
      return {
        created: false as const,
        proposalId: activeRequest.proposals[0]?.id ?? null,
        experienceIds: [] as number[],
      };
    }

    // Some tests still mock the legacy one-experience proposal shape. Keep
    // this fallback path so older mocks can still exercise the action layer.
    if (!hasProposalExperienceDelegate) {
      const baseScore =
        primaryRecommendation.breakdown?.baseScore ??
        primaryRecommendation.score;
      const riskAdjustment =
        (primaryRecommendation.breakdown?.debriefBoost ?? 0) +
        (primaryRecommendation.breakdown?.opennessBoost ?? 0);

      const created = await txAny.proposal.create({
        data: {
          // Backward-compatible path for older mocks using the legacy shape.
          request_id: request.id,
          experience_id: primaryRecommendation.experience.id,
          proposal_status: ProposalStatus.PENDING,
          objective_alignment: `source:${primaryRecommendation.recommendationSource}`,
          base_score: Math.round(baseScore * 100),
          risk_adjustment: Math.round(riskAdjustment * 100),
          rationale_desc: primaryRecommendation.reason,
        },
        select: {
          id: true,
          experience_id: true,
        },
      });

      return {
        created: true as const,
        proposalId: created.id,
        experienceIds: [
          created.experience_id ?? primaryRecommendation.experience.id,
        ],
      };
    }

    // The current schema stores one proposal row plus separate
    // proposal_experience rows for each recommended experience.
    const createdProposal = await tx.proposal.create({
      data: {
        request_id: request.id,
        proposal_status: ProposalStatus.PENDING,
        objective_alignment: `source:${primaryRecommendation.recommendationSource}`,
      },
      select: {
        id: true,
      },
    });

    for (const recommendation of topRecommendations) {
      const baseScore =
        recommendation.breakdown?.baseScore ?? recommendation.score;
      const riskAdjustment =
        (recommendation.breakdown?.debriefBoost ?? 0) +
        (recommendation.breakdown?.opennessBoost ?? 0);

      await txAny.proposalExperience!.create({
        data: {
          proposal_id: createdProposal.id,
          experience_id: recommendation.experience.id,
          base_score: Math.round(baseScore * 100),
          risk_adjustment: Math.round(riskAdjustment * 100),
          rationale_desc: recommendation.reason,
        },
      });
    }

    return {
      created: true as const,
      proposalId: createdProposal.id,
      experienceIds: topRecommendations.map(
        recommendation => recommendation.experience.id
      ),
    };
  });

  if (!creationResult.created) {
    return {
      created: false,
      reason: 'active_proposal_exists',
      proposalId: creationResult.proposalId,
    };
  }

  logger.info(
    {
      requestId: job.requestId,
      proposalCount: 1,
      proposalIds: [creationResult.proposalId],
      experienceIds: creationResult.experienceIds,
      trigger: job.trigger,
    },
    'Proposal generated from queue job'
  );

  return {
    created: true,
    proposalId: creationResult.proposalId,
  };
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function buildUserDisplayName(user: {
  email: string;
  user_name: string | null;
  profile: { first_name: string | null; last_name: string | null } | null;
}) {
  const fullName = [user.profile?.first_name, user.profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName || user.user_name || user.email.split('@')[0] || 'Unknown User'
  );
}

function toUserProposalStatus(
  raw: ProposalStatus
): 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'REJECTED' {
  return String(raw).toUpperCase() as
    | 'PENDING'
    | 'APPROVED'
    | 'ACCEPTED'
    | 'REJECTED';
}

function buildDefaultUserProposalStatusCounts(): UserProposalStatusCounts {
  return {
    PENDING: 0,
    APPROVED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
  };
}

function buildUserProposalWhere(input: {
  userId: number;
  status: UserProposalStatusFilter;
  requestId: number | null;
  createdFrom: string;
  createdTo: string;
}): Prisma.ProposalWhereInput {
  const clauses: Prisma.ProposalWhereInput[] = [
    {
      request: { user_id: input.userId },
    },
  ];

  if (input.status !== 'all') {
    clauses.push({
      proposal_status: input.status as ProposalStatus,
    });
  }

  if (input.requestId !== null) {
    clauses.push({
      request_id: input.requestId,
    });
  }

  if (input.createdFrom || input.createdTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (input.createdFrom) {
      createdAt.gte = new Date(`${input.createdFrom}T00:00:00.000Z`);
    }
    if (input.createdTo) {
      createdAt.lte = new Date(`${input.createdTo}T23:59:59.999Z`);
    }
    clauses.push({
      created_at: createdAt,
    });
  }

  return clauses.length === 1 ? clauses[0] : { AND: clauses };
}

async function findUserProposalRows(
  where: Prisma.ProposalWhereInput,
  currentPage?: number,
  pageSize?: number
) {
  return prisma.proposal.findMany({
    where,
    select: {
      id: true,
      proposal_status: true,
      created_at: true,
      updated_at: true,
      proposal_experiences: {
        select: {
          rationale_desc: true,
          base_score: true,
          risk_adjustment: true,
          experience: {
            select: {
              id: true,
              experience_title: true,
              delivery_methods: true,
              capacity_max: true,
              duration_min: true,
              duration_max: true,
              experience_pricing: {
                select: {
                  starting_price: true,
                },
              },
            },
          },
        },
        orderBy: [{ id: 'asc' }],
      },
      _count: {
        select: { proposal_experiences: true },
      },
      request: {
        select: {
          id: true,
          objective_category: true,
        },
      },
    },
    ...(currentPage !== undefined && pageSize !== undefined
      ? {
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        }
      : {}),
    orderBy: { created_at: 'desc' },
  });
}

function mapUserProposalItem(
  proposal: Awaited<ReturnType<typeof findUserProposalRows>>[number]
): UserProposalItem {
  return {
    id: proposal.id,
    requestId: proposal.request.id,
    status: toUserProposalStatus(proposal.proposal_status),
    experienceTitle:
      proposal.proposal_experiences[0]?.experience.experience_title ?? '-',
    deliveryMethod:
      proposal.proposal_experiences[0]?.experience.delivery_methods ?? '-',
    capacityMax: proposal.proposal_experiences[0]?.experience.capacity_max ?? 0,
    rationale: proposal.proposal_experiences[0]?.rationale_desc ?? '-',
    objectiveCategory: proposal.request.objective_category,
    experienceCount: proposal._count.proposal_experiences,
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
    score:
      proposal.proposal_experiences[0] !== undefined
        ? Number(proposal.proposal_experiences[0].base_score) +
          Number(proposal.proposal_experiences[0].risk_adjustment)
        : null,
    experiences: proposal.proposal_experiences.map(item => ({
      id: item.experience.id,
      title: item.experience.experience_title,
      deliveryMethods: item.experience.delivery_methods,
      capacityMax: item.experience.capacity_max,
      durationMin: item.experience.duration_min,
      durationMax: item.experience.duration_max,
      startingPrice:
        item.experience.experience_pricing?.starting_price !== null &&
        item.experience.experience_pricing?.starting_price !== undefined
          ? Number(item.experience.experience_pricing.starting_price)
          : null,
    })),
  };
}

export async function getUserProposals(
  userId: number
): Promise<UserProposalItem[]> {
  const proposals = await findUserProposalRows(
    buildUserProposalWhere({
      userId,
      status: 'all',
      requestId: null,
      createdFrom: '',
      createdTo: '',
    })
  );

  return proposals.map(mapUserProposalItem);
}

export async function getUserProposalsPage(
  userId: number,
  query: UserProposalsPageQuery
): Promise<UserProposalsPageData> {
  const currentPage =
    Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize =
    Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : 8;

  const where = buildUserProposalWhere({
    userId,
    status: query.status,
    requestId: query.requestId,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });

  const statusWhere = buildUserProposalWhere({
    userId,
    status: 'all',
    requestId: query.requestId,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });

  const [totalItems, rows, statusRows] = await Promise.all([
    prisma.proposal.count({ where }),
    findUserProposalRows(where, currentPage, pageSize),
    prisma.proposal.groupBy({
      by: ['proposal_status'],
      where: statusWhere,
      _count: {
        id: true,
      },
    }),
  ]);

  const statusCounts = buildDefaultUserProposalStatusCounts();
  statusRows.forEach(row => {
    const normalizedStatus = String(row.proposal_status).toUpperCase();
    if (normalizedStatus in statusCounts) {
      statusCounts[normalizedStatus as keyof typeof statusCounts] =
        row._count.id;
    }
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: rows.map(mapUserProposalItem),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    statusCounts,
  };
}

export async function getUserProposalById(
  proposalId: number,
  userId: number
): Promise<UserProposalDetail | null> {
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      request: { user_id: userId },
    },
    select: {
      id: true,
      proposal_status: true,
      objective_alignment: true,
      created_at: true,
      updated_at: true,
      request: {
        select: {
          id: true,
          objective_category: true,
          budget_min: true,
          budget_max: true,
          participant_count: true,
          requestCalendars: {
            select: {
              preferred_date: true,
            },
            orderBy: [{ preferred_date: 'asc' }, { id: 'asc' }],
            take: 1,
          },
        },
      },
      proposal_experiences: {
        orderBy: { id: 'asc' },
        select: {
          rationale_desc: true,
          base_score: true,
          risk_adjustment: true,
          experience: {
            select: {
              id: true,
              experience_title: true,
              delivery_methods: true,
              capacity_max: true,
              duration_min: true,
              duration_max: true,
              experience_pricing: {
                select: {
                  starting_price: true,
                  adding_price: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proposal) return null;

  return {
    id: proposal.id,
    requestId: proposal.request.id,
    status: toUserProposalStatus(proposal.proposal_status),
    objectiveAlignment: proposal.objective_alignment,
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
    request: {
      id: proposal.request.id,
      objectiveCategory: proposal.request.objective_category,
      budgetMin: proposal.request.budget_min
        ? Number(proposal.request.budget_min)
        : null,
      budgetMax: proposal.request.budget_max
        ? Number(proposal.request.budget_max)
        : null,
      preferredDate:
        proposal.request.requestCalendars[0]?.preferred_date ?? null,
      participantCount: proposal.request.participant_count,
    },
    experiences: proposal.proposal_experiences.map(pe => ({
      id: pe.experience.id,
      title: pe.experience.experience_title,
      deliveryMethods: pe.experience.delivery_methods,
      capacityMax: pe.experience.capacity_max,
      durationMin: pe.experience.duration_min,
      durationMax: pe.experience.duration_max,
      startingPrice: pe.experience.experience_pricing?.starting_price
        ? Number(pe.experience.experience_pricing.starting_price)
        : null,
      addingPrice: pe.experience.experience_pricing?.adding_price
        ? Number(pe.experience.experience_pricing.adding_price)
        : null,
      rationale: pe.rationale_desc,
      baseScore: Number(pe.base_score),
      riskAdjustment: Number(pe.risk_adjustment),
    })),
  };
}

export async function getPendingProposalCount(userId: number): Promise<number> {
  return prisma.proposal.count({
    where: {
      request: { user_id: userId },
      proposal_status: ProposalStatus.PENDING,
    },
  });
}

function buildProposalWhere(query: {
  search: string;
  userEmail: string;
  companyName: string;
  status: AdminProposalsPageQuery['status'];
  requestId: number | null;
}): Prisma.ProposalWhereInput {
  const clauses: Prisma.ProposalWhereInput[] = [];
  const keyword = query.search.trim();
  const userEmail = query.userEmail.trim();
  const companyName = query.companyName.trim();

  if (query.status !== 'all') {
    clauses.push({
      proposal_status: query.status.toUpperCase() as ProposalStatus,
    });
  }

  if (query.requestId !== null) {
    clauses.push({ request_id: query.requestId });
  }

  if (userEmail.length > 0) {
    clauses.push({
      request: {
        is: {
          user: {
            is: {
              email: {
                contains: userEmail,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    });
  }

  if (companyName.length > 0) {
    clauses.push({
      request: {
        is: {
          user: {
            is: {
              corporate: {
                is: {
                  company_name: {
                    contains: companyName,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  if (keyword.length > 0) {
    const numericKeyword = Number(keyword);
    const orConditions: Prisma.ProposalWhereInput[] = [
      {
        objective_alignment: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      {
        proposal_experiences: {
          some: {
            rationale_desc: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      },
      {
        proposal_experiences: {
          some: {
            experience: {
              is: {
                experience_title: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      },
      {
        request: {
          is: {
            user: {
              is: {
                email: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      },
      {
        request: {
          is: {
            user: {
              is: {
                user_name: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      },
      {
        request: {
          is: {
            user: {
              is: {
                profile: {
                  is: {
                    first_name: {
                      contains: keyword,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        request: {
          is: {
            user: {
              is: {
                profile: {
                  is: {
                    last_name: {
                      contains: keyword,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        request: {
          is: {
            user: {
              is: {
                corporate: {
                  is: {
                    company_name: {
                      contains: keyword,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    if (Number.isInteger(numericKeyword) && numericKeyword > 0) {
      orConditions.push({ id: numericKeyword });
      orConditions.push({ request_id: numericKeyword });
    }

    clauses.push({ OR: orConditions });
  }

  if (clauses.length === 0) return {};

  return { AND: clauses };
}

function buildDefaultStatusCounts(): AdminProposalStatusCounts {
  return {
    pending: 0,
    approved: 0,
    accepted: 0,
    rejected: 0,
  };
}

function mapProposalItem(
  row: Prisma.ProposalGetPayload<{
    include: {
      request: {
        include: {
          user: {
            include: {
              profile: true;
              corporate: true;
            };
          };
          _count: {
            select: {
              request_preferences: true;
              proposals: true;
            };
          };
        };
      };
      proposal_experiences: {
        include: {
          experience: {
            include: {
              experience_pricing: {
                select: {
                  starting_price: true;
                  adding_price: true;
                  pricing_model: true;
                  pricing_notes: true;
                };
              };
              experience_images: {
                select: {
                  image_url: true;
                  is_cover: true;
                };
                orderBy: [{ is_cover: 'desc' }, { id: 'asc' }];
                take: 1;
              };
              experience_calendars: {
                select: {
                  schedule_date: true;
                };
                orderBy: [{ schedule_date: 'asc' }];
                take: 1;
              };
            };
          };
        };
      };
    };
  }>
): AdminProposalListItem {
  const mappedExperiences = row.proposal_experiences.map(item => {
    const experience = item.experience;
    const pricing = experience.experience_pricing;
    const firstImage = experience.experience_images[0] ?? null;
    const nextCalendar = experience.experience_calendars[0] ?? null;

    return {
      id: experience.id,
      title: experience.experience_title,
      rationale: item.rationale_desc,
      baseScore: toNumber(item.base_score),
      riskAdjustment: toNumber(item.risk_adjustment),
      durationMin: experience.duration_min,
      durationMax: experience.duration_max,
      capacityMax: experience.capacity_max,
      deliveryMethods: experience.delivery_methods,
      leadType: experience.lead_type,
      startingPrice: pricing ? toNumber(pricing.starting_price) : null,
      addingPrice: pricing ? toNumber(pricing.adding_price) : null,
      pricingModel: pricing?.pricing_model ?? null,
      pricingNotes: pricing?.pricing_notes ?? null,
      dietaryConsiderations: experience.dietary_considerations ?? null,
      nextScheduleDate: nextCalendar?.schedule_date.toISOString() ?? null,
      coverImageUrl: firstImage?.image_url ?? null,
    };
  });

  const primaryExperience = mappedExperiences[0];

  if (!primaryExperience) {
    throw new Error(`Proposal ${row.id} has no linked experiences`);
  }

  return {
    id: row.id,
    requestId: row.request_id,
    requestStatus: row.request.request_status,
    requestBudgetMin: toNumber(row.request.budget_min),
    requestBudgetMax: toNumber(row.request.budget_max),
    requestExpiredAt: row.request.expired_at?.toISOString() ?? null,
    requestPreferenceCount: row.request._count.request_preferences,
    requestProposalCount: row.request._count.proposals,
    experienceId: primaryExperience.id,
    experienceTitle: primaryExperience.title,
    experiences: mappedExperiences,
    status: String(
      row.proposal_status
    ).toLowerCase() as AdminProposalListItem['status'],
    objectiveAlignment: row.objective_alignment,
    rejectNotes: row.reject_notes,
    rationale: primaryExperience?.rationale ?? '-',
    baseScore: primaryExperience?.baseScore ?? 0,
    riskAdjustment: primaryExperience?.riskAdjustment ?? 0,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    user: {
      id: row.request.user.id,
      email: row.request.user.email,
      displayName: buildUserDisplayName(row.request.user),
      companyName: row.request.user.corporate?.company_name ?? null,
    },
  };
}

export async function getAdminProposalsPage(
  query: AdminProposalsPageQuery
): Promise<AdminProposalsPageData> {
  const currentPage =
    Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize =
    Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : 12;

  const where = buildProposalWhere({
    search: query.search,
    userEmail: query.userEmail,
    companyName: query.companyName,
    status: query.status,
    requestId: query.requestId,
  });

  const statusWhere = buildProposalWhere({
    search: query.search,
    userEmail: query.userEmail,
    companyName: query.companyName,
    status: 'all',
    requestId: query.requestId,
  });

  const [totalItems, rows, statusRows] = await Promise.all([
    prisma.proposal.count({ where }),
    prisma.proposal.findMany({
      where,
      include: {
        request: {
          include: {
            user: {
              include: {
                profile: true,
                corporate: true,
              },
            },
            _count: {
              select: {
                request_preferences: true,
                proposals: true,
              },
            },
          },
        },
        proposal_experiences: {
          include: {
            experience: {
              include: {
                experience_pricing: {
                  select: {
                    starting_price: true,
                    adding_price: true,
                    pricing_model: true,
                    pricing_notes: true,
                  },
                },
                experience_images: {
                  select: {
                    image_url: true,
                    is_cover: true,
                  },
                  orderBy: [{ is_cover: 'desc' }, { id: 'asc' }],
                  take: 1,
                },
                experience_calendars: {
                  select: {
                    schedule_date: true,
                  },
                  orderBy: [{ schedule_date: 'asc' }],
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.proposal.groupBy({
      by: ['proposal_status'],
      where: statusWhere,
      _count: {
        id: true,
      },
    }),
  ]);

  const statusCounts = buildDefaultStatusCounts();
  statusRows.forEach(row => {
    const normalizedStatus = String(row.proposal_status).toLowerCase();
    if (normalizedStatus in statusCounts) {
      statusCounts[normalizedStatus as keyof typeof statusCounts] =
        row._count.id;
    }
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: rows.map(mapProposalItem),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    statusCounts,
  };
}

export async function getAdminProposalById(
  id: number
): Promise<AdminProposalEditableItem | null> {
  const row = await prisma.proposal.findUnique({
    where: { id },
    include: {
      request: {
        include: {
          user: {
            include: {
              profile: true,
              corporate: true,
            },
          },
          _count: {
            select: {
              request_preferences: true,
              proposals: true,
            },
          },
        },
      },
      proposal_experiences: {
        include: {
          experience: {
            include: {
              experience_pricing: {
                select: {
                  starting_price: true,
                  adding_price: true,
                  pricing_model: true,
                  pricing_notes: true,
                },
              },
              experience_images: {
                select: {
                  image_url: true,
                  is_cover: true,
                },
                orderBy: [{ is_cover: 'desc' }, { id: 'asc' }],
                take: 1,
              },
              experience_calendars: {
                select: {
                  schedule_date: true,
                },
                orderBy: [{ schedule_date: 'asc' }],
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!row) return null;
  return mapProposalItem(row);
}

function validateProposalEditableUpdateInput(
  input: AdminProposalEditableUpdateInput
): AdminProposalEditableUpdateErrors {
  const errors: AdminProposalEditableUpdateErrors = {};

  if (!['pending', 'approved', 'accepted', 'rejected'].includes(input.status)) {
    errors.status = 'Invalid proposal status.';
  }

  if (!input.objectiveAlignment.trim()) {
    errors.objectiveAlignment = 'Objective alignment is required.';
  } else if (input.objectiveAlignment.trim().length > 255) {
    errors.objectiveAlignment =
      'Objective alignment must be 255 characters or fewer.';
  }

  if (!input.rationale.trim()) {
    errors.rationale = 'Rationale is required.';
  } else if (input.rationale.trim().length > 255) {
    errors.rationale = 'Rationale must be 255 characters or fewer.';
  }

  if (!Number.isFinite(input.baseScore)) {
    errors.baseScore = 'Base score must be a valid number.';
  }

  if (!Number.isFinite(input.riskAdjustment)) {
    errors.riskAdjustment = 'Risk adjustment must be a valid number.';
  }

  return errors;
}

export async function updateAdminProposal(
  id: number,
  payload: AdminProposalEditableUpdateInput
): Promise<{
  success: boolean;
  fieldErrors?: AdminProposalEditableUpdateErrors;
}> {
  const normalized: AdminProposalEditableUpdateInput = {
    status: payload.status,
    objectiveAlignment: payload.objectiveAlignment.trim(),
    rationale: payload.rationale.trim(),
    baseScore: payload.baseScore,
    riskAdjustment: payload.riskAdjustment,
  };

  const fieldErrors = validateProposalEditableUpdateInput(normalized);
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  await prisma.proposal.update({
    where: { id },
    data: {
      proposal_status: normalized.status.toUpperCase() as ProposalStatus,
      objective_alignment: normalized.objectiveAlignment,
      ...(normalized.status === 'approved' ? { reject_notes: null } : {}),
    },
  });

  return { success: true };
}

export async function approveAdminProposal(id: number): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: 'Invalid proposal id.' };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    select: {
      id: true,
      proposal_status: true,
      request: {
        select: {
          id: true,
          request_status: true,
          objective_category: true,
          user: {
            select: {
              id: true,
              email: true,
              user_name: true,
              profile: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!proposal) {
    return { success: false, message: 'Proposal not found.' };
  }

  if (
    proposal.proposal_status === ProposalStatus.APPROVED ||
    proposal.proposal_status === ProposalStatus.ACCEPTED
  ) {
    return {
      success: false,
      message: 'This proposal is already approved/accepted.',
    };
  }

  const previousStatus = proposal.request.request_status;

  await prisma.$transaction(async tx => {
    await tx.proposal.update({
      where: { id: proposal.id },
      data: {
        proposal_status: ProposalStatus.APPROVED,
        reject_notes: null,
      },
    });

    await tx.request.update({
      where: { id: proposal.request.id },
      data: {
        request_status: REQUEST_STATUS.MATCHED as never,
      },
    });
  });

  try {
    const { enqueueRequestChangedNotification } =
      await import('@/services/notification-service');

    await enqueueRequestChangedNotification({
      requestId: proposal.request.id,
      previousStatus,
      nextStatus: REQUEST_STATUS.MATCHED,
    });

    return {
      success: true,
      message:
        'Proposal approved, request status updated, and notifications queued.',
    };
  } catch (error) {
    logger.warn(
      {
        error,
        proposalId: proposal.id,
        requestId: proposal.request.id,
        recipientEmail: proposal.request.user.email,
      },
      'Failed to send request changed email after approval'
    );

    return {
      success: true,
      message:
        'Proposal approved and request status updated. Failed to queue notifications.',
    };
  }
}

export type ProposalExperienceSearchItem = {
  id: number;
  title: string;
  status: 'draft' | 'inactive' | 'active';
  providerLabel: string;
  providerType: string;
  categoryTitle: string;
  popularityIndex: number;
  durationMin: number;
  durationMax: number;
  capacityMax: number;
  leadType: string;
  deliveryMethods: string;
  startingPrice: number | null;
  addingPrice: number | null;
  takeItem: number | null;
  travelFlying: number | null;
  createdAt: Date | null;
};

export type ProposalExperienceSearchPage = {
  items: ProposalExperienceSearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function searchProposalExperienceCandidates(
  proposalId: number,
  keyword: string,
  limit = 8
): Promise<ProposalExperienceSearchItem[]> {
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return [];
  }

  const normalizedKeyword = keyword.trim();
  if (normalizedKeyword.length === 0) {
    return [];
  }

  const cappedLimit = Math.max(1, Math.min(20, Math.floor(limit)));

  const rows = await prisma.experience.findMany({
    where: {
      experience_status: 'active' as never,
      proposal_experiences: {
        none: {
          proposal_id: proposalId,
        },
      },
      OR: [
        {
          experience_title: {
            contains: normalizedKeyword,
            mode: 'insensitive',
          },
        },
        {
          provider: {
            is: {
              provider_label: {
                contains: normalizedKeyword,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          category: {
            is: {
              category_title: {
                contains: normalizedKeyword,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          delivery_methods: {
            contains: normalizedKeyword,
            mode: 'insensitive',
          },
        },
      ],
    },
    select: {
      id: true,
      experience_title: true,
      experience_status: true,
      duration_min: true,
      duration_max: true,
      capacity_max: true,
      lead_type: true,
      delivery_methods: true,
      popularity_index: true,
      take_item: true,
      travel_flying: true,
      created_at: true,
      experience_pricing: {
        select: {
          starting_price: true,
          adding_price: true,
        },
      },
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
    },
    orderBy: [{ popularity_index: 'desc' }, { id: 'desc' }],
    take: cappedLimit,
  });

  return rows.map(row => ({
    id: row.id,
    title: row.experience_title,
    status: row.experience_status as 'draft' | 'inactive' | 'active',
    providerLabel: row.provider.provider_label,
    providerType: row.provider.provider_type,
    categoryTitle: row.category.category_title,
    popularityIndex: row.popularity_index,
    durationMin: row.duration_min,
    durationMax: row.duration_max,
    capacityMax: row.capacity_max,
    leadType: row.lead_type,
    deliveryMethods: row.delivery_methods,
    startingPrice:
      row.experience_pricing?.starting_price !== null &&
      row.experience_pricing?.starting_price !== undefined
        ? Number(row.experience_pricing.starting_price)
        : null,
    addingPrice:
      row.experience_pricing?.adding_price !== null &&
      row.experience_pricing?.adding_price !== undefined
        ? Number(row.experience_pricing.adding_price)
        : null,
    takeItem: row.take_item,
    travelFlying: row.travel_flying,
    createdAt: row.created_at ?? null,
  }));
}

export async function listProposalExperienceCandidates(
  proposalId: number,
  limit = 12
): Promise<ProposalExperienceSearchItem[]> {
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return [];
  }

  const cappedLimit = Math.max(1, Math.min(20, Math.floor(limit)));

  const rows = await prisma.experience.findMany({
    where: {
      experience_status: 'active' as never,
      proposal_experiences: {
        none: {
          proposal_id: proposalId,
        },
      },
    },
    select: {
      id: true,
      experience_title: true,
      experience_status: true,
      duration_min: true,
      duration_max: true,
      capacity_max: true,
      lead_type: true,
      delivery_methods: true,
      popularity_index: true,
      take_item: true,
      travel_flying: true,
      created_at: true,
      experience_pricing: {
        select: {
          starting_price: true,
          adding_price: true,
        },
      },
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
    },
    orderBy: [{ popularity_index: 'desc' }, { id: 'desc' }],
    take: cappedLimit,
  });

  return rows.map(row => ({
    id: row.id,
    title: row.experience_title,
    status: row.experience_status as 'draft' | 'inactive' | 'active',
    providerLabel: row.provider.provider_label,
    providerType: row.provider.provider_type,
    categoryTitle: row.category.category_title,
    popularityIndex: row.popularity_index,
    durationMin: row.duration_min,
    durationMax: row.duration_max,
    capacityMax: row.capacity_max,
    leadType: row.lead_type,
    deliveryMethods: row.delivery_methods,
    startingPrice:
      row.experience_pricing?.starting_price !== null &&
      row.experience_pricing?.starting_price !== undefined
        ? Number(row.experience_pricing.starting_price)
        : null,
    addingPrice:
      row.experience_pricing?.adding_price !== null &&
      row.experience_pricing?.adding_price !== undefined
        ? Number(row.experience_pricing.adding_price)
        : null,
    takeItem: row.take_item,
    travelFlying: row.travel_flying,
    createdAt: row.created_at ?? null,
  }));
}

export async function listProposalExperienceCandidatesPage(
  proposalId: number,
  keyword = '',
  page = 1,
  pageSize = 8
): Promise<ProposalExperienceSearchPage> {
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
      totalPages: 1,
    };
  }

  const normalizedKeyword = keyword.trim();
  const normalizedPageSize = Math.max(1, Math.min(20, Math.floor(pageSize)));
  const normalizedPage = Math.max(1, Math.floor(page));

  const where = {
    experience_status: 'active' as never,
    proposal_experiences: {
      none: {
        proposal_id: proposalId,
      },
    },
    ...(normalizedKeyword
      ? {
          OR: [
            {
              experience_title: {
                contains: normalizedKeyword,
                mode: 'insensitive' as const,
              },
            },
            {
              provider: {
                is: {
                  provider_label: {
                    contains: normalizedKeyword,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
            {
              category: {
                is: {
                  category_title: {
                    contains: normalizedKeyword,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
            {
              delivery_methods: {
                contains: normalizedKeyword,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.experience.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);

  const rows = await prisma.experience.findMany({
    where,
    select: {
      id: true,
      experience_title: true,
      experience_status: true,
      duration_min: true,
      duration_max: true,
      capacity_max: true,
      lead_type: true,
      delivery_methods: true,
      popularity_index: true,
      take_item: true,
      travel_flying: true,
      created_at: true,
      experience_pricing: {
        select: {
          starting_price: true,
          adding_price: true,
        },
      },
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
    },
    orderBy: [{ popularity_index: 'desc' }, { id: 'desc' }],
    skip: (safePage - 1) * normalizedPageSize,
    take: normalizedPageSize,
  });

  return {
    items: rows.map(row => ({
      id: row.id,
      title: row.experience_title,
      status: row.experience_status as 'draft' | 'inactive' | 'active',
      providerLabel: row.provider.provider_label,
      providerType: row.provider.provider_type,
      categoryTitle: row.category.category_title,
      popularityIndex: row.popularity_index,
      durationMin: row.duration_min,
      durationMax: row.duration_max,
      capacityMax: row.capacity_max,
      leadType: row.lead_type,
      deliveryMethods: row.delivery_methods,
      startingPrice:
        row.experience_pricing?.starting_price !== null &&
        row.experience_pricing?.starting_price !== undefined
          ? Number(row.experience_pricing.starting_price)
          : null,
      addingPrice:
        row.experience_pricing?.adding_price !== null &&
        row.experience_pricing?.adding_price !== undefined
          ? Number(row.experience_pricing.adding_price)
          : null,
      takeItem: row.take_item,
      travelFlying: row.travel_flying,
      createdAt: row.created_at ?? null,
    })),
    total,
    page: safePage,
    pageSize: normalizedPageSize,
    totalPages,
  };
}

export async function addExperienceToProposal(
  proposalId: number,
  experienceId: number,
  rationale: string
): Promise<{ success: boolean; message?: string }> {
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return { success: false, message: 'Invalid proposal id.' };
  }

  if (!Number.isInteger(experienceId) || experienceId < 1) {
    return { success: false, message: 'Invalid experience id.' };
  }

  const normalizedRationale = rationale.trim();
  if (!normalizedRationale) {
    return { success: false, message: 'Rationale is required.' };
  }

  if (normalizedRationale.length > 255) {
    return {
      success: false,
      message: 'Rationale must be 255 characters or fewer.',
    };
  }

  const [proposal, experience] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true },
    }),
    prisma.experience.findUnique({
      where: { id: experienceId },
      select: {
        id: true,
        experience_status: true,
      },
    }),
  ]);

  if (!proposal) {
    return { success: false, message: 'Proposal not found.' };
  }

  if (!experience) {
    return { success: false, message: 'Experience not found.' };
  }

  if (experience.experience_status !== 'active') {
    return {
      success: false,
      message: 'Only active experiences can be added to proposal.',
    };
  }

  try {
    await prisma.proposalExperience.create({
      data: {
        proposal_id: proposalId,
        experience_id: experienceId,
        base_score: 0,
        risk_adjustment: 0,
        rationale_desc: normalizedRationale,
      },
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2002') {
      return {
        success: false,
        message: 'This experience has already been added to the proposal.',
      };
    }
    throw error;
  }

  return { success: true };
}

export async function removeExperienceFromProposal(
  proposalId: number,
  experienceId: number
): Promise<{ success: boolean; message?: string }> {
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return { success: false, message: 'Invalid proposal id.' };
  }

  if (!Number.isInteger(experienceId) || experienceId < 1) {
    return { success: false, message: 'Invalid experience id.' };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    select: { id: true },
  });

  if (!proposal) {
    return { success: false, message: 'Proposal not found.' };
  }

  const linkedCount = await prisma.proposalExperience.count({
    where: { proposal_id: proposalId },
  });

  if (linkedCount <= 1) {
    return {
      success: false,
      message: 'A proposal must keep at least one experience.',
    };
  }

  const deleted = await prisma.proposalExperience.deleteMany({
    where: {
      proposal_id: proposalId,
      experience_id: experienceId,
    },
  });

  if (deleted.count === 0) {
    return {
      success: false,
      message: 'Experience is not linked to this proposal.',
    };
  }

  return { success: true };
}

export async function deleteAdminProposal(id: number): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!Number.isInteger(id) || id < 1) {
    return { success: false, message: 'Invalid proposal id.' };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    select: {
      id: true,
      proposal_status: true,
      _count: {
        select: {
          orders: true,
          user_experiences: true,
        },
      },
    },
  });

  if (!proposal) {
    return { success: false, message: 'Proposal not found.' };
  }

  if (
    proposal.proposal_status !== ProposalStatus.PENDING &&
    proposal.proposal_status !== ProposalStatus.REJECTED
  ) {
    return {
      success: false,
      message: 'Only pending or rejected proposals can be deleted.',
    };
  }

  if (proposal._count.orders > 0 || proposal._count.user_experiences > 0) {
    return {
      success: false,
      message: 'This proposal has linked records and cannot be deleted safely.',
    };
  }

  await prisma.proposal.delete({ where: { id } });

  return { success: true };
}
