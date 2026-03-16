'use client';

import { useMemo, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import type { AdminTeamCardItem } from '@/types/team-type';
import {
  getTeamMemberAvatarText,
  getTeamMemberNameLine,
} from '@/utils/team-member';
import styles from '@/styles/admin/users/team-view.module.css';

type Props = {
  team: AdminTeamCardItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TeamViewModal({ team, isOpen, onClose }: Props) {
  const [keyword, setKeyword] = useState('');
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredMembers = useMemo(() => {
    const members = team?.members ?? [];
    if (!normalizedKeyword) return members;
    return members.filter(member => {
      const haystack = [
        member.firstName ?? '',
        member.lastName ?? '',
        member.name,
        member.email,
        member.role,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [team, normalizedKeyword]);

  if (!isOpen || !team) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={team.name}
      subtitle={team.ownerEmail}
      rootTestId="team-detail-modal-root"
      panelTestId="team-detail-modal"
    >
      <div className={styles.content}>
        <div className={styles.infoCard}>
          <p className={styles.label}>Team Mates ({team.memberCount})</p>
          <div className={styles.searchRow}>
            <input
              type="search"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Filter team mates on this page..."
              className={styles.searchInput}
              data-testid="team-member-search"
            />
          </div>
          {team.members.length === 0 ? (
            <p className={styles.emptyText}>No team members found</p>
          ) : filteredMembers.length === 0 ? (
            <p className={styles.emptyText}>No matched team members found</p>
          ) : (
            <div className={styles.membersList}>
              {filteredMembers.map(member => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberAvatar} aria-hidden="true">
                    {getTeamMemberAvatarText(member)}
                  </div>
                  <div className={styles.memberBody}>
                    <p className={styles.memberName}>
                      {getTeamMemberNameLine(member)}
                    </p>
                    <p className={styles.memberEmail}>{member.email}</p>
                    <p className={styles.memberRole}>Role: {member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
