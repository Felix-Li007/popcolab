import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/libs/prisma-client';
import IntakeForm from '@/components/onboarding/intake-form';

export default async function IntakePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: { intake_complete: true },
  });

  if (user?.intake_complete) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4 py-12">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-8 py-7 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E91E8C]">
              <span className="text-xs font-bold text-white">PC</span>
            </div>
            <span className="text-base font-bold text-white">Pop CoLab</span>
          </div>
          <p className="text-xs text-gray-400">Rediscover the Power of Play</p>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <h1 className="mb-1 text-lg font-bold text-gray-800">
            Employee Intake Form
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Step 2 of 3 — Tell us about yourself so we can match you with the
            right experiences
          </p>

          <IntakeForm />
        </div>
      </div>
    </main>
  );
}
