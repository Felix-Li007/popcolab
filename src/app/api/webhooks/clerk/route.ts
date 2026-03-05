import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  updateUserEmail,
  updateUserProfile,
  deactivateUserByClerkId,
} from '@/services/user-service';

export async function POST(req: NextRequest) {
  let event: WebhookEvent;

  try {
    event = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }
  console.log('Received Clerk webhook event:', event);
  try {
    switch (event.type) {
      case 'user.updated': {
        console.log('Received user.updated event:', event.data);
        const {
          id,
          email_addresses,
          primary_email_address_id,
          first_name,
          last_name,
        } = event.data;
        const primary = email_addresses.find(
          e => e.id === primary_email_address_id
        );
        if (primary?.email_address) {
          await updateUserEmail(id, primary.email_address);
        }
        await updateUserProfile(id, first_name, last_name);
        break;
      }

      case 'user.deleted': {
        const { id } = event.data;
        if (id) {
          await deactivateUserByClerkId(id);
        }
        break;
      }

      default:
        break;
    }
  } catch {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
