import { REQUEST_STATUS, type RequestStatus } from '@/constants/request-status';
import { InviteStatus, type PrismaClient } from '@/libs/prisma/client';

type MockRequestPreferenceSeed = {
  index_key: string;
  desired_score: number;
  weight_rate: number;
};

type MockInvitedUserSeed = {
  email: string;
  invite_status?: keyof typeof InviteStatus;
  confirm_at?: Date | string | null;
};

type MockRequestSeed = {
  request_status?: RequestStatus;
  objective_category?: string | number | null;
  invite_code?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  delivery_method?: string | number | null;
  duration_max?: number | null;
  expired_at?: Date | string | null;
  invited_users?: MockInvitedUserSeed[];
  preferences?: MockRequestPreferenceSeed[];
};

type MockProfileSeed = {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  preferred_contact?: string | null;
  consent_given: number;
  privacy_notes?: string | null;
};

type MockCompanySeed = {
  corporate_name?: string | null;
  department_name?: string | null;
  role_title?: string | null;
  work_mode?: string | null;
};

type MockUserSeed = {
  email: string;
  status: 'active' | 'inactive';
  profile?: MockProfileSeed;
  company?: MockCompanySeed;
  requests?: MockRequestSeed[];
};

type MockTeamSeed = {
  team_name: string;
  team_notes?: string;
  team_owner_email: string;
  created_by_email: string;
  members: string[];
};

type SeedUsersInput = {
  hasUserStatusColumn: boolean;
  dimensionIdByKey: Map<string, number>;
};

export type SeedUsersResult = {
  userIdByEmail: Map<string, number>;
  userCount: number;
  teamCount: number;
};

let requestInviteCodeCounter = 0;

function toRequestTextValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'unspecified';
  return String(value).slice(0, 20);
}

function createRequestInviteCode(): string {
  requestInviteCodeCounter += 1;
  return requestInviteCodeCounter.toString(36).toUpperCase().padStart(6, '0');
}

function toRequestExpiry(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

const USER_NAME_MAX_LENGTH = 50;
const CLERK_ID_MAX_LENGTH = 255;

function normalizeUserName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .replace(/[_\-.]{2,}/g, '_');

  return normalized.slice(0, USER_NAME_MAX_LENGTH);
}

function deriveUserName(seedUser: MockUserSeed): string {
  const first = seedUser.profile?.first_name?.trim();
  const last = seedUser.profile?.last_name?.trim();

  if (first && last) {
    const joined = normalizeUserName(`${first}.${last}`);
    if (joined) return joined;
  }

  if (first) {
    const fromFirst = normalizeUserName(first);
    if (fromFirst) return fromFirst;
  }

  const localPart = seedUser.email.split('@')[0] ?? '';
  const fromEmail = normalizeUserName(localPart);
  if (fromEmail) return fromEmail;

  return 'user';
}

function deriveClerkId(seedUser: MockUserSeed): string {
  const normalized = seedUser.email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '')
    .replace(/[_\-.]{2,}/g, '_');

  const fallback = normalized || normalizeUserName(seedUser.email) || 'user';
  return `seed_${fallback}`.slice(0, CLERK_ID_MAX_LENGTH);
}

