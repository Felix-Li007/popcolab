import { Client } from '@upstash/qstash';

function normalizeAppUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  return `https://${trimmed.replace(/\/+$/, '')}/`;
}

export function getQStashAppUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!rawUrl) {
    throw new Error(
      'Missing QStash app url. Set QSTASH_APP_URL or NEXT_PUBLIC_APP_URL.'
    );
  }

  return normalizeAppUrl(rawUrl);
}

export function getQStashEndpointPath(): string {
  const rawPath = process.env.QSTASH_ENDPOINT_PATH;

  if (!rawPath) {
    throw new Error('Missing QSTASH_ENDPOINT_PATH.');
  }

  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

export function getQStashEndpointUrl(path = getQStashEndpointPath()): string {
  return new URL(path, getQStashAppUrl()).toString();
}

export function getQStashClient(): Client {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error('Missing QSTASH_TOKEN.');
  }

  return new Client({ token });
}

export function getQStashSigningKeys() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentSigningKey || !nextSigningKey) {
    throw new Error(
      'Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY.'
    );
  }

  return { currentSigningKey, nextSigningKey };
}
