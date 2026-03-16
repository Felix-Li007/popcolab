const DEFAULT_REDIRECT_PATH = '/dashboard/requests';

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH
): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  return value;
}
