import 'server-only';

import { Prisma } from '@/libs/prisma/client';
import { InviteStatus, ProposalStatus } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import { REQUEST_STATUS } from '@/constants/request-status';
import { isRequestStatus } from '@/constants/request-status';
import type { RequestStatus } from '@/constants/request-status';
import { enqueueQueueJob } from '@/services/queue-service';
import { REQUEST_QUEUE_TRIGGER, RequestQueueTrigger } from '@/types/queue-job';
import { QSTASH_TASK_TYPE } from '@/types/qstash-task';
import type {
  AdminRequestListItem,
  AdminRequestsPageData,
  AdminRequestsPageQuery,
  AdminRequestStatusCounts,
} from '@/types/request-type';
import { publishQStashTask } from './qstash-service';

export type UserRequestProposal = {
  id: number;
  status: 'APPROVED' | 'ACCEPTED';
  rationale: string;
  experienceTitle: string;
  deliveryMethod: string;
  capacityMax: number;
};

export type UserRequestItem = {
  id: number;
  status: 'OPENED' | 'PENDING' | 'MATCHED' | 'CLOSED';
  objectiveCategory: string;
  preferredDate: Date | null;
  preferredDates: Date[];
  participantCount: number | null;
  createdAt: Date;
  proposal: UserRequestProposal | null;
};

export type UserRequestScheduleItem = {
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
};

export type UserRequestPreferenceItem = {
  id: number;
  categoryName: string | null;
  questionText: string | null;
  answerText: string;
};

export type UserRequestDetail = UserRequestItem & {
  userId: number;
  deliveryMethod: string | null;
  durationMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  capacityMax: number;
  constraintMode: string;
  deadlineDate: Date | null;
  expiredAt: Date | null;
  notesForAdmin: string | null;
  updatedAt: Date;
  preferredDateTimes: UserRequestScheduleItem[];
  requestPreferences: UserRequestPreferenceItem[];
};

export type RequestStats = {
  total: number;
  opened: number;
  pending: number;
  matched: number;
  closed: number;
};

export type UserRequestStatusFilter = 'all' | RequestStatus;

export type UserRequestsPageQuery = {
  status: UserRequestStatusFilter;
  userEmail: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
};

export type UserRequestsPageData = {
  items: UserRequestItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  statusCounts: RequestStats;
};

export type PreferredDateTime = {
  date: Date;
  startTime?: Date;
  endTime?: Date;
};

export type RequestPreferenceAnswerInput = {
  questionId: number;
  value: string | string[];
};

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

  return publishRequestReadyTask(
    requestId,
    REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
    {
      notBefore: Math.floor(request.expired_at.getTime() / 1000),
      deduplicationId: `request-expiry:${requestId}:${request.expired_at.toISOString()}`,
      retries: 3,
    }
  );
}

export async function publishRequestReadyTask(
  requestId: number,
  trigger: RequestQueueTrigger,
  options?: {
    notBefore?: number;
    deduplicationId?: string;
    retries?: number;
  }
) {
  return getQStashClient().publishJSON({
    url: getQStashEndpointUrl(),
    body: {
      type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
      requestId,
      trigger,
    },
    notBefore: options?.notBefore,
    deduplicationId:
      options?.deduplicationId ?? `request-ready:${requestId}:${trigger}`,
    retries: options?.retries ?? 3,
  });
}

export async function handleRequestUserResponded(userId: number) {
  const user = await prisma.requestUser.findUnique({
    where: { id: userId },
    select: {
      request_id: true,
    },
  });

  if (!user) {
    throw new Error(`Request user ${userId} not found.`);
  }

  return enqueueRequestReady(
    user.request_id,
    REQUEST_QUEUE_TRIGGER.REQUEST_USERS_RESPONDED
  );
}

