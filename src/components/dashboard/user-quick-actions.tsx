'use client';

import Link from 'next/link';

type Props = {
  hasPersonality: boolean;
};

export default function UserQuickActions({ hasPersonality }: Readonly<Props>) {
  return (
    <div className="dashboard-glass-panel p-5">
      <p className="dashboard-section-eyebrow mb-3">Quick Actions</p>
      <div className="space-y-2">
        <Link
          href="/dashboard/test"
          className="dashboard-pill-button dashboard-pill-button--primary flex w-full justify-start"
        >
          <span>🎭</span>
          <span>{hasPersonality ? 'Retake Test' : 'Take Test'}</span>
        </Link>
        <Link
          href="/dashboard/profile"
          className="dashboard-pill-button dashboard-pill-button--secondary flex w-full justify-start"
        >
          <span>👤</span>
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  );
}
