'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { sanitizeRedirectPath } from '@/utils/auth-redirect';
import { SIGN_IN_PATH } from '@/utils/url-helper';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = sanitizeRedirectPath(
    searchParams.get('redirect'),
    '/onboarding/personality-choice'
  );
  const email = searchParams.get('email')?.trim() ?? '';
  const isJoinInviteFlow = redirectUrl.startsWith('/join/');
  const signInParams = new URLSearchParams();

  signInParams.set('redirect', redirectUrl);
  if (email) {
    signInParams.set('email', email);
  }

  const signInHref = `${SIGN_IN_PATH}?${signInParams.toString()}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4 py-12">
      <div className="flex w-full max-w-[460px] flex-col gap-4">
        <SignUp
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          initialValues={email ? { emailAddress: email } : undefined}
          appearance={{
            variables: { colorPrimary: 'var(--color-magenta)' },
          }}
        />

        <p
          className={`text-center text-xs ${
            isJoinInviteFlow ? 'text-white/55' : 'text-gray-400'
          }`}
        >
          Already have an account?{' '}
          <Link
            href={signInHref}
            className={`font-semibold ${
              isJoinInviteFlow
                ? 'text-[#ff6ab4] hover:text-[#ff8cc6]'
                : 'text-[#E91E8C] hover:text-[#c7177a]'
            }`}
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
