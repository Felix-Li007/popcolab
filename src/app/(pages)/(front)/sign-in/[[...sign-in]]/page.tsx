'use client';
import { SignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { sanitizeRedirectPath } from '@/utils/auth-redirect';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = sanitizeRedirectPath(
    searchParams.get('redirect'),
    '/onboarding/personality-choice'
  );
  const email = searchParams.get('email')?.trim() ?? '';

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#19464d] to-[#6390a4] px-4 py-16">
      <div className="flex flex-col items-start gap-6 w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="self-start text-sm text-pink-medium hover:text-pink-bright font-bold"
        >
          ← Back to Home
        </button>
        <SignIn
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          initialValues={email ? { emailAddress: email } : undefined}
          appearance={{
            variables: {
              colorPrimary: 'var(--color-magenta)',
            },
          }}
        />
      </div>
    </main>
  );
}
