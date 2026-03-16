'use client';

import { useState } from 'react';
import TeamCard from '@/components/admin/user/team-card';
import TeamViewModal from '@/components/admin/user/team-view';
import type { AdminTeamCardItem } from '@/types/team-type';
import styles from '@/styles/admin/users/team-content.module.css';

type Props = {
  teams: AdminTeamCardItem[];
};

export default function TeamClient({ teams }: Props) {
  const [viewTeamId, setViewTeamId] = useState<number | null>(null);
  const viewTeam = teams.find(team => team.id === viewTeamId) ?? null;

  return (
    <>
      <div className={styles.grid}>
        {teams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            onViewMembers={nextTeam => setViewTeamId(nextTeam.id)}
          />
        ))}
      </div>

      <TeamViewModal
        key={viewTeamId ?? 'closed'}
        team={viewTeam}
        isOpen={viewTeam !== null}
        onClose={() => setViewTeamId(null)}
      />
    </>
  );
}
