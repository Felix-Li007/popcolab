import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import {
  getStripeServerClient,
  getStripeWebhookSecret,
} from '@/libs/stripe-server';
import { syncExperienceOrderPaymentByWebhook } from '@/services/order-service';

export const runtime = 'nodejs';

function isHandledStripeEvent(eventType: Stripe.Event.Type): boolean {
  return [
    'payment_intent.succeeded',
    'payment_intent.processing',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'payment_intent.requires_action',
  ].includes(eventType);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const stripe = getStripeServerClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Invalid webhook signature',
      },
      { status: 400 }
    );
  }

  try {
    if (isHandledStripeEvent(event.type)) {
      await syncExperienceOrderPaymentByWebhook(
        event.data.object as Stripe.PaymentIntent
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
