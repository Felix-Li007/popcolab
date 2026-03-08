import 'server-only';
import { Prisma } from '@/libs/prisma/client';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/libs/prisma-client';
import {
  USER_STATUS,
  USER_STATUS_SET,
  isUserStatus,
} from '@/constants/user-status';
import { normalizeWorkMode } from '@/constants/work-mode';
import type {
  AdminUserEditableUpdateErrors,
  AdminUserEditableUpdateInput,
  AdminUserListItem,
  AdminUsersPageData,
  AdminUsersPageQuery,
  AdminUsersStatusFilter,
  AdminUserStatusCounts,
  UserStatus,
} from '@/types/user-type';

type UserListRow = {
  id: number;
  email: string;
  user_name: string | null;
  avatar_image: string | null;
  status: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  preferred_contact: string | null;
  consent_given: number | null;
  privacy_notes: string | null;
  corporate_name: string | null;
  department_name: string | null;
  role_title: string | null;
  work_mode: string | null;
  team_count: number | string | bigint | null;
  team_names: string | null;
  request_count: number | string | bigint | null;
};

type UserCountRow = {
  count: number | string | bigint;
};

type UserStatusCountRow = {
  active_count: number | string | bigint;
  inactive_count: number | string | bigint;
  blocked_count: number | string | bigint;
};

let statusColumnCheckPromise: Promise<boolean> | null = null;
const USER_NAME_MAX_LENGTH = 50;
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 20;
const COMPANY_NAME_MAX_LENGTH = 255;
const DEPARTMENT_MAX_LENGTH = 100;
const ROLE_TITLE_MAX_LENGTH = 50;
const AVATAR_IMAGE_MAX_LENGTH = 255;
const USER_PREFERRED_CONTACT_SET = new Set(['email', 'phone']);

function normalizeUserStatus(value: string | null | undefined): UserStatus {
  if (!value) return USER_STATUS.ACTIVE;
  const normalized = value.toLowerCase();
  return isUserStatus(normalized) ? normalized : USER_STATUS.ACTIVE;
}

