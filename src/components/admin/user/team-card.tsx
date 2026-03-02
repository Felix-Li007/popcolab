import type { AdminTeamCardItem } from '@/types/team-type';
import { Button } from '@/ui';
import { getTeamMemberAvatarText } from '@/utils/team-member';
import styles from '@/styles/team-card.module.css';

type Props = {
  team: AdminTeamCardItem;
  onViewMembers: (team: AdminTeamCardItem) => void;
};

function EyeIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

export default function TeamCard({ team, onViewMembers }: Props) {
  const avatarText = team.name.slice(0, 1).toUpperCase() || '?';
  const previewMembers = team.members.slice(0, 2);

  return (
    <article className={styles.card} data-testid="team-card">
      <div className={styles.orb} aria-hidden="true" />

      <div className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{avatarText}</div>
          <div className={styles.identityText}>
            <p className={styles.teamName}>{team.name}</p>
            <p className={styles.ownerEmail}>{team.ownerEmail}</p>
          </div>
        </div>
      </div>

      <div className={styles.metaPanel}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Description</p>
          <p className={styles.metaValue}>{team.description?.trim() || '-'}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Members</p>
          <div className={styles.membersSummaryRow}>
            <Button
              variant="text"
              size="xs"
              onClick={() => onViewMembers(team)}
              className={styles.memberCountButton}
              data-testid="view-team-number"
            >
              {team.memberCount}
            </Button>
            <div className={styles.memberAvatars}>
              {previewMembers.map(member => (
                <span
                  key={member.id}
                  className={styles.memberAvatarSm}
                  aria-label={member.email}
                  title={member.email}
                >
                  {getTeamMemberAvatarText(member)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          variant="text"
          size="xs"
          onClick={() => onViewMembers(team)}
          className={styles.actionPrimary}
          data-testid="view-team-view"
          icon={<EyeIcon className={styles.actionIcon} />}
        >
          View
        </Button>
      </div>
    </article>
  );
}
