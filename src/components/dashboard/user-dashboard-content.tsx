'use client';

import PersonalityResultCard from '@/components/dashboard/personality-result-card';
import MyTeamsSection from '@/components/dashboard/my-teams-section';
import MyRequestsSection from '@/components/dashboard/my-requests-section';
import UserQuickActions from '@/components/dashboard/user-quick-actions';
import type { Personality } from '@/types/personality-type';
import type {
  UserTeamSummary,
  UserRequestSummary,
} from '@/services/user-dashboard-service';

type Props = {
  displayName: string;
  personality: Personality | null;
  totalScore: number | null;
  teams: UserTeamSummary[];
  requests: UserRequestSummary[];
};

export default function UserDashboardContent({
  displayName,
  personality,
  totalScore,
  teams,
  requests,
}: Readonly<Props>) {
  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 flex-1 space-y-5">
            <section className="dashboard-glass-panel px-5 py-5 sm:px-6">
              <p className="dashboard-section-eyebrow">Dashboard overview</p>
              <h1 className="dashboard-section-title mt-2">
                Welcome back, {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
                Your user dashboard now brings personality, teams, requests, and
                next actions into one softer glass workspace.
              </p>
            </section>

            <PersonalityResultCard
              personality={personality}
              totalScore={totalScore}
            />

            <MyTeamsSection teams={teams} />

            <MyRequestsSection requests={requests} />
          </div>

          <aside className="hidden w-full lg:block">
            <div className="sticky top-5 space-y-4">
              <UserQuickActions hasPersonality={personality !== null} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