function toNumber(value: number | string | bigint | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toIso(value: Date | string): string {
  return new Date(value).toISOString();
}

function mapUserRow(row: UserListRow): AdminUserListItem {
  const displayName =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.user_name ||
    row.email.split('@')[0] ||
    'Unknown User';

  return {
    id: row.id,
    email: row.email,
    userName: row.user_name || row.email.split('@')[0] || 'user',
    avatarImage: row.avatar_image,
    status: normalizeUserStatus(row.status),
    displayName,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    preferredContact: row.preferred_contact,
    consentGiven:
      row.consent_given === null ? null : Number(row.consent_given) > 0,
    privacyNotes: row.privacy_notes,
    corporateName: row.corporate_name,
    departmentName: row.department_name,
    roleTitle: row.role_title,
    workMode: normalizeWorkMode(row.work_mode),
    teamCount: toNumber(row.team_count),
    teamNames: row.team_names
      ? row.team_names
          .split(',')
          .map(name => name.trim())
          .filter(Boolean)
      : [],
    requestCount: toNumber(row.request_count),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toNullableTrimmed(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateMaxLength(
  value: string | null,
  maxLength: number,
  message: string
): string | undefined {
  if (!value) return undefined;
  return value.length > maxLength ? message : undefined;
}

export function normalizeUserEditableUpdateInput(
  input: AdminUserEditableUpdateInput
): AdminUserEditableUpdateInput {
  const normalizedPreferredContact = toNullableTrimmed(input.preferredContact);

  return {
    userName: input.userName.trim(),
    status: input.status,
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phoneNumber: toNullableTrimmed(input.phoneNumber),
    preferredContact: normalizedPreferredContact
      ? normalizedPreferredContact.toLowerCase()
      : null,
    corporateName: toNullableTrimmed(input.corporateName),
    departmentName: toNullableTrimmed(input.departmentName),
    roleTitle: toNullableTrimmed(input.roleTitle),
    workMode: normalizeWorkMode(input.workMode),
  };
}

export function validateUserEditableUpdateInput(
  input: AdminUserEditableUpdateInput
): AdminUserEditableUpdateErrors {
  const errors: AdminUserEditableUpdateErrors = {};

  if (!input.userName) {
    errors.userName = 'Username is required.';
  } else if (input.userName.length > USER_NAME_MAX_LENGTH) {
    errors.userName = `Username must be ${USER_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!USER_STATUS_SET.has(input.status)) {
    errors.status = 'Invalid user status.';
  }

  errors.firstName = validateMaxLength(
    input.firstName,
    FIRST_NAME_MAX_LENGTH,
    `First name must be ${FIRST_NAME_MAX_LENGTH} characters or fewer.`
  );
  errors.lastName = validateMaxLength(
    input.lastName,
    LAST_NAME_MAX_LENGTH,
    `Last name must be ${LAST_NAME_MAX_LENGTH} characters or fewer.`
  );
  errors.phoneNumber = validateMaxLength(
    input.phoneNumber,
    PHONE_MAX_LENGTH,
    `Phone number must be ${PHONE_MAX_LENGTH} characters or fewer.`
  );
  if (
    input.preferredContact &&
    !USER_PREFERRED_CONTACT_SET.has(input.preferredContact)
  ) {
    errors.preferredContact = 'Preferred contact must be email or phone.';
  }
  errors.corporateName = validateMaxLength(
    input.corporateName,
    COMPANY_NAME_MAX_LENGTH,
    `Company must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.`
  );
  errors.departmentName = validateMaxLength(
    input.departmentName,
    DEPARTMENT_MAX_LENGTH,
    `Department must be ${DEPARTMENT_MAX_LENGTH} characters or fewer.`
  );
  errors.roleTitle = validateMaxLength(
    input.roleTitle,
    ROLE_TITLE_MAX_LENGTH,
    `Role must be ${ROLE_TITLE_MAX_LENGTH} characters or fewer.`
  );
  if (input.workMode !== null && !normalizeWorkMode(input.workMode)) {
    errors.workMode = 'Work mode must be remote, hybrid, or onsite.';
  }

  (Object.keys(errors) as Array<keyof AdminUserEditableUpdateErrors>).forEach(
    key => {
      if (!errors[key]) delete errors[key];
    }
  );

  return errors;
}

async function hasUserStatusColumn(): Promise<boolean> {
  if (!statusColumnCheckPromise) {
    statusColumnCheckPromise = prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'user'
            AND column_name = 'status'
        ) AS "exists"
      `
      .then(rows => Boolean(rows[0]?.exists))
      .catch(() => false);
  }

  return statusColumnCheckPromise;
}

function buildUserWhereSql(
  status: AdminUsersStatusFilter,
  search: string,
  hasStatusColumn: boolean
): Prisma.Sql {
  const clauses: Prisma.Sql[] = [];
  const normalizedSearch = search.trim().toLowerCase();

  if (status !== 'all') {
    if (hasStatusColumn) {
      if (status === USER_STATUS.ACTIVE) {
        clauses.push(
          Prisma.sql`LOWER(COALESCE(u.status, 'active')) NOT IN ('inactive', 'blocked')`
        );
      } else {
        clauses.push(
          Prisma.sql`LOWER(COALESCE(u.status, 'active')) = ${status}`
        );
      }
    } else if (status === USER_STATUS.BLOCKED) {
      clauses.push(Prisma.sql`1 = 0`);
    } else {
      clauses.push(
        Prisma.sql`CASE
            WHEN COALESCE(p.consent_given, 1) > 0 THEN 'active'
            ELSE 'inactive'
          END = ${status}`
      );
    }
  }

  if (normalizedSearch) {
    const like = `%${normalizedSearch}%`;
    clauses.push(Prisma.sql`(
      LOWER(u.email) LIKE ${like}
      OR LOWER(COALESCE(u.user_name, '')) LIKE ${like}
      OR LOWER(COALESCE(p.first_name, '')) LIKE ${like}
      OR LOWER(COALESCE(p.last_name, '')) LIKE ${like}
      OR LOWER(COALESCE(c.corporate_name, '')) LIKE ${like}
      OR LOWER(COALESCE(c.department_name, '')) LIKE ${like}
      OR LOWER(COALESCE(c.role_title, '')) LIKE ${like}
      OR LOWER(COALESCE(c.work_mode, '')) LIKE ${like}
      OR EXISTS (
        SELECT 1
        FROM "team" team
        WHERE team.team_owner = u.id
          AND LOWER(team.team_name) LIKE ${like}
      )
    )`);
  }

  if (clauses.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
}

async function getUserRows(
  whereSql: Prisma.Sql,
  hasStatusColumn: boolean,
  limit?: number,
  offset?: number
): Promise<UserListRow[]> {
  const statusExpr = hasStatusColumn
    ? Prisma.sql`u.status`
    : Prisma.sql`CASE
          WHEN COALESCE(p.consent_given, 1) > 0 THEN 'active'
          ELSE 'inactive'
        END`;
  const paginationSql =
    typeof limit === 'number'
      ? Prisma.sql`LIMIT ${limit} OFFSET ${offset ?? 0}`
      : Prisma.empty;

  return prisma.$queryRaw<UserListRow[]>(Prisma.sql`
    SELECT
      u.id,
      u.email,
      u.user_name,
      u.avatar_image,
      ${statusExpr} AS status,
      u.created_at,
      u.updated_at,
      p.first_name,
      p.last_name,
      p.phone_number,
      p.preferred_contact,
      p.consent_given,
      p.privacy_notes,
      c.corporate_name,
      c.department_name,
      c.role_title,
      c.work_mode,
      COALESCE(tm.team_count, 0)::int AS team_count,
      COALESCE(tm.team_names, '') AS team_names,
      COALESCE(rq.request_count, 0)::int AS request_count
    FROM "user" u
    LEFT JOIN "profile" p ON p.user_id = u.id
    LEFT JOIN "company" c ON c.user_id = u.id
    LEFT JOIN (
      SELECT
        team.team_owner AS user_id,
        COUNT(*)::int AS team_count,
        STRING_AGG(team.team_name, ',' ORDER BY team.team_name) AS team_names
      FROM "team" team
      GROUP BY team.team_owner
    ) tm ON tm.user_id = u.id
    LEFT JOIN (
      SELECT
        request.user_id,
        COUNT(*)::int AS request_count
      FROM "request" request
      GROUP BY request.user_id
    ) rq ON rq.user_id = u.id
    ${whereSql}
    ORDER BY u.updated_at DESC, u.id DESC
    ${paginationSql}
  `);
}

async function getUserTotalCount(whereSql: Prisma.Sql): Promise<number> {
  const rows = await prisma.$queryRaw<UserCountRow[]>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM "user" u
    LEFT JOIN "profile" p ON p.user_id = u.id
    LEFT JOIN "company" c ON c.user_id = u.id
    ${whereSql}
  `);
  return toNumber(rows[0]?.count ?? 0);
}

async function getUserStatusCounts(
  hasStatusColumn: boolean
): Promise<AdminUserStatusCounts> {
  if (hasStatusColumn) {
    const rows = await prisma.$queryRaw<UserStatusCountRow[]>(Prisma.sql`
      SELECT
        SUM(
          CASE
            WHEN LOWER(COALESCE(u.status, 'active')) IN ('inactive', 'blocked') THEN 0
            ELSE 1
          END
        )::int AS active_count,
        SUM(CASE WHEN LOWER(COALESCE(u.status, 'active')) = 'inactive' THEN 1 ELSE 0 END)::int AS inactive_count,
        SUM(CASE WHEN LOWER(COALESCE(u.status, 'active')) = 'blocked' THEN 1 ELSE 0 END)::int AS blocked_count
      FROM "user" u
    `);
    const row = rows[0];
    return {
      [USER_STATUS.ACTIVE]: toNumber(row?.active_count ?? 0),
      [USER_STATUS.INACTIVE]: toNumber(row?.inactive_count ?? 0),
      [USER_STATUS.BLOCKED]: toNumber(row?.blocked_count ?? 0),
    };
  }

  const rows = await prisma.$queryRaw<UserStatusCountRow[]>(Prisma.sql`
    SELECT
      SUM(CASE WHEN COALESCE(p.consent_given, 1) > 0 THEN 1 ELSE 0 END)::int AS active_count,
      SUM(CASE WHEN COALESCE(p.consent_given, 1) <= 0 THEN 1 ELSE 0 END)::int AS inactive_count,
      0::int AS blocked_count
    FROM "user" u
    LEFT JOIN "profile" p ON p.user_id = u.id
  `);
  const row = rows[0];
  return {
    [USER_STATUS.ACTIVE]: toNumber(row?.active_count ?? 0),
    [USER_STATUS.INACTIVE]: toNumber(row?.inactive_count ?? 0),
    [USER_STATUS.BLOCKED]: toNumber(row?.blocked_count ?? 0),
  };
}

export async function getUsersPage(
  query: AdminUsersPageQuery
): Promise<AdminUsersPageData> {
  const hasStatusColumn = await hasUserStatusColumn();
  const statusCountsPromise = getUserStatusCounts(hasStatusColumn);
  const pageSize = Number.isFinite(query.pageSize)
    ? Math.min(50, Math.max(1, Math.floor(query.pageSize)))
    : 10;
  const requestedPage = Number.isFinite(query.page)
    ? Math.max(1, Math.floor(query.page))
    : 1;
  const whereSql = buildUserWhereSql(
    query.status,
    query.search,
    hasStatusColumn
  );
  const totalItems = await getUserTotalCount(whereSql);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const [rows, statusCounts] = await Promise.all([
    getUserRows(whereSql, hasStatusColumn, pageSize, offset),
    statusCountsPromise,
  ]);

  return {
    items: rows.map(mapUserRow),
    totalItems,
    totalPages,
    currentPage,
    statusCounts,
  };
}

export async function getUsers(): Promise<AdminUserListItem[]> {
  const hasStatusColumn = await hasUserStatusColumn();
  const userRows = await getUserRows(Prisma.empty, hasStatusColumn);
  return userRows.map(mapUserRow);
}

async function updateUserStatus(
  userId: number,
  nextStatus: UserStatus
): Promise<void> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user id');
  }

  if (!USER_STATUS_SET.has(nextStatus)) {
    throw new Error('Invalid user status');
  }

  const userExistsRows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM "user" WHERE "id" = ${userId}) AS "exists"
  `;
  if (!userExistsRows[0]?.exists) {
    throw new Error('User does not exist');
  }

  if (await hasUserStatusColumn()) {
    await prisma.$executeRaw`
      UPDATE "user"
      SET
        "status" = ${nextStatus},
        "updated_at" = NOW()
      WHERE "id" = ${userId}
    `;
    return;
  }

  // Fallback path before the "user.status" migration is applied.
  const consentValue = nextStatus === USER_STATUS.ACTIVE ? 1 : 0;
  const updatedRows = await prisma.$executeRaw`
    UPDATE "profile"
    SET
      "consent_given" = ${consentValue},
      "updated_at" = NOW()
    WHERE "user_id" = ${userId}
  `;

  if (Number(updatedRows) > 0) return;

  await prisma.$executeRaw`
    INSERT INTO "profile" (
      "user_id",
      "consent_given",
      "created_at",
      "updated_at"
    )
    VALUES (${userId}, ${consentValue}, NOW(), NOW())
    ON CONFLICT ("user_id")
    DO UPDATE SET
      "consent_given" = EXCLUDED."consent_given",
      "updated_at" = NOW()
  `;
}

export async function updateUserEditableFields(
  userId: number,
  input: AdminUserEditableUpdateInput
): Promise<void> {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user id');
  }

  const normalized = normalizeUserEditableUpdateInput(input);
  const fieldErrors = validateUserEditableUpdateInput(normalized);
  if (Object.keys(fieldErrors).length > 0) {
    throw new Error('Invalid user update payload');
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!userExists) {
    throw new Error('User does not exist');
  }

  const hasStatusColumn = await hasUserStatusColumn();
  if (hasStatusColumn) {
    await prisma.$executeRaw`
      UPDATE "user"
      SET
        "user_name" = ${normalized.userName},
        "status" = ${normalized.status},
        "updated_at" = NOW()
      WHERE "id" = ${userId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "user"
      SET
        "user_name" = ${normalized.userName},
        "updated_at" = NOW()
      WHERE "id" = ${userId}
    `;
    await updateUserStatus(userId, normalized.status);
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  const hasProfilePayload =
    normalized.firstName !== null ||
    normalized.lastName !== null ||
    normalized.phoneNumber !== null ||
    normalized.preferredContact !== null;
  if (existingProfile || hasProfilePayload) {
    if (existingProfile) {
      await prisma.profile.update({
        where: { user_id: userId },
        data: {
          first_name: normalized.firstName,
          last_name: normalized.lastName,
          phone_number: normalized.phoneNumber,
          preferred_contact: normalized.preferredContact,
        },
      });
    } else {
      await prisma.profile.create({
        data: {
          user_id: userId,
          first_name: normalized.firstName,
          last_name: normalized.lastName,
          phone_number: normalized.phoneNumber,
          preferred_contact: normalized.preferredContact,
          consent_given: 1,
          privacy_notes: null,
        },
      });
    }
  }

  const existingCompany = await prisma.company.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });
  const hasCompanyPayload =
    normalized.corporateName !== null ||
    normalized.departmentName !== null ||
    normalized.roleTitle !== null ||
    normalized.workMode !== null;
  if (existingCompany || hasCompanyPayload) {
    if (existingCompany) {
      await prisma.company.update({
        where: { user_id: userId },
        data: {
          corporate_name: normalized.corporateName,
          department_name: normalized.departmentName,
          role_title: normalized.roleTitle,
          work_mode: normalized.workMode,
        },
      });
    } else {
      await prisma.company.create({
        data: {
          user_id: userId,
          corporate_name: normalized.corporateName,
          department_name: normalized.departmentName,
          role_title: normalized.roleTitle,
          work_mode: normalized.workMode,
        },
      });
    }
  }
}

/**
 * Upserts a user based on their Clerk ID. If a user with the given Clerk ID already exists, the function does nothing.
 * @param clerkId
 * @param email
 * @param userName
 * @returns
 */
export async function upsertClerkUser(
  clerkId: string,
  email: string
): Promise<{ userId: number }> {
  // Try to find an existing user with the given Clerk ID
  let user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true },
  });
  if (user) return { userId: user.id };
  // Create a new user if none exists
  user = await prisma.user.create({
    data: {
      clerk_id: clerkId,
      email,
    },
  });
  return { userId: user.id };
}

