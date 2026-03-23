import 'server-only';
import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import type {
  AdminTeamCardItem,
  AdminTeamListItem,
  AdminTeamMember,
  AdminTeamsPageData,
  AdminTeamsPageQuery,
} from '@/types/team-type';

type TeamListRow = {
  id: number;
  team_name: string;
  team_notes: string | null;
  owner_email: string;
  member_count: number | string | bigint | null;
};

type TeamMemberRow = {
  id: number;
  email: string;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role_title: string | null;
};

function toNumber(value: number | string | bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toDisplayName(row: TeamMemberRow): string {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ');
  if (fullName.trim().length > 0) return fullName.trim();
  if (row.user_name && row.user_name.trim().length > 0) return row.user_name;
  const emailPrefix = row.email.split('@')[0]?.trim();
  return emailPrefix && emailPrefix.length > 0 ? emailPrefix : 'Unknown User';
}

function mapTeamRow(row: TeamListRow): AdminTeamListItem {
  return {
    id: row.id,
    name: row.team_name,
    description: row.team_notes,
    ownerEmail: row.owner_email,
    memberCount: toNumber(row.member_count),
  };
}

function mapMemberRow(row: TeamMemberRow): AdminTeamMember {
  return {
    id: row.id,
    name: toDisplayName(row),
    firstName: row.first_name?.trim() || null,
    lastName: row.last_name?.trim() || null,
    email: row.email,
    role: row.role_title?.trim() || 'N/A',
  };
}

type TeamCountRow = {
  count: number | string | bigint;
};

async function getTeamRows(
  search: string,
  limit: number,
  offset: number
): Promise<TeamListRow[]> {
  const normalizedSearch = search.trim().toLowerCase();
  const whereSql =
    normalizedSearch.length > 0
      ? Prisma.sql`WHERE (
            LOWER(team.team_name) LIKE ${`%${normalizedSearch}%`}
            OR LOWER(owner.email) LIKE ${`%${normalizedSearch}%`}
          )`
      : Prisma.empty;

  return prisma.$queryRaw<TeamListRow[]>(Prisma.sql`
    SELECT
      team.id,
      team.team_name,
      team.team_notes,
      owner.email AS owner_email,
      COALESCE(member_counts.member_count, 0)::int AS member_count
    FROM "team" team
    JOIN "user" owner ON owner.id = team.created_by
    LEFT JOIN (
      SELECT
        team_mate.team_id,
        COUNT(*)::int AS member_count
      FROM "team_mate" team_mate
      GROUP BY team_mate.team_id
    ) member_counts ON member_counts.team_id = team.id
    ${whereSql}
    ORDER BY team.team_name ASC, team.id ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `);
}

async function getTeamTotalCount(search: string): Promise<number> {
  const normalizedSearch = search.trim().toLowerCase();
  const whereSql =
    normalizedSearch.length > 0
      ? Prisma.sql`WHERE (
            LOWER(team.team_name) LIKE ${`%${normalizedSearch}%`}
            OR LOWER(owner.email) LIKE ${`%${normalizedSearch}%`}
          )`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<TeamCountRow[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "team" team
    JOIN "user" owner ON owner.id = team.created_by
    ${whereSql}
  `);

  return toNumber(rows[0]?.count ?? 0);
}

async function getMemberRows(teamId: number): Promise<TeamMemberRow[]> {
  return prisma.$queryRaw<TeamMemberRow[]>(Prisma.sql`
    SELECT
      user_account.id,
      user_account.email,
      user_account.user_name,
      profile.first_name,
      profile.last_name,
      company.role_title
    FROM "team_mate" team_mate
    JOIN "user" user_account ON user_account.id = team_mate.user_id
    LEFT JOIN "profile" profile ON profile.user_id = user_account.id
    LEFT JOIN "company" company ON company.user_id = user_account.id
    WHERE team_mate.team_id = ${teamId}
    ORDER BY
      LOWER(COALESCE(profile.first_name, '')),
      LOWER(COALESCE(profile.last_name, '')),
      LOWER(user_account.email)
  `);
}

export async function getAdminTeamsPage(
  query: AdminTeamsPageQuery
): Promise<AdminTeamsPageData> {
  const search = query.search.trim();
  const pageSize = Number.isFinite(query.pageSize)
    ? Math.min(20, Math.max(1, Math.floor(query.pageSize)))
    : 6;
  const requestedPage = Number.isFinite(query.page)
    ? Math.max(1, Math.floor(query.page))
    : 1;
  const totalItems = await getTeamTotalCount(search);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const teams = (await getTeamRows(search, pageSize, offset)).map(mapTeamRow);

  if (teams.length === 0) {
    return {
      search,
      items: [],
      totalItems,
      totalPages,
      currentPage,
    };
  }

  const membersByTeam = await Promise.all(
    teams.map(async team => {
      const members = (await getMemberRows(team.id)).map(mapMemberRow);
      return [team.id, members] as const;
    })
  );
  const membersLookup = new Map<number, AdminTeamMember[]>(membersByTeam);
  const items: AdminTeamCardItem[] = teams.map(team => ({
    ...team,
    members: membersLookup.get(team.id) ?? [],
  }));

  return {
    search,
    items,
    totalItems,
    totalPages,
    currentPage,
  };
}
