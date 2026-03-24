import { Receiver } from '@upstash/qstash';
import { NextRequest, NextResponse } from 'next/server';
import {
  getQStashEndpointUrl,
  getQStashSigningKeys,
} from '@/libs/qstash-client';
import { handleQStashTask } from '@/services/qstash-service';
import { isQStashTaskPayload } from '@/types/qstash-task';

/**
 * Receives QStash webhooks and handles scheduled tasks.
 * @param req
 * @returns
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('upstash-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Upstash signature' },
      { status: 401 }
    );
  }

  const body = await req.text();

  try {
    const receiver = new Receiver(getQStashSigningKeys());

    await receiver.verify({
      signature,
      body,
      url: getQStashEndpointUrl(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid QStash signature' },
      { status: 401 }
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: 'Invalid QStash payload' },
      { status: 400 }
    );
  }

  if (!isQStashTaskPayload(payload)) {
    return NextResponse.json(
      { error: 'Unsupported QStash task' },
      { status: 400 }
    );
  }

  try {
    const result = await handleQStashTask(payload);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'QStash task handler failed' },
      { status: 500 }
    );
  }
}