const baseMockUsers: MockUserSeed[] = [
  {
    email: 'ava.hughes@northstar.io',
    status: 'active',
    profile: {
      first_name: 'Ava',
      last_name: 'Hughes',
      phone_number: '+1-415-555-1001',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Weekly updates preferred.',
    },
    company: {
      corporate_name: 'Northstar Labs',
      department_name: 'Product',
      role_title: 'Product Manager',
      work_mode: 'hybrid',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.OPENED,
        objective_category: 'team_building',
        budget_min: 3000,
        budget_max: 6000,
        delivery_method: 'in_person',
        duration_max: 180,
        expired_at: '2026-03-18T18:00:00.000Z',
        invited_users: [
          { email: 'logan.chen@northstar.io', invite_status: 'accepted' },
          {
            email: 'mia.garcia@lumen.co',
            invite_status: 'pending',
          },
        ],
        preferences: [
          { index_key: 'social_intensity', desired_score: 80, weight_rate: 35 },
          {
            index_key: 'personality_creator_artist',
            desired_score: 75,
            weight_rate: 30,
          },
          {
            index_key: 'personality_director',
            desired_score: 70,
            weight_rate: 20,
          },
        ],
      },
      {
        request_status: REQUEST_STATUS.PENDING,
        objective_category: 'leadership',
        budget_min: 2000,
        budget_max: 4500,
        delivery_method: 'virtual',
        duration_max: 120,
        expired_at: '2026-03-14T15:00:00.000Z',
        invited_users: [
          {
            email: 'sophia.reed@helix.ai',
            invite_status: 'accepted',
            confirm_at: '2026-03-09T10:00:00.000Z',
          },
          {
            email: 'liam.brown@verve.studio',
            invite_status: 'accepted',
            confirm_at: '2026-03-09T12:30:00.000Z',
          },
        ],
        preferences: [
          {
            index_key: 'personality_joker',
            desired_score: 85,
            weight_rate: 40,
          },
          { index_key: 'spotlight_level', desired_score: 65, weight_rate: 25 },
        ],
      },
    ],
  },
  {
    email: 'logan.chen@northstar.io',
    status: 'active',
    profile: {
      first_name: 'Logan',
      last_name: 'Chen',
      phone_number: '+1-415-555-1002',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: 'Phone for urgent coordination.',
    },
    company: {
      corporate_name: 'Northstar Labs',
      department_name: 'Operations',
      role_title: 'Ops Lead',
      work_mode: 'onsite',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.MATCHED,
        objective_category: 'innovation',
        budget_min: 5000,
        budget_max: 9000,
        delivery_method: 'hybrid',
        duration_max: 240,
        expired_at: '2026-03-20T20:00:00.000Z',
        invited_users: [
          { email: 'ava.hughes@northstar.io', invite_status: 'accepted' },
          { email: 'emma.davis@orbit.one', invite_status: 'accepted' },
        ],
        preferences: [
          { index_key: 'cognitive_load', desired_score: 90, weight_rate: 45 },
          {
            index_key: 'competition_level',
            desired_score: 78,
            weight_rate: 25,
          },
        ],
      },
    ],
  },
  {
    email: 'mia.garcia@lumen.co',
    status: 'active',
    profile: {
      first_name: 'Mia',
      last_name: 'Garcia',
      phone_number: '+1-650-555-1003',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Creative workshops enthusiast.',
    },
    company: {
      corporate_name: 'Lumen Co',
      department_name: 'Design',
      role_title: 'Design Director',
      work_mode: 'hybrid',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.CLOSED,
        objective_category: 'team_building',
        budget_min: 2500,
        budget_max: 5000,
        delivery_method: 'virtual',
        duration_max: 150,
        expired_at: '2026-03-07T16:00:00.000Z',
        invited_users: [
          { email: 'ethan.park@lumen.co', invite_status: 'rejected' },
          { email: 'noah.wright@helix.ai', invite_status: 'accepted' },
        ],
        preferences: [
          {
            index_key: 'personality_creator_artist',
            desired_score: 92,
            weight_rate: 50,
          },
          {
            index_key: 'personality_explorer',
            desired_score: 76,
            weight_rate: 20,
          },
        ],
      },
      {
        request_status: REQUEST_STATUS.OPENED,
        objective_category: 'innovation',
        budget_min: 4200,
        budget_max: 7800,
        delivery_method: 'in_person',
        duration_max: 180,
        expired_at: '2026-03-22T19:00:00.000Z',
        invited_users: [
          { email: 'olivia.kim@verve.studio', invite_status: 'pending' },
          { email: 'harper.nguyen@aurora.dev', invite_status: 'pending' },
        ],
        preferences: [
          {
            index_key: 'personality_creator_artist',
            desired_score: 88,
            weight_rate: 36,
          },
          { index_key: 'social_intensity', desired_score: 77, weight_rate: 24 },
        ],
      },
    ],
  },
  {
    email: 'ethan.park@lumen.co',
    status: 'inactive',
    profile: {
      first_name: 'Ethan',
      last_name: 'Park',
      phone_number: '+1-650-555-1004',
      preferred_contact: 'email',
      consent_given: 0,
      privacy_notes: 'Paused account during leave.',
    },
    company: {
      corporate_name: 'Lumen Co',
      department_name: 'Engineering',
      role_title: 'Frontend Engineer',
      work_mode: 'remote',
    },
  },
  {
    email: 'sophia.reed@helix.ai',
    status: 'active',
    profile: {
      first_name: 'Sophia',
      last_name: 'Reed',
      phone_number: '+1-206-555-1005',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Interested in active sessions.',
    },
    company: {
      corporate_name: 'Helix AI',
      department_name: 'People Ops',
      role_title: 'HRBP',
      work_mode: 'hybrid',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.PENDING,
        objective_category: 'wellness',
        budget_min: 1500,
        budget_max: 3500,
        delivery_method: 'in_person',
        duration_max: 90,
        expired_at: '2026-03-13T13:00:00.000Z',
        invited_users: [
          { email: 'ava.hughes@northstar.io', invite_status: 'accepted' },
          { email: 'mason.lee@orbit.one', invite_status: 'accepted' },
        ],
        preferences: [
          {
            index_key: 'personality_kinesthete',
            desired_score: 82,
            weight_rate: 35,
          },
          { index_key: 'social_intensity', desired_score: 88, weight_rate: 30 },
        ],
      },
    ],
  },
  {
    email: 'noah.wright@helix.ai',
    status: 'inactive',
    profile: {
      first_name: 'Noah',
      last_name: 'Wright',
      phone_number: '+1-206-555-1006',
      preferred_contact: 'phone',
      consent_given: 0,
      privacy_notes: 'Reactivate next quarter.',
    },
    company: {
      corporate_name: 'Helix AI',
      department_name: 'Security',
      role_title: 'Security Analyst',
      work_mode: 'onsite',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.OPENED,
        objective_category: 'leadership',
        budget_min: 1800,
        budget_max: 4200,
        delivery_method: 'virtual',
        duration_max: 110,
        expired_at: '2026-03-16T17:00:00.000Z',
        invited_users: [
          { email: 'sophia.reed@helix.ai', invite_status: 'pending' },
          { email: 'jack.wilson@example.com', invite_status: 'pending' },
        ],
        preferences: [
          {
            index_key: 'personality_collector',
            desired_score: 84,
            weight_rate: 35,
          },
          { index_key: 'cognitive_load', desired_score: 79, weight_rate: 25 },
        ],
      },
      {
        request_status: REQUEST_STATUS.MATCHED,
        objective_category: 'innovation',
        budget_min: 2400,
        budget_max: 4600,
        delivery_method: 'hybrid',
        duration_max: 130,
        expired_at: '2026-03-11T11:00:00.000Z',
        invited_users: [
          { email: 'mia.garcia@lumen.co', invite_status: 'accepted' },
          { email: 'liam.brown@verve.studio', invite_status: 'accepted' },
        ],
        preferences: [
          { index_key: 'cognitive_load', desired_score: 82, weight_rate: 34 },
          {
            index_key: 'personality_collector',
            desired_score: 75,
            weight_rate: 22,
          },
        ],
      },
    ],
  },
  {
    email: 'olivia.kim@verve.studio',
    status: 'active',
    profile: {
      first_name: 'Olivia',
      last_name: 'Kim',
      phone_number: '+1-408-555-1007',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: null,
    },
    company: {
      corporate_name: 'Verve Studio',
      department_name: 'Marketing',
      role_title: 'Brand Strategist',
      work_mode: 'remote',
    },
  },
  {
    email: 'liam.brown@verve.studio',
    status: 'active',
    profile: {
      first_name: 'Liam',
      last_name: 'Brown',
      phone_number: '+1-408-555-1008',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: 'Prefers evening sessions.',
    },
    company: {
      corporate_name: 'Verve Studio',
      department_name: 'Growth',
      role_title: 'Growth Manager',
      work_mode: 'hybrid',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.MATCHED,
        objective_category: 'innovation',
        budget_min: 2200,
        budget_max: 5400,
        delivery_method: 'in_person',
        duration_max: 140,
        expired_at: '2026-03-10T18:00:00.000Z',
        invited_users: [
          { email: 'olivia.kim@verve.studio', invite_status: 'accepted' },
          { email: 'emma.davis@orbit.one', invite_status: 'accepted' },
        ],
        preferences: [
          {
            index_key: 'competition_level',
            desired_score: 86,
            weight_rate: 35,
          },
          {
            index_key: 'personality_joker',
            desired_score: 74,
            weight_rate: 20,
          },
        ],
      },
    ],
  },
  {
    email: 'emma.davis@orbit.one',
    status: 'active',
    profile: {
      first_name: 'Emma',
      last_name: 'Davis',
      phone_number: '+1-312-555-1009',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Looking for mixed-format events.',
    },
    company: {
      corporate_name: 'Orbit One',
      department_name: 'Finance',
      role_title: 'Finance Manager',
      work_mode: 'onsite',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.CLOSED,
        objective_category: 'team_building',
        budget_min: 3200,
        budget_max: 7000,
        delivery_method: 'in_person',
        duration_max: 200,
        expired_at: '2026-03-06T16:30:00.000Z',
        invited_users: [
          { email: 'harper.nguyen@aurora.dev', invite_status: 'accepted' },
          { email: 'jack.wilson@example.com', invite_status: 'rejected' },
        ],
        preferences: [
          {
            index_key: 'personality_director',
            desired_score: 81,
            weight_rate: 30,
          },
          { index_key: 'social_intensity', desired_score: 89, weight_rate: 35 },
        ],
      },
      {
        request_status: REQUEST_STATUS.PENDING,
        objective_category: 'leadership',
        budget_min: 2600,
        budget_max: 5200,
        delivery_method: 'virtual',
        duration_max: 160,
        expired_at: '2026-03-15T14:00:00.000Z',
        invited_users: [
          {
            email: 'ava.hughes@northstar.io',
            invite_status: 'accepted',
            confirm_at: '2026-03-09T09:30:00.000Z',
          },
          {
            email: 'logan.chen@northstar.io',
            invite_status: 'accepted',
            confirm_at: '2026-03-09T11:00:00.000Z',
          },
        ],
        preferences: [
          {
            index_key: 'personality_director',
            desired_score: 74,
            weight_rate: 22,
          },
          { index_key: 'social_intensity', desired_score: 86, weight_rate: 30 },
        ],
      },
    ],
  },
  {
    email: 'mason.lee@orbit.one',
    status: 'inactive',
    profile: {
      first_name: 'Mason',
      last_name: 'Lee',
      phone_number: '+1-312-555-1010',
      preferred_contact: 'email',
      consent_given: 0,
      privacy_notes: 'No outreach while inactive.',
    },
    company: {
      corporate_name: 'Orbit One',
      department_name: 'Data',
      role_title: 'Data Analyst',
      work_mode: 'remote',
    },
  },
  {
    email: 'harper.nguyen@aurora.dev',
    status: 'active',
    profile: {
      first_name: 'Harper',
      last_name: 'Nguyen',
      phone_number: '+1-971-555-1011',
      preferred_contact: 'email',
      consent_given: 1,
      privacy_notes: 'Prefers low-noise activities.',
    },
    requests: [
      {
        request_status: REQUEST_STATUS.OPENED,
        objective_category: 'wellness',
        budget_min: 1200,
        budget_max: 2600,
        delivery_method: 'virtual',
        duration_max: 80,
        expired_at: '2026-03-19T12:00:00.000Z',
        invited_users: [
          { email: 'emma.davis@orbit.one', invite_status: 'pending' },
          { email: 'mason.lee@orbit.one', invite_status: 'pending' },
        ],
        preferences: [
          {
            index_key: 'personality_explorer',
            desired_score: 83,
            weight_rate: 32,
          },
          {
            index_key: 'personality_creator_artist',
            desired_score: 80,
            weight_rate: 28,
          },
        ],
      },
      {
        request_status: REQUEST_STATUS.CLOSED,
        objective_category: 'team_building',
        budget_min: 1800,
        budget_max: 3200,
        delivery_method: 'virtual',
        duration_max: 75,
        expired_at: '2026-03-05T12:00:00.000Z',
        invited_users: [
          { email: 'sophia.reed@helix.ai', invite_status: 'accepted' },
          { email: 'noah.wright@helix.ai', invite_status: 'rejected' },
        ],
        preferences: [
          {
            index_key: 'personality_explorer',
            desired_score: 79,
            weight_rate: 28,
          },
          {
            index_key: 'personality_creator_artist',
            desired_score: 84,
            weight_rate: 31,
          },
        ],
      },
    ],
  },
  {
    email: 'jack.wilson@example.com',
    status: 'active',
    profile: {
      first_name: 'Jack',
      last_name: 'Wilson',
      phone_number: '+1-503-555-1012',
      preferred_contact: 'phone',
      consent_given: 1,
      privacy_notes: null,
    },
  },
];

