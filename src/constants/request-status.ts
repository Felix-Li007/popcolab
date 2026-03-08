export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  MATCHED: 'matched',
  CLOSED: 'closed',
} as const;

export type RequestStatus =
  (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const REQUEST_STATUS_OPTIONS: Array<{
  value: RequestStatus;
  label: string;
}> = [
  { value: REQUEST_STATUS.OPEN, label: 'Open' },
  { value: REQUEST_STATUS.IN_REVIEW, label: 'In Review' },
  { value: REQUEST_STATUS.MATCHED, label: 'Matched' },
  { value: REQUEST_STATUS.CLOSED, label: 'Closed' },
];

export const REQUEST_STATUS_SET = new Set<RequestStatus>(
  REQUEST_STATUS_OPTIONS.map(option => option.value)
);

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUS_SET.has(value as RequestStatus);
}

export function normalizeRequestStatus(
  value: string | null | undefined
): RequestStatus | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isRequestStatus(normalized) ? normalized : null;
}

export function getRequestStatusLabel(
  value: RequestStatus | null | undefined
): string | null {
  if (!value) return null;
  const option = REQUEST_STATUS_OPTIONS.find(item => item.value === value);
  return option?.label ?? null;
}
