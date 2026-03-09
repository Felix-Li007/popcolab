'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { savePersonalityKeyAction } from '@/actions/response-actions';

const PENDING_KEY = 'pclab_pending_key';
const RETRY_DELAY_MS = 1500;
const MAX_ATTEMPTS = 4;

/**
 * Silently saves a pending personality key from localStorage on every
 * dashboard page mount — so result saving works regardless of which
 * dashboard page Clerk drops the user on after sign-up or sign-in.
 * Retries automatically if auth is not yet propagated right after sign-up.
 */
export default function PendingResultSaver() {
  const router = useRouter();
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function trySave() {
      const pendingKey = localStorage.getItem(PENDING_KEY);
      if (!pendingKey || cancelled) return;

      attemptRef.current += 1;

      try {
        const result = await savePersonalityKeyAction(pendingKey);
        if (cancelled) return;
        if (result.success) {
          localStorage.removeItem(PENDING_KEY);
          router.refresh();
          return;
        }
        // Not authenticated yet or other transient error — retry if under limit.
        if (attemptRef.current < MAX_ATTEMPTS) {
          setTimeout(trySave, RETRY_DELAY_MS);
        }
      } catch {
        if (!cancelled && attemptRef.current < MAX_ATTEMPTS) {
          setTimeout(trySave, RETRY_DELAY_MS);
        }
      }
    }

    trySave();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