const TOTAL_USER_COUNT = 200;

if (baseMockUsers.length > TOTAL_USER_COUNT) {
  throw new Error(
    `Base mock users (${baseMockUsers.length}) exceed TOTAL_USER_COUNT (${TOTAL_USER_COUNT}).`
  );
}

const generatedUserCount = TOTAL_USER_COUNT - baseMockUsers.length;

const generatedMockUsers: MockUserSeed[] = Array.from(
  { length: generatedUserCount },
  (_, index) => {
    const userNo = String(index + 1).padStart(3, '0');
    return {
      email: `seed.user${userNo}@popcolab.dev`,
      status: index % 9 === 0 ? 'inactive' : 'active',
      profile: {
        first_name: `Seed${userNo}`,
        last_name: `User${userNo}`,
        phone_number: null,
        preferred_contact: 'email',
        consent_given: index % 9 === 0 ? 0 : 1,
        privacy_notes: null,
      },
      company: {
        corporate_name: 'Pop CoLab Seed',
        department_name: 'Sandbox',
        role_title: 'Seed Member',
        work_mode: 'remote',
      },
    };
  }
);

const mockUsers: MockUserSeed[] = [...baseMockUsers, ...generatedMockUsers];

const TEAM_COUNT = 20;

if (TOTAL_USER_COUNT % TEAM_COUNT !== 0) {
  throw new Error(
    `TOTAL_USER_COUNT (${TOTAL_USER_COUNT}) must be divisible by TEAM_COUNT (${TEAM_COUNT}).`
  );
}

