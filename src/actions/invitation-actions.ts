'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getCurrentAuthContext } from '@/services/clerk-service';
import {
  getInvitationByToken,
  respondToInvitation,
  sendRequestInvitations,
  type InvitationResponseAction,
  type InvitationResponseResult,
} from '@/services/invitation-service';
import {
  buildAuthPath,
  buildDashboardRequestInvitePath,
  buildInvitationPath,
  getAppBaseUrlFromHeaders,
  DASHBOARD_PATH,
} from '@/utils/url-helper';
import { getFormEntryString } from '@/utils/form-data';

export type SendInvitationsActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  sentCount: number;
  failedCount: number;
};

async function getAppBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const fallbackUrl = getAppBaseUrlFromHeaders(requestHeaders);
  if (fallbackUrl) {
    return fallbackUrl;
  }

  throw new Error('Unable to determine app base URL for invitation links.');
}

function parseInvitations(rawValue: FormDataEntryValue | null) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return [];
  }

  const parsed = JSON.parse(rawValue) as Array<{
    userName?: unknown;
    userEmail?: unknown;
  }>;

  if (!Array.isArray(parsed)) {
    throw new TypeError('Invalid invitations payload.');
  }

  return parsed.map(item => ({
    userName: typeof item.userName === 'string' ? item.userName : '',
    userEmail: typeof item.userEmail === 'string' ? item.userEmail : '',
  }));
}

function buildInvitationResponseRedirectPath(
  token: string,
  response: InvitationResponseResult
): string {
  if (response.type === 'forbidden') {
    return buildInvitationPath(token, { error: 'forbidden' });
  }

  if (response.type === 'expired') {
    return buildInvitationPath(token, { expired: 1 });
  }

  if (response.type === 'rejected') {
    return buildInvitationPath(token, { rejected: 1 });
  }

  return buildAuthPath({
    authAction: response.authAction,
    redirectPath: DASHBOARD_PATH,
    email: response.userEmail,
  });
}

export async function sendInvitationsAction(
  _prevState: SendInvitationsActionState,
  formData: FormData
): Promise<SendInvitationsActionState> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    return {
      status: 'error',
      message: 'Authentication required.',
      sentCount: 0,
      failedCount: 0,
    };
  }

  const requestId = Number(formData.get('requestId'));
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return {
      status: 'error',
      message: 'Invalid request id.',
      sentCount: 0,
      failedCount: 0,
    };
  }

  try {
    const invitations = parseInvitations(formData.get('invitations'));
    const result = await sendRequestInvitations({
      clerkUserId: authContext.user.id,
      requestId,
      invitations,
      appBaseUrl: await getAppBaseUrl(),
    });

    revalidatePath(buildDashboardRequestInvitePath(requestId));

    if (result.failedCount > 0 && result.sentCount === 0) {
      return {
        status: 'error',
        message: result.failed.join(' | '),
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      };
    }

    return {
      status: 'success',
      message:
        result.failedCount > 0
          ? `Sent ${result.sentCount} invitation(s). Failed: ${result.failedCount}. Errors: ${result.failed.join(' | ')}`
          : `Sent ${result.sentCount} invitation(s). Failed: ${result.failedCount}.`,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to send invitations.',
      sentCount: 0,
      failedCount: 0,
    };
  }
}

export async function respondToInvitationAction(
  token: string,
  formData: FormData
): Promise<never> {
  const action = getFormEntryString(formData.get('action')).toLowerCase();

  if (action !== 'accept' && action !== 'reject') {
    redirect(buildInvitationPath(token, { error: 1 }));
  }

  try {
    const authContext = await getCurrentAuthContext();
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      redirect(buildInvitationPath(token, { error: 1 }));
    }

    if (!authContext.isAuthenticated || !authContext.user) {
      redirect(
        buildAuthPath({
          authAction: 'sign-in',
          redirectPath: buildInvitationPath(token),
          email: invitation.userEmail,
        })
      );
    }

    const currentUserEmail =
      authContext.user?.emailAddresses.find(
        entry => entry.id === authContext.user?.primaryEmailAddressId
      )?.emailAddress ??
      authContext.user?.emailAddresses[0]?.emailAddress ??
      null;

    const response = await respondToInvitation(
      token,
      action as InvitationResponseAction,
      currentUserEmail
    );
    redirect(buildInvitationResponseRedirectPath(token, response));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    redirect(buildInvitationPath(token, { error: 1 }));
  }
}
