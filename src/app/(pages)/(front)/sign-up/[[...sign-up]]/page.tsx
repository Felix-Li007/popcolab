'use client';
import { useRouter } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#19464d] to-[#6390a4] px-4 py-16">
      <div className="flex flex-col items-start gap-6 w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="self-start text-sm text-pink-medium hover:text-pink-bright font-bold"
        >
          ← Back to Home
        </button>
        {/* Clerk form */}
        <SignUp
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