const USERS_PER_TEAM = TOTAL_USER_COUNT / TEAM_COUNT;
const teamNamePrefixes = [
  'North',
  'Bright',
  'Prime',
  'Delta',
  'Summit',
  'Nova',
  'Atlas',
  'Echo',
  'Pulse',
  'Orbit',
];
const teamNameSuffixes = [
  'Crew',
  'Squad',
  'Guild',
  'Circle',
  'Unit',
  'Hub',
  'Lab',
  'Core',
  'Ops',
  'Collective',
];

const mockUserEmails = mockUsers.map(user => user.email);

if (mockUserEmails.length !== TOTAL_USER_COUNT) {
  throw new Error(
    `Expected ${TOTAL_USER_COUNT} users, but got ${mockUserEmails.length} in mockUsers.`
  );
}

const generatedTeams: MockTeamSeed[] = Array.from(
  { length: TEAM_COUNT },
  (_, index) => {
    const teamNumber = String(index + 1).padStart(3, '0');
    const prefix = teamNamePrefixes[index % teamNamePrefixes.length];
    const suffix =
      teamNameSuffixes[
        Math.floor(index / teamNamePrefixes.length) % teamNameSuffixes.length
      ];
    const start = index * USERS_PER_TEAM;
    const teamUsers = mockUserEmails.slice(start, start + USERS_PER_TEAM);

    if (teamUsers.length < USERS_PER_TEAM) {
      throw new Error(
        `Unable to assign ${USERS_PER_TEAM} users to team index ${index + 1}.`
      );
    }

    const ownerEmail = teamUsers[0];
    const creatorEmail = teamUsers[1];

    return {
      team_name: `T${teamNumber} ${prefix} ${suffix}`,
      team_notes: `Seeded team ${teamNumber} for admin team browsing and management scenarios.`,
      team_owner_email: ownerEmail,
      created_by_email: creatorEmail,
      members: teamUsers.slice(2),
    };
  }
);

