export const readMetaRole = (
  record: Record<string, unknown>
): string | null => {
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
};

export const normalizeRole = (role: string | null): string | null => {
  if (!role) return null;

  const normalized = role.trim().toLowerCase();
  const withoutPrefix = normalized.startsWith('org:')
    ? normalized.slice(4)
    : normalized;
  const canonical = withoutPrefix
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const aliases: Record<string, string> = {
    admin: 'role_admin',
    admin_corporate: 'role_admin',
    admincorporate: 'role_admin',

    corporate_admin: 'role_admin',
    corp_admin: 'role_admin',
    user: 'role_user',
    user_normal: 'role_user',
    normal_user: 'role_user',
    user_corporate: 'role_user',
    corporate_user: 'role_user',
    corp_user: 'role_user',
    user_facilitator: 'role_facilitator',
    facilitator: 'role_facilitator',
    facilitator_user: 'role_facilitator',
  };

  return aliases[canonical] ?? canonical;
};

export const readClaimRole = (sessionClaims: unknown): string | null => {
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

  return readMetaRole(claims);
};
