'use client';

import type { UserTeamSummary } from '@/services/user-dashboard-service';

type Props = {
  teams: UserTeamSummary[];
};

export default function MyTeamsSection({ teams }: Readonly<Props>) {
  return (
    <section data-testid="my-teams-section">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👥</span>
        <h2 className="text-sm font-bold text-gray-800">My Teams</h2>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
          <span className="text-3xl">👥</span>
          <p className="text-sm font-medium text-gray-500">
            You&apos;re not part of any team yet.
          </p>
          <p className="text-xs text-gray-400">
            Teams will appear here once you&apos;re added by an admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teams.map(team => (
            <div
              key={team.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-deep/10 flex items-center justify-center shrink-0">
                <span className="text-lg">🏷️</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {team.name}
                </p>
                <p className="text-xs text-gray-400">
                  {team.memberCount} member{team.memberCount === 1 ? '' : 's'} ·{' '}
                  <span
                    className={
                      team.role === 'owner'
                        ? 'text-teal-deep font-semibold'
                        : 'text-gray-400'
                    }
                  >
                    {team.role === 'owner' ? 'Owner' : 'Member'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
