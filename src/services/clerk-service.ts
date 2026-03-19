import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  normalizeRole,
  readMetaRole,
  readClaimRole,
} from '@/utils/clerk-helper';

const ADMIN_ROLE = 'admin';
const SIGN_IN_PATH = '/sign-in';
const UNAUTHORIZED_PATH = '/';

type AuthState = Awaited<ReturnType<typeof auth>>;
type ClerkApiClient = Awaited<ReturnType<typeof clerkClient>>;
type ClerkUser = Awaited<ReturnType<ClerkApiClient['users']['getUser']>>;
type ClerkSession = Awaited<
  ReturnType<ClerkApiClient['sessions']['getSession']>
>;

export type CurrentAuthContext = {
  auth: AuthState;
  user: ClerkUser | null;
  session: ClerkSession | null;
  role: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

function readUserRole(user: ClerkUser | null): string | null {
  if (!user) return null;

  const metadataCandidates = [
    user.publicMetadata,
    user.privateMetadata,
    user.unsafeMetadata,
  ];

  for (const metadataCandidate of metadataCandidates) {
    if (!metadataCandidate || typeof metadataCandidate !== 'object') continue;

    const role = readMetaRole(metadataCandidate as Record<string, unknown>);
    if (role) return role;
  }

  return null;
}

async function getUserById(userId: string): Promise<ClerkUser | null> {
  try {
    const client = await clerkClient();
    return await client.users.getUser(userId);
  } catch {
    return null;
  }
}

async function getRole(authState: AuthState): Promise<string | null> {
  const claimRole = normalizeRole(readClaimRole(authState.sessionClaims));
  if (claimRole) return claimRole;

  if (!authState.userId) return null;
  const user = await getUserById(authState.userId);
  return normalizeRole(readUserRole(user));
}

async function getAdminAuthState(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
}> {
  const authState = await auth();

  if (!authState.userId) {
    return {
      isAuthenticated: false,
      isAdmin: false,
    };
  }

  const role = await getRole(authState);

  return {
    isAuthenticated: true,
    isAdmin: role === ADMIN_ROLE,
  };
}

export async function getCurrentAuthContext(): Promise<CurrentAuthContext> {
  const authState = await auth();

  if (!authState.userId) {
    return {
      auth: authState,
      user: null,
      session: null,
      role: null,
      isAuthenticated: false,
      isAdmin: false,
    };
  }

  const client = await clerkClient();

  const userPromise = client.users.getUser(authState.userId).catch(() => null);
  const sessionPromise = authState.sessionId
    ? client.sessions.getSession(authState.sessionId).catch(() => null)
    : Promise.resolve(null);

  const [user, session] = await Promise.all([userPromise, sessionPromise]);

  const roleFromClaims = normalizeRole(readClaimRole(authState.sessionClaims));
  const role = roleFromClaims ?? normalizeRole(readUserRole(user));

  return {
    auth: authState,
    user,
    session,
    role,
    isAuthenticated: true,
    isAdmin: role === ADMIN_ROLE,
  };
}

export async function isAdminUser(): Promise<boolean> {
  const { isAdmin } = await getAdminAuthState();
  return isAdmin;
}

export async function requireAdminPageAccess(): Promise<void> {
  const { isAuthenticated, isAdmin } = await getAdminAuthState();

  if (!isAuthenticated) {
    redirect(SIGN_IN_PATH);
  }

  if (!isAdmin) {
    redirect(UNAUTHORIZED_PATH);
  }
}

export async function requireAdminActionAccess(): Promise<void> {
  const { isAuthenticated, isAdmin } = await getAdminAuthState();

  if (!isAuthenticated) {
    throw new Error('Authentication required.');
  }

  if (!isAdmin) {
    throw new Error('Admin access required.');
  }
}

export async function updateClerkUserProfileName(
  userId: string,
  params: {
    firstName: string | null;
    lastName: string | null;
  }
): Promise<void> {
  const client = await clerkClient();

  await client.users.updateUser(userId, {
    firstName: params.firstName as string | null | undefined,
    lastName: params.lastName as string | null | undefined,
  } as never);
}