export async function updateUserEmail(
  clerkId: string,
  user_email: string
): Promise<void> {
  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { email: user_email },
  });
}

export async function updateUserName(
  clerkId: string,
  user_name: string
): Promise<void> {
  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { user_name },
  });
}

export async function updateUserAvatar(
  clerkId: string,
  avatarImage: string | null | undefined
): Promise<void> {
  const normalizedAvatar = toNullableTrimmed(avatarImage)?.slice(
    0,
    AVATAR_IMAGE_MAX_LENGTH
  );

  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { avatar_image: normalizedAvatar ?? null },
  });
}

export async function updateUserProfile(
  clerkId: string,
  firstName: string | null | undefined,
  lastName: string | null | undefined
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { id: true },
  });

  if (!user) return;

  const normalizedFirstName = toNullableTrimmed(firstName)?.slice(
    0,
    FIRST_NAME_MAX_LENGTH
  );
  const normalizedLastName = toNullableTrimmed(lastName)?.slice(
    0,
    LAST_NAME_MAX_LENGTH
  );

  const existingProfile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    select: { id: true },
  });

  if (existingProfile) {
    await prisma.profile.update({
      where: { user_id: user.id },
      data: {
        first_name: normalizedFirstName ?? null,
        last_name: normalizedLastName ?? null,
      },
    });
    return;
  }

  if (!normalizedFirstName && !normalizedLastName) {
    return;
  }

  await prisma.profile.create({
    data: {
      user_id: user.id,
      first_name: normalizedFirstName ?? null,
      last_name: normalizedLastName ?? null,
      consent_given: 1,
      phone_number: null,
      preferred_contact: null,
      privacy_notes: null,
    },
  });
}

export async function deactivateUserByClerkId(clerkId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { clerk_id: clerkId },
    data: { status: 'inactive' },
  });
}
