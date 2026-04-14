import 'server-only';

import { Prisma } from '@/libs/prisma/client';
import { InviteStatus, ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { isRequestStatus } from '@/constants/request-status';
import { enqueueQueueJob } from '@/services/queue-service';
import { REQUEST_QUEUE_TRIGGER, RequestQueueTrigger } from '@/types/queue-job';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';
import type {
  AdminRequestListItem,
  AdminRequestsPageData,
  AdminRequestsPageQuery,
  AdminRequestStatusCounts,
} from '@/types/request-type';

async function notifyRequestStatusChanged(params: {
  requestId: number;
  previousStatus: string | null;
  nextStatus: string;
}) {
  if (params.previousStatus === params.nextStatus) {
    return;
  }

  const request = await prisma.request.findUnique({
    where: { id: params.requestId },
    select: {
      id: true,
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
      proposals: {
        orderBy: [{ id: 'desc' }],
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!request) return;

  try {
    const { enqueueRequestChangedNotification } =
      await import('@/services/notification-service');

    await enqueueRequestChangedNotification({
      requestId: request.id,
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    });
  } catch {
    // Best-effort notification; the status update itself should still succeed.
  }
}

/**
 * When a request expires, schedules a QStash task to enqueue a proposal.
 * @param requestId
 * @returns
 */
export async function scheduleRequestExpiry(requestId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      expired_at: true,
    },
  });

  if (!request) {
    throw new Error(`Request ${requestId} not found.`);
  }

  if (!request.expired_at) {
    return { scheduled: false, reason: 'missing_expired_at' } as const;
  }

  return getQStashClient().publishJSON({
    url: getQStashEndpointUrl(),
    body: {
      type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
      requestId,
      trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
    },
    notBefore: Math.floor(request.expired_at.getTime() / 1000),
    deduplicationId: `request-expiry:${requestId}:${request.expired_at.toISOString()}`,
    retries: 3,
  });
}

export async function handleUserConfirmed(userId: number) {
  const user = await prisma.invitedUser.findUnique({
    where: { id: userId },
    select: {
      request_id: true,
    },
  });

  if (!user) {
    throw new Error(`Invited user ${userId} not found.`);
  }

  return enqueueRequestReady(
    user.request_id,
    REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED
  );
}

export async function handleRejectedProposal(proposalId: number) {
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      proposal_status: ProposalStatus.REJECTED,
    },
    select: {
      id: true,
      request_id: true,
      request: {
        select: {
          request_status: true,
        },
      },
    },
  });

  const previousStatus = String(proposal.request.request_status).toUpperCase();

  await prisma.request.update({
    where: { id: proposal.request_id },
    data: {
      request_status: REQUEST_STATUS.PENDING as never,
    },
  });

  await notifyRequestStatusChanged({
    requestId: proposal.request_id,
    previousStatus,
    nextStatus: REQUEST_STATUS.PENDING,
  });

  return enqueueRequestReady(
    proposal.request_id,
    REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
    proposal.id
  );
}

export async function enqueueRequestReady(
  requestId: number,
  trigger: RequestQueueTrigger,
  rejectedProposalId?: number
) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      expired_at: true,
      request_status: true,
      invited_users: {
        select: {
          invited_status: true,
        },
      },
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
    throw new Error(`Request ${requestId} not found.`);
  }

  if (
    request.proposals.length > 0 &&
    trigger !== REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED
  ) {
    return { queued: false, reason: 'active_proposal_exists' } as const;
  }

  if (String(request.request_status).toUpperCase() === REQUEST_STATUS.CLOSED) {
    return { queued: false, reason: 'request_closed' } as const;
  }

  const now = new Date();
  const allInvitedAccepted =
    request.invited_users.length > 0 &&
    request.invited_users.every(
      invite => invite.invited_status !== InviteStatus.pending
    );
  const expired =
    request.expired_at !== null &&
    request.expired_at.getTime() <= now.getTime();

  const ready =
    trigger === REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED ||
    (trigger === REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED &&
      allInvitedAccepted) ||
    (trigger === REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED && expired);

  if (!ready) {
    return { queued: false, reason: 'request_not_ready' } as const;
  }

  await prisma.request.update({
    where: { id: request.id },
    data: {
      request_status: REQUEST_STATUS.PENDING as never,
    },
  });

  await notifyRequestStatusChanged({
    requestId: request.id,
    previousStatus: String(request.request_status).toUpperCase(),
    nextStatus: REQUEST_STATUS.PENDING,
  });

  const result = await enqueueQueueJob({
    requestId: request.id,
    trigger,
    rejectedProposalId,
    queuedAt: new Date().toISOString(),
  });

  return {
    queued: true,
    queueMessageId: result.messageId,
    queueName: result.queueName,
  } as const;
}

