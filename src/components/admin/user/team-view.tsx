'use client';

import { useMemo, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import type { AdminTeamCardItem } from '@/types/team-type';
import {
  getTeamMemberAvatarText,
  getTeamMemberNameLine,
} from '@/utils/team-member';
import { Search } from '@/ui';
import styles from '@/styles/admin/users/team-view.module.css';

type Props = {
  team: AdminTeamCardItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TeamViewModal({
  team,
  isOpen,
  onClose,
}: Readonly<Props>) {
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

  let membersContent = (
    <div className={styles.membersList}>
      {filteredMembers.map(member => (
        <div key={member.id} className={styles.memberCard}>
          <div className={styles.memberAvatar} aria-hidden="true">
            {getTeamMemberAvatarText(member)}
          </div>
          <div className={styles.memberBody}>
            <p className={styles.memberName}>{getTeamMemberNameLine(member)}</p>
            <p className={styles.memberEmail}>{member.email}</p>
            <p className={styles.memberRole}>Role: {member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (team?.members.length === 0) {
    membersContent = <p className={styles.emptyText}>No team members found</p>;
  } else if (filteredMembers.length === 0) {
    membersContent = (
      <p className={styles.emptyText}>No matched team members found</p>
    );
  }

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
            <Search
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Filter team mates on this page..."
              data-testid="team-member-search"
              buttonType="button"
              wrapperClassName={styles.searchWrap}
              iconClassName={styles.searchIcon}
              inputClassName={styles.searchInput}
              buttonClassName={styles.searchButton}
            />
          </div>
          {membersContent}
        </div>
      </div>
    </ModalShell>
  );
}
