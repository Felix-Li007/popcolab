export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_STATUS_OPTIONS: ReadonlyArray<{
  value: UserStatus;
  label: string;
}> = [
  { value: USER_STATUS.ACTIVE, label: 'Active' },
  { value: USER_STATUS.INACTIVE, label: 'Inactive' },
  { value: USER_STATUS.BLOCKED, label: 'Blocked' },
];

export const USER_STATUS_SET: ReadonlySet<UserStatus> = new Set(
  USER_STATUS_OPTIONS.map(option => option.value)
);

export const USER_STATUS_BADGE: Record<
  UserStatus,
  { label: string; variant: 'success' | 'default' | 'danger' }
> = {
  [USER_STATUS.ACTIVE]: {
    label: 'Active',
    variant: 'success',
  },
  [USER_STATUS.INACTIVE]: {
    label: 'Inactive',
    variant: 'default',
  },
  [USER_STATUS.BLOCKED]: {
    label: 'Blocked',
    variant: 'danger',
  },
};

export function isUserStatus(value: string): value is UserStatus {
  return USER_STATUS_SET.has(value as UserStatus);
}
