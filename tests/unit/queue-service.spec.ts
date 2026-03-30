describe('queue-service', () => {
  const prismaMock = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  async function loadQueueService() {
    jest.resetModules();
    jest.doMock('@/libs/prisma-client', () => ({
      prisma: prismaMock,
    }));

    return import('@/services/queue-service');
  }

  beforeEach(() => {
    process.env.SUPABASE_REQUEST_QUEUE = 'popcolab_queue';
    prismaMock.$queryRaw.mockReset();
    prismaMock.$executeRaw.mockReset();
  });

  afterEach(() => {
    delete process.env.SUPABASE_REQUEST_QUEUE;
  });

  test('checks the extension and queue only once across repeated operations', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ message_id: 41 }])
      .mockResolvedValueOnce([]);

    const { enqueueQueueJob, readRequestQueueJobs } = await loadQueueService();

    await enqueueQueueJob({
      requestId: 10,
      trigger: 'request_expired',
      queuedAt: '2026-03-09T12:00:00.000Z',
    });
    await readRequestQueueJobs(5);

    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(4);
  });

  test('creates the queue table once when pgmq is enabled but the queue is missing', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce([{ message_id: 99 }]);

    const { enqueueQueueJob } = await loadQueueService();

    const result = await enqueueQueueJob({
      requestId: 11,
      trigger: 'invited_confirmed',
      queuedAt: '2026-03-09T12:00:00.000Z',
    });

    expect(result).toEqual({
      messageId: 99,
      queueName: 'popcolab_queue',
    });
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(3);
  });

  test('throws a clear error when the pgmq extension is not installed', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ exists: false }]);

    const { enqueueQueueJob } = await loadQueueService();

    await expect(
      enqueueQueueJob({
        requestId: 12,
        trigger: 'proposal_rejected',
        queuedAt: '2026-03-09T12:00:00.000Z',
      })
    ).rejects.toThrow(
      'Missing pgmq extension. Enable it via a database migration or infrastructure setup before using the request queue.'
    );

    expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
  });
});
