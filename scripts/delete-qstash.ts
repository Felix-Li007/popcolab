import 'dotenv/config';

import { getQStashClient } from '@/libs/qstash-client';

function getScheduleIdArg(): string {
  const scheduleId = process.argv[2]?.trim();

  if (!scheduleId) {
    throw new Error(
      'Missing schedule id. Usage: npm run qstash:delete -- <scheduleId>'
    );
  }

  return scheduleId;
}

async function main() {
  const scheduleId = getScheduleIdArg();
  const client = getQStashClient();

  await client.schedules.delete(scheduleId);

  console.log('QStash schedule deleted.');
  console.log(`scheduleId=${scheduleId}`);
}

main().catch(error => {
  console.error('Failed to delete QStash schedule.');
  console.error(error);
  process.exit(1);
});
