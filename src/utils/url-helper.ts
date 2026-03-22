import { sanitizeRedirectPath } from '@/utils/auth-redirect';

function normalizeAppPath(
  rawPath: string | null | undefined,
  fallback: string
): string {
  if (!rawPath) return fallback;

  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed === '/') {
    return trimmed;
  }

  return trimmed.replace(/\/+$/, '');
}

export const SIGN_IN_PATH = normalizeAppPath(
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  '/sign-in'
);
export const SIGN_UP_PATH = normalizeAppPath(
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  '/sign-up'
);
export const DASHBOARD_PATH = '/dashboard';
export const DASHBOARD_REQUESTS_PATH = `${DASHBOARD_PATH}/requests`;
export const DASHBOARD_EXPERIENCES_PATH = `${DASHBOARD_PATH}/experiences`;

function toQueryString(
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  if (!query) return '';

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === false) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function normalizeAppBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '');
}

function parseAbsoluteBaseUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    return normalizeAppBaseUrl(new URL(candidate).origin);
  } catch {
    return null;
  }
}

function getFirstHeaderValue(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.split(',')[0]?.trim();
  return normalized || null;
}

export function getFallbackAppBaseUrl(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const rawUrl of candidates) {
    if (!rawUrl) continue;

    const parsedUrl = parseAbsoluteBaseUrl(rawUrl);
    if (parsedUrl) {
      return parsedUrl;
    }
  }

  return null;
}

export function getAppBaseUrlFromHeaders(
  requestHeaders: Pick<Headers, 'get'>
): string | null {
  const trustedUrl = getFallbackAppBaseUrl();
  if (trustedUrl) return trustedUrl;

  const host = getFirstHeaderValue(
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  );
  const protocol = getFirstHeaderValue(requestHeaders.get('x-forwarded-proto'));

  if (host) {
    return parseAbsoluteBaseUrl(`${protocol ?? 'https'}://${host}`);
  }

  return null;
}

export function buildInvitationPath(
  token: string,
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  return `/invite/${token}${toQueryString(query)}`;
}

export function buildInvitationAbsoluteUrl(
  appBaseUrl: string,
  token: string
): string {
  return `${normalizeAppBaseUrl(appBaseUrl)}${buildInvitationPath(token)}`;
}

export function buildAuthPath(params: {
  authAction: 'sign-in' | 'sign-up';
  redirectPath?: string;
  email?: string;
}): string {
  const query = new URLSearchParams();
  const redirectPath = sanitizeRedirectPath(
    params.redirectPath,
    DASHBOARD_PATH
  );

  query.set('redirect', redirectPath);

  if (params.email) {
    query.set('email', params.email);
  }

  const basePath =
    params.authAction === 'sign-in' ? SIGN_IN_PATH : SIGN_UP_PATH;

  return `${basePath}?${query.toString()}`;
}

export function buildTeamInvitePath(token: string): string {
  return `/join/${token}`;
}

export function buildTeamInviteAbsoluteUrl(
  appBaseUrl: string,
  token: string
): string {
  return `${normalizeAppBaseUrl(appBaseUrl)}${buildTeamInvitePath(token)}`;
}

export function buildDashboardRequestInvitePath(requestId: number): string {
  return `${DASHBOARD_REQUESTS_PATH}/${requestId}/invite`;
}

export function buildDashboardExperienceCheckoutPath(
  experienceId: number
): string {
  return `${DASHBOARD_EXPERIENCES_PATH}/${experienceId}/checkout`;
}

export function buildDashboardExperienceCheckoutResultPath(
  experienceId: number
): string {
  return `${buildDashboardExperienceCheckoutPath(experienceId)}/result`;
}