function toNumber(
  value: Prisma.Decimal | number | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function buildUserDisplayName(requestUser: {
  email: string;
  user_name: string | null;
  profile: { first_name: string | null; last_name: string | null } | null;
}) {
  const fullName = [
    requestUser.profile?.first_name,
    requestUser.profile?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    fullName ||
    requestUser.user_name ||
    requestUser.email.split('@')[0] ||
    'Unknown User'
  );
}

function buildRequestWhere(params: {
  search: string;
  userEmail: string;
  companyName: string;
  status: AdminRequestsPageQuery['status'];
  userId: number | null;
  createdFrom: string;
  createdTo: string;
}): Prisma.RequestWhereInput {
  const clauses: Prisma.RequestWhereInput[] = [];
  const keyword = params.search.trim();
  const userEmail = params.userEmail.trim();
  const companyName = params.companyName.trim();

  if (params.userId !== null) {
    clauses.push({ user_id: params.userId });
  }

  const createdFromDate = params.createdFrom
    ? new Date(`${params.createdFrom}T00:00:00`)
    : null;
  const createdToDate = params.createdTo
    ? new Date(`${params.createdTo}T00:00:00`)
    : null;
  const validCreatedFromDate =
    createdFromDate && !Number.isNaN(createdFromDate.getTime())
      ? createdFromDate
      : null;
  const validCreatedToDate =
    createdToDate && !Number.isNaN(createdToDate.getTime())
      ? createdToDate
      : null;

  if (validCreatedFromDate || validCreatedToDate) {
    const createdAtFilter: Prisma.DateTimeFilter = {};

    if (validCreatedFromDate) {
      createdAtFilter.gte = validCreatedFromDate;
    }

    if (validCreatedToDate) {
      const nextDay = new Date(validCreatedToDate);
      nextDay.setDate(nextDay.getDate() + 1);
      createdAtFilter.lt = nextDay;
    }

    clauses.push({ created_at: createdAtFilter });
  }

  if (params.status !== 'all') {
    clauses.push({ request_status: params.status as never });
  }

  if (userEmail.length > 0) {
    clauses.push({
      user: {
        is: {
          email: {
            contains: userEmail,
            mode: 'insensitive',
          },
        },
      },
    });
  }

  if (companyName.length > 0) {
    clauses.push({
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
    });
  }

  if (keyword.length > 0) {
    const orConditions: Prisma.RequestWhereInput[] = [
      {
        user: {
          is: {
            user_name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      },
      {
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
      {
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
      {
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
    ];

    clauses.push({ OR: orConditions });
  }

  if (clauses.length === 0) {
    return {};
  }

  return {
    AND: clauses,
  };
}

function mapRequestItem(
  row: Prisma.RequestGetPayload<{
    include: {
      user: {
        include: {
          profile: true;
          corporate: true;
        };
      };
      invited_users: true;
      proposals: {
        include: {
          proposal_experiences: {
            include: {
              experience: {
                select: {
                  experience_title: true;
                };
              };
            };
            orderBy: [{ id: 'asc' }];
            take: 1;
          };
        };
      };
      request_preferences: {
        include: {
          question: {
            select: {
              question_text: true;
            };
          };
          dimension_index: {
            select: {
              index_name: true;
            };
          };
          dimension_option: {
            select: {
              option_label: true;
            };
          };
        };
      };
    };
  }>
): AdminRequestListItem {
  const inviteSummary = {
    total: row.invited_users.length,
    pending: row.invited_users.filter(item => item.invited_status === 'pending')
      .length,
    accepted: row.invited_users.filter(
      item => item.invited_status === 'accepted'
    ).length,
    rejected: row.invited_users.filter(
      item => item.invited_status === 'rejected'
    ).length,
  };

  const hasProposalStatus = (value: unknown, status: ProposalStatus): boolean =>
    String(value).toUpperCase() === status;

  const proposalSummary = {
    total: row.proposals.length,
    pending: row.proposals.filter(item =>
      hasProposalStatus(item.proposal_status, ProposalStatus.PENDING)
    ).length,
    accepted: row.proposals.filter(item =>
      hasProposalStatus(item.proposal_status, ProposalStatus.ACCEPTED)
    ).length,
    rejected: row.proposals.filter(item =>
      hasProposalStatus(item.proposal_status, ProposalStatus.REJECTED)
    ).length,
  };

  return {
    id: row.id,
    status: String(
      row.request_status
    ).toUpperCase() as AdminRequestListItem['status'],
    objectiveCategory: row.objective_category,
    deliveryMethod: row.delivery_method,
    durationMax: row.duration_max,
    budgetMin: toNumber(row.budget_min),
    budgetMax: toNumber(row.budget_max),
    participantCount: row.participant_count,
    capacityMax: row.capacity_max,
    constraintMode: row.constraint_mode,
    preferredDate: toIso(row.preferred_date),
    expiredAt: toIso(row.expired_at),
    notesForAdmin: row.notes_for_admin,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    user: {
      id: row.user.id,
      email: row.user.email,
      userName: row.user.user_name,
      displayName: buildUserDisplayName(row.user),
      firstName: row.user.profile?.first_name ?? null,
      lastName: row.user.profile?.last_name ?? null,
      companyName: row.user.corporate?.company_name ?? null,
      departmentName: row.user.corporate?.department_name ?? null,
      roleTitle: row.user.corporate?.role_title ?? null,
    },
    inviteSummary,
    proposalSummary,
    requestPreferences: (row.request_preferences ?? [])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map(item => ({
        id: item.id,
        questionId: item.question_id,
        questionText: item.question?.question_text ?? null,
        dimensionId: item.dimension_id ?? null,
        dimensionName: item.dimension_index?.index_name ?? null,
        optionId: item.option_id ?? null,
        optionLabel: item.dimension_option?.option_label ?? null,
        desiredValue: item.desired_value,
        weightRate: item.weight_rate.toString(),
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      })),
    invitedUsers: row.invited_users
      .slice()
      .sort((a, b) => b.id - a.id)
      .map(item => ({
        id: item.id,
        invitedStatus: item.invited_status,
        userName: item.user_name,
        userEmail: item.user_email,
        createdAt: item.created_at.toISOString(),
        respondAt: toIso(item.respond_at),
        expiredAt: toIso(item.expired_at),
      })),
    proposals: row.proposals
      .slice()
      .sort((a, b) => b.id - a.id)
      .map(item => {
        const legacyItem = item as typeof item & {
          experience?: {
            experience_title?: string | null;
          } | null;
          rationale_desc?: string | null;
        };

        return {
          id: item.id,
          status: String(item.proposal_status).toLowerCase(),
          experienceTitle:
            item.proposal_experiences?.[0]?.experience.experience_title ??
            legacyItem.experience?.experience_title ??
            '-',
          rationale:
            item.proposal_experiences?.[0]?.rationale_desc ??
            legacyItem.rationale_desc ??
            '-',
          createdAt: item.created_at.toISOString(),
          updatedAt: item.updated_at.toISOString(),
        };
      }),
  };
}

function buildDefaultStatusCounts(): AdminRequestStatusCounts {
  return {
    [REQUEST_STATUS.OPENED]: 0,
    [REQUEST_STATUS.PENDING]: 0,
    [REQUEST_STATUS.MATCHED]: 0,
    [REQUEST_STATUS.CLOSED]: 0,
  };
}

export async function getAdminRequestsPage(
  query: AdminRequestsPageQuery
): Promise<AdminRequestsPageData> {
  const currentPage =
    Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize =
    Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : 12;
  const where = buildRequestWhere({
    search: query.search,
    userEmail: query.userEmail,
    companyName: query.companyName,
    status: query.status,
    userId: query.userId,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });
  const statusWhere = buildRequestWhere({
    search: query.search,
    userEmail: query.userEmail,
    companyName: query.companyName,
    status: 'all',
    userId: query.userId,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });

  const [totalItems, rows, statusRows] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
            corporate: true,
          },
        },
        invited_users: true,
        proposals: {
          include: {
            proposal_experiences: {
              include: {
                experience: {
                  select: {
                    experience_title: true,
                  },
                },
              },
              orderBy: [{ id: 'asc' }],
              take: 1,
            },
          },
        },
        request_preferences: {
          include: {
            question: {
              select: {
                question_text: true,
              },
            },
            dimension_index: {
              select: {
                index_name: true,
              },
            },
            dimension_option: {
              select: {
                option_label: true,
              },
            },
          },
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.request.groupBy({
      by: ['request_status'],
      where: statusWhere,
      _count: {
        id: true,
      },
    }),
  ]);

  const statusCounts = buildDefaultStatusCounts();
  statusRows.forEach(row => {
    const normalizedStatus = String(row.request_status).toUpperCase();
    if (isRequestStatus(normalizedStatus)) {
      statusCounts[normalizedStatus as keyof typeof statusCounts] =
        row._count.id;
    }
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: rows.map(mapRequestItem),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    statusCounts,
  };
}

export async function getAdminRequestById(
  requestId: number
): Promise<AdminRequestListItem | null> {
  if (!Number.isInteger(requestId) || requestId < 1) {
    return null;
  }

  const row = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      user: {
        include: {
          profile: true,
          corporate: true,
        },
      },
      invited_users: true,
      proposals: {
        include: {
          proposal_experiences: {
            include: {
              experience: {
                select: {
                  experience_title: true,
                },
              },
            },
            orderBy: [{ id: 'asc' }],
            take: 1,
          },
        },
      },
      request_preferences: {
        include: {
          question: {
            select: {
              question_text: true,
            },
          },
          dimension_index: {
            select: {
              index_name: true,
            },
          },
          dimension_option: {
            select: {
              option_label: true,
            },
          },
        },
      },
    },
  });

  return row ? mapRequestItem(row) : null;
}
