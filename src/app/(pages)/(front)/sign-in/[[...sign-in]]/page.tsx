import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#19464d] to-[#6390a4] px-4 py-16">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-white/60 uppercase mb-1">
            Pop CoLab
          </p>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/70 mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Clerk form — themed to brand */}
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#f52e81',
              colorBackground: '#ffffff',
              colorText: '#111827',
              colorTextSecondary: '#6b7280',
              colorInputBackground: '#f9fafb',
              colorInputText: '#111827',
              fontFamily: 'Poppins, sans-serif',
              borderRadius: '0.75rem',
            },
            elements: {
              card: 'shadow-xl border-0 rounded-2xl',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton:
                'border border-gray-200 hover:bg-gray-50',
              formButtonPrimary:
                'bg-[#f52e81] hover:bg-[#d4246d] text-white font-semibold',
              footerActionLink:
                'text-[#f52e81] hover:text-[#d4246d] font-semibold',
            },
          }}
        />

        {/* Fallback cross-link */}
        <p className="text-sm text-white/70">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-white font-semibold underline underline-offset-4 hover:opacity-80"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
