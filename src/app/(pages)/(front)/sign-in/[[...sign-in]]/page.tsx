'use client';
import { SignIn } from '@clerk/nextjs';

import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#19464d] to-[#6390a4] px-4 py-16">
      <div className="flex flex-col items-start gap-6 w-full max-w-md">
        {/* Brand header */}
        {/* <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome, Pop CoLab</h1>
        </div> */}
        {/* Clerk form — themed to brand */}
        <button
          onClick={() => router.push('/')}
          className="self-start text-sm text-pink-medium hover:text-pink-bright font-bold"
        >
          ← Back to Home
        </button>
        <SignIn />
      </div>
    </main>
  );
}
