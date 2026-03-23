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
    <div className="flex flex-col">
      <div className="flex flex-1 gap-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 p-4 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Here&apos;s a summary of your Pop CoLab profile.
            </p>
          </div>

          <PersonalityResultCard
            personality={personality}
            totalScore={totalScore}
          />

          <MyTeamsSection teams={teams} />

          <MyRequestsSection requests={requests} />
        </div>

        {/* Right sidebar — mirrors admin overview */}
        <aside className="w-56 shrink-0 p-4 space-y-4 border-l border-gray-100 hidden lg:block">
          <UserQuickActions hasPersonality={personality !== null} />
        </aside>
      </div>
    </div>
  );
}
