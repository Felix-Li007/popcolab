import 'server-only';

import {
  REQUEST_STATUS,
  getRequestStatusLabel,
  normalizeRequestStatus,
} from '@/constants/request-status';
import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import {
  formatScheduleTimeValue,
  mergeDateAndTime,
  parseCalendarDateValue,
} from '@/utils/event-schedule';
import { EventStatus } from '@/libs/prisma/enums';
import type {
  OverviewBreakdownItem,
  OverviewEventMetrics,
  OverviewEventSummaryItem,
  OverviewGrowthMetrics,
  OverviewGrowthPoint,
  OverviewExperienceMetrics,
  OverviewExperienceTrendPoint,
  OverviewProposalMetrics,
  OverviewQuestionMetrics,
  OverviewQuizMetrics,
  OverviewQuizTrendPoint,
  OverviewRequestMetrics,
  OverviewRequestStatusPoint,
  OverviewRequestTrendPoint,
  OverviewUserTeamMetrics,
} from '@/types/overview-type';

type OverviewCountRow = {
  total_users: number | string | bigint;
  total_teams: number | string | bigint;
  total_requests: number | string | bigint;
  total_proposals: number | string | bigint;
};

type OverviewUserTeamSummaryRow = {
  onboarding_completed_users: number | string | bigint;
  users_in_teams: number | string | bigint;
  average_team_size: number | string | bigint | null;
  teams_with_multiple_members: number | string | bigint;
  total_invites: number | string | bigint;
  pending_invites: number | string | bigint;
  accepted_invites: number | string | bigint;
  rejected_invites: number | string | bigint;
};

type OverviewGrowthRow = {
  day_start: Date | string;
  user_count: number | string | bigint;
  team_count: number | string | bigint;
};

type OverviewRequestStatusRow = {
  request_status: string | null;
  count: number | string | bigint;
};

type OverviewRequestTrendRow = {
  month_start: Date | string;
  request_status: string | null;
  count: number | string | bigint;
};

type OverviewCategoryRow = {
  label: string;
  value: number | string | bigint;
};

type OverviewMatchSummaryRow = {
  matched_count: number | string | bigint;
  backlog_count: number | string | bigint;
  avg_match_hours: number | string | bigint | null;
};

type OverviewExperienceTrendRow = {
  week_start: Date | string;
  count: number | string | bigint;
};

type OverviewQuizSummaryRow = {
  total_completions: number | string | bigint;
  unique_participants: number | string | bigint;
  completions_this_week: number | string | bigint;
  completions_previous_week: number | string | bigint;
};

type OverviewQuizTrendRow = {
  day_start: Date | string;
  count: number | string | bigint;
};

type OverviewQuestionSummaryRow = {
  total_questions: number | string | bigint;
  mapped_questions: number | string | bigint;
  unmapped_questions: number | string | bigint;
  choice_questions_without_options: number | string | bigint;
};

type OverviewProposalSummaryRow = {
  pending_count: number | string | bigint;
  approved_count: number | string | bigint;
  accepted_count: number | string | bigint;
  rejected_count: number | string | bigint;
  avg_experiences_per_proposal: number | string | bigint | null;
};

type OverviewProposalTrendRow = {
  week_start: Date | string;
  count: number | string | bigint;
};