const FOCUS_USER_EMAIL = 'seed.user187@popcolab.dev';
const FOCUS_USER_TEAM_COUNT = 5;

if (FOCUS_USER_TEAM_COUNT > TEAM_COUNT) {
  throw new Error(
    `FOCUS_USER_TEAM_COUNT (${FOCUS_USER_TEAM_COUNT}) cannot exceed TEAM_COUNT (${TEAM_COUNT}).`
  );
}

if (!mockUserEmails.includes(FOCUS_USER_EMAIL)) {
  throw new Error(`Required focus user not found: ${FOCUS_USER_EMAIL}`);
}

const currentFocusUserOwnedCount = generatedTeams.filter(
  team => team.team_owner_email === FOCUS_USER_EMAIL
).length;

if (currentFocusUserOwnedCount < FOCUS_USER_TEAM_COUNT) {
  let remaining = FOCUS_USER_TEAM_COUNT - currentFocusUserOwnedCount;
  for (const team of generatedTeams) {
    if (remaining === 0) break;
    if (team.team_owner_email === FOCUS_USER_EMAIL) continue;

    const previousOwner = team.team_owner_email;
    team.team_owner_email = FOCUS_USER_EMAIL;

    const focusMemberIndex = team.members.indexOf(FOCUS_USER_EMAIL);
    if (focusMemberIndex >= 0) {
      team.members[focusMemberIndex] = previousOwner;
    }

    if (team.created_by_email === FOCUS_USER_EMAIL) {
      const replacementCreator = team.members.find(
        email => email !== FOCUS_USER_EMAIL
      );
      if (!replacementCreator) {
        throw new Error(`Unable to set created_by for team ${team.team_name}.`);
      }
      team.created_by_email = replacementCreator;
    }

    remaining -= 1;
  }
}