export async function handleUserConfirmed(userId: number) {
  const user = await prisma.requestUser.findUnique({
    where: { id: userId },
    select: {
      request_id: true,
    },
  });

  if (!user) {
    throw new Error(`Request user ${userId} not found.`);
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
      request_users: {
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
  const allInvitedResponded =
    request.request_users.length > 0 &&
    request.request_users.every(
      invite => invite.invited_status !== InviteStatus.pending
    );
  const expired =
    request.expired_at !== null &&
    request.expired_at.getTime() <= now.getTime();

  const ready =
    trigger === REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED ||
    ((trigger === REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED ||
      trigger === REQUEST_QUEUE_TRIGGER.REQUEST_USERS_RESPONDED) &&
      allInvitedResponded) ||
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

  try {
    await publishQStashTask(
      {
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 25,
      },
      {
        deduplicationId: `request-queue-process_${request.id}_${trigger}`,
        retries: 3,
      }
    );
  } catch (error) {
    console.error(
      'Failed to publish QStash task for request queue processing:',
      error
    );
  }

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

function mapRequestCalendarItems(
  items: Array<{
    preferred_date: Date;
    start_time: Date;
    end_time: Date;
  }>
) {
  return items.map(item => ({
    date: item.preferred_date.toISOString(),
    startTime: toIso(item.start_time),
    endTime: toIso(item.end_time),
  }));
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
      request_users: true;
      requestCalendars: {
        select: {
          preferred_date: true;
          start_time: true;
          end_time: true;
        };
      };
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
              category: {
                select: {
                  category_name: true;
                };
              };
            };
          };
          dimension_option: {
            select: {
              option_label: true;
              option_value: true;
            };
          };
        };
      };
    };
  }>
): AdminRequestListItem {
  const inviteSummary = {
    total: row.request_users.length,
    pending: row.request_users.filter(item => item.invited_status === 'pending')
      .length,
    accepted: row.request_users.filter(
      item => item.invited_status === 'accepted'
    ).length,
    rejected: row.request_users.filter(
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

  const preferredDateTimes = mapRequestCalendarItems(
    row.requestCalendars ?? []
  );
  const fallbackPreferredDate =
    preferredDateTimes[0]?.date ??
    toIso((row as { preferred_date?: Date | null }).preferred_date);

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
    preferredDate: fallbackPreferredDate,
    preferredDateTimes,
    deadlineDate: toIso(row.deadline_date),
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
        categoryName: item.dimension_index?.category?.category_name ?? null,
        optionId: item.option_id ?? null,
        optionLabel: item.dimension_option?.option_label ?? null,
        optionValue: item.dimension_option?.option_value ?? null,
        desiredValue: item.desired_value,
        weightRate: item.weight_rate.toString(),
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      })),
    invitedUsers: row.request_users
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
        request_users: true,
        requestCalendars: {
          select: {
            preferred_date: true,
            start_time: true,
            end_time: true,
          },
          orderBy: [{ preferred_date: 'asc' }, { start_time: 'asc' }],
        },
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
                category: {
                  select: {
                    category_name: true,
                  },
                },
              },
            },
            dimension_option: {
              select: {
                option_label: true,
                option_value: true,
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
      request_users: true,
      requestCalendars: {
        select: {
          preferred_date: true,
          start_time: true,
          end_time: true,
        },
        orderBy: [{ preferred_date: 'asc' }, { start_time: 'asc' }],
      },
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
              category: {
                select: {
                  category_name: true,
                },
              },
            },
          },
          dimension_option: {
            select: {
              option_label: true,
              option_value: true,
            },
          },
        },
      },
    },
  });

  return row ? mapRequestItem(row) : null;
}

export async function getUserRequests(
  userId: number
): Promise<UserRequestItem[]> {
  const requests = await findUserRequestRows(
    buildUserRequestWhere({
      userId,
      status: 'all',
      userEmail: '',
      createdFrom: '',
      createdTo: '',
    })
  );

  return requests.map(mapUserRequestItem);
}

function buildDefaultUserRequestStatusCounts(): RequestStats {
  return {
    total: 0,
    opened: 0,
    pending: 0,
    matched: 0,
    closed: 0,
  };
}