const NEW_EXPERIENCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function toNumber(value: number | string | bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toMonthLabel(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function toMonthKey(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 7);
}

function toDayLabel(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function toDayKey(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function toWeekLabel(value: Date | string): string {
  return toDayLabel(value);
}

function toWeekKey(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function toWeekdayLabel(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    weekday: 'narrow',
    timeZone: 'UTC',
  });
}

function formatEventDateLabel(value: Date): string {
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function parseDeliveryMethodTokens(value: string | null | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[\n,;|]+/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function buildDeliveryMethodBreakdown(
  values: Array<{ delivery_methods: string }>
): OverviewBreakdownItem[] {
  const counts = new Map<string, number>();

  values.forEach(row => {
    parseDeliveryMethodTokens(row.delivery_methods).forEach(token => {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function getQuestionFormLabel(value: string): string {
  switch (value) {
    case 'ASSESS':
      return 'Assessment';
    case 'REQUEST':
      return 'Request';
    case 'EXPERIENCE':
      return 'Experience';
    case 'MEMBER':
      return 'Member';
    default:
      return value;
  }
}

function getQuestionTypeLabel(value: string): string {
  switch (value) {
    case 'single_choice':
      return 'Single Choice';
    case 'multi_choice':
      return 'Multi Choice';
    case 'scale':
      return 'Scale';
    case 'text_input':
      return 'Text Input';
    default:
      return value;
  }
}

function getProposalStatusLabel(value: string): string {
  switch (value) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    default:
      return value;
  }
}

function getWeeklyChangePercentage(
  completionsThisWeek: number,
  completionsPreviousWeek: number
) {
  if (completionsPreviousWeek === 0) {
    return completionsThisWeek === 0 ? 0 : 100;
  }

  return (
    ((completionsThisWeek - completionsPreviousWeek) /
      completionsPreviousWeek) *
    100
  );
}

export async function getOverviewGrowthMetrics(): Promise<OverviewGrowthMetrics> {
  const [
    countRows,
    growthRows,
    userTeamSummaryRows,
    requestStatusRows,
    requestTrendRows,
    requestMatchSummaryRows,
    topRequestedCategoryRows,
    topMatchedExperienceRows,
    proposalSummaryRows,
    proposalStatusRows,
    proposalTrendRows,
    topProposedExperienceRows,
    quizSummaryRows,
    quizTrendRows,
    questionSummaryRows,
    questionFormRows,
    questionTypeRows,
    experienceStatusRows,
    newExperiencesThisWeek,
    newExperienceTrendRows,
    deliveryMethodRows,
    topCategoryRows,
  ] = await Promise.all([
    prisma.$queryRaw<OverviewCountRow[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::int FROM "user") AS total_users,
        (SELECT COUNT(*)::int FROM "team") AS total_teams,
        (SELECT COUNT(*)::int FROM "request") AS total_requests,
        (SELECT COUNT(*)::int FROM "proposal") AS total_proposals
    `),
    prisma.$queryRaw<OverviewGrowthRow[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '13 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day_start
      ),
      user_counts AS (
        SELECT
          created_at::date AS day_start,
          COUNT(*)::int AS user_count
        FROM "user"
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY 1
      ),
      team_counts AS (
        SELECT
          created_at::date AS day_start,
          COUNT(*)::int AS team_count
        FROM "team"
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY 1
      )
      SELECT
        days.day_start,
        COALESCE(user_counts.user_count, 0)::int AS user_count,
        COALESCE(team_counts.team_count, 0)::int AS team_count
      FROM days
      LEFT JOIN user_counts ON user_counts.day_start = days.day_start
      LEFT JOIN team_counts ON team_counts.day_start = days.day_start
      ORDER BY days.day_start ASC
    `),
    prisma.$queryRaw<OverviewUserTeamSummaryRow[]>(Prisma.sql`
      WITH team_membership AS (
        SELECT id AS team_id, created_by AS user_id
        FROM "team"
        UNION
        SELECT team_id, user_id
        FROM "team_mate"
      ),
      team_sizes AS (
        SELECT
          team_id,
          COUNT(DISTINCT user_id)::int AS member_count
        FROM team_membership
        GROUP BY team_id
      ),
      user_membership AS (
        SELECT COUNT(DISTINCT user_id)::int AS users_in_teams
        FROM team_membership
      )
      SELECT
        (SELECT COUNT(*)::int FROM "user" WHERE intake_complete = true AND personality_complete = true) AS onboarding_completed_users,
        COALESCE((SELECT users_in_teams FROM user_membership), 0)::int AS users_in_teams,
        COALESCE((SELECT AVG(member_count) FROM team_sizes), 0) AS average_team_size,
        COALESCE((SELECT COUNT(*)::int FROM team_sizes WHERE member_count >= 2), 0)::int AS teams_with_multiple_members,
        (SELECT COUNT(*)::int FROM "team_invite") AS total_invites,
        (SELECT COUNT(*)::int FROM "team_invite" WHERE status = 'pending') AS pending_invites,
        (SELECT COUNT(*)::int FROM "team_invite" WHERE status = 'accepted') AS accepted_invites,
        (SELECT COUNT(*)::int FROM "team_invite" WHERE status = 'rejected') AS rejected_invites
    `),
    prisma.$queryRaw<OverviewRequestStatusRow[]>(Prisma.sql`
      SELECT
        request_status::text AS request_status,
        COUNT(*)::int AS count
      FROM "request"
      GROUP BY request_status::text
      ORDER BY COUNT(*) DESC, request_status ASC
    `),
    prisma.$queryRaw<OverviewRequestTrendRow[]>(Prisma.sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_start
      ),
      statuses AS (
        SELECT unnest(ARRAY[
          ${REQUEST_STATUS.OPENED}::text,
          ${REQUEST_STATUS.PENDING}::text,
          ${REQUEST_STATUS.MATCHED}::text,
          ${REQUEST_STATUS.CLOSED}::text
        ]) AS request_status
      ),
      request_counts AS (
        SELECT
          date_trunc('month', created_at) AS month_start,
          request_status::text AS request_status,
          COUNT(*)::int AS count
        FROM "request"
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1, 2
      )
      SELECT
        months.month_start,
        statuses.request_status,
        COALESCE(request_counts.count, 0)::int AS count
      FROM months
      CROSS JOIN statuses
      LEFT JOIN request_counts
        ON request_counts.month_start = months.month_start
        AND request_counts.request_status = statuses.request_status
      ORDER BY months.month_start ASC, statuses.request_status ASC
    `),
    prisma.$queryRaw<OverviewMatchSummaryRow[]>(Prisma.sql`
      WITH first_proposals AS (
        SELECT
          request_id,
          MIN(created_at) AS first_proposal_at
        FROM "proposal"
        GROUP BY request_id
      )
      SELECT
        COUNT(*) FILTER (
          WHERE r.request_status::text IN (${REQUEST_STATUS.MATCHED}, ${REQUEST_STATUS.CLOSED})
        )::int AS matched_count,
        COUNT(*) FILTER (
          WHERE r.request_status::text IN (
            ${REQUEST_STATUS.OPENED},
            ${REQUEST_STATUS.PENDING}
          )
        )::int AS backlog_count,
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (fp.first_proposal_at - r.created_at)) / 3600.0
          ) FILTER (
            WHERE fp.first_proposal_at IS NOT NULL
              AND r.request_status::text IN (
                ${REQUEST_STATUS.MATCHED},
                ${REQUEST_STATUS.CLOSED}
              )
          ),
          0
        ) AS avg_match_hours
      FROM "request" r
      LEFT JOIN first_proposals fp ON fp.request_id = r.id
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        objective_category AS label,
        COUNT(*)::int AS value
      FROM "request"
      GROUP BY objective_category
      ORDER BY COUNT(*) DESC, objective_category ASC
      LIMIT 5
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        e.experience_title AS label,
        COUNT(*)::int AS value
      FROM "proposal_experience" pe
      INNER JOIN "proposal" p ON p.id = pe.proposal_id
      INNER JOIN "request" r ON r.id = p.request_id
      INNER JOIN "experience" e ON e.id = pe.experience_id
      WHERE r.request_status::text IN (
        ${REQUEST_STATUS.MATCHED},
        ${REQUEST_STATUS.CLOSED}
      )
      GROUP BY e.id, e.experience_title
      ORDER BY COUNT(*) DESC, e.experience_title ASC
      LIMIT 5
    `),
    prisma.$queryRaw<OverviewProposalSummaryRow[]>(Prisma.sql`
      WITH proposal_experience_counts AS (
        SELECT
          p.id AS proposal_id,
          COUNT(pe.experience_id)::int AS experience_count
        FROM "proposal" p
        LEFT JOIN "proposal_experience" pe ON pe.proposal_id = p.id
        GROUP BY p.id
      )
      SELECT
        COUNT(*) FILTER (WHERE proposal_status = 'PENDING')::int AS pending_count,
        COUNT(*) FILTER (WHERE proposal_status = 'APPROVED')::int AS approved_count,
        COUNT(*) FILTER (WHERE proposal_status = 'ACCEPTED')::int AS accepted_count,
        COUNT(*) FILTER (WHERE proposal_status = 'REJECTED')::int AS rejected_count,
        COALESCE(AVG(experience_count), 0) AS avg_experiences_per_proposal
      FROM "proposal" p
      LEFT JOIN proposal_experience_counts pec ON pec.proposal_id = p.id
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        proposal_status::text AS label,
        COUNT(*)::int AS value
      FROM "proposal"
      GROUP BY proposal_status::text
      ORDER BY COUNT(*) DESC, proposal_status::text ASC
    `),
    prisma.$queryRaw<OverviewProposalTrendRow[]>(Prisma.sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks',
          date_trunc('week', CURRENT_DATE),
          INTERVAL '1 week'
        ) AS week_start
      ),
      proposal_counts AS (
        SELECT
          date_trunc('week', created_at) AS week_start,
          COUNT(*)::int AS count
        FROM "proposal"
        WHERE created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks'
        GROUP BY 1
      )
      SELECT
        weeks.week_start,
        COALESCE(proposal_counts.count, 0)::int AS count
      FROM weeks
      LEFT JOIN proposal_counts ON proposal_counts.week_start = weeks.week_start
      ORDER BY weeks.week_start ASC
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        e.experience_title AS label,
        COUNT(*)::int AS value
      FROM "proposal_experience" pe
      INNER JOIN "experience" e ON e.id = pe.experience_id
      GROUP BY e.id, e.experience_title
      ORDER BY COUNT(*) DESC, e.experience_title ASC
      LIMIT 5
    `),
    prisma.$queryRaw<OverviewQuizSummaryRow[]>(Prisma.sql`
      WITH completed_responses AS (
        SELECT
          user_id,
          completed_at::date AS completed_day
        FROM "response"
        WHERE completed_at IS NOT NULL
      )
      SELECT
        COUNT(*)::int AS total_completions,
        COUNT(DISTINCT user_id)::int AS unique_participants,
        COUNT(*) FILTER (
          WHERE completed_day >= CURRENT_DATE - INTERVAL '6 days'
        )::int AS completions_this_week,
        COUNT(*) FILTER (
          WHERE completed_day BETWEEN CURRENT_DATE - INTERVAL '13 days'
          AND CURRENT_DATE - INTERVAL '7 days'
        )::int AS completions_previous_week
      FROM completed_responses
    `),
    prisma.$queryRaw<OverviewQuizTrendRow[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day_start
      ),
      response_counts AS (
        SELECT
          completed_at::date AS day_start,
          COUNT(*)::int AS count
        FROM "response"
        WHERE completed_at >= CURRENT_DATE - INTERVAL '6 days'
          AND completed_at IS NOT NULL
        GROUP BY 1
      )
      SELECT
        days.day_start,
        COALESCE(response_counts.count, 0)::int AS count
      FROM days
      LEFT JOIN response_counts
        ON response_counts.day_start = days.day_start
      ORDER BY days.day_start ASC
    `),
    prisma.$queryRaw<OverviewQuestionSummaryRow[]>(Prisma.sql`
      WITH mapped_questions AS (
        SELECT DISTINCT question_id FROM "question_dimension"
      ),
      question_options AS (
        SELECT DISTINCT question_id FROM "question_option"
      )
      SELECT
        COUNT(*)::int AS total_questions,
        COUNT(*) FILTER (
          WHERE q.dimension_id IS NOT NULL OR mq.question_id IS NOT NULL
        )::int AS mapped_questions,
        COUNT(*) FILTER (
          WHERE q.dimension_id IS NULL AND mq.question_id IS NULL
        )::int AS unmapped_questions,
        COUNT(*) FILTER (
          WHERE q.question_type IN ('single_choice', 'multi_choice')
            AND qo.question_id IS NULL
        )::int AS choice_questions_without_options
      FROM "question" q
      LEFT JOIN mapped_questions mq ON mq.question_id = q.id
      LEFT JOIN question_options qo ON qo.question_id = q.id
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        form_name::text AS label,
        COUNT(*)::int AS value
      FROM "question"
      GROUP BY form_name::text
      ORDER BY COUNT(*) DESC, form_name::text ASC
    `),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        question_type AS label,
        COUNT(*)::int AS value
      FROM "question"
      GROUP BY question_type
      ORDER BY COUNT(*) DESC, question_type ASC
    `),
    prisma.experience.groupBy({
      by: ['experience_status'],
      _count: {
        _all: true,
      },
    }),
    prisma.experience.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - NEW_EXPERIENCE_WINDOW_MS),
        },
      },
    }),
    prisma.$queryRaw<OverviewExperienceTrendRow[]>(Prisma.sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks',
          date_trunc('week', CURRENT_DATE),
          INTERVAL '1 week'
        ) AS week_start
      ),
      experience_counts AS (
        SELECT
          date_trunc('week', created_at) AS week_start,
          COUNT(*)::int AS count
        FROM "experience"
        WHERE created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 weeks'
        GROUP BY 1
      )
      SELECT
        weeks.week_start,
        COALESCE(experience_counts.count, 0)::int AS count
      FROM weeks
      LEFT JOIN experience_counts
        ON experience_counts.week_start = weeks.week_start
      ORDER BY weeks.week_start ASC
    `),
    prisma.experience.findMany({
      select: {
        delivery_methods: true,
      },
    }),
    prisma.$queryRaw<OverviewCategoryRow[]>(Prisma.sql`
      SELECT
        c.category_title AS label,
        COUNT(*)::int AS value
      FROM "experience" e
      INNER JOIN "category" c ON c.id = e.category_id
      GROUP BY c.id, c.category_title
      ORDER BY COUNT(*) DESC, c.category_title ASC
      LIMIT 5
    `),
  ]);

  const growth: OverviewGrowthPoint[] = growthRows.map(row => ({
    periodKey: toDayKey(row.day_start),
    periodLabel: toDayLabel(row.day_start),
    users: toNumber(row.user_count),
    teams: toNumber(row.team_count),
  }));

  const counts = countRows[0];
  const userTeamSummary = userTeamSummaryRows[0];
  const usersLast14Days = growth.reduce((sum, point) => sum + point.users, 0);
  const teamsLast14Days = growth.reduce((sum, point) => sum + point.teams, 0);
  const totalUsers = toNumber(counts?.total_users ?? 0);
  const usersInTeams = toNumber(userTeamSummary?.users_in_teams ?? 0);
  const totalInvites = toNumber(userTeamSummary?.total_invites ?? 0);
  const acceptedInvites = toNumber(userTeamSummary?.accepted_invites ?? 0);
  const userTeamMetrics: OverviewUserTeamMetrics = {
    onboardingCompletedUsers: toNumber(
      userTeamSummary?.onboarding_completed_users ?? 0
    ),
    onboardingCompletionRate:
      totalUsers === 0
        ? 0
        : (toNumber(userTeamSummary?.onboarding_completed_users ?? 0) /
            totalUsers) *
          100,
    usersInTeams,
    soloUsers: Math.max(totalUsers - usersInTeams, 0),
    averageTeamSize: Number(
      toNumber(userTeamSummary?.average_team_size ?? 0).toFixed(1)
    ),
    teamsWithMultipleMembers: toNumber(
      userTeamSummary?.teams_with_multiple_members ?? 0
    ),
    totalInvites,
    pendingInvites: toNumber(userTeamSummary?.pending_invites ?? 0),
    acceptedInvites,
    rejectedInvites: toNumber(userTeamSummary?.rejected_invites ?? 0),
    inviteAcceptanceRate:
      totalInvites === 0 ? 0 : (acceptedInvites / totalInvites) * 100,
  };
  const requestStatus: OverviewRequestStatusPoint[] = requestStatusRows.map(
    row => ({
      id: normalizeRequestStatus(row.request_status) ?? 'unknown',
      label:
        getRequestStatusLabel(normalizeRequestStatus(row.request_status)) ??
        'Unknown',
      value: toNumber(row.count),
    })
  );
  const requestTrendMap = new Map<string, OverviewRequestTrendPoint>();

  requestTrendRows.forEach(row => {
    const monthKey = toMonthKey(row.month_start);
    const normalizedStatus = normalizeRequestStatus(row.request_status);
    if (!normalizedStatus) return;

    const existing = requestTrendMap.get(monthKey) ?? {
      monthKey,
      monthLabel: toMonthLabel(row.month_start),
      [REQUEST_STATUS.OPENED]: 0,
      [REQUEST_STATUS.PENDING]: 0,
      [REQUEST_STATUS.MATCHED]: 0,
      [REQUEST_STATUS.CLOSED]: 0,
    };

    existing[normalizedStatus] = toNumber(row.count);
    requestTrendMap.set(monthKey, existing);
  });

  const requestTrend = Array.from(requestTrendMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey)
  );
  const requestMatchSummary = requestMatchSummaryRows[0];
  const matchedRequests = toNumber(requestMatchSummary?.matched_count ?? 0);
  const requestMetrics: OverviewRequestMetrics = {
    matchRate:
      toNumber(counts?.total_requests ?? 0) === 0
        ? 0
        : (matchedRequests / toNumber(counts?.total_requests ?? 0)) * 100,
    backlogRequests: toNumber(requestMatchSummary?.backlog_count ?? 0),
    averageMatchTimeHours: Number(
      toNumber(requestMatchSummary?.avg_match_hours ?? 0).toFixed(1)
    ),
    topRequestedCategories: topRequestedCategoryRows.map(row => ({
      label: row.label,
      value: toNumber(row.value),
    })),
    topMatchedExperiences: topMatchedExperienceRows.map(row => ({
      label: row.label,
      value: toNumber(row.value),
    })),
  };
  const proposalSummary = proposalSummaryRows[0];
  const totalProposals = toNumber(counts?.total_proposals ?? 0);
  const acceptedProposals = toNumber(proposalSummary?.accepted_count ?? 0);
  const proposalMetrics: OverviewProposalMetrics = {
    totalProposals,
    pendingProposals: toNumber(proposalSummary?.pending_count ?? 0),
    approvedProposals: toNumber(proposalSummary?.approved_count ?? 0),
    acceptedProposals,
    rejectedProposals: toNumber(proposalSummary?.rejected_count ?? 0),
    acceptanceRate:
      totalProposals === 0 ? 0 : (acceptedProposals / totalProposals) * 100,
    averageExperiencesPerProposal: Number(
      toNumber(proposalSummary?.avg_experiences_per_proposal ?? 0).toFixed(1)
    ),
    statusBreakdown: proposalStatusRows.map(row => ({
      label: getProposalStatusLabel(row.label),
      value: toNumber(row.value),
    })),
    trend: proposalTrendRows.map(row => ({
      periodKey: toWeekKey(row.week_start),
      periodLabel: toWeekLabel(row.week_start),
      value: toNumber(row.count),
    })),
    topProposedExperiences: topProposedExperienceRows.map(row => ({
      label: row.label,
      value: toNumber(row.value),
    })),
  };

  const quizSummary = quizSummaryRows[0];
  const completionsThisWeek = toNumber(quizSummary?.completions_this_week ?? 0);
  const completionsPreviousWeek = toNumber(
    quizSummary?.completions_previous_week ?? 0
  );
  const weeklyChangePct = getWeeklyChangePercentage(
    completionsThisWeek,
    completionsPreviousWeek
  );
  const quizTrend: OverviewQuizTrendPoint[] = quizTrendRows.map(row => ({
    periodKey: toDayKey(row.day_start),
    periodLabel: toWeekdayLabel(row.day_start),
    value: toNumber(row.count),
  }));
  const quizMetrics: OverviewQuizMetrics = {
    totalCompletions: toNumber(quizSummary?.total_completions ?? 0),
    uniqueParticipants: toNumber(quizSummary?.unique_participants ?? 0),
    completionsThisWeek,
    completionsPreviousWeek,
    weeklyChangePct: Number(weeklyChangePct.toFixed(1)),
    trend: quizTrend,
  };
  const questionSummary = questionSummaryRows[0];
  const questionMetrics: OverviewQuestionMetrics = {
    totalQuestions: toNumber(questionSummary?.total_questions ?? 0),
    mappedQuestions: toNumber(questionSummary?.mapped_questions ?? 0),
    unmappedQuestions: toNumber(questionSummary?.unmapped_questions ?? 0),
    choiceQuestionsWithoutOptions: toNumber(
      questionSummary?.choice_questions_without_options ?? 0
    ),
    byForm: questionFormRows.map(row => ({
      label: getQuestionFormLabel(row.label),
      value: toNumber(row.value),
    })),
    byType: questionTypeRows.map(row => ({
      label: getQuestionTypeLabel(row.label),
      value: toNumber(row.value),
    })),
  };

  const experienceStatusMap = new Map(
    experienceStatusRows.map(row => [row.experience_status, row._count._all])
  );
  const statusBreakdown: OverviewBreakdownItem[] = [
    {
      label: 'Active',
      value: toNumber(experienceStatusMap.get('active')),
    },
    {
      label: 'Draft',
      value: toNumber(experienceStatusMap.get('draft')),
    },
    {
      label: 'Inactive',
      value: toNumber(experienceStatusMap.get('inactive')),
    },
  ];
  const newExperienceTrend: OverviewExperienceTrendPoint[] =
    newExperienceTrendRows.map(row => ({
      periodKey: toWeekKey(row.week_start),
      periodLabel: toWeekLabel(row.week_start),
      value: toNumber(row.count),
    }));
  const experienceMetrics: OverviewExperienceMetrics = {
    totalExperiences: statusBreakdown.reduce(
      (sum, item) => sum + item.value,
      0
    ),
    activeExperiences: statusBreakdown[0].value,
    draftExperiences: statusBreakdown[1].value,
    inactiveExperiences: statusBreakdown[2].value,
    newExperiencesThisWeek,
    statusBreakdown,
    newExperienceTrend,
    deliveryMethodBreakdown: buildDeliveryMethodBreakdown(deliveryMethodRows),
    topCategories: topCategoryRows.map(row => ({
      label: row.label,
      value: toNumber(row.value),
    })),
  };

  const now = new Date();
  const activeEvents = await prisma.event.findMany({
    where: {
      eventStatus: EventStatus.ACTIVE,
    },
    select: {
      id: true,
      eventTitle: true,
      eventLocation: true,
      event_calendars: {
        select: {
          event_date: true,
          start_time: true,
          end_time: true,
        },
        orderBy: [{ event_date: 'asc' }, { start_time: 'asc' }],
      },
    },
  });

  const eventMetrics: OverviewEventMetrics = {
    highlightedEvents: activeEvents
      .flatMap(event => {
        const nextCalendar = event.event_calendars.find(calendar => {
          const eventDate = parseCalendarDateValue(calendar.event_date);
          const endTime = formatScheduleTimeValue(calendar.end_time);
          if (!eventDate || !endTime) {
            return false;
          }

          const endAt = mergeDateAndTime(eventDate, endTime);

          return endAt >= now;
        });

        if (!nextCalendar) {
          return [];
        }

        const eventDate = parseCalendarDateValue(nextCalendar.event_date);
        const startTime = formatScheduleTimeValue(nextCalendar.start_time);
        const endTime = formatScheduleTimeValue(nextCalendar.end_time);

        if (!eventDate || !startTime || !endTime) {
          return [];
        }

        const startAt = mergeDateAndTime(eventDate, startTime);
        const endAt = mergeDateAndTime(eventDate, endTime);

        return [
          {
            item: {
              id: event.id,
              title: event.eventTitle,
              location: event.eventLocation,
              dateLabel: formatEventDateLabel(startAt),
              status: startAt <= now && endAt >= now ? 'live' : 'upcoming',
            } satisfies OverviewEventSummaryItem,
            sortTime: startAt.getTime(),
          },
        ];
      })
      .sort((left, right) => {
        if (left.item.status !== right.item.status) {
          return left.item.status === 'live' ? -1 : 1;
        }

        return left.sortTime - right.sortTime;
      })
      .slice(0, 6)
      .map(entry => entry.item),
  };

  return {
    totalUsers,
    totalTeams: toNumber(counts?.total_teams ?? 0),
    usersLast14Days,
    teamsLast14Days,
    growth,
    userTeamMetrics,
    totalRequests: toNumber(counts?.total_requests ?? 0),
    requestStatus,
    requestTrend,
    requestMetrics,
    proposalMetrics,
    experienceMetrics,
    eventMetrics,
    quizMetrics,
    questionMetrics,
  };
}
