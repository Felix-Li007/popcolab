import { normalizeRole } from '@/utils/clerk-helper';
import type { CompanyInfo } from '@/types/company-type';

export type RoleKey = 'role_admin' | 'role_user' | 'role_facilitator';

export type RoleBranding = {
  role: RoleKey;
  dataRole: RoleKey;
  displayLabel: string;
  logoSrc: string;
  logoAlt: string;
  footerLogoSrc: string;
  footerLogoAlt: string;
};

const FALLBACK_ROLE: RoleKey = 'role_user';

const ROLE_BRANDING: Record<RoleKey, RoleBranding> = {
  role_admin: {
    role: 'role_admin',
    dataRole: 'role_admin',
    displayLabel: 'Admin',
    logoSrc: '/logo/corporate/logo-full-h.png',
    logoAlt: 'Pop CoLab Admin Corporate logo',
    footerLogoSrc: '/logo/corporate/logo-full-v.png',
    footerLogoAlt: 'Pop CoLab Admin Corporate footer logo',
  },
  role_user: {
    role: 'role_user',
    dataRole: 'role_user',
    displayLabel: 'User',
    logoSrc: '/logo/user/logo-full-h.png',
    logoAlt: 'Pop CoLab Corporate user logo',
    footerLogoSrc: '/logo/user/logo-full-v.png',
    footerLogoAlt: 'Pop CoLab user footer logo',
  },
  role_facilitator: {
    role: 'role_facilitator',
    dataRole: 'role_facilitator',
    displayLabel: 'Facilitator',
    logoSrc: '/logo/logo-text.png',
    logoAlt: 'Pop CoLab Facilitator logo',
    footerLogoSrc: '/logo/logo-text.png',
    footerLogoAlt: 'Pop CoLab Facilitator footer logo',
  },
};

export function normalizeBrandRole(role: string | null | undefined): RoleKey {
  const normalized = normalizeRole(role ?? null);

  switch (normalized) {
    case 'role_admin':
    case 'role_user':
    case 'role_facilitator':
      return normalized;
    default:
      return FALLBACK_ROLE;
  }
}

export function resolveRoleBranding(
  role: string | null | undefined,
  companyInfo?: CompanyInfo | null
): RoleBranding {
  const normalizedRole = normalizeBrandRole(role);

  if (normalizedRole === 'role_user' && companyInfo) {
    return {
      ...ROLE_BRANDING.role_user,
      dataRole: 'role_admin',
      logoSrc: ROLE_BRANDING.role_admin.logoSrc,
      logoAlt: ROLE_BRANDING.role_admin.logoAlt,
      footerLogoSrc: ROLE_BRANDING.role_admin.footerLogoSrc,
      footerLogoAlt: ROLE_BRANDING.role_admin.footerLogoAlt,
    };
  }

  return ROLE_BRANDING[normalizedRole];
}
