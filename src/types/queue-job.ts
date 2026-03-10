export const REQUEST_QUEUE_TRIGGER = {
  REQUEST_EXPIRED: 'request_expired',
  INVITED_CONFIRMED: 'invited_confirmed',
  PROPOSAL_REJECTED: 'proposal_rejected',
} as const;

export type RequestQueueTrigger =
  (typeof REQUEST_QUEUE_TRIGGER)[keyof typeof REQUEST_QUEUE_TRIGGER];

export type RequestQueueJob = {
  requestId: number;
  trigger: RequestQueueTrigger;
  rejectedProposalId?: number;
  queuedAt: string;
};

export function isRequestQueueJob(value: unknown): value is RequestQueueJob {
  if (!value || typeof value !== 'object') return false;

  const job = value as Record<string, unknown>;

  return (
    typeof job.requestId === 'number' &&
    Number.isInteger(job.requestId) &&
    typeof job.queuedAt === 'string' &&
    Object.values(REQUEST_QUEUE_TRIGGER).includes(
      job.trigger as RequestQueueTrigger
    ) &&
    (job.rejectedProposalId === undefined ||
      (typeof job.rejectedProposalId === 'number' &&
        Number.isInteger(job.rejectedProposalId)))
  );
}