function buildUserRequestWhere(input: {
  userId: number;
  status: UserRequestStatusFilter;
  userEmail: string;
  createdFrom: string;
  createdTo: string;
}): Prisma.RequestWhereInput {
  const clauses: Prisma.RequestWhereInput[] = [{ user_id: input.userId }];

  if (input.status !== 'all') {
    clauses.push({
      request_status: input.status,
    });
  }

  const normalizedEmail = input.userEmail.trim();
  if (normalizedEmail.length > 0) {
    clauses.push({
      request_users: {
        some: {
          user_email: {
            contains: normalizedEmail,
            mode: 'insensitive',
          },
        },
      },
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

async function findUserRequestRows(
  where: Prisma.RequestWhereInput,
  currentPage?: number,
  pageSize?: number
) {
  return prisma.request.findMany({
    where,
    select: {
      id: true,
      request_status: true,
      objective_category: true,
      participant_count: true,
      created_at: true,
      user: {
        select: {
          email: true,
        },
      },
      requestCalendars: {
        select: { preferred_date: true },
        orderBy: { preferred_date: 'asc' },
      },
      proposals: {
        where: {
          proposal_status: {
            in: [ProposalStatus.APPROVED, ProposalStatus.ACCEPTED],
          },
        },
        include: {
          proposal_experiences: {
            include: {
              experience: {
                select: {
                  experience_title: true,
                  delivery_methods: true,
                  capacity_max: true,
                },
              },
            },
            orderBy: [{ id: 'asc' }],
            take: 1,
          },
        },
        orderBy: [{ id: 'desc' }],
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

function selectUserRequestProposal(
  proposals: Awaited<
    ReturnType<typeof findUserRequestRows>
  >[number]['proposals']
) {
  return (
    proposals.find(
      proposal => String(proposal.proposal_status).toUpperCase() === 'ACCEPTED'
    ) ??
    proposals[0] ??
    null
  );
}

function mapUserRequestItem(
  row: Awaited<ReturnType<typeof findUserRequestRows>>[number]
): UserRequestItem {
  const selectedProposal = selectUserRequestProposal(row.proposals);

  return {
    id: row.id,
    status: row.request_status as UserRequestItem['status'],
    objectiveCategory: row.objective_category,
    preferredDate: row.requestCalendars[0]?.preferred_date ?? null,
    preferredDates: row.requestCalendars.map(c => c.preferred_date),
    participantCount: row.participant_count,
    createdAt: row.created_at,
    proposal: selectedProposal
      ? {
          id: selectedProposal.id,
          status: String(selectedProposal.proposal_status).toUpperCase() as
            | 'APPROVED'
            | 'ACCEPTED',
          rationale:
            selectedProposal.proposal_experiences[0]?.rationale_desc ?? '-',
          experienceTitle:
            selectedProposal.proposal_experiences[0]?.experience
              .experience_title ?? '-',
          deliveryMethod:
            selectedProposal.proposal_experiences[0]?.experience
              .delivery_methods ?? '-',
          capacityMax:
            selectedProposal.proposal_experiences[0]?.experience.capacity_max ??
            0,
        }
      : null,
  };
}

export async function getUserRequestsPage(
  userId: number,
  query: UserRequestsPageQuery
): Promise<UserRequestsPageData> {
  const currentPage =
    Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize =
    Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : 8;

  const where = buildUserRequestWhere({
    userId,
    status: query.status,
    userEmail: query.userEmail,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });

  const statusWhere = buildUserRequestWhere({
    userId,
    status: 'all',
    userEmail: query.userEmail,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
  });

  const [totalItems, rows, statusRows] = await Promise.all([
    prisma.request.count({ where }),
    findUserRequestRows(where, currentPage, pageSize),
    prisma.request.groupBy({
      by: ['request_status'],
      where: statusWhere,
      _count: {
        id: true,
      },
    }),
  ]);

  const statusCounts = buildDefaultUserRequestStatusCounts();
  statusRows.forEach(row => {
    const normalizedStatus = String(row.request_status).toUpperCase();
    if (normalizedStatus === REQUEST_STATUS.OPENED) {
      statusCounts.opened = row._count.id;
    }
    if (normalizedStatus === REQUEST_STATUS.PENDING) {
      statusCounts.pending = row._count.id;
    }
    if (normalizedStatus === REQUEST_STATUS.MATCHED) {
      statusCounts.matched = row._count.id;
    }
    if (normalizedStatus === REQUEST_STATUS.CLOSED) {
      statusCounts.closed = row._count.id;
    }
  });
  statusCounts.total =
    statusCounts.opened +
    statusCounts.pending +
    statusCounts.matched +
    statusCounts.closed;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: rows.map(mapUserRequestItem),
    totalItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages),
    statusCounts,
  };
}

export async function getUserRequestById(
  userId: number,
  requestId: number
): Promise<UserRequestDetail | null> {
  if (!Number.isInteger(userId) || userId < 1) return null;
  if (!Number.isInteger(requestId) || requestId < 1) return null;

  const row = await prisma.request.findFirst({
    where: {
      id: requestId,
      user_id: userId,
    },
    select: {
      id: true,
      user_id: true,
      request_status: true,
      objective_category: true,
      delivery_method: true,
      duration_max: true,
      capacity_max: true,
      constraint_mode: true,
      budget_min: true,
      budget_max: true,
      participant_count: true,
      deadline_date: true,
      expired_at: true,
      notes_for_admin: true,
      created_at: true,
      updated_at: true,
      requestCalendars: {
        select: {
          preferred_date: true,
          start_time: true,
          end_time: true,
        },
        orderBy: [{ preferred_date: 'asc' }, { start_time: 'asc' }],
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
              category: {
                select: {
                  category_name: true,
                },
              },
            },
          },
          dimension_option: {
            select: {
              option_label: true,
              option_value: true,
            },
          },
        },
        orderBy: [{ id: 'asc' }],
      },
      proposals: {
        where: {
          proposal_status: {
            in: [ProposalStatus.APPROVED, ProposalStatus.ACCEPTED],
          },
        },
        include: {
          proposal_experiences: {
            include: {
              experience: {
                select: {
                  experience_title: true,
                  delivery_methods: true,
                  capacity_max: true,
                },
              },
            },
            orderBy: [{ id: 'asc' }],
            take: 1,
          },
        },
        orderBy: [{ id: 'desc' }],
      },
    },
  });

  if (!row) return null;

  const selectedProposal = selectUserRequestProposal(row.proposals);

  return {
    id: row.id,
    userId: row.user_id,
    status: row.request_status as UserRequestDetail['status'],
    objectiveCategory: row.objective_category,
    deliveryMethod: row.delivery_method,
    durationMax: row.duration_max,
    capacityMax: row.capacity_max,
    constraintMode: row.constraint_mode,
    budgetMin: toNumber(row.budget_min),
    budgetMax: toNumber(row.budget_max),
    preferredDate: row.requestCalendars[0]?.preferred_date ?? null,
    preferredDates: row.requestCalendars.map(c => c.preferred_date),
    preferredDateTimes: row.requestCalendars.map(item => ({
      date: item.preferred_date,
      startTime: item.start_time ?? null,
      endTime: item.end_time ?? null,
    })),
    deadlineDate: row.deadline_date,
    participantCount: row.participant_count,
    expiredAt: row.expired_at,
    notesForAdmin: row.notes_for_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requestPreferences: row.request_preferences.map(item => ({
      id: item.id,
      categoryName: item.dimension_index?.category?.category_name ?? null,
      questionText: item.question?.question_text ?? null,
      answerText:
        item.dimension_option?.option_value?.trim() ||
        item.dimension_option?.option_label?.trim() ||
        item.desired_value,
    })),
    proposal: selectedProposal
      ? {
          id: selectedProposal.id,
          status: String(selectedProposal.proposal_status).toUpperCase() as
            | 'APPROVED'
            | 'ACCEPTED',
          rationale:
            selectedProposal.proposal_experiences[0]?.rationale_desc ?? '-',
          experienceTitle:
            selectedProposal.proposal_experiences[0]?.experience
              .experience_title ?? '-',
          deliveryMethod:
            selectedProposal.proposal_experiences[0]?.experience
              .delivery_methods ?? '-',
          capacityMax:
            selectedProposal.proposal_experiences[0]?.experience.capacity_max ??
            0,
        }
      : null,
  };
}

export async function getRequestStats(userId: number): Promise<RequestStats> {
  const counts = await prisma.request.groupBy({
    by: ['request_status'],
    where: { user_id: userId },
    _count: { id: true },
  });

  const map = Object.fromEntries(
    counts.map(c => [c.request_status, c._count.id])
  );

  return {
    total: Object.values(map).reduce((a, b) => a + b, 0),
    opened: map['OPENED'] ?? 0,
    pending: map['PENDING'] ?? 0,
    matched: map['MATCHED'] ?? 0,
    closed: map['CLOSED'] ?? 0,
  };
}

export async function createRequest(params: {
  userId: number;
  eventTypes: string[];
  durationMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredDates: PreferredDateTime[];
  deadlineDate: Date | null;
  participantCount: number;
  notesForAdmin: string | null;
  requestPreferences?: RequestPreferenceAnswerInput[];
}): Promise<number> {
  const objectiveCategory = params.eventTypes.join(', ').slice(0, 100);
  const requestPreferenceInputs = params.requestPreferences ?? [];
  const questionIds = Array.from(
    new Set(
      requestPreferenceInputs
        .map(item => item.questionId)
        .filter(questionId => Number.isInteger(questionId) && questionId > 0)
    )
  );

  const [questions, questionDimensions] = await Promise.all([
    questionIds.length > 0
      ? prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: {
            id: true,
            dimension_id: true,
            question_type: true,
            question_options: {
              select: {
                id: true,
                option_label: true,
                option_value: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    questionIds.length > 0
      ? prisma.questionDimension.findMany({
          where: { question_id: { in: questionIds } },
          select: {
            question_id: true,
            dimension_id: true,
          },
          orderBy: [{ question_id: 'asc' }, { id: 'asc' }],
        })
      : Promise.resolve([]),
  ]);

  const dimensionIds = Array.from(
    new Set([
      ...questions
        .map(question => question.dimension_id)
        .filter(
          (dimensionId): dimensionId is number =>
            dimensionId !== null &&
            Number.isInteger(dimensionId) &&
            dimensionId > 0
        ),
      ...questionDimensions.map(item => item.dimension_id),
    ])
  );

  const dimensionOptions = dimensionIds.length
    ? await prisma.dimensionOption.findMany({
        where: { dimension_id: { in: dimensionIds } },
        select: {
          id: true,
          dimension_id: true,
          option_label: true,
          option_value: true,
        },
      })
    : [];

  const questionById = new Map(
    questions.map(question => [question.id, question])
  );
  const dimensionIdsByQuestionId = new Map<number, number[]>();
  for (const item of questionDimensions) {
    const current = dimensionIdsByQuestionId.get(item.question_id) ?? [];
    if (!current.includes(item.dimension_id)) {
      current.push(item.dimension_id);
    }
    dimensionIdsByQuestionId.set(item.question_id, current);
  }

  for (const question of questions) {
    const current = dimensionIdsByQuestionId.get(question.id) ?? [];
    if (
      question.dimension_id &&
      Number.isInteger(question.dimension_id) &&
      !current.includes(question.dimension_id)
    ) {
      current.push(question.dimension_id);
      dimensionIdsByQuestionId.set(question.id, current);
    }
  }

  const dimensionOptionsByDimensionId = new Map<
    number,
    Array<{
      id: number;
      option_label: string;
      option_value: string;
    }>
  >();
  for (const option of dimensionOptions) {
    const current =
      dimensionOptionsByDimensionId.get(option.dimension_id) ?? [];
    current.push(option);
    dimensionOptionsByDimensionId.set(option.dimension_id, current);
  }

  const requestPreferenceRows: Array<{
    question_id: number;
    dimension_id: number | null;
    option_id: number | null;
    desired_value: string;
  }> = [];

  for (const item of requestPreferenceInputs) {
    const question = questionById.get(item.questionId);
    if (!question) continue;

    const dimensionIdsForQuestion =
      dimensionIdsByQuestionId.get(question.id) ?? [];
    const values = Array.isArray(item.value) ? item.value : [item.value];

    for (const rawValue of values) {
      const normalizedRawValue = rawValue.trim();
      if (!normalizedRawValue) continue;

      const matchedQuestionOption = question.question_options.find(option => {
        const optionValue = option.option_value?.trim() ?? '';
        const optionLabel = option.option_label.trim();
        return (
          optionValue.localeCompare(normalizedRawValue, undefined, {
            sensitivity: 'accent',
          }) === 0 ||
          optionLabel.localeCompare(normalizedRawValue, undefined, {
            sensitivity: 'accent',
          }) === 0
        );
      });

      const desiredValue =
        matchedQuestionOption?.option_value?.trim() ||
        matchedQuestionOption?.option_label.trim() ||
        normalizedRawValue;

      if (dimensionIdsForQuestion.length === 0) {
        requestPreferenceRows.push({
          question_id: question.id,
          dimension_id: null,
          option_id: null,
          desired_value: desiredValue,
        });
        continue;
      }

      for (const dimensionId of dimensionIdsForQuestion) {
        const matchedDimensionOption =
          dimensionOptionsByDimensionId.get(dimensionId)?.find(option => {
            const optionValue = option.option_value.trim();
            const optionLabel = option.option_label.trim();
            return (
              optionValue.localeCompare(desiredValue, undefined, {
                sensitivity: 'accent',
              }) === 0 ||
              optionLabel.localeCompare(desiredValue, undefined, {
                sensitivity: 'accent',
              }) === 0 ||
              optionValue.localeCompare(normalizedRawValue, undefined, {
                sensitivity: 'accent',
              }) === 0 ||
              optionLabel.localeCompare(normalizedRawValue, undefined, {
                sensitivity: 'accent',
              }) === 0
            );
          }) ?? null;

        requestPreferenceRows.push({
          question_id: question.id,
          dimension_id: dimensionId,
          option_id: matchedDimensionOption?.id ?? null,
          desired_value: desiredValue,
        });
      }
    }
  }

  const request = await prisma.$transaction(async tx => {
    const createdRequest = await tx.request.create({
      data: {
        user_id: params.userId,
        objective_category: objectiveCategory,
        request_status: 'OPENED',
        delivery_method: 'in_person',
        duration_max: params.durationMax,
        participant_count: params.participantCount,
        budget_min: params.budgetMin,
        budget_max: params.budgetMax,
        deadline_date: params.deadlineDate,
        notes_for_admin: params.notesForAdmin,
      },
      select: { id: true },
    });

    if (params.preferredDates.length > 0) {
      await tx.request_Calendar.createMany({
        data: params.preferredDates.map(item => ({
          request_id: createdRequest.id,
          preferred_date: item.date,
          start_time: item.startTime ?? item.date,
          end_time: item.endTime ?? item.date,
        })),
      });
    }

    if (requestPreferenceRows.length > 0) {
      await tx.requestPreference.createMany({
        data: requestPreferenceRows.map(item => ({
          request_id: createdRequest.id,
          question_id: item.question_id,
          dimension_id: item.dimension_id,
          option_id: item.option_id,
          desired_value: item.desired_value,
        })),
      });
    }

    return createdRequest;
  });

  return request.id;
}