const finalFocusUserOwnedCount = generatedTeams.filter(
  team => team.team_owner_email === FOCUS_USER_EMAIL
).length;

if (finalFocusUserOwnedCount !== FOCUS_USER_TEAM_COUNT) {
  throw new Error(
    `Expected ${FOCUS_USER_EMAIL} to own ${FOCUS_USER_TEAM_COUNT} teams, but found ${finalFocusUserOwnedCount}.`
  );
}

const mockTeams: MockTeamSeed[] = generatedTeams;

export async function seedUsersAndTeams(
  prisma: PrismaClient,
  input: SeedUsersInput
): Promise<SeedUsersResult> {
  await prisma.userVector.deleteMany({});
  await prisma.requestPreference.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.invitedUser.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.teamAggregate.deleteMany({});
  await prisma.teamVector.deleteMany({});
  await prisma.teamMate.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🗑️  Cleared existing users and related data');

  const userIdByEmail = new Map<string, number>();
  const pendingRequestSeeds: Array<{
    ownerId: number;
    requestSeed: MockRequestSeed;
  }> = [];

  for (const seedUser of mockUsers) {
    const userName = deriveUserName(seedUser);
    const clerkId = deriveClerkId(seedUser);
    const userType = seedUser.company ? 'CORPORATE' : 'INDIVIDUAL';
    const createdUser = await prisma.user.create({
      data: {
        clerk_id: clerkId,
        email: seedUser.email,
        user_name: userName,
        user_type: userType,
        ...(input.hasUserStatusColumn ? { status: seedUser.status } : {}),
      },
    });

    userIdByEmail.set(seedUser.email, createdUser.id);

    if (input.hasUserStatusColumn) {
      await prisma.$executeRaw`
        UPDATE "user"
        SET
          "status" = ${seedUser.status},
          "updated_at" = NOW()
        WHERE "id" = ${createdUser.id}
      `;
    }

    if (seedUser.profile) {
      await prisma.profile.create({
        data: {
          user_id: createdUser.id,
          consent_given: seedUser.profile.consent_given,
          first_name: seedUser.profile.first_name ?? null,
          last_name: seedUser.profile.last_name ?? null,
          phone_number: seedUser.profile.phone_number ?? null,
          preferred_contact: seedUser.profile.preferred_contact ?? null,
          privacy_notes: seedUser.profile.privacy_notes ?? null,
        },
      });
    }

    if (seedUser.company) {
      await prisma.company.create({
        data: {
          user_id: createdUser.id,
          corporate_name: seedUser.company.corporate_name ?? null,
          department_name: seedUser.company.department_name ?? null,
          role_title: seedUser.company.role_title ?? null,
          work_mode: seedUser.company.work_mode ?? null,
        },
      });
    }

    for (const requestSeed of seedUser.requests ?? []) {
      pendingRequestSeeds.push({
        ownerId: createdUser.id,
        requestSeed,
      });
    }
  }

  for (const { ownerId, requestSeed } of pendingRequestSeeds) {
    const createdRequest = await prisma.request.create({
      data: {
        user_id: ownerId,
        objective_category: toRequestTextValue(requestSeed.objective_category),
        invite_code: (requestSeed.invite_code ?? createRequestInviteCode())
          .toUpperCase()
          .slice(0, 6),
        request_status: requestSeed.request_status ?? REQUEST_STATUS.OPENED,
        budget_min: requestSeed.budget_min ?? null,
        budget_max: requestSeed.budget_max ?? null,
        delivery_method: toRequestTextValue(requestSeed.delivery_method),
        duration_max: requestSeed.duration_max ?? null,
        expired_at: toRequestExpiry(requestSeed.expired_at),
      },
    });

    for (const invitedUserSeed of requestSeed.invited_users ?? []) {
      const invitedUserId = userIdByEmail.get(invitedUserSeed.email);
      if (!invitedUserId) {
        console.warn(
          `⚠️  No user ${invitedUserSeed.email} found for invited user on request ${createdRequest.id}`
        );
        continue;
      }

      await prisma.invitedUser.create({
        data: {
          request_id: createdRequest.id,
          user_id: invitedUserId,
          invite_status:
            InviteStatus[invitedUserSeed.invite_status ?? 'pending'],
          confirm_at: toRequestExpiry(invitedUserSeed.confirm_at),
        },
      });
    }

    for (const preferenceSeed of requestSeed.preferences ?? []) {
      const dimensionId = input.dimensionIdByKey.get(preferenceSeed.index_key);
      if (!dimensionId) {
        console.warn(
          `⚠️  No dimension with key ${preferenceSeed.index_key} for request preference`
        );
        continue;
      }

      await prisma.requestPreference.create({
        data: {
          request_id: createdRequest.id,
          dimension_id: dimensionId,
          desired_score: preferenceSeed.desired_score,
          weight_rate: preferenceSeed.weight_rate,
        },
      });
    }
  }

  for (const teamSeed of mockTeams) {
    const ownerId = userIdByEmail.get(teamSeed.team_owner_email);
    const creatorId = userIdByEmail.get(teamSeed.created_by_email);

    if (!ownerId) {
      console.warn(
        `⚠️  No user ${teamSeed.team_owner_email} found as owner for team ${teamSeed.team_name}`
      );
      continue;
    }

    if (!creatorId) {
      console.warn(
        `⚠️  No user ${teamSeed.created_by_email} found for team ${teamSeed.team_name}`
      );
      continue;
    }

    const createdTeam = await prisma.team.create({
      data: {
        team_name: teamSeed.team_name,
        team_notes: teamSeed.team_notes ?? null,
        team_owner: ownerId,
        created_by: creatorId,
      },
    });

    const memberEmails = Array.from(
      new Set([
        teamSeed.team_owner_email,
        teamSeed.created_by_email,
        ...teamSeed.members,
      ])
    );

    for (const memberEmail of memberEmails) {
      const userId = userIdByEmail.get(memberEmail);
      if (!userId) {
        console.warn(
          `⚠️  No user ${memberEmail} found for team member in ${teamSeed.team_name}`
        );
        continue;
      }

      await prisma.teamMate.create({
        data: {
          team_id: createdTeam.id,
          user_id: userId,
        },
      });
    }
  }

  return {
    userIdByEmail,
    userCount: mockUsers.length,
    teamCount: mockTeams.length,
  };
}
