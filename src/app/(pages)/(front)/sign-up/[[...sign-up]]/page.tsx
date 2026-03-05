import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#19464d] to-[#6390a4] px-4 py-16">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-white/60 uppercase mb-1">
            Pop CoLab
          </p>
          <h1 className="text-3xl font-bold text-white">Join Pop CoLab</h1>
          <p className="text-sm text-white/70 mt-1">
            Create your account to get started
          </p>
        </div>

        {/* Clerk form */}
        <SignUp />

        {/* Cross-link */}
        <p className="text-sm text-white/70">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="text-white font-semibold underline underline-offset-4 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
