import 'server-only';

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function readSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  return secretKey;
}

export function getStripeServerClient(): Stripe {
  if (stripeClient) return stripeClient;

  stripeClient = new Stripe(readSecretKey(), {
    appInfo: {
      name: 'Pop CoLab',
      version: '0.1.0',
    },
  });

  return stripeClient;
}

export function getStripePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured.');
  }

  return publishableKey;
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }

  return webhookSecret;
}

export function toStripeAmountCents(amountCad: number): number {
  if (!Number.isFinite(amountCad) || amountCad <= 0) {
    throw new Error('Stripe amount must be greater than zero.');
  }

  return Math.round(amountCad * 100);
}
