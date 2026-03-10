import { isRequestQueueJob, REQUEST_QUEUE_TRIGGER } from '@/types/queue-job';
import { isQStashTaskPayload, QSTASH_TASK_TYPE } from '@/types/qstash-task';

describe('request and proposal payload guards', () => {
  test('accepts a valid request queue job', () => {
    expect(
      isRequestQueueJob({
        requestId: 10,
        trigger: REQUEST_QUEUE_TRIGGER.PROPOSAL_REJECTED,
        rejectedProposalId: 5,
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).toBe(true);
  });

  test('rejects invalid request queue jobs', () => {
    expect(
      isRequestQueueJob({
        requestId: 10,
        trigger: 'bad_trigger',
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).toBe(false);
    expect(
      isRequestQueueJob({
        requestId: 10.5,
        trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).toBe(false);
    expect(
      isRequestQueueJob({
        requestId: 10,
        trigger: REQUEST_QUEUE_TRIGGER.REQUEST_EXPIRED,
        rejectedProposalId: '5',
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).toBe(false);
  });

  test('accepts valid qstash task payloads', () => {
    expect(
      isQStashTaskPayload({
        type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
        requestId: 12,
        trigger: REQUEST_QUEUE_TRIGGER.INVITED_CONFIRMED,
      })
    ).toBe(true);
    expect(
      isQStashTaskPayload({
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 20,
      })
    ).toBe(true);
  });

  test('rejects invalid qstash task payloads', () => {
    expect(
      isQStashTaskPayload({
        type: QSTASH_TASK_TYPE.REQUEST_ENQUEUE_READY,
        requestId: 12,
        trigger: 'bad_trigger',
      })
    ).toBe(false);
    expect(
      isQStashTaskPayload({
        type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
        batchSize: 0,
      })
    ).toBe(false);
    expect(isQStashTaskPayload(null)).toBe(false);
  });
});
