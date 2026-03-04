export function readMetaRole(record: Record<string, unknown>): string | null {
  const directRole = record.role;
  if (typeof directRole === 'string' && directRole.trim().length > 0) {
    return directRole;
  }

  const METADATA_ALL = [
    record.public_metadata,
    record.publicMetadata,
    record.metadata,
  ];

  for (const metadata of METADATA_ALL) {
    if (!metadata || typeof metadata !== 'object') continue;
    const metaRole = (metadata as Record<string, unknown>).role;
    if (typeof metaRole === 'string' && metaRole.trim().length > 0) {
      return metaRole;
    }
  }
  return null;
}

function normalizeRole(role: string | null): string | null {
  if (!role) return null;

  const normalized = role.trim().toLowerCase();
  if (normalized.startsWith('org:')) {
    return normalized.slice(4);
  }

  return normalized;
}

export function readClaimRole(sessionClaims: unknown): string | null {
  if (!sessionClaims || typeof sessionClaims !== 'object') return null;

  const claims = sessionClaims as Record<string, unknown>;

  const directRole = claims.role;
  if (typeof directRole === 'string' && directRole.trim().length > 0) {
    return directRole;
  }

  const orgRole = claims.org_role;
  if (typeof orgRole === 'string' && orgRole.trim().length > 0) {
    return orgRole;
  }

  for (const [key, value] of Object.entries(claims)) {
    if (
      typeof value === 'string' &&
      value.trim().length > 0 &&
      (key.endsWith('/role') || key.endsWith(':role'))
    ) {
      return value;
    }
  }

  return normalizeRole(readMetaRole(claims));
}
