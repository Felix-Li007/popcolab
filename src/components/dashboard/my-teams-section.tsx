'use client';

import type { UserTeamSummary } from '@/services/user-dashboard-service';

type Props = {
  teams: UserTeamSummary[];
};

export default function MyTeamsSection({ teams }: Readonly<Props>) {
  return (
    <section
      className="dashboard-glass-panel p-5 sm:p-6"
      data-testid="my-teams-section"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👥</span>
        <div>
          <p className="dashboard-section-eyebrow">Community</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">My Teams</h2>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[rgba(1,43,48,0.10)] bg-[rgba(255,255,255,0.62)] py-10 text-center backdrop-blur-xl">
          <span className="text-3xl">👥</span>
          <p className="text-sm font-medium text-slate-600">
            You&apos;re not part of any team yet.
          </p>
          <p className="text-xs text-slate-400">
            Teams will appear here once you&apos;re added by an admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teams.map(team => (
            <div
              key={team.id}
              className="flex items-center gap-3 rounded-[1.5rem] border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.76))] p-4 shadow-[0_16px_34px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,232,241,0.92),rgba(255,255,255,0.58))]">
                <span className="text-lg">🏷️</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {team.name}
                </p>
                <p className="text-xs text-slate-400">
                  {team.memberCount} member{team.memberCount === 1 ? '' : 's'} ·{' '}
                  <span
                    className={
                      team.role === 'owner'
                        ? 'text-fuchsia-600 font-semibold'
                        : 'text-slate-400'
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
