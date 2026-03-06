export const WORK_MODE = {
  REMOTE: 'remote',
  HYBRID: 'hybrid',
  ONSITE: 'onsite',
} as const;

export type WorkMode = (typeof WORK_MODE)[keyof typeof WORK_MODE];

export const WORK_MODE_OPTIONS: Array<{ value: WorkMode; label: string }> = [
  { value: WORK_MODE.REMOTE, label: 'Remote' },
  { value: WORK_MODE.HYBRID, label: 'Hybrid' },
  { value: WORK_MODE.ONSITE, label: 'Onsite' },
];

export const WORK_MODE_SET = new Set<WorkMode>(
  WORK_MODE_OPTIONS.map(option => option.value)
);

export function isWorkMode(value: string): value is WorkMode {
  return WORK_MODE_SET.has(value as WorkMode);
}

export function normalizeWorkMode(
  value: string | null | undefined
): WorkMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isWorkMode(normalized) ? normalized : null;
}

export function getWorkModeLabel(
  value: WorkMode | null | undefined
): string | null {
  if (!value) return null;
  const option = WORK_MODE_OPTIONS.find(item => item.value === value);
  return option?.label ?? null;
}
