'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { sanitizeRedirectPath } from '@/utils/auth-redirect';
import { SIGN_IN_PATH } from '@/utils/url-helper';

const STEPS = [
  {
    label: 'Verify your email',
    sub: 'Click the link we sent you',
    done: true,
  },
  {
    label: 'Complete intake form',
    sub: 'Username, role — takes 1 min',
    done: false,
  },
  {
    label: 'Take personality test',
    sub: 'Discover your play style',
    done: false,
  },
  {
    label: 'Access your dashboard',
    sub: 'Teams, Experiences, Requests',
    done: false,
  },
];

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = sanitizeRedirectPath(
    searchParams.get('redirect'),
    '/onboarding/intake'
  );
  const email = searchParams.get('email')?.trim() ?? '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4 py-12">
      <div className="flex w-full max-w-[460px] flex-col gap-6">
        {/* Branding card with step indicators */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Dark header */}
          <div className="bg-[#111827] px-8 py-7 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E91E8C]">
                <span className="text-xs font-bold text-white">PC</span>
              </div>
              <span className="text-base font-bold text-white">Pop CoLab</span>
            </div>
            <p className="text-xs text-gray-400">
              Rediscover the Power of Play
            </p>
          </div>

          {/* Step context */}
          <div className="px-8 py-6">
            <h1 className="mb-1 text-lg font-bold text-gray-800">
              Create your account
            </h1>
            <p className="mb-5 text-sm text-gray-500">
              Join Pop CoLab and discover your play personality
            </p>

            <p className="mb-3 text-xs text-gray-400">
              What happens after you verify:
            </p>

            <div className="flex flex-col gap-2">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                  style={{ opacity: step.done || i === 1 ? 1 : 0.5 }}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: step.done
                        ? '#22c55e'
                        : i === 1
                          ? '#E91E8C'
                          : '#d1d5db',
                    }}
                  >
                    {step.done ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Already have an account?{' '}
              <Link
                href={SIGN_IN_PATH}
                className="font-semibold text-[#E91E8C] hover:text-[#c7177a]"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Clerk sign-up form */}
        <SignUp
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
          initialValues={email ? { emailAddress: email } : undefined}
          appearance={{
            variables: { colorPrimary: 'var(--color-magenta)' },
          }}
        />
      </div>
    </main>
  );
}
