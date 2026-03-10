import 'dotenv/config';

import { getQStashClient, getQStashEndpointUrl } from '@/libs/qstash-client';
import {
  QSTASH_TASK_TYPE,
  type RequestProcessPayload,
} from '@/types/qstash-task';

function getCronArg(): string {
  return process.argv[2]?.trim() || '* * * * *';
}

function getBatchSizeArg(): number {
  const rawValue = process.argv[3];

  if (!rawValue) {
    return 10;
  }

  const batchSize = Number(rawValue);

  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(`Invalid batch size: ${rawValue}`);
  }

  return batchSize;
}

async function main() {
  const cron = getCronArg();
  const batchSize = getBatchSizeArg();
  const client = getQStashClient();
  const scheduleId = 'request-queue-process';

  try {
    await client.schedules.get(scheduleId);
    await client.schedules.delete(scheduleId);
  } catch {
    // Ignore missing schedules so create behaves like an upsert.
  }

  const result = await client.schedules.create({
    destination: getQStashEndpointUrl(),
    scheduleId,
    cron,
    retries: 3,
    body: JSON.stringify({
      type: QSTASH_TASK_TYPE.REQUEST_QUEUE_PROCESS,
      batchSize,
    } satisfies RequestProcessPayload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('QStash request queue processor schedule is ready.');
  console.log(`cron=${cron}`);
  console.log(`batchSize=${batchSize}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error('Failed to set up QStash schedule.');
  console.error(error);
  process.exit(1);
});
